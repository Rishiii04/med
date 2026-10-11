import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupSocket } from './app.js';
import { testConnection } from './config/database.js';
import config from './config/env.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.socket.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

setupSocket(io);

app.set('io', io);

const startServer = async () => {
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`🚀 MedFlow Server running on port ${config.port}`);
    console.log(`📡 Socket.IO enabled`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Client URL: ${config.clientUrl}`);
  });
};

startServer();

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io, httpServer };