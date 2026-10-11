import { Op } from 'sequelize';
import models from '../models/index.js';
import {
  getQueueForDoctor,
  callNextPatient,
  startConsultation,
  completeConsultation,
  skipPatient,
  recallPatient,
  getQueueStats,
} from '../services/queue.js';
import { logAuditEvent, auditActions, auditResourceTypes } from '../services/audit.js';

const { User, Encounter, QueueEntry, Consultation, Prescription, Patient, MedicalCondition, Allergy, Medication, LabOrder, LabResult, DoctorProfile, Department, OperatingSession } = models;

export const getDashboard = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({
      where: { user_id: req.userId },
      include: ['department', 'hospital'],
    });
    
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        code: 'DOCTOR_PROFILE_NOT_FOUND',
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const session = await OperatingSession.findOne({
      where: {
        department_id: doctorProfile.department_id,
        session_date: today,
        status: 'ACTIVE',
      },
    });
    
    let queueStats = { total: 0, waiting: 0, called: 0, inProgress: 0, completed: 0, skipped: 0, cancelled: 0 };
    
    if (session) {
      queueStats = await getQueueStats(session.id);
    }
    
    const myConsultationsToday = await Consultation.count({
      where: {
        doctor_id: req.userId,
        started_at: {
          [Op.gte]: new Date(today + ' 00:00:00'),
          [Op.lte]: new Date(today + ' 23:59:59'),
        },
      },
    });
    
    const completedToday = await Consultation.count({
      where: {
        doctor_id: req.userId,
        completed_at: {
          [Op.gte]: new Date(today + ' 00:00:00'),
          [Op.lte]: new Date(today + ' 23:59:59'),
        },
      },
    });
    
    const currentConsultation = await Consultation.findOne({
      where: {
        doctor_id: req.userId,
        completed_at: null,
      },
      include: [{
        model: Encounter,
        as: 'encounter',
        include: [{ model: Patient, as: 'patient', include: [{ model: User, as: 'user', attributes: ['full_name'] }] }],
      }],
    });
    
    res.json({
      success: true,
      data: {
        doctor: {
          id: req.userId,
          name: req.user.full_name,
          department: doctorProfile.department,
          registrationNumber: doctorProfile.registration_number,
        },
        session: session ? {
          id: session.id,
          start_time: session.start_time,
          end_time: session.end_time,
        } : null,
        queueStats,
        myStats: {
          consultationsToday: myConsultationsToday,
          completedToday,
        },
        currentConsultation: currentConsultation ? {
          id: currentConsultation.id,
          patientName: currentConsultation.encounter?.patient?.user?.full_name,
          startedAt: currentConsultation.started_at,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get doctor dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard',
      code: 'GET_DASHBOARD_FAILED',
    });
  }
};

export const getQueue = async (req, res) => {
  try {
    const { queueEntries, session } = await getQueueForDoctor(req.userId);
    
    if (!session) {
      return res.json({
        success: true,
        data: { queueEntries: [], session: null, message: 'No active session today' },
      });
    }
    
    const formattedEntries = queueEntries.map(entry => ({
      id: entry.id,
      token_number: entry.token_number,
      status: entry.status,
      patient: entry.encounter?.patient?.user ? {
        id: entry.encounter.patient.user.id,
        full_name: entry.encounter.patient.user.full_name,
        patient_number: entry.encounter.patient.patient_number,
      } : null,
      registration_time: entry.created_at,
      waiting_duration: entry.status === 'WAITING' || entry.status === 'REGISTERED' 
        ? Math.floor((Date.now() - new Date(entry.created_at).getTime()) / 60000)
        : null,
      called_at: entry.called_at,
      consultation_started_at: entry.consultation_started_at,
      priority: entry.priority,
    }));
    
    res.json({
      success: true,
      data: {
        queueEntries: formattedEntries,
        session: {
          id: session.id,
          department_id: session.department_id,
          start_time: session.start_time,
          end_time: session.end_time,
        },
      },
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue',
      code: 'GET_QUEUE_FAILED',
    });
  }
};

export const callPatient = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    
    const queueEntry = await QueueEntry.findByPk(id, {
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
      include: [{ model: Encounter, as: 'encounter' }],
    });
    
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Queue entry not found',
        code: 'QUEUE_ENTRY_NOT_FOUND',
      });
    }
    
    if (!['WAITING', 'REGISTERED'].includes(queueEntry.status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: `Cannot call patient with status ${queueEntry.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    
    const updatedEntry = await transitionQueueStatus(id, 'CALLED', req.userId, {
      reason: `Called by doctor ${req.user.full_name}`,
    }, transaction);
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: { queueEntry: updatedEntry },
      message: 'Patient called successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Call patient error:', error);
    if (error.message.includes('Invalid status transition')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to call patient',
      code: 'CALL_PATIENT_FAILED',
    });
  }
};

export const startConsultationAction = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    
    const queueEntry = await QueueEntry.findByPk(id, {
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
      include: [{ model: Encounter, as: 'encounter' }],
    });
    
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Queue entry not found',
        code: 'QUEUE_ENTRY_NOT_FOUND',
      });
    }
    
    if (queueEntry.status !== 'CALLED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: `Cannot start consultation for patient with status ${queueEntry.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    
    const existingConsultation = await Consultation.findOne({
      where: {
        doctor_id: req.userId,
        completed_at: null,
      },
      transaction,
    });
    
    if (existingConsultation) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: 'You already have an active consultation. Complete it first.',
        code: 'ACTIVE_CONSULTATION_EXISTS',
      });
    }
    
    const { queueEntry: updatedEntry, consultation } = await startConsultation(id, req.userId, transaction);
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: { queueEntry: updatedEntry, consultation },
      message: 'Consultation started',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Start consultation error:', error);
    if (error.message.includes('Invalid status transition')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to start consultation',
      code: 'START_CONSULTATION_FAILED',
    });
  }
};

