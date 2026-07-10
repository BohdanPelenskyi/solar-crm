import {
  Navigate,
  Route,
  Routes,
} from 'react-router'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/AppLayout'
import { UndoDeleteProvider } from './components/UndoDeleteProvider'
import { CalendarPage } from './pages/CalendarPage'
import { LoginPage } from './pages/LoginPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return (
    <AuthProvider>
      <UndoDeleteProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                index
                element={<Navigate to="/projects" replace />}
              />

              <Route
                path="dashboard"
                element={<Navigate to="/projects" replace />}
              />

              <Route path="tasks" element={<TasksPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="projects" element={<ProjectsPage />} />

              <Route
                path="projects/:id"
                element={<ProjectDetailsPage />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </UndoDeleteProvider>
    </AuthProvider>
  )
}