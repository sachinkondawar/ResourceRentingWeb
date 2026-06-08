import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useSocket();

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      addToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/bookings/${id}`, { status });
      addToast(`Booking ${status} successfully`, 'success');
      fetchBookings();
    } catch (error) {
      console.error('Failed to update booking status', error);
      addToast('Failed to update booking', 'error');
    }
  };

  const filteredBookings = bookings.filter(b => 
    b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.item?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: '0.5rem' }}>Manage Bookings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review rental requests, track active rentals, and manage returns.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary">Export CSV</button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search bookings by ID, user, or item..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }} 
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Booking ID</th>
                <th style={{ padding: '1rem' }}>User</th>
                <th style={{ padding: '1rem' }}>Item</th>
                <th style={{ padding: '1rem' }}>Dates</th>
                <th style={{ padding: '1rem' }}>Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading bookings...</td></tr>
              ) : filteredBookings.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No bookings found</td></tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{booking._id.substring(0, 6)}</td>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{booking.user?.name || 'Unknown'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{booking.item?.title || 'Unknown'}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <Calendar size={14} color="var(--primary)" />
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      ₹{booking.totalAmount}
                      {booking.paymentMethod === 'COD' && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--warning)', border: '1px solid currentColor', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>COD</span>}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${
                        booking.status === 'Completed' ? 'badge-success' : 
                        booking.status === 'Active' ? 'badge-primary' : 
                        booking.status === 'Pending' ? 'badge-warning' : 
                        'badge-danger'
                      }`} style={{ backgroundColor: booking.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' : undefined, color: booking.status === 'Cancelled' ? '#f87171' : undefined }}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {booking.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleUpdateStatus(booking._id, 'Active')} className="btn-icon-only" title="Approve" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.2)' }}><CheckCircle size={18} /></button>
                          <button onClick={() => handleUpdateStatus(booking._id, 'Cancelled')} className="btn-icon-only" title="Reject" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.2)' }}><XCircle size={18} /></button>
                        </div>
                      )}
                      
                      {booking.status === 'Active' && (
                        <button onClick={() => handleUpdateStatus(booking._id, 'Completed')} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                          <RotateCcw size={14} style={{ marginRight: '0.3rem' }} /> Mark Returned
                        </button>
                      )}

                      {(booking.status === 'Completed' || booking.status === 'Cancelled') && (
                        <button className="btn btn-secondary" disabled style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Resolved</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageBookings;
