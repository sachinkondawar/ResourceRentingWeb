import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, Menu, X, Package, LogOut, Settings, Bell, Check } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  const isLoggedIn = user && token;

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
       console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (socket) {
      const handleNotif = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };
      // Prevent duplicate listeners
      socket.off('notification', handleNotif);
      socket.on('notification', handleNotif);
    }
  }, [socket]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { }
  };

  const markAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all`);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) { }
  };

  const unreadCount = notifications.filter(n => !n.read).length;


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled glass-panel' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <Package className="logo-icon" size={28} color="var(--primary)" />
          <span>Rentify</span>
        </Link>
        
        <div className="navbar-search hidden-mobile">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input type="text" placeholder="Search for tools, cameras..." className="search-input" />
          </div>
        </div>

        <div className="navbar-links hidden-mobile">
          <Link to="/explore" className="nav-link">Explore</Link>
          <Link to="/how-it-works" className="nav-link">How it Works</Link>
          {isLoggedIn ? (
            <>
              <Link to="/my-bookings" className="btn btn-secondary">My Bookings</Link>
              <div style={{ position: 'relative' }}>
                <button 
                  className="btn"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.5rem', position: 'relative' }}
                  onClick={() => { setNotifMenuOpen(!notifMenuOpen); setUserMenuOpen(false); }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && <span style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', padding: '2px 5px' }}>{unreadCount}</span>}
                </button>
                {notifMenuOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute', top: '120%', right: 0, 
                    display: 'flex', flexDirection: 'column', 
                    gap: '0.5rem', padding: '1rem', 
                    minWidth: '300px', maxHeight: '400px', overflowY: 'auto', zIndex: 100
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Notifications</h4>
                      {unreadCount > 0 && <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12px' }}>Mark all read</button>}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>No notifications yet</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: n.read ? 0.6 : 1 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '14px', fontWeight: n.read ? 'normal' : 'bold' }}>{n.message}</span>
                              {!n.read && <button onClick={() => markAsRead(n._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}><Check size={14} /></button>}
                           </div>
                           {n.link && <Link to={n.link} style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', marginTop: '4px' }}>View details</Link>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifMenuOpen(false); }}
                >
                  <UserIcon size={18} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute', top: '120%', right: 0, 
                    display: 'flex', flexDirection: 'column', 
                    gap: '0.5rem', padding: '0.5rem', 
                    minWidth: '150px', zIndex: 100
                  }}>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="nav-link" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} /> Admin Panel
                      </Link>
                    )}
                    <Link to="/settings" className="nav-link" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Settings size={16} /> Settings
                    </Link>
                    <button onClick={handleLogout} className="nav-link" style={{ 
                      padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#ef4444', justifyContent: 'flex-start', width: '100%'
                    }}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              <UserIcon size={18} />
              <span>Sign In</span>
            </Link>
          )}
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu Expansion */}
      {mobileMenuOpen && (
        <div className="mobile-menu glass-panel">
          <Link to="/explore" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Explore</Link>
          <Link to="/how-it-works" className="nav-link" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
          
          {isLoggedIn ? (
            <>
              <Link to="/my-bookings" className="btn btn-secondary" onClick={() => setMobileMenuOpen(false)}>My Bookings</Link>
              <Link to="/settings" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
              )}
              <button 
                className="btn btn-primary" 
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
