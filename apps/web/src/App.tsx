import { Navigate, Route, Routes } from 'react-router'
import { AppLayout } from './components/AppLayout'
import { CalendarPage } from './pages/CalendarPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectDetailsPage } from './pages/ProjectDetailsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
return ( <Routes>
<Route element={<AppLayout />}>
<Route
index
element={<Navigate to="/dashboard" replace />}
/>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="tasks" element={<TasksPage />} />
    <Route path="calendar" element={<CalendarPage />} />
    <Route path="projects" element={<ProjectsPage />} />
    <Route
      path="projects/:id"
      element={<ProjectDetailsPage />}
    />
  </Route>
</Routes>
)
}
