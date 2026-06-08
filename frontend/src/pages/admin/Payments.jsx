import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Search, RotateCcw } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const Payments = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useSocket();

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to load bookings', error);
      addToast('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleUpdatePayment = async (id, paymentStatus) => {
    try {
      await api.put(`/bookings/${id}/payment`, { paymentStatus });
      addToast(`Payment marked as ${paymentStatus}`, 'success');
      fetchBookings();
    } catch (error) {
      addToast('Failed to update payment status', 'error');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Paid') return <span className="badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Paid</span>;
    if (status === 'Refunded') return <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Refunded</span>;
    return <span className="badge" style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308' }}>Pending</span>;
  };

  const filteredBookings = bookings.filter(b => 
    b._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-md">Payments Tracker</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor and update transaction statuses.</p>
        </div>
        <div className="search-wrapper" style={{ minWidth: '300px' }}>
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID or User..." 
            className="search-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Transaction ID</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>User</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Amount</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading payments...</td></tr>
            ) : filteredBookings.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No payments found.</td></tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>#{booking._id.substring(0, 8)}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{booking.user?.name || 'Unknown User'}</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary)' }}>₹{booking.totalAmount}</td>
                  <td style={{ padding: '1rem' }}>{getStatusBadge(booking.paymentStatus || 'Pending')}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {booking.paymentStatus !== 'Paid' && (
                        <button 
                          onClick={() => handleUpdatePayment(booking._id, 'Paid')} 
                          className="btn-icon-only" 
                          title="Mark as Paid"
                          style={{ color: 'var(--success)', background: 'rgba(34,197,94,0.1)' }}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {booking.paymentStatus === 'Paid' && (
                        <button 
                          onClick={() => handleUpdatePayment(booking._id, 'Refunded')} 
                          className="btn-icon-only" 
                          title="Mark as Refunded"
                          style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)' }}
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
