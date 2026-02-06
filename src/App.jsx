import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminLayout from './components/admin/AdminLayout'
import UserLayout from './components/user/UserLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import Recruitment from './pages/admin/Recruitment'
import ResumeScreening from './pages/admin/ResumeScreening'
import OfferLetter from './pages/admin/OfferLetter'
import Reporting from './pages/admin/Reporting'
import UserHome from './pages/user/UserHome'
import UnderConstruction from './pages/UnderConstruction'
import Homepage from './components/home/Homepage'
import AdminLogin from './components/admin/AdminLogin'
import ProtectedRoute from './components/admin/ProtectedRoute'
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Redirect root to user home */}
          <Route path="/" element={<Navigate to="/user/home" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="resume-screening" element={<ResumeScreening />} />
            <Route path="offer-letter/:applicationId" element={<OfferLetter />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="employees" element={<UnderConstruction />} />
            <Route path="settings" element={<UnderConstruction />} />
          </Route>
          <Route path="/home" element={<Homepage />} />
          {/* User Routes */}
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<Navigate to="/user/home" replace />} />
            <Route path="home" element={<UserHome />} />
            <Route path="applications" element={<UnderConstruction />} />
            <Route path="profile" element={<UnderConstruction />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
