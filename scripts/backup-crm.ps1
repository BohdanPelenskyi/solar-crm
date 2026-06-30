$ErrorActionPreference = 'Stop'

$database = 'solar_srm'
$databaseUser = 'postgres'
$databaseHost = 'localhost'
$databasePort = '5432'
$pgBin = 'C:\Program Files\PostgreSQL\13\bin'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupsRoot = Join-Path $projectRoot 'backups'
$exportsRoot = Join-Path $projectRoot 'exports'
$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

$pgDump = Join-Path $pgBin 'pg_dump.exe'
$pgRestore = Join-Path $pgBin 'pg_restore.exe'
$psql = Join-Path $pgBin 'psql.exe'

if (
-not (Test-Path $pgDump) -or
-not (Test-Path $pgRestore) -or
-not (Test-Path $psql)
) {
throw "PostgreSQL binaries not found: $pgBin"
}

New-Item -ItemType Directory -Force $backupsRoot | Out-Null

$exportFolder = Join-Path $exportsRoot $timestamp
New-Item -ItemType Directory -Force $exportFolder | Out-Null

$databaseBackup = Join-Path $backupsRoot "solar_srm_$timestamp.backup"
$uploadsZip = Join-Path $backupsRoot "uploads_$timestamp.zip"

$securePassword = Read-Host 'PostgreSQL password for user postgres' -AsSecureString

$plainPassword = [System.Net.NetworkCredential]::new(
'',
$securePassword
).Password

$env:PGPASSWORD = $plainPassword

function Invoke-CsvExport {
  param(
    [string]$Query,
    [string]$OutputPath
  )

  $outputPathForPsql = $OutputPath.Replace([char]92, [char]47)
  $sqlFile = Join-Path $env:TEMP (
    'solar_crm_export_' + [guid]::NewGuid().ToString() + '.sql'
  )

  $singleLineQuery = ($Query -replace '\s+', ' ').Trim()

  $copyCommand = "\copy ($singleLineQuery) TO '$outputPathForPsql' WITH (FORMAT CSV, HEADER TRUE);"

  try {
    Set-Content -Path $sqlFile -Value $copyCommand -Encoding ascii -NoNewline

    $psqlArgs = @(
      '-h', $databaseHost,
      '-p', $databasePort,
      '-U', $databaseUser,
      '-d', $database,
      '-v', 'ON_ERROR_STOP=1',
      '-f', $sqlFile
    )

    & $psql @psqlArgs

    if ($LASTEXITCODE -ne 0) {
      throw "CSV export failed: $OutputPath"
    }
  } finally {
    Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
  }
}

try {
Write-Host 'Creating PostgreSQL backup...' -ForegroundColor Cyan

$pgDumpArgs = @(
'-h', $databaseHost,
'-p', $databasePort,
'-U', $databaseUser,
'-Fc',
'-C',
'-f', $databaseBackup,
$database
)

& $pgDump @pgDumpArgs

if ($LASTEXITCODE -ne 0) {
throw 'Database backup failed'
}

$restoreList = & $pgRestore '-l' $databaseBackup

if ($LASTEXITCODE -ne 0) {
throw 'Backup verification failed'
}

$restoreList | Select-Object -First 5 | Out-Null

$uploadsPath = Join-Path $projectRoot 'apps\api\uploads'

if (
(Test-Path $uploadsPath) -and
(Get-ChildItem $uploadsPath -Force | Measure-Object).Count -gt 0
) {
Write-Host 'Archiving uploaded documents and media...' -ForegroundColor Cyan


Compress-Archive `
  -Path (Join-Path $uploadsPath '*') `
  -DestinationPath $uploadsZip `
  -Force


}

Write-Host 'Creating CSV exports...' -ForegroundColor Cyan

Invoke-CsvExport -OutputPath (Join-Path $exportFolder 'projects.csv') -Query @'
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
COALESCE(
SUM(
CASE
WHEN ft.type = 'INCOME' THEN ft.amount
WHEN ft.type = 'EXPENSE' THEN -ft.amount
ELSE 0
END
),
0
) AS margin,
COUNT(ft.id) AS transactions_count
FROM "Project" p
LEFT JOIN "FinancialTransaction" ft
ON ft."projectId" = p.id
GROUP BY
p.id,
p.name,
p.status,
p.source,
p.location,
p.notes,
p."createdAt",
p."updatedAt"
ORDER BY p.id
'@

Invoke-CsvExport -OutputPath (Join-Path $exportFolder 'contacts.csv') -Query @'
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
JOIN "Project" p
ON p.id = c."projectId"
ORDER BY p.id, c."isPrimary" DESC, c.id
'@

Invoke-CsvExport -OutputPath (Join-Path $exportFolder 'transactions.csv') -Query @'
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
ft.comment
FROM "FinancialTransaction" ft
JOIN "Project" p
ON p.id = ft."projectId"
ORDER BY ft."occurredAt" DESC, ft.id DESC
'@

Invoke-CsvExport -OutputPath (Join-Path $exportFolder 'tasks.csv') -Query @'
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
JOIN "Project" p
ON p.id = t."projectId"
ORDER BY t."dueDate" NULLS LAST, t.id
'@

Write-Host ''
Write-Host 'Backup completed successfully.' -ForegroundColor Green
Write-Host "Database backup: $databaseBackup"
Write-Host "CSV exports:     $exportFolder"

if (Test-Path $uploadsZip) {
Write-Host "Uploads archive: $uploadsZip"
}
} finally {
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
$plainPassword = $null
}


