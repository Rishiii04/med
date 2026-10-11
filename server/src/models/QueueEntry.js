import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Encounter from './Encounter.js';
import OperatingSession from './OperatingSession.js';

const QueueEntry = sequelize.define('QueueEntry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  encounter_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'encounters',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  operating_session_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'operating_sessions',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  token_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  status: {
    type: DataTypes.ENUM('REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'),
    allowNull: false,
    defaultValue: 'REGISTERED',
    validate: {
      isIn: [['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']],
    },
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10,
    },
  },
  called_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  consultation_started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  skipped_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  skip_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'queue_entries',
  indexes: [
    { fields: ['encounter_id'] },
    { fields: ['operating_session_id'] },
    { unique: true, fields: ['operating_session_id', 'token_number'] },
    { fields: ['status'] },
    { fields: ['priority', 'created_at'] },
  ],
});

QueueEntry.belongsTo(Encounter, { foreignKey: 'encounter_id', as: 'encounter' });
QueueEntry.belongsTo(OperatingSession, { foreignKey: 'operating_session_id', as: 'operatingSession' });
Encounter.hasOne(QueueEntry, { foreignKey: 'encounter_id', as: 'queueEntry' });
OperatingSession.hasMany(QueueEntry, { foreignKey: 'operating_session_id', as: 'queueEntries' });

export default QueueEntry;