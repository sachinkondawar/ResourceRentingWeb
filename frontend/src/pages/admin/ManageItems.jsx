import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Loader, Image as ImageIcon, X } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const ManageItems = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useSocket();
  
  // Item Form Data
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'photography',
    pricePerDay: '',
    description: '',
    location: '', 
    images: [],
    status: 'Available'
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get('/items');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      addToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);
    setUploading(true);

    try {
      const response = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload response:', response.data);
      if (response.data && response.data.url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, response.data.url] }));
        addToast('Image uploaded successfully', 'success');
      } else {
        throw new Error('No URL in response');
      }
    } catch (error) {
      console.error('Failed to upload image', error);
      const msg = error.response?.data?.message || error.message || 'Upload failed';
      addToast(`Upload failed: ${msg}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ title: '', category: 'photography', pricePerDay: '', description: '', location: '', images: [], status: 'Available' });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setEditId(item._id);
    setFormData({
      title: item.title,
      category: item.category,
      pricePerDay: item.pricePerDay,
      description: item.description,
      location: item.location,
      images: Array.isArray(item.images) ? item.images : [],
      status: item.status
    });
    setShowModal(true);
  };

  const deleteImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const publishItem = async () => {
    if (!formData.title || !formData.pricePerDay || !formData.description || !formData.location) {
      return addToast("Title, Price, Description, and Location are required", 'warning');
    }

    if (formData.images.length === 0) {
      return addToast("At least one image is required", 'warning');
    }

    try {
      setUploading(true);
      if (isEditing) {
        await api.put(`/items/${editId}`, formData);
        addToast('Item updated successfully', 'success');
      } else {
        await api.post('/items', formData);
        addToast('Item created successfully', 'success');
      }
      setShowModal(false);
      fetchItems();
    } catch (error) {
      console.error('Failed to save item', error);
      const msg = error.response?.data?.message || 'Error saving item.';
      addToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await api.delete(`/items/${id}`);
        addToast('Item deleted safely', 'success');
        fetchItems();
      } catch (error) {
        console.error('Failed to delete item', error);
        addToast('Failed to delete item', 'error');
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: '0.5rem' }}>Manage Items</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Upload and manage all rental items on the platform.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Upload New Item</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Loader className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Image</th>
                  <th style={{ padding: '1rem' }}>Item Name</th>
                  <th style={{ padding: '1rem' }}>Category</th>
                  <th style={{ padding: '1rem' }}>Price/Day</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No items found</td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>#{item._id.substring(0, 6)}</td>
                      <td style={{ padding: '1rem' }}>
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt="img" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (<ImageIcon size={24} style={{ color: 'var(--text-muted)' }} />)}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{item.title}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{item.category}</td>
                      <td style={{ padding: '1rem' }}>₹{item.pricePerDay}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${item.status === 'Available' ? 'badge-success' : item.status === 'Rented' ? 'badge-primary' : 'badge-warning'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openEditModal(item)} className="btn-icon-only" style={{ color: 'var(--primary)', background: 'var(--primary-light)' }}><Edit size={16} /></button>
                          <button onClick={() => deleteItem(item._id)} className="btn-icon-only" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.2)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="heading-md">{isEditing ? 'Edit Item' : 'Upload New Item'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div className="input-group">
              <label className="input-label">Item Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="input-field" placeholder="e.g. Sony A7III Camera" />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="input-field">
                  <option value="photography">Photography</option>
                  <option value="tools">Power Tools</option>
                  <option value="electronics">Electronics</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="outdoors">Outdoors</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Price per Day (₹)</label>
                <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} className="input-field" placeholder="e.g. 450" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label className="input-label">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="input-field" placeholder="e.g. Warehouse A, Delhi" />
              </div>
              {isEditing && (
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                    <option value="Available">Available</option>
                    <option value="Rented">Rented</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows="4" placeholder="Describe the item..."></textarea>
            </div>

            <div className="input-group">
              <label className="input-label">Image Upload</label>
              <div 
                onClick={() => !uploading && fileInputRef.current.click()} 
                style={{ border: '2px dashed var(--glass-border)', padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-md)', cursor: 'pointer', opacity: uploading ? 0.5 : 1 }}
              >
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
                <Plus size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {uploading ? 'Processing Image...' : 'Click to select an image'}
                </p>
              </div>
              
              {formData.images.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {formData.images.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      <img src={src} alt="Uploaded preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteImage(idx); }} 
                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-secondary" disabled={uploading} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={uploading} onClick={publishItem}>
                {uploading ? 'Processing...' : (isEditing ? 'Update Item' : 'Publish Item')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageItems;
