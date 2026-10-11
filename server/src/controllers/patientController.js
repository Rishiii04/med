import { Op } from 'sequelize';
import models from '../models/index.js';
import { logAuditEvent, auditActions, auditResourceTypes } from '../services/audit.js';
import { createQueueEntry } from '../services/queue.js';

const { Encounter, QueueEntry, OperatingSession, Department, Hospital, Patient, MedicalCondition, Allergy, Medication, Consultation, Prescription, LabOrder, LabResult } = models;

export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      where: { user_id: req.userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'full_name', 'email', 'phone', 'role'],
      }],
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    res.json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    console.error('Get patient profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get patient profile',
      code: 'GET_PATIENT_FAILED',
    });
  }
};

export const createEncounter = async (req, res) => {
  const transaction = await models.sequelize.transaction();
  
  try {
    const { hospital_id, department_id, visit_type, reason_for_visit } = req.validated.body;
    
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const session = await OperatingSession.findOne({
      where: {
        department_id,
        session_date: today,
        status: 'ACTIVE',
      },
      transaction,
    });
    
    if (!session) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'No active operating session for this department today',
        code: 'NO_ACTIVE_SESSION',
      });
    }
    
    const encounter = await Encounter.create({
      patient_id: patient.id,
      hospital_id,
      department_id,
      visit_type,
      reason_for_visit,
      status: 'REGISTERED',
    }, { transaction });
    
    const queueEntry = await createQueueEntry(encounter.id, session.id, req.userId, transaction);
    
    await transaction.commit();
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId: patient.id,
      action: auditActions.ENCOUNTER_CREATE,
      resourceType: auditResourceTypes.ENCOUNTER,
      resourceId: encounter.id,
      reason: `New ${visit_type} encounter created`,
    });
    
    res.status(201).json({
      success: true,
      data: {
        encounter: {
          id: encounter.id,
          status: encounter.status,
          visit_type: encounter.visit_type,
          reason_for_visit: encounter.reason_for_visit,
          created_at: encounter.created_at,
        },
        queueEntry: {
          id: queueEntry.id,
          token_number: queueEntry.token_number,
          status: queueEntry.status,
          operating_session_id: session.id,
        },
      },
      message: 'OPD registration successful',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create encounter error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create encounter',
      code: 'CREATE_ENCOUNTER_FAILED',
    });
  }
};

export const getMyEncounters = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const { page = 1, limit = 20, status, date_from, date_to } = req.validated.query;
    const offset = (page - 1) * limit;
    
    const where = { patient_id: patient.id };
    
    if (status) where.status = status;
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = date_from;
      if (date_to) where.created_at[Op.lte] = date_to;
    }
    
    const { count, rows } = await Encounter.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: Hospital, as: 'hospital', attributes: ['id', 'name'] },
        { model: QueueEntry, as: 'queueEntry', attributes: ['id', 'token_number', 'status', 'called_at'] },
      ],
    });
    
    res.json({
      success: true,
      data: {
        encounters: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get encounters error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get encounters',
      code: 'GET_ENCOUNTERS_FAILED',
    });
  }
};

export const getMyQueueStatus = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    const activeEncounters = await Encounter.findAll({
      where: {
        patient_id: patient.id,
        status: { [Op.in]: ['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS'] },
      },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: QueueEntry, as: 'queueEntry', include: [{ model: OperatingSession, as: 'operatingSession' }] },
      ],
    });
    
    if (activeEncounters.length === 0) {
      return res.json({
        success: true,
        data: { activeToken: null, message: 'No active queue entries' },
      });
    }
    
    const encounter = activeEncounters[0];
    const queueEntry = encounter.queueEntry;
    
    let position = null;
    let estimatedWait = null;
    
    if (queueEntry && ['WAITING', 'REGISTERED'].includes(queueEntry.status)) {
      const waitingBefore = await QueueEntry.count({
        where: {
          operating_session_id: queueEntry.operating_session_id,
          status: { [Op.in]: ['WAITING', 'REGISTERED'] },
          created_at: { [Op.lt]: queueEntry.created_at },
        },
      });
      position = waitingBefore + 1;
      
      const avgConsultationTime = 15;
      estimatedWait = position * avgConsultationTime;
    }
    
    const statusLabels = {
      REGISTERED: 'Registered',
      WAITING: 'Waiting',
      CALLED: 'Called',
      IN_PROGRESS: 'Consultation in Progress',
      COMPLETED: 'Completed',
      SKIPPED: 'Skipped',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
    };
    
    res.json({
      success: true,
      data: {
        activeToken: {
          encounter_id: encounter.id,
          token_number: queueEntry?.token_number,
          status: queueEntry?.status,
          statusLabel: statusLabels[queueEntry?.status] || queueEntry?.status,
          department: encounter.department,
          queue_position: position,
          estimated_wait_minutes: estimatedWait,
          registered_at: encounter.created_at,
          called_at: queueEntry?.called_at,
        },
      },
    });
  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status',
      code: 'GET_QUEUE_STATUS_FAILED',
    });
  }
};

