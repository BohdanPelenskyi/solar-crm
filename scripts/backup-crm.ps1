param(
  [string]$OffsitePath = '',
  [int]$RetentionDays = 0
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# PostgreSQL connection settings
$database = 'solar_srm'
$databaseUser = 'postgres'
$databaseHost = 'localhost'
$databasePort = '5432'
$pgBin = 'C:\Program Files\PostgreSQL\13\bin'

# Project paths
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupsRoot = Join-Path $projectRoot 'backups'
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backupName = "solar-crm_$timestamp"

$workDirectory = Join-Path $backupsRoot "_working_$backupName"
$archivePath = Join-Path $backupsRoot "$backupName.zip"
$checksumPath = "$archivePath.sha256"
$lockPath = Join-Path $backupsRoot '.backup.lock'

$pgDump = Join-Path $pgBin 'pg_dump.exe'
$pgRestore = Join-Path $pgBin 'pg_restore.exe'
$psql = Join-Path $pgBin 'psql.exe'

$previousPgPassFile = $env:PGPASSFILE
$previousPgPassword = $env:PGPASSWORD
$plainPassword = $null
$success = $false
$lockOwned = $false

function Assert-LastExitCode {
  param([string]$Operation)

  if ($LASTEXITCODE -ne 0) {
    throw "$Operation failed. Exit code: $LASTEXITCODE"
  }
}

function Invoke-CsvExport {
  param(
    [string]$Query,
    [string]$OutputPath
  )

  $outputPathForPsql = [System.IO.Path]::GetFullPath($OutputPath).Replace('\', '/').Replace("'", "''")

  $sqlFile = Join-Path $env:TEMP (
    'solar_crm_export_' + [guid]::NewGuid().ToString() + '.sql'
  )

  $singleLineQuery = ($Query -replace '\s+', ' ').Trim()
  $copyCommand = "\copy ($singleLineQuery) TO '$outputPathForPsql' WITH (FORMAT CSV, HEADER TRUE, ENCODING 'UTF8');"

  try {
    Set-Content -Path $sqlFile -Value $copyCommand -Encoding ascii -NoNewline

    $psqlArgs = @(
      '-X',
      '-h', $databaseHost,
      '-p', $databasePort,
      '-U', $databaseUser,
      '-d', $database,
      '-v', 'ON_ERROR_STOP=1',
      '-f', $sqlFile
    )

    & $psql @psqlArgs
    Assert-LastExitCode "CSV export: $OutputPath"
  }
  finally {
    Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
  }
}

function Copy-UploadsSnapshot {
  param(
    [string]$SourcePath,
    [string]$DestinationPath
  )

  New-Item -ItemType Directory -Force $DestinationPath | Out-Null

  if (Test-Path -LiteralPath $SourcePath) {
    $items = @(Get-ChildItem -LiteralPath $SourcePath -Force)

    foreach ($item in $items) {
      Copy-Item -LiteralPath $item.FullName -Destination $DestinationPath -Recurse -Force
    }
  }

  Set-Content -Path (Join-Path $DestinationPath 'README.txt') -Encoding utf8 -Value @"
This folder is a snapshot of apps/api/uploads.
It contains all uploaded project documents, PDFs, photos and video that existed at backup time.
Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
}

function Test-ZipArchive {
  param([string]$Path)

  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $archive = [System.IO.Compression.ZipFile]::OpenRead($Path)

  try {
    if ($archive.Entries.Count -eq 0) {
      throw 'Backup ZIP archive is empty'
    }

    # Compress-Archive can use either / or \ inside ZIP paths on Windows.
    # Normalize paths and accept entries nested under a top-level folder too.
    $entryNames = @(
      $archive.Entries | ForEach-Object {
        $_.FullName.Replace([char]92, [char]47)
      }
    )

    foreach ($requiredFile in @(
      'database.backup',
      'manifest.json',
      'uploads/README.txt'
    )) {
      $isPresent = @(
        $entryNames | Where-Object {
          $_ -eq $requiredFile -or
          $_.EndsWith("/$requiredFile")
        }
      ).Count -gt 0

      if (-not $isPresent) {
        throw "Backup ZIP archive does not contain: $requiredFile"
      }
    }
  }
  finally {
    $archive.Dispose()
  }
}

function Remove-ExpiredBackups {
  param(
    [string]$Folder,
    [int]$Days
  )

  if ($Days -le 0 -or -not (Test-Path -LiteralPath $Folder)) {
    return
  }

  $cutoff = (Get-Date).AddDays(-$Days)

  Get-ChildItem -LiteralPath $Folder -File |
    Where-Object {
      $_.Name -like 'solar-crm_*.zip' -and $_.LastWriteTime -lt $cutoff
    } |
    ForEach-Object {
      Remove-Item $_.FullName -Force
      Remove-Item "$($_.FullName).sha256" -Force -ErrorAction SilentlyContinue
    }
}

try {
  foreach ($binary in @($pgDump, $pgRestore, $psql)) {
    if (-not (Test-Path -LiteralPath $binary)) {
      throw "PostgreSQL binary was not found: $binary"
    }
  }

  New-Item -ItemType Directory -Force $backupsRoot | Out-Null

  # Password source priority:
  # 1) an existing PGPASSFILE, 2) %APPDATA%\postgresql\pgpass.conf, 3) one-time prompt.
  $defaultPgPassFile = Join-Path $env:APPDATA 'postgresql\pgpass.conf'

  if ($env:PGPASSFILE -and (Test-Path -LiteralPath $env:PGPASSFILE)) {
    # Use current PGPASSFILE.
  }
  elseif (Test-Path -LiteralPath $defaultPgPassFile) {
    $env:PGPASSFILE = $defaultPgPassFile
  }
  else {
    $securePassword = Read-Host 'PostgreSQL password for user postgres' -AsSecureString
    $plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
    $env:PGPASSWORD = $plainPassword
  }

  $env:PGCLIENTENCODING = 'UTF8'

  if (Test-Path -LiteralPath $lockPath) {
    $lockAge = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime

    if ($lockAge.TotalHours -lt 12) {
      throw 'Another backup appears to be running. Check backups\.backup.lock'
    }

    Remove-Item $lockPath -Force
  }

  Set-Content -Path $lockPath -Encoding utf8 -Value "Backup started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
  $lockOwned = $true
  New-Item -ItemType Directory -Force $workDirectory | Out-Null

  $databaseBackup = Join-Path $workDirectory 'database.backup'
  $uploadsBackup = Join-Path $workDirectory 'uploads'
  $exportsFolder = Join-Path $workDirectory 'exports'
  $configFolder = Join-Path $workDirectory 'config'
  $manifestPath = Join-Path $workDirectory 'manifest.json'

  New-Item -ItemType Directory -Force $exportsFolder | Out-Null
  New-Item -ItemType Directory -Force $configFolder | Out-Null

  Write-Host 'Checking PostgreSQL connection...' -ForegroundColor Cyan
  & $psql '-X' '-h' $databaseHost '-p' $databasePort '-U' $databaseUser '-d' $database '-Atc' 'SELECT 1;' | Out-Null
  Assert-LastExitCode 'PostgreSQL connection check'

  Write-Host 'Creating PostgreSQL backup...' -ForegroundColor Cyan
  & $pgDump '-h' $databaseHost '-p' $databasePort '-U' $databaseUser '-Fc' '-C' '-f' $databaseBackup $database
  Assert-LastExitCode 'Database backup'

  & $pgRestore '-l' $databaseBackup | Out-Null
  Assert-LastExitCode 'Database backup verification'

  Write-Host 'Copying uploaded documents, photos and video...' -ForegroundColor Cyan
  Copy-UploadsSnapshot -SourcePath (Join-Path $projectRoot 'apps\api\uploads') -DestinationPath $uploadsBackup

  Write-Host 'Copying application configuration...' -ForegroundColor Cyan
  $apiEnv = Join-Path $projectRoot 'apps\api\.env'
  $webEnv = Join-Path $projectRoot 'apps\web\.env'

  if (Test-Path -LiteralPath $apiEnv) {
    Copy-Item -LiteralPath $apiEnv -Destination (Join-Path $configFolder 'api.env') -Force
  }

  if (Test-Path -LiteralPath $webEnv) {
    Copy-Item -LiteralPath $webEnv -Destination (Join-Path $configFolder 'web.env') -Force
  }

  if (-not (Get-ChildItem -LiteralPath $configFolder -Force | Select-Object -First 1)) {
    Set-Content -Path (Join-Path $configFolder 'README.txt') -Encoding utf8 -Value 'No .env files were found at backup time.'
  }

  Write-Host 'Creating CSV exports...' -ForegroundColor Cyan

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'projects.csv') -Query @'
SELECT
  p.id AS project_id,
  p.name,
  p.status,
  p.source,
  p.location,
  p.notes,
  p."createdAt" AS created_at,
  p."updatedAt" AS updated_at,
  COALESCE(SUM(CASE WHEN ft.type = 'INCOME' THEN ft.amount ELSE 0 END), 0) AS income,
  COALESCE(SUM(CASE WHEN ft.type = 'EXPENSE' THEN ft.amount ELSE 0 END), 0) AS expenses,
  COALESCE(SUM(CASE WHEN ft.type = 'INCOME' THEN ft.amount WHEN ft.type = 'EXPENSE' THEN -ft.amount ELSE 0 END), 0) AS margin,
  COUNT(ft.id) AS transactions_count
FROM "Project" p
LEFT JOIN "FinancialTransaction" ft ON ft."projectId" = p.id
GROUP BY p.id, p.name, p.status, p.source, p.location, p.notes, p."createdAt", p."updatedAt"
ORDER BY p.id
'@

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'contacts.csv') -Query @'
SELECT
  c.id AS contact_id,
  p.id AS project_id,
  p.name AS project_name,
  c."fullName" AS full_name,
  c.phone,
  c.role,
  c.position,
  c."isPrimary" AS is_primary
FROM "ProjectContact" c
JOIN "Project" p ON p.id = c."projectId"
ORDER BY p.id, c."isPrimary" DESC, c.id
'@

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'transactions.csv') -Query @'
SELECT
  ft.id AS transaction_id,
  p.id AS project_id,
  p.name AS project_name,
  ft.type,
  ft.amount,
  ft.counterparty,
  ft."paymentMethod" AS payment_method,
  ft."accountName" AS account_name,
  ft."occurredAt" AS occurred_at,
  ft.comment,
  ft."receiptPath" AS receipt_path
