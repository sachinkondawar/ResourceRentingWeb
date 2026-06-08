let io;
// Key: userId, Value: socketId
const userSocketMap = new Map();

module.exports = {
  init: (httpServer) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://resource-renting-web.vercel.app',
      'https://resource-renting-web.vercel.app/',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('register', (userId) => {
        if (userId) {
          userSocketMap.set(userId, socket.id);
          console.log(`User ${userId} registered with socket ${socket.id}`);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove socket from map
        for (let [key, value] of userSocketMap.entries()) {
          if (value === socket.id) {
            userSocketMap.delete(key);
            break;
          }
        }
      });
    });

    return io;
  },
  
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },

  getSocketId: (userId) => {
    return userSocketMap.get(userId);
  }
};
