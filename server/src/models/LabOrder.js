import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Encounter from './Encounter.js';
import Patient from './Patient.js';
import User from './User.js';

const LabOrder = sequelize.define('LabOrder', {
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
  ordered_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  test_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  status: {
    type: DataTypes.ENUM('ORDERED', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'ORDERED',
    validate: {
      isIn: [['ORDERED', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED']],
    },
  },
  ordered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'lab_orders',
  indexes: [
    { fields: ['encounter_id'] },
    { fields: ['patient_id'] },
    { fields: ['ordered_by'] },
    { fields: ['status'] },
    { fields: ['ordered_at'] },
  ],
});

LabOrder.belongsTo(Encounter, { foreignKey: 'encounter_id', as: 'encounter' });
LabOrder.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
LabOrder.belongsTo(User, { foreignKey: 'ordered_by', as: 'orderedBy' });
Encounter.hasMany(LabOrder, { foreignKey: 'encounter_id', as: 'labOrders' });
Patient.hasMany(LabOrder, { foreignKey: 'patient_id', as: 'labOrders' });
User.hasMany(LabOrder, { foreignKey: 'ordered_by', as: 'labOrders' });

export default LabOrder;