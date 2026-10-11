import { Op, fn, col, literal } from 'sequelize';
import models from '../models/index.js';
import { logAuditEvent, auditActions, auditResourceTypes } from '../services/audit.js';

const { Hospital, Department, User, DoctorProfile, OperatingSession, Encounter, QueueEntry, Consultation, Patient, AuditEvent } = models;

export const getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [
      totalRegistrations,
      waitingPatients,
      activeConsultations,
      completedToday,
      departments,
      avgWaitTime,
      avgConsultationTime,
    ] = await Promise.all([
      Encounter.count({
        where: {
          created_at: {
            [Op.gte]: new Date(today + ' 00:00:00'),
            [Op.lte]: new Date(today + ' 23:59:59'),
          },
        },
      }),
      QueueEntry.count({
        where: { status: { [Op.in]: ['WAITING', 'REGISTERED', 'CALLED'] } },
      }),
      Consultation.count({ where: { completed_at: null } }),
      Consultation.count({
        where: {
          completed_at: {
            [Op.gte]: new Date(today + ' 00:00:00'),
            [Op.lte]: new Date(today + ' 23:59:59'),
          },
        },
      }),
      Department.findAll({
        where: { is_active: true },
        include: [{
          model: OperatingSession,
          as: 'operatingSessions',
          where: { session_date: today, status: 'ACTIVE' },
          required: false,
        }],
      }),
      QueueEntry.findOne({
        where: { status: 'COMPLETED' },
        attributes: [
          [fn('AVG', fn('TIMESTAMPDIFF', literal('MINUTE'), col('created_at'), col('completed_at'))), 'avg_wait'],
        ],
        raw: true,
      }),
      Consultation.findOne({
        where: { completed_at: { [Op.ne]: null } },
        attributes: [
          [fn('AVG', fn('TIMESTAMPDIFF', literal('MINUTE'), col('started_at'), col('completed_at'))), 'avg_consultation'],
        ],
        raw: true,
      }),
    ]);
    
    const departmentWorkload = await Promise.all(departments.map(async (dept) => {
      const session = dept.operatingSessions?.[0];
      let queueCount = 0;
      let completedCount = 0;
      
      if (session) {
        queueCount = await QueueEntry.count({
          where: { operating_session_id: session.id, status: { [Op.in]: ['WAITING', 'REGISTERED', 'CALLED'] } },
        });
        completedCount = await QueueEntry.count({
          where: { operating_session_id: session.id, status: 'COMPLETED' },
        });
      }
      
      return {
        id: dept.id,
        name: dept.name,
        active: !!session,
        waiting: queueCount,
        completed: completedCount,
        total: queueCount + completedCount,
      };
    }));
    
    res.json({
      success: true,
      data: {
        overview: {
          totalRegistrations,
          waitingPatients,
          activeConsultations,
          completedToday,
          avgWaitMinutes: Math.round(avgWaitTime?.avg_wait || 0),
          avgConsultationMinutes: Math.round(avgConsultationTime?.avg_consultation || 0),
        },
        departmentWorkload,
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
      code: 'GET_DASHBOARD_FAILED',
    });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [{ model: Hospital, as: 'hospital', attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    
    res.json({ success: true, data: { departments } });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get departments', code: 'GET_DEPARTMENTS_FAILED' });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { hospital_id, name, description } = req.validated.body;
    
    const department = await Department.create({ hospital_id, name, description });
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.ADMIN_DEPARTMENT_CREATE,
      resourceType: auditResourceTypes.DEPARTMENT,
      resourceId: department.id,
      reason: `Created department: ${name}`,
    });
    
    res.status(201).json({ success: true, data: { department }, message: 'Department created' });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ success: false, error: 'Failed to create department', code: 'CREATE_DEPARTMENT_FAILED' });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const { name, description, is_active } = req.validated.body;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found', code: 'DEPARTMENT_NOT_FOUND' });
    }
    
    await department.update({ name, description, is_active });
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.ADMIN_DEPARTMENT_UPDATE,
      resourceType: auditResourceTypes.DEPARTMENT,
      resourceId: department.id,
      reason: `Updated department: ${department.name}`,
    });
    
    res.json({ success: true, data: { department }, message: 'Department updated' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ success: false, error: 'Failed to update department', code: 'UPDATE_DEPARTMENT_FAILED' });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 20, is_active, department_id } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    
    const include = [
      { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone', 'is_active'] },
      { model: Department, as: 'department', attributes: ['id', 'name'] },
      { model: Hospital, as: 'hospital', attributes: ['id', 'name'] },
    ];
    
    if (department_id) {
      include[1].where = { id: department_id };
    }
    
    const { count, rows } = await DoctorProfile.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });
    
    res.json({
      success: true,
      data: {
        doctors: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, error: 'Failed to get doctors', code: 'GET_DOCTORS_FAILED' });
  }
};