FROM "FinancialTransaction" ft
JOIN "Project" p ON p.id = ft."projectId"
ORDER BY ft."occurredAt" DESC, ft.id DESC
'@

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'tasks.csv') -Query @'
SELECT
  t.id AS task_id,
  p.id AS project_id,
  p.name AS project_name,
  t.title,
  t.description,
  t.status,
  t.priority,
  t."dueDate" AS due_date,
  t."createdAt" AS created_at,
  t."updatedAt" AS updated_at
FROM "ProjectTask" t
JOIN "Project" p ON p.id = t."projectId"
ORDER BY t."dueDate" NULLS LAST, t.id
'@

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'files.csv') -Query @'
SELECT
  pf.id AS file_id,
  p.id AS project_id,
  p.name AS project_name,
  pf.category,
  pf."originalName" AS original_name,
  pf."storageKey" AS storage_key,
  pf."mimeType" AS mime_type,
  pf.size,
  pf."isFinal" AS is_final,
  pf."uploadedAt" AS uploaded_at
FROM "ProjectFile" pf
JOIN "Project" p ON p.id = pf."projectId"
ORDER BY pf."uploadedAt" DESC
'@

  Invoke-CsvExport -OutputPath (Join-Path $exportsFolder 'media.csv') -Query @'
SELECT
  pm.id AS media_id,
  p.id AS project_id,
  p.name AS project_name,
  pm.type,
  pm."originalName" AS original_name,
  pm."storageKey" AS storage_key,
  pm."mimeType" AS mime_type,
  pm.size,
  pm."durationSeconds" AS duration_seconds,
  pm."createdAt" AS created_at
