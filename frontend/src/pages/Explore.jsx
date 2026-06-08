import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal, Star, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ItemCard = ({ id, image, title, price, category, rating, location, status }) => {
  const navigate = useNavigate();
  
  return (
    <div className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/resource/${id}`)}>
      <div style={{ height: '220px', backgroundColor: '#1e293b', backgroundImage: image ? `url(${image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {!image && <span style={{ color: 'var(--text-muted)' }}>No Image</span>}
        <div style={{ position: 'absolute', margin: '1rem', padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', top: 0, left: 0 }}>
          <MapPin size={14} color="var(--primary)" />
          <span>{location || 'Network Region'}</span>
        </div>
      </div>
      <div style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem', gap: '0.75rem' }}>
          <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{category}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className={`badge ${status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
              {status || 'Unknown'}
            </span>
            <span style={{ color: 'var(--warning)', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} fill="currentColor" /> {rating || 'New'}
            </span>
          </div>
        </div>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h4>
        <div className="flex justify-between items-center">
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{price}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/day</span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            {status === 'Available' ? 'Rent Now' : 'View Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Explore = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  const fetchItems = useCallback(async (search = '', location = '') => {
    setLoading(true);
    try {
      const response = await api.get('/items', {
        params: { search, location }
      });
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]); // Initial load

  const handleSearch = () => {
    fetchItems(searchQuery, locationQuery);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="heading-lg" style={{ marginBottom: '1rem' }}>Explore Resources</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Find exactly what you need, when you need it.</p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="input-group" style={{ flex: '1 1 300px', marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input-field" placeholder="Search for cameras, tools, tech..." style={{ paddingLeft: '3rem', fontSize: '1rem' }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        <div className="input-group" style={{ flex: '0 1 200px', marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <MapPin size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" className="input-field" placeholder="Location" style={{ paddingLeft: '3rem', fontSize: '1rem' }} value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        <button className="btn btn-secondary" style={{ flex: '0 0 auto' }}>
          <SlidersHorizontal size={18} />
          <span>Filters</span>
        </button>
        <button className="btn btn-primary" style={{ flex: '0 0 auto' }} onClick={handleSearch}>Search</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader className="animate-spin" style={{ margin: '0 auto 1rem' }} size={40} />
          <p>Loading catalog...</p>
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <p>No items found. Check back later!</p>
        </div>
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {items.map(item => (
            <ItemCard 
              key={item._id}
              id={item._id}
              image={item.images?.[0]}
              title={item.title}
              category={item.category}
              price={item.pricePerDay}
              rating={null} 
              location={item.location}
              status={item.status}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
