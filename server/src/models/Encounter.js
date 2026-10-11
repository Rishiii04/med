import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Patient from './Patient.js';
import Hospital from './Hospital.js';
import Department from './Department.js';

const Encounter = sequelize.define('Encounter', {
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
  hospital_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hospitals',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  department_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'departments',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  visit_type: {
    type: DataTypes.ENUM('OPD', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL', 'TELEMEDICINE'),
    allowNull: false,
    defaultValue: 'OPD',
    validate: {
      isIn: [['OPD', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL', 'TELEMEDICINE']],
    },
  },
  reason_for_visit: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'),
    allowNull: false,
    defaultValue: 'REGISTERED',
    validate: {
      isIn: [['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']],
    },
  },
}, {
  tableName: 'encounters',
  indexes: [
    { fields: ['patient_id'] },
    { fields: ['hospital_id'] },
    { fields: ['department_id'] },
    { fields: ['status'] },
    { fields: ['created_at'] },
  ],
});

Encounter.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
Encounter.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
Encounter.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Patient.hasMany(Encounter, { foreignKey: 'patient_id', as: 'encounters' });
Hospital.hasMany(Encounter, { foreignKey: 'hospital_id', as: 'encounters' });
Department.hasMany(Encounter, { foreignKey: 'department_id', as: 'encounters' });

export default Encounter;