export const createDoctor = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { full_name, email, phone, password, hospital_id, department_id, registration_number, specialization } = req.validated.body;
    
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ success: false, error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }
    
    const existingReg = await DoctorProfile.findOne({ where: { registration_number }, transaction });
    if (existingReg) {
      await transaction.rollback();
      return res.status(409).json({ success: false, error: 'Registration number already exists', code: 'REG_NUMBER_EXISTS' });
    }
    
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.default.hash(password, 12);
    
    const user = await User.create({
      full_name,
      email,
      phone,
      password_hash: passwordHash,
      role: 'DOCTOR',
      is_active: true,
    }, { transaction });
    
    const doctorProfile = await DoctorProfile.create({
      user_id: user.id,
      hospital_id,
      department_id,
      registration_number,
      specialization,
      is_active: true,
    }, { transaction });
    
    await transaction.commit();
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.ADMIN_DOCTOR_CREATE,
      resourceType: auditResourceTypes.DOCTOR_PROFILE,
      resourceId: doctorProfile.id,
      reason: `Created doctor: ${full_name} (${registration_number})`,
    });
    
    res.status(201).json({ success: true, data: { doctor: doctorProfile, user }, message: 'Doctor created' });
  } catch (error) {
    await transaction.rollback();
    console.error('Create doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to create doctor', code: 'CREATE_DOCTOR_FAILED' });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.validated.params;
    const updates = req.validated.body;
    
    const doctorProfile = await DoctorProfile.findByPk(id, { include: [{ model: User, as: 'user' }] });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, error: 'Doctor not found', code: 'DOCTOR_NOT_FOUND' });
    }
    
    if (updates.full_name || updates.email || updates.phone || updates.is_active !== undefined) {
      await doctorProfile.user.update({
        full_name: updates.full_name,
        email: updates.email,
        phone: updates.phone,
        is_active: updates.is_active,
      });
    }
    
    await doctorProfile.update({
      hospital_id: updates.hospital_id,
      department_id: updates.department_id,
      registration_number: updates.registration_number,
      specialization: updates.specialization,
      is_active: updates.is_active,
    });
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.ADMIN_DOCTOR_UPDATE,
      resourceType: auditResourceTypes.DOCTOR_PROFILE,
      resourceId: doctorProfile.id,
      reason: `Updated doctor: ${doctorProfile.user?.full_name}`,
    });
    
    res.json({ success: true, data: { doctor: doctorProfile }, message: 'Doctor updated' });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to update doctor', code: 'UPDATE_DOCTOR_FAILED' });
  }
};