export const getMedicalHistory = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const [conditions, allergies, medications] = await Promise.all([
      MedicalCondition.findAll({ where: { patient_id: patient.id }, order: [['diagnosed_at', 'DESC']] }),
      Allergy.findAll({ where: { patient_id: patient.id }, order: [['created_at', 'DESC']] }),
      Medication.findAll({ where: { patient_id: patient.id }, order: [['created_at', 'DESC']] }),
    ]);
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId: patient.id,
      action: auditActions.PATIENT_MEDICAL_HISTORY_VIEW,
      resourceType: auditResourceTypes.PATIENT,
      resourceId: patient.id,
      reason: 'Patient viewed own medical history',
    });
    
    res.json({
      success: true,
      data: {
        medicalConditions: conditions,
        allergies,
        medications,
      },
    });
  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get medical history',
      code: 'GET_MEDICAL_HISTORY_FAILED',
    });
  }
};

export const addMedicalCondition = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const { condition_name, description, diagnosed_at } = req.validated.body;
    
    const condition = await MedicalCondition.create({
      patient_id: patient.id,
      condition_name,
      description,
      diagnosed_at: diagnosed_at || null,
      recorded_by: req.userId,
    });
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId: patient.id,
      action: auditActions.PATIENT_MEDICAL_HISTORY_CREATE,
      resourceType: auditResourceTypes.MEDICAL_CONDITION,
      resourceId: condition.id,
      reason: `Added medical condition: ${condition_name}`,
    });
    
    res.status(201).json({
      success: true,
      data: { condition },
      message: 'Medical condition added',
    });
  } catch (error) {
    console.error('Add medical condition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add medical condition',
      code: 'ADD_CONDITION_FAILED',
    });
  }
};

export const addAllergy = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const { substance, reaction, severity } = req.validated.body;
    
    const allergy = await Allergy.create({
      patient_id: patient.id,
      substance,
      reaction,
      severity,
      recorded_by: req.userId,
    });
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId: patient.id,
      action: auditActions.PATIENT_MEDICAL_HISTORY_CREATE,
      resourceType: auditResourceTypes.ALLERGY,
      resourceId: allergy.id,
      reason: `Added allergy: ${substance}`,
    });
    
    res.status(201).json({
      success: true,
      data: { allergy },
      message: 'Allergy added',
    });
  } catch (error) {
    console.error('Add allergy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add allergy',
      code: 'ADD_ALLERGY_FAILED',
    });
  }
};

export const addMedication = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const { medication_name, dosage, frequency, start_date, end_date, status } = req.validated.body;
    
    const medication = await Medication.create({
      patient_id: patient.id,
      medication_name,
      dosage,
      frequency,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'ACTIVE',
      recorded_by: req.userId,
    });
    
    await logAuditEvent({
      actorUserId: req.userId,
      patientId: patient.id,
      action: auditActions.PATIENT_MEDICAL_HISTORY_CREATE,
      resourceType: auditResourceTypes.MEDICATION,
      resourceId: medication.id,
      reason: `Added medication: ${medication_name}`,
    });
    
    res.status(201).json({
      success: true,
      data: { medication },
      message: 'Medication added',
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add medication',
      code: 'ADD_MEDICATION_FAILED',
    });
  }
};

export const getEncounterDetails = async (req, res) => {
  try {
    const patient = await Patient.findOne({ where: { user_id: req.userId } });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found',
        code: 'PATIENT_NOT_FOUND',
      });
    }
    
    const encounter = await Encounter.findOne({
      where: { id: req.params.id, patient_id: patient.id },
      include: [
        { model: Department, as: 'department' },
        { model: Hospital, as: 'hospital' },
        { model: QueueEntry, as: 'queueEntry', include: [{ model: OperatingSession, as: 'operatingSession' }] },
        { model: Consultation, as: 'consultations', include: [{ model: User, as: 'doctor', attributes: ['id', 'full_name'] }, { model: Prescription, as: 'prescriptions' }] },
        { model: LabOrder, as: 'labOrders', include: [{ model: LabResult, as: 'result' }] },
      ],
    });
    
    if (!encounter) {
      return res.status(404).json({
        success: false,
        error: 'Encounter not found',
        code: 'ENCOUNTER_NOT_FOUND',
      });
    }
    
    res.json({
      success: true,
      data: { encounter },
    });
  } catch (error) {
    console.error('Get encounter details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get encounter details',
      code: 'GET_ENCOUNTER_FAILED',
    });
  }
};