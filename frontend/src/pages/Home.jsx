import React, { useState, useEffect } from 'react';
import { Camera, Wrench, Monitor, Zap, Shield, Clock, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const FeatureCard = ({ icon, title, desc }) => (
  <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
    <div style={{ background: 'var(--primary-light)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--primary)' }}>
      {icon}
    </div>
    <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{desc}</p>
  </div>
);

const CategoryCard = ({ icon, title, count }) => {
  const navigate = useNavigate();
  return (
    <div className="glass-card flex items-center gap-4" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => navigate('/explore')}>
      <div style={{ color: 'var(--accent)' }}>{icon}</div>
      <div>
        <h4 style={{ fontWeight: '600' }}>{title}</h4>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{count} items</span>
      </div>
    </div>
  );
};

const ItemCard = ({ id, image, title, price, category, rating }) => {
  const navigate = useNavigate();
  return (
    <div className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/resource/${id}`)}>
      <div style={{ height: '200px', backgroundColor: '#1e293b', backgroundImage: image ? `url(${image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!image && <span style={{ color: 'var(--text-muted)' }}>No Image</span>}
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{category}</span>
          <span style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.9rem' }}>★ {rating || 'New'}</span>
        </div>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
        <div className="flex justify-between items-center">
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{price}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/day</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/resource/${id}`); }}>Rent Now</button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await api.get('/items');
        // Just take the first 3 items for the home page
        setFeaturedItems(response.data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching featured items', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-page" style={{ paddingTop: '5rem' }}>
      {/* Hero Section */}
      <section className="hero-section container" style={{ padding: '6rem 1.5rem 4rem', textAlign: 'center' }}>
        <div className="animate-fade-in">
          <span className="badge badge-primary" style={{ marginBottom: '1.5rem' }}>Welcome to Rentify</span>
          <h1 className="heading-xl" style={{ margin: '1rem 0' }}>
            Rent what you need.<br />
            <span className="text-gradient">Share what you have.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            The premium platform to rent tools, electronics, and everyday items from your local community. Secure, easy, and smart.
          </p>
          <div className="flex justify-center gap-4">
            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/explore')}>Explore Resources</button>
            <button className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/login')}>List an Item</button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="heading-lg">How <span className="text-gradient">Rentify</span> Works</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Simple, transparent, and secure process for everyone.</p>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard 
            icon={<Search size={32} />} 
            title="1. Find your item" 
            desc="Search through thousands of items listed by verified local users." 
          />
          <FeatureCard 
            icon={<Shield size={32} />} 
            title="2. Book securely" 
            desc="Request to book with our secure payment and deposit system." 
          />
          <FeatureCard 
            icon={<Clock size={32} />} 
            title="3. Pick up & Use" 
            desc="Meet the owner, check the item, and enjoy your rental period." 
          />
        </div>
      </section>

      {/* Categories */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <h2 className="heading-lg">Browse Categories</h2>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/explore')}>View All</button>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <CategoryCard icon={<Camera size={28} />} title="Photography" count="124" />
          <CategoryCard icon={<Wrench size={28} />} title="Power Tools" count="356" />
          <CategoryCard icon={<Monitor size={28} />} title="Electronics" count="210" />
          <CategoryCard icon={<Zap size={28} />} title="Party Equipment" count="85" />
        </div>
      </section>

      {/* Featured Items */}
      <section className="container" style={{ padding: '4rem 1.5rem 6rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
          <h2 className="heading-lg">Popular <span className="text-gradient">Near You</span></h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading popular items...</div>
        ) : featuredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No items currently available. Provide some from the Admin panel!</div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
            {featuredItems.map(item => (
              <ItemCard 
                key={item._id}
                id={item._id}
                image={item.images && item.images.length > 0 ? item.images[0] : null}
                title={item.title} 
                category={item.category} 
                price={item.pricePerDay} 
                rating={null} 
              />
            ))}
          </div>
        )}
      </section>

      </div>
    );
  };

export default Home;
