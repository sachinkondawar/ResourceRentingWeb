import React, { useState, useEffect } from 'react';
import { Calendar, Loader, Star, X, ReceiptText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const UserBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useSocket();
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({ isOpen: false, bookingId: null, itemId: null });
  // Receipt Modal State
  const [receiptModal, setReceiptModal] = useState({ isOpen: false, booking: null });
  
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment) return addToast('Comment is required', 'warning');
    
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId: reviewModal.bookingId,
        itemId: reviewModal.itemId,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      addToast('Review posted successfully!', 'success');
      setReviewModal({ isOpen: false, bookingId: null, itemId: null });
      setReviewForm({ rating: 5, comment: '' });
      fetchMyBookings(); 
    } catch (error) {
      console.error('Failed to post review', error);
      addToast(error.response?.data?.message || 'Error posting review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePendingPayment = async (booking) => {
    try {
      const keyRes = await api.get('/payment/key');
      const apiKey = keyRes.data.key;

      const orderRes = await api.post('/payment/create-order', {
        amount: booking.totalAmount
      });
      const order = orderRes.data;

      const options = {
        key: apiKey,
        amount: order.amount,
        currency: order.currency,
        name: "Rentify",
        description: `Payment for ${booking.item?.title || 'Booking'}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });
            addToast('Payment Successful!', 'success');
            fetchMyBookings();
          } catch (error) {
            console.error('Payment Verification Failed', error);
            addToast('Payment Verification Failed.', 'error');
          }
        },
        theme: { color: "#0d9488" }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         addToast('Payment Failed. Please try again.', 'error');
      });
      rzp.open();
    } catch (error) {
      console.error('Failed to initiate payment', error);
      addToast('Failed to initiate payment', 'error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '6rem', maxWidth: '1000px' }}>
      <h1 className="heading-md" style={{ marginBottom: '0.5rem' }}>My Bookings</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Track and manage all your rental requests.</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><Loader className="animate-spin" style={{ margin: '0 auto' }} /></div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>You haven't made any bookings yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map(booking => (
            <div key={booking._id} className="glass-card flex" style={{ padding: '1.5rem', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                {booking.item?.images?.[0] ? (
                  <img src={booking.item.images[0]} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                )}
              </div>
              
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div className="flex justify-between items-start" style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{booking.item?.title || 'Unknown Item'}</h3>
                  <span className={`badge ${
                      booking.status === 'Completed' ? 'badge-success' : 
                      booking.status === 'Active' ? 'badge-primary' : 
                      booking.status === 'Pending' ? 'badge-warning' : 
                      'badge-danger'
                    }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total:</span> ₹{booking.totalAmount}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Price per day:</span> ₹{booking.item?.pricePerDay}
                  </div>
                </div>

                <div className="flex gap-4">
                  {booking.status === 'Completed' ? (
                    <>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/resource/${booking.item?._id}`)}
                      >
                        Rent Again
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => setReviewModal({ isOpen: true, bookingId: booking._id, itemId: booking.item?._id })}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#eab308' }}
                      >
                        <Star size={16} style={{ marginRight: '0.3rem' }} /> Leave a Review
                      </button>
                    </>
                  ) : (
                    <>
                      {booking.paymentStatus === 'Pending' && booking.status !== 'Cancelled' && booking.paymentMethod !== 'COD' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => handlePendingPayment(booking)}
                        >
                          Pay Now
                        </button>
                      )}
                      {booking.paymentStatus === 'Pending' && booking.status !== 'Cancelled' && booking.paymentMethod === 'COD' && (
                        <span className="badge" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
                          COD Pending
                        </span>
                      )}
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => setReceiptModal({ isOpen: true, booking })}
                      >
                        <ReceiptText size={16} style={{ marginRight: '0.3rem' }} /> View Receipt
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate('/chat')}>Contact Admin</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="heading-md">Leave a Review</h2>
              <button onClick={() => setReviewModal({ isOpen: false, bookingId: null, itemId: null })} className="btn-icon-only">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="input-group">
                <label className="input-label">Rating (1-5)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1,2,3,4,5].map(num => (
                    <button 
                      type="button" 
                      key={num} 
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: num }))}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer', 
                        color: num <= reviewForm.rating ? '#eab308' : 'var(--text-muted)' 
                      }}
                    >
                      <Star size={24} fill={num <= reviewForm.rating ? '#eab308' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">Comment</label>
                <textarea 
                  className="input-field" 
                  rows="4" 
                  placeholder="Share your experience..."
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '1rem' }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Receipt Modal */}
      {receiptModal.isOpen && receiptModal.booking && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
             <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary)' }}>
                   <ReceiptText size={32} />
                </div>
                <h2 className="heading-md">Rental Receipt</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Transaction ID: #{receiptModal.booking._id}</p>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Item</span>
                   <span style={{ fontWeight: 600 }}>{receiptModal.booking.item?.title || 'Unknown Item'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Dates</span>
                   <span style={{ fontSize: '0.9rem' }}>{new Date(receiptModal.booking.startDate).toLocaleDateString()} - {new Date(receiptModal.booking.endDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span style={{ color: 'var(--text-secondary)' }}>Payment Status</span>
                   <span className="badge" style={{ background: receiptModal.booking.paymentStatus === 'Paid' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)', color: receiptModal.booking.paymentStatus === 'Paid' ? '#22c55e' : '#eab308' }}>
                      {receiptModal.booking.paymentStatus || 'Pending'}
                   </span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px dashed var(--glass-border)', margin: '0.5rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 700 }}>
                   <span>Total Paid</span>
                   <span style={{ color: 'var(--primary)' }}>₹{receiptModal.booking.totalAmount}</span>
                </div>
             </div>

             <button onClick={() => setReceiptModal({ isOpen: false, booking: null })} className="btn btn-primary" style={{ width: '100%' }}>Close Receipt</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBookings;
