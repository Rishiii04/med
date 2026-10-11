import sequelize from '../config/database.js';
import Hospital from './Hospital.js';
import Department from './Department.js';
import User from './User.js';
import Patient from './Patient.js';
import DoctorProfile from './DoctorProfile.js';
import OperatingSession from './OperatingSession.js';
import Encounter from './Encounter.js';
import QueueEntry from './QueueEntry.js';
import Consultation from './Consultation.js';
import MedicalCondition from './MedicalCondition.js';
import Allergy from './Allergy.js';
import Medication from './Medication.js';
import Prescription from './Prescription.js';
import LabOrder from './LabOrder.js';
import LabResult from './LabResult.js';
import AuditEvent from './AuditEvent.js';

const models = {
  sequelize,
  Hospital,
  Department,
  User,
  Patient,
  DoctorProfile,
  OperatingSession,
  Encounter,
  QueueEntry,
  Consultation,
  MedicalCondition,
  Allergy,
  Medication,
  Prescription,
  LabOrder,
  LabResult,
  AuditEvent,
};

Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

export {
  sequelize,
  Hospital,
  Department,
  User,
  Patient,
  DoctorProfile,
  OperatingSession,
  Encounter,
  QueueEntry,
  Consultation,
  MedicalCondition,
  Allergy,
  Medication,
  Prescription,
  LabOrder,
  LabResult,
  AuditEvent,
};

export default models;