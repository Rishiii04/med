import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import models from '../models/index.js';

const { User, QueueEntry, Encounter, OperatingSession, Consultation } = models;

const userSockets = new Map();
const patientRooms = new Map();
const departmentRooms = new Map();

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, config.jwt.secret);
      
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.is_active) {
        return next(new Error('User not found or inactive'));
      }
      
      socket.userId = user.id;
      socket.userRole = user.role;
      socket.user = user;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId} (${socket.userRole})`);
    
    userSockets.set(socket.userId, socket.id);
    
    socket.join(`user:${socket.userId}`);
    
    if (socket.userRole === 'PATIENT') {
      socket.join(`patient:${socket.userId}`);
      patientRooms.set(socket.userId, socket.id);
    }
    
    if (socket.userRole === 'DOCTOR') {
      setupDoctorRooms(socket);
    }
    
    if (socket.userRole === 'ADMIN') {
      socket.join('admin:all');
    }
    
    socket.on('join:department', async (data) => {
      if (socket.userRole !== 'DOCTOR' && socket.userRole !== 'ADMIN') return;
      
      const { departmentId } = data;
      if (!departmentId) return;
      
      socket.join(`department:${departmentId}`);
      departmentRooms.set(`${socket.userId}:${departmentId}`, true);
      
      const session = await OperatingSession.findOne({
        where: {
          department_id: departmentId,
          session_date: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
        },
      });
      
      if (session) {
        socket.join(`session:${session.id}`);
      }
    });
    
    socket.on('leave:department', (data) => {
      const { departmentId } = data;
      if (!departmentId) return;
      
      socket.leave(`department:${departmentId}`);
      departmentRooms.delete(`${socket.userId}:${departmentId}`);
    });
    
    socket.on('join:session', (data) => {
      if (socket.userRole !== 'DOCTOR' && socket.userRole !== 'ADMIN') return;
      
      const { sessionId } = data;
      if (!sessionId) return;
      
      socket.join(`session:${sessionId}`);
    });
    
    socket.on('leave:session', (data) => {
      const { sessionId } = data;
      if (!sessionId) return;
      
      socket.leave(`session:${sessionId}`);
    });
    
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userId} (${socket.userRole})`);
      userSockets.delete(socket.userId);
      patientRooms.delete(socket.userId);
      
      if (socket.userRole === 'DOCTOR') {
        for (const key of departmentRooms.keys()) {
          if (key.startsWith(`${socket.userId}:`)) {
            departmentRooms.delete(key);
          }
        }
      }
    });
  });
};

const setupDoctorRooms = async (socket) => {
  const doctorProfile = await models.DoctorProfile.findOne({
    where: { user_id: socket.userId },
    include: ['department'],
  });
  
  if (doctorProfile?.department_id) {
    socket.join(`department:${doctorProfile.department_id}`);
    
    const session = await OperatingSession.findOne({
      where: {
        department_id: doctorProfile.department_id,
        session_date: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      },
    });
    
    if (session) {
      socket.join(`session:${session.id}`);
    }
  }
};

export const emitQueueUpdate = (io, departmentId, sessionId, queueData) => {
  if (departmentId) {
    io.to(`department:${departmentId}`).emit('queue-updated', queueData);
  }
  if (sessionId) {
    io.to(`session:${sessionId}`).emit('queue-updated', queueData);
  }
};

export const emitConsultationUpdate = (io, patientId, consultationData) => {
  io.to(`patient:${patientId}`).emit('consultation-updated', consultationData);
  io.to(`user:${patientId}`).emit('consultation-updated', consultationData);
};

export const emitPatientNotification = (io, patientId, notification) => {
  io.to(`patient:${patientId}`).emit('patient-notification', notification);
  io.to(`user:${patientId}`).emit('patient-notification', notification);
};

export const emitAdminUpdate = (io, updateData) => {
  io.to('admin:all').emit('admin-update', updateData);
};

export const getConnectedUsers = () => userSockets;

export default { initializeSocket, emitQueueUpdate, emitConsultationUpdate, emitPatientNotification, emitAdminUpdate, getConnectedUsers };