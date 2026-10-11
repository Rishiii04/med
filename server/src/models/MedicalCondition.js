import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import User from './User.js';

const MedicalCondition = sequelize.define('MedicalCondition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  condition_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosed_at: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
    },
  },
  recorded_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'medical_conditions',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['condition_name'] },
    { fields: ['diagnosed_at'] },
  ],
});

MedicalCondition.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
MedicalCondition.belongsTo(User, { foreignKey: 'recorded_by', as: 'recordedBy' });
Patient.hasMany(MedicalCondition, { foreignKey: 'patient_id', as: 'medicalConditions' });

export default MedicalCondition;