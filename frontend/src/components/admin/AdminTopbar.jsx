import React, { useState, useEffect } from 'react';
import { Bell, Search, User as UserIcon, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const AdminTopbar = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
       console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotif = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };
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

  return (
    <header style={{
      height: '80px',
      flexShrink: 0,
      background: 'var(--bg-color)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ width: '350px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search items, users, bookings..." 
          style={{
            width: '100%',
            padding: '0.6rem 1rem 0.6rem 2.8rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <button 
            style={{ position: 'relative', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                background: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid var(--bg-color)'
              }}></span>
            )}
          </button>
          
          {notifMenuOpen && (
            <div className="glass-panel animate-fade-in" style={{
              position: 'absolute', top: '150%', right: 0, 
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-full)', background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <UserIcon size={20} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', paddingRight: '0.5rem' }}>{user?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