FROM "ProjectMedia" pm
JOIN "Project" p ON p.id = pm."projectId"
ORDER BY pm."createdAt" DESC
'@

  if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitInfo = @(
      "Backup created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
      "Git branch: $(& git -C $projectRoot branch --show-current 2>$null)"
      "Git commit: $(& git -C $projectRoot rev-parse HEAD 2>$null)"
      ''
      'Uncommitted changes at backup time:'
      (& git -C $projectRoot status --short 2>$null)
    )

    $gitInfo | Set-Content -Path (Join-Path $workDirectory 'git-info.txt') -Encoding utf8
  }

  $manifestFiles = @(
    Get-ChildItem -LiteralPath $workDirectory -Recurse -File |
      Where-Object { $_.FullName -ne $manifestPath } |
      ForEach-Object {
        [PSCustomObject]@{
          path = $_.FullName.Substring($workDirectory.Length).TrimStart('\')
          sizeBytes = $_.Length
          sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
      }
  )

  [ordered]@{
    backupName = $backupName
    createdAt = (Get-Date).ToString('o')
    database = $database
    files = $manifestFiles
  } | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding utf8

  Write-Host 'Creating final archive...' -ForegroundColor Cyan
  $archiveInput = Get-ChildItem -LiteralPath $workDirectory -Force | Select-Object -ExpandProperty FullName
  Compress-Archive -Path $archiveInput -DestinationPath $archivePath -CompressionLevel Optimal -Force

  Test-ZipArchive -Path $archivePath

  $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -Path $checksumPath -Encoding ascii -Value "$archiveHash  $(Split-Path $archivePath -Leaf)"

  if (-not [string]::IsNullOrWhiteSpace($OffsitePath)) {
    Write-Host 'Copying backup to offsite storage...' -ForegroundColor Cyan
    New-Item -ItemType Directory -Force $OffsitePath | Out-Null

    $offsiteArchive = Join-Path $OffsitePath (Split-Path $archivePath -Leaf)
    $partialArchive = "$offsiteArchive.partial"

    Remove-Item -LiteralPath $partialArchive -Force -ErrorAction SilentlyContinue
    Copy-Item -LiteralPath $archivePath -Destination $partialArchive -Force

    $offsiteHash = (Get-FileHash -LiteralPath $partialArchive -Algorithm SHA256).Hash.ToLowerInvariant()

    if ($offsiteHash -ne $archiveHash) {
      Remove-Item -LiteralPath $partialArchive -Force -ErrorAction SilentlyContinue
      throw 'Offsite archive verification failed'
    }

    Move-Item -LiteralPath $partialArchive -Destination $offsiteArchive -Force
    Copy-Item -LiteralPath $checksumPath -Destination "$offsiteArchive.sha256" -Force
  }
  else {
    Write-Warning 'No offsite path was given. This backup currently exists only on this PC.'
  }

  Remove-ExpiredBackups -Folder $backupsRoot -Days $RetentionDays

  if (-not [string]::IsNullOrWhiteSpace($OffsitePath)) {
    Remove-ExpiredBackups -Folder $OffsitePath -Days $RetentionDays
  }

  $success = $true

  Write-Host ''
  Write-Host 'Backup completed successfully.' -ForegroundColor Green
  Write-Host "Archive:  $archivePath"
  Write-Host "Checksum: $checksumPath"
}
finally {
  if (Test-Path -LiteralPath $workDirectory) {
    Remove-Item -LiteralPath $workDirectory -Recurse -Force -ErrorAction SilentlyContinue
  }

  # Remove the lock only if this run created it; otherwise we would unlock a running backup.
  if ($lockOwned) {
    Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
  }

  if ($null -eq $previousPgPassFile) {
    Remove-Item Env:PGPASSFILE -ErrorAction SilentlyContinue
  }
  else {
    $env:PGPASSFILE = $previousPgPassFile
  }

  if ($null -eq $previousPgPassword) {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
  else {
    $env:PGPASSWORD = $previousPgPassword
  }

  $plainPassword = $null

  if (-not $success) {
    Write-Host ''
    Write-Host 'Backup was not completed.' -ForegroundColor Red
  }
}
