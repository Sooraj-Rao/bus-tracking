import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar/Navbar"
import Home from "./pages/Home/Home"
import Tracking from "./pages/Tracking/Tracking"
import Booking from "./pages/Booking/Booking"
import Admin from "./pages/Admin/Admin"
import Schedules from "./pages/Schedules/Schedules"
import RouteOptimization from "./pages/RouteOptimization/RouteOptimization"
import SingleBusTracking from "./pages/SingleBusTracking/SingleBusTracking"
import LoginPage from "./pages/Auth/LoginPage"
import RegisterPage from "./pages/Auth/RegisterPage"
import AdminLoginPage from "./pages/Admin/AdminLoginPage"
import NotificationProvider from "./components/NotificationProvider/NotificationProvider"
import { AuthProvider, useAuth } from "./context/AuthContext" 
import "./App.css"


const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return <div>Loading authentication...</div>; 
  }

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/admin/login" replace />; 
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  return children;
};


const App = () => {
  return (
    <NotificationProvider>
      <Router>
        <AuthProvider> 
          <div className="app">
            <Navbar />
            <div className="app-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/booking" element={
                  <ProtectedRoute>
                    <Booking />
                  </ProtectedRoute>
                } />
                <Route path="/schedules" element={<Schedules />} />
                <Route path="/route-optimization" element={<RouteOptimization />} />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin">
                    <Admin />
                  </ProtectedRoute>
                } />
                <Route path="/track/bus/:busId" element={<SingleBusTracking />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} /> 
              </Routes>
            </div>
          </div>
        </AuthProvider>
      </Router>
    </NotificationProvider>
  )
}

export default App
