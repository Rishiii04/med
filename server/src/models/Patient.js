import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  patient_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString().split('T')[0],
    },
  },
  sex: {
    type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'),
    allowNull: true,
  },
  emergency_contact: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: () => ({}),
    validate: {
      isValidContact(value) {
        if (value && typeof value === 'object') {
          if (value.name && typeof value.name !== 'string') throw new Error('Emergency contact name must be a string');
          if (value.phone && typeof value.phone !== 'string') throw new Error('Emergency contact phone must be a string');
          if (value.relationship && typeof value.relationship !== 'string') throw new Error('Emergency contact relationship must be a string');
        }
      },
    },
  },
}, {
  tableName: 'patients',
  indexes: [
    { unique: true, fields: ['patient_number'] },
    { fields: ['user_id'] },
  ],
});

Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(Patient, { foreignKey: 'user_id', as: 'patient' });

export default Patient;