import { Op, Transaction } from 'sequelize';
import models from '../models/index.js';
import { logAuditEvent, auditActions, auditResourceTypes } from './audit.js';

const { QueueEntry, Encounter, OperatingSession, Consultation, User } = models;

const VALID_TRANSITIONS = {
  REGISTERED: ['WAITING', 'CANCELLED'],
  WAITING: ['CALLED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'],
  CALLED: ['IN_PROGRESS', 'WAITING', 'SKIPPED', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'WAITING', 'CANCELLED'],
  COMPLETED: [],
  SKIPPED: ['WAITING', 'CANCELLED'],
  CANCELLED: [],
  NO_SHOW: ['WAITING', 'CANCELLED'],
};

export const getNextTokenNumber = async (operatingSessionId, transaction = null) => {
  const lastEntry = await QueueEntry.findOne({
    where: { operating_session_id: operatingSessionId },
    order: [['token_number', 'DESC']],
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
  });
  
  return (lastEntry?.token_number || 0) + 1;
};

export const createQueueEntry = async (encounterId, operatingSessionId, actorUserId, transaction = null) => {
  const tokenNumber = await getNextTokenNumber(operatingSessionId, transaction);
  
  const queueEntry = await QueueEntry.create({
    encounter_id: encounterId,
    operating_session_id: operatingSessionId,
    token_number: tokenNumber,
    status: 'WAITING',
    priority: 0,
  }, { transaction });
  
  await logAuditEvent({
    actorUserId,
    action: auditActions.QUEUE_TOKEN_GENERATED,
    resourceType: auditResourceTypes.QUEUE_ENTRY,
    resourceId: queueEntry.id,
    reason: `Token ${tokenNumber} generated for encounter ${encounterId}`,
    transaction,
  });
  
  return queueEntry;
};

export const transitionQueueStatus = async (queueEntryId, newStatus, actorUserId, options = {}, transaction = null) => {
  const { reason = null, skipReason = null } = options;
  
  const queueEntry = await QueueEntry.findByPk(queueEntryId, {
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
    include: [{ model: Encounter, as: 'encounter' }],
  });
  
  if (!queueEntry) {
    throw new Error('Queue entry not found');
  }
  
  const currentStatus = queueEntry.status;
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  
  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
  }
  
  const updates = { status: newStatus };
  const now = new Date();
  
  switch (newStatus) {
    case 'CALLED':
      updates.called_at = now;
      break;
    case 'IN_PROGRESS':
      updates.consultation_started_at = now;
      break;
    case 'COMPLETED':
      updates.completed_at = now;
      break;
    case 'SKIPPED':
      updates.skipped_at = now;
      updates.skip_reason = skipReason;
      break;
  }
  
  await queueEntry.update(updates, { transaction });
  
  if (queueEntry.encounter) {
    await queueEntry.encounter.update({ status: newStatus }, { transaction });
  }
  
  await logAuditEvent({
    actorUserId,
    patientId: queueEntry.encounter?.patient_id,
    action: auditActions.QUEUE_STATUS_CHANGE,
    resourceType: auditResourceTypes.QUEUE_ENTRY,
    resourceId: queueEntryId,
    reason: reason || `Status changed from ${currentStatus} to ${newStatus}`,
    metadata: { previousStatus: currentStatus, newStatus },
    transaction,
  });
  
  return queueEntry;
};

export const callNextPatient = async (operatingSessionId, doctorId, transaction = null) => {
  const queueEntry = await QueueEntry.findOne({
    where: {
      operating_session_id: operatingSessionId,
      status: { [Op.in]: ['WAITING', 'REGISTERED'] },
    },
    order: [
      ['priority', 'DESC'],
      ['created_at', 'ASC'],
    ],
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
    include: [{ model: Encounter, as: 'encounter' }],
  });
  
  if (!queueEntry) {
    throw new Error('No waiting patients in queue');
  }
  
  await transitionQueueStatus(queueEntry.id, 'CALLED', doctorId, {
    reason: `Called by doctor ${doctorId}`,
  }, transaction);
  
  return queueEntry;
};

export const startConsultation = async (queueEntryId, doctorId, transaction = null) => {
  const queueEntry = await transitionQueueStatus(queueEntryId, 'IN_PROGRESS', doctorId, {
    reason: `Consultation started by doctor ${doctorId}`,
  }, transaction);
  
  const encounter = queueEntry.encounter;
  
  const consultation = await Consultation.create({
    encounter_id: encounter.id,
    doctor_id: doctorId,
    started_at: new Date(),
  }, { transaction });
  
  await logAuditEvent({
    actorUserId: doctorId,
    patientId: encounter.patient_id,
    action: auditActions.CONSULTATION_CREATE,
    resourceType: auditResourceTypes.CONSULTATION,
    resourceId: consultation.id,
    reason: `Consultation started for encounter ${encounter.id}`,
    transaction,
  });
  
  return { queueEntry, consultation };
};

