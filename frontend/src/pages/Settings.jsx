import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Save, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/profile');
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          password: ''
        });
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      const response = await api.put('/users/profile', payload);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      // Update local storage user data
      const oldUser = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...oldUser, ...response.data }));
      setFormData({ ...formData, password: '' });
    } catch (error) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <h1 className="heading-md" style={{ marginBottom: '1.5rem' }}>Account Settings</h1>
      <div className="glass-panel" style={{ maxWidth: '600px', padding: '2rem' }}>
        {message.text && (
          <div style={{
            backgroundColor: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            color: message.type === 'error' ? '#ef4444' : '#22c55e',
            padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <AlertCircle size={18} />
            <span>{message.text}</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" style={{ paddingLeft: '2.8rem' }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" style={{ paddingLeft: '2.8rem' }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" style={{ paddingLeft: '2.8rem' }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">New Password (leave blank to keep current)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="••••••••" style={{ paddingLeft: '2.8rem' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
