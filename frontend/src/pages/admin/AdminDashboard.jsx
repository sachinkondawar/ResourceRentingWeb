import React, { useState, useEffect } from 'react';
import { Users, Package, CalendarCheck, DollarSign, TrendingUp, Loader, FileText, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const StatCard = ({ title, value, icon, trend }) => (
  <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</p>
      <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{value}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.5rem', color: 'var(--success)', fontSize: '0.85rem' }}>
        <TrendingUp size={14} />
        <span>{trend} from last month</span>
      </div>
    </div>
    <div style={{ padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
      {icon}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalItems: 0,
    activeBookings: 0,
    totalUsers: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useSocket();

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, recentRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/recent-bookings')
      ]);
      setMetrics(metricsRes.data);
      setRecentBookings(recentRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      addToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateReport = async () => {
    try {
      const res = await api.get('/bookings');
      const bookings = res.data;
      
      const headers = ['Booking ID', 'User', 'Item', 'Start Date', 'End Date', 'Amount', 'Status'];
      const rows = bookings.map(b => [
        b._id,
        b.user?.name || 'Unknown',
        b.item?.title || 'Unknown',
        new Date(b.startDate).toLocaleDateString(),
        new Date(b.endDate).toLocaleDateString(),
        `INR ${b.totalAmount}`,
        b.status
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Rentify_Bookings_Report_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addToast('Report generated successfully', 'success');
    } catch (error) {
      addToast('Failed to generate report', 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: '0.5rem' }}>Overview Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name || 'Admin'}. Here's what's happening today.</p>
        </div>
        <button className="btn btn-primary" onClick={generateReport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} />
          <span>Generate Report</span>
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Revenue" value={`₹${metrics.totalRevenue}`} icon={<DollarSign size={24} />} trend="Active" />
        <StatCard title="Active Listings" value={metrics.totalItems} icon={<Package size={24} />} trend="Active" />
        <StatCard title="Active Bookings" value={metrics.activeBookings} icon={<CalendarCheck size={24} />} trend="Active" />
        <StatCard title="Total Users" value={metrics.totalUsers} icon={<Users size={24} />} trend="Active" />
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Recent Bookings</h3>
        
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><Loader className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No recent activity found.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '1rem' }}>User</th>
                  <th style={{ padding: '1rem' }}>Item</th>
                  <th style={{ padding: '1rem' }}>Date</th>
                  <th style={{ padding: '1rem' }}>Amount</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{b.user?.name || 'User'}</td>
                    <td style={{ padding: '1rem' }}>{b.item?.title || 'Item'}</td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={12} />
                        {new Date(b.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>₹{b.totalAmount}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${b.status === 'Completed' ? 'badge-success' : b.status === 'Pending' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.75rem' }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
