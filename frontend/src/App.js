import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

// --- NEW Admin Components ---
// We will create these next
import AdminSidebar from './components/admin/AdminSidebar';
import AdminTopbar from './components/admin/AdminTopbar';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageItems from './pages/admin/ManageItems';
import ManageBookings from './pages/admin/ManageBookings';
import Payments from './pages/admin/Payments';
import Messages from './pages/admin/Messages';
import Settings from './pages/Settings';

import Explore from './pages/Explore';
import ResourceDetails from './pages/ResourceDetails';
import UserBookings from './pages/UserBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

// Route Guard for authenticated users
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {}

  if (!token) return <Navigate to="/login" replace />;
  
  // If user is admin, redirect them to admin dashboard
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

// Route Guard for admin users
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user && user.role === 'admin';
  
  if (!token) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/" replace />;
};

// Layout for public and logged-in users
const UserLayout = () => {
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '80px' }}>
      <Navbar />
      <main className="main-content" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Layout for Admins
const AdminLayout = () => {
  return (
    <div className="admin-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-surface)' }}>
      <AdminSidebar />
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminTopbar />
        <main className="admin-content" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* User Module Routes */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/resource/:id" element={<ResourceDetails />} />
          
          {/* Protected User Routes */}
          <Route path="/my-bookings" element={<PrivateRoute><UserBookings /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin Module Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="items" element={<ManageItems />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