export const completeConsultationAction = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    const { clinical_notes, diagnosis_summary, treatment_plan, follow_up_date, prescriptions } = req.validated.body;
    
    const queueEntry = await QueueEntry.findByPk(id, {
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
      include: [{ model: Encounter, as: 'encounter' }],
    });
    
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Queue entry not found',
        code: 'QUEUE_ENTRY_NOT_FOUND',
      });
    }
    
    if (queueEntry.status !== 'IN_PROGRESS') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: `Cannot complete consultation for patient with status ${queueEntry.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    
    const consultation = await Consultation.findOne({
      where: {
        encounter_id: queueEntry.encounter_id,
        doctor_id: req.userId,
        completed_at: null,
      },
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
    });
    
    if (!consultation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Active consultation not found',
        code: 'CONSULTATION_NOT_FOUND',
      });
    }
    
    await completeConsultation(id, req.userId, {
      clinical_notes,
      diagnosis_summary,
      treatment_plan,
      follow_up_date,
      prescriptions,
    }, transaction);
    
    await transaction.commit();
    
    res.json({
      success: true,
      data: { queueEntry, consultation },
      message: 'Consultation completed successfully',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Complete consultation error:', error);
    if (error.message.includes('Invalid status transition')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to complete consultation',
      code: 'COMPLETE_CONSULTATION_FAILED',
    });
  }
};

export const skipPatientAction = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    const { reason } = req.validated.body;
    
    const queueEntry = await QueueEntry.findByPk(id, {
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
      include: [{ model: Encounter, as: 'encounter' }],
    });
    
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Queue entry not found',
        code: 'QUEUE_ENTRY_NOT_FOUND',
      });
    }
    
    if (!['WAITING', 'CALLED', 'REGISTERED'].includes(queueEntry.status)) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: `Cannot skip patient with status ${queueEntry.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    
    await skipPatient(id, req.userId, reason, transaction);
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Patient skipped',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Skip patient error:', error);
    if (error.message.includes('Invalid status transition')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to skip patient',
      code: 'SKIP_PATIENT_FAILED',
    });
  }
};

export const recallPatientAction = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { id } = req.validated.params;
    
    const queueEntry = await QueueEntry.findByPk(id, {
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
      include: [{ model: Encounter, as: 'encounter' }],
    });
    
    if (!queueEntry) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Queue entry not found',
        code: 'QUEUE_ENTRY_NOT_FOUND',
      });
    }
    
    if (queueEntry.status !== 'SKIPPED') {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        error: `Can only recall skipped patients (current status: ${queueEntry.status})`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    
    await recallPatient(id, req.userId, transaction);
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Patient recalled to queue',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Recall patient error:', error);
    if (error.message.includes('Invalid status transition')) {
      return res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to recall patient',
      code: 'RECALL_PATIENT_FAILED',
    });
  }
};

export const getPatientMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const doctorProfile = await DoctorProfile.findOne({ where: { user_id: req.userId } });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Doctor profile not found',
        code: 'DOCTOR_PROFILE_NOT_FOUND',
      });
    }
    
    const encounter = await Encounter.findOne({
      where: {
        patient_id: patientId,
        department_id: doctorProfile.department_id,
        status: { [Op.in]: ['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      order: [['created_at', 'DESC']],
    });
    
    if (!encounter) {
      return res.status(403).json({
        success: false,
        error: 'No valid care relationship found for this patient',
        code: 'NO_CARE_RELATIONSHIP',
      });
    }
    
    const patient = await Patient.findByPk(patientId, {
      include: [{ model: User, as: 'user', attributes: ['full_name', 'email', 'phone'] }],
    });
    
    const [conditions, allergies, medications, pastConsultations, labOrders] = await Promise.all([
      MedicalCondition.findAll({ where: { patient_id: patientId }, order: [['diagnosed_at', 'DESC']] }),
      Allergy.findAll({ where: { patient_id: patientId }, order: [['created_at', 'DESC']] }),
      Medication.findAll({ where: { patient_id: patientId }, order: [['created_at', 'DESC']] }),
      Consultation.findAll({
        where: { patient_id: patientId },
        include: [{ model: User, as: 'doctor', attributes: ['id', 'full_name'] }, { model: Prescription, as: 'prescriptions' }],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      LabOrder.findAll({
        where: { patient_id: patientId },
        include: [{ model: LabResult, as: 'result' }],
        order: [['ordered_at', 'DESC']],
        limit: 10,
      }),
    ]);
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId,
      action: auditActions.MEDICAL_RECORD_VIEW,
      resourceType: auditResourceTypes.PATIENT,
      resourceId: patientId,
      reason: `Doctor ${req.user.full_name} viewed medical history for patient ${patient?.user?.full_name}`,
    });
    
    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          patient_number: patient.patient_number,
          full_name: patient.user?.full_name,
          date_of_birth: patient.date_of_birth,
          sex: patient.sex,
        },
        medicalConditions: conditions,
        allergies,
        medications,
        pastConsultations,
        labOrders,
      },
    });
  } catch (error) {
    console.error('Get patient medical history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get patient medical history',
      code: 'GET_MEDICAL_HISTORY_FAILED',
    });
  }
};

import { transitionQueueStatus } from '../services/queue.js';
import { Transaction } from 'sequelize';