export const completeConsultation = async (queueEntryId, doctorId, consultationData, transaction = null) => {
  const { clinical_notes, diagnosis_summary, treatment_plan, follow_up_date, prescriptions = [] } = consultationData;
  
  const queueEntry = await QueueEntry.findByPk(queueEntryId, {
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
    include: [{ model: Encounter, as: 'encounter' }],
  });
  
  if (!queueEntry) {
    throw new Error('Queue entry not found');
  }
  
  if (queueEntry.status !== 'IN_PROGRESS') {
    throw new Error('Can only complete consultations that are in progress');
  }
  
  const consultation = await Consultation.findOne({
    where: {
      encounter_id: queueEntry.encounter_id,
      doctor_id: doctorId,
      completed_at: null,
    },
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
  });
  
  if (!consultation) {
    throw new Error('Active consultation not found');
  }
  
  await consultation.update({
    clinical_notes,
    diagnosis_summary,
    treatment_plan,
    follow_up_date: follow_up_date || null,
    completed_at: new Date(),
  }, { transaction });
  
  if (prescriptions.length > 0) {
    const { Prescription } = models;
    await Prescription.bulkCreate(prescriptions.map(p => ({
      consultation_id: consultation.id,
      patient_id: queueEntry.encounter.patient_id,
      doctor_id: doctorId,
      ...p,
    })), { transaction });
  }
  
  await transitionQueueStatus(queueEntryId, 'COMPLETED', doctorId, {
    reason: `Consultation completed by doctor ${doctorId}`,
  }, transaction);
  
  await logAuditEvent({
    actorUserId: doctorId,
    patientId: queueEntry.encounter.patient_id,
    action: auditActions.CONSULTATION_COMPLETE,
    resourceType: auditResourceTypes.CONSULTATION,
    resourceId: consultation.id,
    reason: `Consultation completed for encounter ${queueEntry.encounter_id}`,
    transaction,
  });
  
  return { queueEntry, consultation };
};

export const skipPatient = async (queueEntryId, doctorId, reason, transaction = null) => {
  return transitionQueueStatus(queueEntryId, 'SKIPPED', doctorId, {
    reason: `Skipped by doctor ${doctorId}: ${reason}`,
    skipReason: reason,
  }, transaction);
};

export const recallPatient = async (queueEntryId, doctorId, transaction = null) => {
  const queueEntry = await QueueEntry.findByPk(queueEntryId, {
    transaction,
    lock: transaction ? Transaction.LOCK.UPDATE : false,
    include: [{ model: Encounter, as: 'encounter' }],
  });
  
  if (!queueEntry) {
    throw new Error('Queue entry not found');
  }
  
  if (queueEntry.status !== 'SKIPPED') {
    throw new Error('Can only recall skipped patients');
  }
  
  return transitionQueueStatus(queueEntryId, 'WAITING', doctorId, {
    reason: `Recalled by doctor ${doctorId}`,
  }, transaction);
};

export const getQueueForDoctor = async (doctorId) => {
  const doctorProfile = await User.findByPk(doctorId, {
    include: [{
      association: 'doctorProfile',
      include: ['department'],
    }],
  });
  
  if (!doctorProfile?.doctorProfile?.department_id) {
    throw new Error('Doctor not assigned to a department');
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  const session = await OperatingSession.findOne({
    where: {
      department_id: doctorProfile.doctorProfile.department_id,
      session_date: today,
      status: 'ACTIVE',
    },
  });
  
  if (!session) {
    return { queueEntries: [], session: null };
  }
  
  const queueEntries = await QueueEntry.findAll({
    where: {
      operating_session_id: session.id,
      status: { [Op.in]: ['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] },
    },
    order: [
      ['priority', 'DESC'],
      ['created_at', 'ASC'],
    ],
    include: [{
      model: Encounter,
      as: 'encounter',
      include: [{
        model: User,
        as: 'patient',
        include: [{ association: 'patient', attributes: ['patient_number'] }],
      }],
    }],
  });
  
  return { queueEntries, session };
};

export const getQueueStats = async (operatingSessionId) => {
  const stats = await QueueEntry.findAll({
    where: { operating_session_id: operatingSessionId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });
  
  const result = {
    total: 0,
    waiting: 0,
    called: 0,
    inProgress: 0,
    completed: 0,
    skipped: 0,
    cancelled: 0,
  };
  
  stats.forEach(s => {
    const count = parseInt(s.count, 10);
    result.total += count;
    result[s.status.toLowerCase()] = count;
  });
  
  return result;
};

import sequelize from '../config/database.js';