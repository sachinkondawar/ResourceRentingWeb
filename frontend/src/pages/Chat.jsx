import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, User as UserIcon, Phone, Video, MoreVertical, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [adminContact, setAdminContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const { socket, addToast } = useSocket();

  const currentUser = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);
  const currentUserId = currentUser?.id || currentUser?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async (contact) => {
    if (!currentUserId || !contact?._id) return;

    try {
      const msgsRes = await api.get('/messages');
      const thread = msgsRes.data
        .filter(msg => {
          const senderId = msg.sender?._id || msg.sender;
          const receiverId = msg.receiver?._id || msg.receiver;

          return (
            (senderId === currentUserId && receiverId === contact._id) ||
            (senderId === contact._id && receiverId === currentUserId)
          );
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      setMessages(thread);
    } catch (fetchError) {
      console.error('Failed to fetch messages', fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load messages.');
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUser) {
      setError('Please sign in to use chat.');
      setLoading(false);
      return;
    }

    if (currentUser.role === 'admin') {
      setLoading(false);
      return;
    }

    const initChat = async () => {
      try {
        const adminRes = await api.get('/users/admin-contact');
        setAdminContact(adminRes.data);
        await fetchMessages(adminRes.data);
      } catch (initError) {
        console.error('Failed to init chat', initError);
        setError(initError.response?.data?.message || 'Unable to start chat right now.');
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [currentUser, fetchMessages]);

  useEffect(() => {
    if (!adminContact || !socket) return;
    
    // Listen for new messages
    const handleReceiveMessage = (msg) => {
      // Check if this message belongs to the current chat
      const msgSenderId = msg.sender?._id || msg.sender;
      const msgReceiverId = msg.receiver?._id || msg.receiver;
      if (
        (msgSenderId === adminContact._id && msgReceiverId === currentUserId) || 
        (msgSenderId === currentUserId && msgReceiverId === adminContact._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [adminContact, socket, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !adminContact || !currentUserId) return;

    const tempMsg = {
      _id: Date.now().toString(),
      sender: { _id: currentUserId, name: currentUser.name },
      receiver: adminContact,
      text: message.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);
    const textToSend = message.trim();
    setMessage('');
    setError('');

    try {
      await api.post('/messages', {
        receiver: adminContact._id,
        text: textToSend
      });

      await fetchMessages(adminContact);
    } catch (sendError) {
      console.error('Failed to send message', sendError);
      setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
      setError(sendError.response?.data?.message || 'Failed to send message.');
    }
  };

  if (!currentUser) {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <h2 className="heading-md" style={{ marginBottom: '1rem' }}>Login required</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please sign in before using the messaging system.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'admin') {
    return (
      <div className="container animate-fade-in" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="glass-panel" style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
          <h2 className="heading-md" style={{ marginBottom: '1rem' }}>Admin messages are in the inbox panel</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>This page is for users contacting support. As an admin, open the dedicated inbox to reply to users.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin/messages')}>Open Admin Inbox</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ height: 'calc(100vh - 80px)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <UserIcon size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rentify Support / Admin</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></span>
                {adminContact ? 'Online' : 'Unavailable'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
            <button className="btn-icon-only" onClick={() => addToast('Voice calls coming soon!', 'info')}><Phone size={20} /></button>
            <button className="btn-icon-only" onClick={() => addToast('Video calls coming soon!', 'info')}><Video size={20} /></button>
            <button className="btn-icon-only" onClick={() => addToast('Options menu coming soon!', 'info')}><MoreVertical size={20} /></button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.1)' }}>
          {loading ? (
            <div style={{ margin: 'auto' }}><Loader className="animate-spin" size={30} /></div>
          ) : error ? (
            <div style={{ margin: 'auto', color: '#f87171', textAlign: 'center' }}>{error}</div>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>No messages yet. Send a message to start conversing!</div>
          ) : (
            messages.map(msg => {
              const msgSenderId = msg.sender?._id || msg.sender;
              const isMe = msgSenderId === currentUserId;

              return (
                <div key={msg._id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{
                    padding: '1rem 1.2rem',
                    borderRadius: 'var(--radius-lg)',
                    background: isMe ? 'var(--primary)' : 'var(--bg-surface)',
                    border: isMe ? 'none' : '1px solid var(--glass-border)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    borderBottomRightRadius: isMe ? 0 : 'var(--radius-lg)',
                    borderBottomLeftRadius: isMe ? 'var(--radius-lg)' : 0
                  }}>
                    <p style={{ lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder={adminContact ? 'Type your message...' : 'Messaging is currently unavailable'}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1, borderRadius: 'var(--radius-full)' }}
              disabled={!adminContact || loading}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0 }} disabled={!adminContact || loading}>
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;