export const getAllQueue = async (req, res) => {
  try {
    const { department_id, status, date_from, date_to, page = 1, limit = 50, search } = req.validated.query;
    const offset = (page - 1) * limit;
    
    const sessionWhere = {};
    if (department_id) sessionWhere.department_id = department_id;
    if (date_from) sessionWhere.session_date = { [Op.gte]: date_from };
    if (date_to) sessionWhere.session_date = { ...sessionWhere.session_date, [Op.lte]: date_to };
    
    const queueWhere = {};
    if (status) queueWhere.status = status;
    
    const { count, rows } = await QueueEntry.findAndCountAll({
      where: queueWhere,
      include: [
        { model: Encounter, as: 'encounter', include: [
          { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }] },
          { model: Department, as: 'department', attributes: ['id', 'name'] },
        ]},
        { model: OperatingSession, as: 'operatingSession', where: sessionWhere, include: [{ model: Department, as: 'department' }] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });
    
    res.json({
      success: true,
      data: {
        queueEntries: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    console.error('Get all queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to get queue', code: 'GET_QUEUE_FAILED' });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { department_id, date_from, date_to } = req.validated.query;
    const from = date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = date_to || new Date().toISOString().split('T')[0];
    
    const sessionWhere = { session_date: { [Op.between]: [from, to] } };
    if (department_id) sessionWhere.department_id = department_id;
    
    const sessions = await OperatingSession.findAll({ where: sessionWhere });
    const sessionIds = sessions.map(s => s.id);
    
    const [
      dailyRegistrations,
      dailyCompleted,
      departmentStats,
      avgWaitByDept,
    ] = await Promise.all([
      Encounter.findAll({
        where: { created_at: { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] } },
        attributes: [[fn('DATE', col('created_at')), 'date'], [fn('COUNT', '*'), 'count']],
        group: [fn('DATE', col('created_at'))],
        order: [[fn('DATE', col('created_at')), 'ASC']],
        raw: true,
      }),
      QueueEntry.findAll({
        where: { operating_session_id: { [Op.in]: sessionIds }, status: 'COMPLETED' },
        attributes: [[fn('DATE', col('completed_at')), 'date'], [fn('COUNT', '*'), 'count']],
        group: [fn('DATE', col('completed_at'))],
        order: [[fn('DATE', col('completed_at')), 'ASC']],
        raw: true,
      }),
      Department.findAll({
        where: { is_active: true },
        include: [{ model: OperatingSession, as: 'operatingSessions', where: sessionWhere, required: false }],
      }),
      QueueEntry.findAll({
        where: { operating_session_id: { [Op.in]: sessionIds }, status: 'COMPLETED' },
        include: [{ model: OperatingSession, as: 'operatingSession', include: [{ model: Department, as: 'department' }] }],
        attributes: [
          [col('operatingSession.department.id'), 'department_id'],
          [col('operatingSession.department.name'), 'department_name'],
          [fn('AVG', fn('TIMESTAMPDIFF', literal('MINUTE'), col('created_at'), col('completed_at'))), 'avg_wait'],
          [fn('COUNT', '*'), 'total_completed'],
        ],
        group: ['operatingSession.department.id', 'operatingSession.department.name'],
        raw: true,
      }),
    ]);
    
    const deptWorkload = departmentStats.map(dept => {
      const session = dept.operatingSessions?.[0];
      return {
        department: { id: dept.id, name: dept.name },
        sessions: session ? 1 : 0,
        avgWait: avgWaitByDept.find(d => d.department_id === dept.id)?.avg_wait || 0,
        totalCompleted: parseInt(avgWaitByDept.find(d => d.department_id === dept.id)?.total_completed || '0', 10),
      };
    });
    
    res.json({
      success: true,
      data: {
        period: { from, to },
        dailyRegistrations,
        dailyCompleted,
        departmentWorkload: deptWorkload,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics', code: 'GET_ANALYTICS_FAILED' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { actor_user_id, patient_id, action, resource_type, date_from, date_to, page = 1, limit = 50 } = req.validated.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (actor_user_id) where.actor_user_id = actor_user_id;
    if (patient_id) where.patient_id = patient_id;
    if (action) where.action = action;
    if (resource_type) where.resource_type = resource_type;
    if (date_from || date_to) {
      where.timestamp = {};
      if (date_from) where.timestamp[Op.gte] = date_from;
      if (date_to) where.timestamp[Op.lte] = date_to;
    }
    
    const { count, rows } = await AuditEvent.findAndCountAll({
      where,
      include: [
        { model: User, as: 'actor', attributes: ['id', 'full_name', 'email'] },
        { model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['full_name'] }] },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['timestamp', 'DESC']],
    });
    
    res.json({
      success: true,
      data: {
        auditLogs: rows,
        pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) },
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit logs', code: 'GET_AUDIT_LOGS_FAILED' });
  }
};

export const queueCorrection = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    const { action, new_status, reason } = req.validated.body;
    
    const queueEntry = await QueueEntry.findByPk(id, { transaction, lock: transaction ? Transaction.LOCK.UPDATE : false });
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({ success: false, error: 'Queue entry not found', code: 'QUEUE_ENTRY_NOT_FOUND' });
    }
    
    const oldStatus = queueEntry.status;
    let finalStatus = new_status;
    
    if (action === 'CANCEL') finalStatus = 'CANCELLED';
    else if (action === 'REINSTATE') finalStatus = 'WAITING';
    
    if (oldStatus === finalStatus) {
      await transaction.rollback();
      return res.status(400).json({ success: false, error: 'Status unchanged', code: 'NO_STATUS_CHANGE' });
    }
    
    await queueEntry.update({ status: finalStatus }, { transaction });
    
    if (queueEntry.encounter) {
      await queueEntry.encounter.update({ status: finalStatus }, { transaction });
    }
    
    await logAuditEvent({
      actorUserId: req.userId,
      action: auditActions.ADMIN_QUEUE_OVERRIDE,
      resourceType: auditResourceTypes.QUEUE_ENTRY,
      resourceId: queueEntry.id,
      reason: `Admin queue correction: ${action} - ${reason}`,
      metadata: { oldStatus, newStatus: finalStatus, action },
      transaction,
    });
    
    await transaction.commit();
    
    res.json({ success: true, data: { queueEntry }, message: 'Queue entry updated' });
  } catch (error) {
    await transaction.rollback();
    console.error('Queue correction error:', error);
    res.status(500).json({ success: false, error: 'Failed to update queue entry', code: 'QUEUE_CORRECTION_FAILED' });
  }
};

import { Transaction } from 'sequelize';