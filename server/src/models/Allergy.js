import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import User from './User.js';

const Allergy = sequelize.define('Allergy', {
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
  substance: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  reaction: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severity: {
    type: DataTypes.ENUM('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'),
    allowNull: false,
    defaultValue: 'MILD',
    validate: {
      isIn: [['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']],
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
  tableName: 'allergies',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['substance'] },
    { fields: ['severity'] },
  ],
});

Allergy.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Allergy.belongsTo(User, { foreignKey: 'recorded_by', as: 'recordedBy' });
Patient.hasMany(Allergy, { foreignKey: 'patient_id', as: 'allergies' });

export default Allergy;