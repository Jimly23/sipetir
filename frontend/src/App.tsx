import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoadingSpinner } from './components/common/LoadingSpinner'

// Pages
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { CaseList } from './pages/Cases/CaseList'
import { CaseDetail } from './pages/Cases/CaseDetail'
import { CaseForm } from './pages/Cases/CaseForm'
import { CategoryList } from './pages/Categories/CategoryList'
import { ReportView } from './pages/Reports/ReportView'
import { UserList } from './pages/Users/UserList'

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner size="lg" text="Memuat sistem Sipetir..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside AppLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Cases Routes */}
            <Route path="cases" element={<CaseList />} />
            <Route path="cases/new" element={<CaseForm />} />
            <Route path="cases/:id" element={<CaseDetail />} />
            <Route path="cases/:id/edit" element={<CaseForm />} />

            {/* Categories Route */}
            <Route path="categories" element={<CategoryList />} />

            {/* Reports Route */}
            <Route path="reports" element={<ReportView />} />

            {/* Users Route */}
            <Route path="users" element={<UserList />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
