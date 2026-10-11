import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Patient from './Patient.js';

const AuditEvent = sequelize.define('AuditEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  actor_user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  patient_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  },
  resource_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  },
  resource_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  request_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: () => ({}),
  },
}, {
  tableName: 'audit_events',
  timestamps: false,
  indexes: [
    { fields: ['actor_user_id'] },
    { fields: ['patient_id'] },
    { fields: ['action'] },
    { fields: ['resource_type'] },
    { fields: ['timestamp'] },
    { fields: ['request_id'] },
  ],
});

AuditEvent.belongsTo(User, { foreignKey: 'actor_user_id', as: 'actor' });
AuditEvent.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });
User.hasMany(AuditEvent, { foreignKey: 'actor_user_id', as: 'auditEvents' });

export default AuditEvent;