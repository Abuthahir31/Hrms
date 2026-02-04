import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import UserLayout from './components/user/UserLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import Recruitment from './pages/admin/Recruitment'
import ResumeScreening from './pages/admin/ResumeScreening'
import UserHome from './pages/user/UserHome'
import UnderConstruction from './pages/UnderConstruction'

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to user home */}
        <Route path="/" element={<Navigate to="/user/home" replace />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="recruitment" element={<Recruitment />} />
          <Route path="resume-screening" element={<ResumeScreening />} />
          <Route path="employees" element={<UnderConstruction />} />
          <Route path="settings" element={<UnderConstruction />} />
        </Route>

        {/* User Routes */}
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="/user/home" replace />} />
          <Route path="home" element={<UserHome />} />
          <Route path="applications" element={<UnderConstruction />} />
          <Route path="profile" element={<UnderConstruction />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
