import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackageSearch, CalendarCheck, CreditCard, MessageSquare, Settings, LogOut, Package, User } from 'lucide-react';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Manage Items', path: '/admin/items', icon: <PackageSearch size={20} /> },
    { name: 'Manage Bookings', path: '/admin/bookings', icon: <CalendarCheck size={20} /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    { name: 'Messages', path: '/admin/messages', icon: <MessageSquare size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> }
  ];

  return (
    <aside style={{
      width: '260px',
      flexShrink: 0,
      background: 'var(--bg-color)',
      borderRight: '1px solid var(--glass-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
        <NavLink to="/admin" className="navbar-logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Package size={26} color="var(--primary)" style={{ marginRight: '8px' }} />
          <span>Rentify Admin</span>
        </NavLink>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end={item.exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.8rem 1rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all var(--transition-fast)',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
            })}
          >
            {item.icon}
            <span style={{ fontWeight: 500 }}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
            <User size={16} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Admin'}</p>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'admin@rentify.com'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', color: '#ef4444' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
