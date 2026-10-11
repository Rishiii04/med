import bcrypt from 'bcrypt';
import config from '../config/env.js';
import models from '../models/index.js';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { logAuditEvent, auditActions, auditResourceTypes } from '../services/audit.js';

const { User, Patient, DoctorProfile } = models;

export const register = async (req, res) => {
  try {
    const { full_name, email, phone, password, role = 'PATIENT' } = req.validated.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        code: 'EMAIL_EXISTS',
      });
    }
    
    const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);
    
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash: passwordHash,
      role,
      is_active: true,
    });
    
    if (role === 'PATIENT') {
      const patientCount = await Patient.count();
      const patientNumber = `PAT${String(patientCount + 1).padStart(3, '0')}`;
      
      await Patient.create({
        user_id: user.id,
        patient_number: patientNumber,
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    await logAuditEvent({
      actorUserId: user.id,
      action: auditActions.REGISTER,
      resourceType: auditResourceTypes.USER,
      resourceId: user.id,
      reason: `New ${role.toLowerCase()} registration`,
    });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED',
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.validated.body;
    
    const user = await User.scope('withPassword').findOne({ where: { email } });
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }
    
    await user.update({ last_login_at: new Date() });
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    await logAuditEvent({
      actorUserId: user.id,
      action: auditActions.LOGIN,
      resourceType: auditResourceTypes.USER,
      resourceId: user.id,
      reason: 'User login',
    });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refresh_token } = req.validated.body;
    
    const decoded = verifyRefreshToken(refresh_token);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        code: 'INVALID_TOKEN',
      });
    }
    
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
        code: 'USER_INACTIVE',
      });
    }
    
    const { accessToken, refreshToken } = generateTokens(user);
    
    res.json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed',
      code: 'TOKEN_REFRESH_FAILED',
    });
  }
};

export const logout = async (req, res) => {
  try {
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.LOGOUT,
      resourceType: auditResourceTypes.USER,
      resourceId: req.userId,
      reason: 'User logout',
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_FAILED',
    });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      include: [
        { association: 'patient', attributes: ['patient_number', 'date_of_birth', 'sex'] },
        { association: 'doctorProfile', include: ['department'] },
      ],
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          patient: user.patient,
          doctorProfile: user.doctorProfile,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user info',
      code: 'GET_USER_FAILED',
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.validated.body;
    
    const user = await User.scope('withPassword').findByPk(req.userId);
    
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD',
      });
    }
    
    const passwordHash = await bcrypt.hash(new_password, config.bcrypt.rounds);
    await user.update({ password_hash: passwordHash });
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.PASSWORD_CHANGE,
      resourceType: auditResourceTypes.USER,
      resourceId: req.userId,
      reason: 'Password changed',
    });
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      code: 'PASSWORD_CHANGE_FAILED',
    });
  }
};