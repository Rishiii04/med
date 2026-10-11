import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import User from './User.js';

const Medication = sequelize.define('Medication', {
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
    allowNull: true,
  },
  frequency: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
    },
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
    },
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD'),
    allowNull: false,
    defaultValue: 'ACTIVE',
    validate: {
      isIn: [['ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD']],
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
  tableName: 'medications',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['medication_name'] },
    { fields: ['status'] },
  ],
});

Medication.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Medication.belongsTo(User, { foreignKey: 'recorded_by', as: 'recordedBy' });
Patient.hasMany(Medication, { foreignKey: 'patient_id', as: 'medications' });

export default Medication;