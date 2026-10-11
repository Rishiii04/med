import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Consultation from './Consultation.js';
import Patient from './Patient.js';
import User from './User.js';

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  consultation_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'consultations',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  doctor_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  medication_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  dosage: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  frequency: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  duration: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'prescriptions',
  indexes: [
    { fields: ['consultation_id'] },
    { fields: ['patient_id'] },
    { fields: ['doctor_id'] },
    { fields: ['created_at'] },
  ],
});

Prescription.belongsTo(Consultation, { foreignKey: 'consultation_id', as: 'consultation' });
Prescription.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Prescription.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });
Consultation.hasMany(Prescription, { foreignKey: 'consultation_id', as: 'prescriptions' });
Patient.hasMany(Prescription, { foreignKey: 'patient_id', as: 'prescriptions' });
User.hasMany(Prescription, { foreignKey: 'doctor_id', as: 'prescriptions' });

export default Prescription;