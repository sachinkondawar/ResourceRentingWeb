import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User as UserIcon, Loader } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContact, setActiveContact] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [contacts, setContacts] = useState([]);
  const messagesEndRef = useRef(null);
  const { socket, addToast } = useSocket();

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const currentUserId = currentUser?.id || currentUser?._id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/messages');
      const allMsgs = response.data;
      setMessages(allMsgs);

      const contactMap = new Map();
      allMsgs.forEach(msg => {
        const senderId = msg.sender?._id || msg.sender;
        const otherUser = senderId === currentUserId ? msg.receiver : msg.sender;

        if (otherUser && (otherUser._id || typeof otherUser === 'string')) {
          const otherUserId = otherUser._id || otherUser;
          if (!contactMap.has(otherUserId)) {
            contactMap.set(otherUserId, otherUser);
          }
        }
      });

      const nextContacts = Array.from(contactMap.values());
      setContacts(nextContacts);

      setActiveContact(prev => {
        if (!prev && nextContacts.length > 0) {
          return nextContacts[0];
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to load messages', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      
      // Update contacts if new message comes from a new user
      setContacts((prevContacts) => {
        const senderId = msg.sender?._id || msg.sender;
        const receiverId = msg.receiver?._id || msg.receiver;
        const otherUser = senderId === currentUserId ? msg.receiver : msg.sender;
        
        if (otherUser && (otherUser._id || typeof otherUser === 'string')) {
          const otherUserId = otherUser._id || otherUser;
          if (!prevContacts.find(c => (c._id || c) === otherUserId)) {
            return [otherUser, ...prevContacts];
          }
        }
        return prevContacts;
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => socket.off('receive_message', handleReceiveMessage);
  }, [socket, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeContact]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeContact || !newMessage.trim()) return;

    try {
      const contactId = activeContact._id || activeContact;
      await api.post('/messages', {
        receiver: contactId,
        text: newMessage
      });
      // Refresh to get the actual sorted message
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Send failed', error);
      addToast('Failed to send message.', 'error');
    }
  };

  const activeThread = messages
    .filter(msg => {
      const contactId = activeContact?._id || activeContact;
      const senderId = msg.sender?._id || msg.sender;
      const receiverId = msg.receiver?._id || msg.receiver;

      return (
        (senderId === currentUserId && receiverId === contactId) ||
        (senderId === contactId && receiverId === currentUserId)
      );
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  if (!currentUserId) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in as an admin to use the inbox.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: 'calc(100vh - 120px)' }}>

      {/* Sidebar logic */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Contacts</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Inbox list</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}><Loader className="animate-spin" size={24} /></div>
          ) : contacts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No conversations yet.</div>
          ) : (
            contacts.map(contact => {
              const contactId = contact._id || contact;
              const activeId = activeContact?._id || activeContact;
              return (
                <div 
                  key={contactId} 
                  onClick={() => setActiveContact(contact)}
                  style={{ 
                    padding: '1rem 1.5rem', 
                    borderBottom: '1px solid var(--glass-border)', 
                    cursor: 'pointer',
                    background: activeId === contactId ? 'var(--primary-light)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    {contact.name?.charAt(0) || 'U'}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{contact.name || 'User'}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contact.email || ''}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Messages List Area */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
          <h2 className="heading-sm">{activeContact ? `Chat with ${activeContact.name || 'User'}` : 'Select a contact'}</h2>
        </div>
        
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'rgba(0,0,0,0.1)' }}>
          {!activeContact ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
              <MessageSquare size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
              <p>Click on a contact to start messaging.</p>
            </div>
          ) : activeThread.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
              <p>No messages in this thread.</p>
            </div>
          ) : (
            activeThread.map(msg => {
              const currentUserId = currentUser.id || currentUser._id;
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

        {/* Message Input */}
        {activeContact && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-card)' }}>
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder={`Message ${activeContact.name || 'User'}...`} 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)} 
                className="input-field" 
                style={{ flex: 1, borderRadius: 'var(--radius-full)' }} 
              />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0 }}>
                <Send size={20} />
              </button>
            </form>
          </div>
        )}
      </div>

    </div>
  );
};

export default Messages;

