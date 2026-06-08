import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', link) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type, link }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        let newSocket;
        if (user && token) {
            newSocket = io(process.env.REACT_APP_SOCKET_URL || 'https://resourcerentingweb-backend.onrender.com');
            setSocket(newSocket);
            const userId = user.id || user._id; // Fix: handles both id and _id
            if (userId) {
                newSocket.emit('register', userId);
            }

            newSocket.on('notification', (notification) => {
                addToast(notification.message, notification.type, notification.link);
            });

            // We handle receive_message in Chat Component or here.
            newSocket.on('receive_message', (msg) => {
                if (window.location.pathname !== '/chat' && window.location.pathname !== '/admin/messages') {
                    addToast(`New message from ${msg.sender.name}`, 'Message', '/chat');
                }
            });
        }

        return () => {
            if (newSocket) newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-message toast-${toast.type.toLowerCase()}`}>
                        <span>{toast.message}</span>
                        <div className="toast-actions">
                            {toast.link && <a href={toast.link} className="toast-link">View</a>}
                            <button onClick={() => removeToast(toast.id)}>✕</button>
                        </div>
                    </div>
                ))}
            </div>
        </SocketContext.Provider>
    );
};
