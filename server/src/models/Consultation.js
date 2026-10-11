import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Encounter from './Encounter.js';
import User from './User.js';
import Patient from './Patient.js';

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  encounter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'encounters',
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
  clinical_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosis_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  treatment_plan: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  follow_up_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString().split('T')[0],
    },
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'consultations',
  indexes: [
    { fields: ['encounter_id'] },
    { fields: ['doctor_id'] },
    { fields: ['started_at'] },
    { fields: ['completed_at'] },
  ],
});

Consultation.belongsTo(Encounter, { foreignKey: 'encounter_id', as: 'encounter' });
Consultation.belongsTo(User, { foreignKey: 'doctor_id', as: 'doctor' });
Encounter.hasMany(Consultation, { foreignKey: 'encounter_id', as: 'consultations' });
User.hasMany(Consultation, { foreignKey: 'doctor_id', as: 'consultations' });

export default Consultation;