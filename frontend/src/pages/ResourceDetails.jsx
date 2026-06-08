import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Clock, Loader } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useSocket();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsData, setReviewsData] = useState({ reviews: [], count: 0, avgRating: 0 });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('Online');

  useEffect(() => {
    const fetchItemAndReviews = async () => {
      setLoading(true);
      try {
        const [itemRes, reviewsRes] = await Promise.all([
          api.get(`/items/${id}`),
          api.get(`/reviews/item/${id}`)
        ]);
        setItem(itemRes.data);
        setReviewsData(reviewsRes.data);
      } catch (error) {
        console.error('Failed to fetch item details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItemAndReviews();
  }, [id]);

  const computeTotal = () => {
    if (!startDate || !endDate || !item) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    return diffDays * item.pricePerDay;
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    try {
      const totalAmount = (computeTotal() * 1.05).toFixed(2);
      
      // 1. Create a pending booking
      const bookingRes = await api.post('/bookings', {
        itemId: item._id,
        startDate,
        endDate,
        totalAmount,
        paymentMethod: selectedPayment
      });
      const bookingId = bookingRes.data._id;

      if (selectedPayment === 'COD') {
        addToast('Booking Configured! Please pay cash on delivery.', 'success');
        setShowPayment(false);
        navigate('/my-bookings');
        return;
      }

      // 2. Fetch Razorpay key
      const keyRes = await api.get('/payment/key');
      const apiKey = keyRes.data.key;

      // 3. Create Razorpay order
      const orderRes = await api.post('/payment/create-order', {
        amount: totalAmount
      });
      const order = orderRes.data;

      // 4. Initialize Razorpay Modal
      const options = {
        key: apiKey,
        amount: order.amount,
        currency: order.currency,
        name: "Rentify",
        description: `Booking for ${item.title}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: bookingId
            });
            addToast('Payment Successful! Booking confirmed.', 'success');
            setShowPayment(false);
            navigate('/my-bookings');
          } catch (error) {
            console.error('Payment Verification Failed', error);
            addToast('Payment Verification Failed.', 'error');
            navigate('/my-bookings');
          }
        },
        theme: { color: "#0d9488" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         addToast('Payment Failed. You can try again from My Bookings.', 'error');
         setShowPayment(false);
         navigate('/my-bookings');
      });
      rzp.open();

    } catch (error) {
      console.error('Booking failed', error);
      addToast(error.response?.data?.message || 'Failed to process booking', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <Loader className="animate-spin" style={{ margin: '0 auto 1rem' }} size={40} />
        <p>Loading Item...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
        <h2 className="heading-md">Item not found.</h2>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  const isAvailable = item.status === 'Available';

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '6rem' }}>
      <button className="btn btn-secondary" style={{ marginBottom: '2rem' }} onClick={() => navigate(-1)}>
        &larr; Back to Explore
      </button>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '3rem' }}>
        {/* Left Column - Details */}
        <div>
          <div style={{ width: '100%', height: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '2rem', background: 'var(--glass-bg)' }}>
            {item.images && item.images[0] ? (
              <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image Available</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div className="flex items-center gap-4" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{item.category}</span>
                <span className={`badge ${isAvailable ? 'badge-success' : 'badge-warning'}`}>
                  {item.status}
                </span>
                <span style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star fill="currentColor" size={16} /> {reviewsData.avgRating} ({reviewsData.count} reviews)
                </span>
              </div>
              <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>{item.title}</h1>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                <MapPin size={18} color="var(--primary)" />
                {item.location}
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '2rem 0' }} />

          <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Description</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '2rem', whiteSpace: 'pre-line' }}>
            {item.description}
          </p>

          <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '3rem 0' }} />

          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={24} color="var(--warning)" fill="currentColor" /> 
            {reviewsData.avgRating} · {reviewsData.count} Reviews
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviewsData.reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet for this item.</p>
            ) : (
              reviewsData.reviews.map(review => (
                <div key={review._id} className="glass-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {review.user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{review.user?.name || 'Anonymous User'}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem', color: 'var(--warning)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} color={i < review.rating ? 'currentColor' : 'var(--glass-border)'} />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div>
          <div className="glass-panel sticky" style={{ padding: '2rem', top: '100px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
              ₹{item.pricePerDay} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ day</span>
            </h2>
            
            <div style={{ margin: '2rem 0' }}>
              <div className="input-group">
                <label className="input-label">Pick-up Date</label>
                <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="input-group">
                <label className="input-label">Return Date</label>
                <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
              </div>
            </div>

            {startDate && endDate && (
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                <div className="flex justify-between" style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>₹{item.pricePerDay} x {Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) || 1} days</span>
                  <span>₹{computeTotal()}</span>
                </div>
                <div className="flex justify-between" style={{ marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Service Fee (5%)</span>
                  <span>₹{(computeTotal() * 0.05).toFixed(2)}</span>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                <div className="flex justify-between" style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary)' }}>₹{(computeTotal() * 1.05).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginBottom: '1.5rem', opacity: (!startDate || !endDate || !isAvailable) ? 0.7 : 1 }}
              onClick={() => {
                if (!localStorage.getItem('token')) {
                  addToast('Please Login to continue', 'warning');
                  navigate('/login');
                  return;
                }
                setShowPayment(true);
              }}
              disabled={!startDate || !endDate || !isAvailable}
            >
              {isAvailable ? 'Request to Book' : `Currently ${item.status}`}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <ShieldCheck size={18} color="var(--success)" />
                <span>Secure Payments via Razorpay/Stripe</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <Clock size={18} />
                <span>24/7 Support from Rentify</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', textAlign: 'center' }}>
            <h2 className="heading-md" style={{ marginBottom: '1rem' }}>Complete Payment</h2>
            
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
                You are about to book this item for <strong>₹{(computeTotal() * 1.05).toFixed(2)}</strong>.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Online" 
                    checked={selectedPayment === 'Online'} 
                    onChange={() => setSelectedPayment('Online')} 
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontWeight: selectedPayment === 'Online' ? 600 : 400 }}>Pay Online securely (Razorpay)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="COD" 
                    checked={selectedPayment === 'COD'} 
                    onChange={() => setSelectedPayment('COD')} 
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontWeight: selectedPayment === 'COD' ? 600 : 400 }}>Cash on Delivery / Pay on Pickup</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" disabled={bookingLoading} onClick={() => setShowPayment(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={bookingLoading} onClick={handleBooking}>
                {bookingLoading ? 'Processing...' : (selectedPayment === 'Online' ? 'Pay Now' : 'Confirm Booking')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetails;
