import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthGate } from './components/AuthGate'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'
import { LoginPage } from './pages/LoginPage'
import { DashboardOverviewPage } from './pages/DashboardOverviewPage'
import { TestTrackingPage } from './pages/TestTrackingPage'
import { CreateTestPage } from './pages/CreateTestPage'
import { AddQuestionsPage } from './pages/AddQuestionsPage'
import { PreviewPublishPage } from './pages/PreviewPublishPage'

function LoginRoute() {
  const token = useAuthStore((s) => s.token)
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from || '/dashboard'

  if (token) {
    return <Navigate to={from} replace />
  }

  return <LoginPage />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/tracking"
        element={
          <ProtectedRoute>
            <TestTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/create"
        element={
          <ProtectedRoute>
            <CreateTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/edit"
        element={
          <ProtectedRoute>
            <CreateTestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/questions"
        element={
          <ProtectedRoute>
            <AddQuestionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/preview"
        element={
          <ProtectedRoute>
            <PreviewPublishPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AuthGate>
        <AppRoutes />
      </AuthGate>
    </BrowserRouter>
  )
}

export default App
