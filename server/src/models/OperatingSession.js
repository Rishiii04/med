import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Hospital from './Hospital.js';
import Department from './Department.js';

const OperatingSession = sequelize.define('OperatingSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  session_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
    },
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'),
    allowNull: false,
    defaultValue: 'SCHEDULED',
    validate: {
      isIn: [['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED']],
    },
  },
}, {
  tableName: 'operating_sessions',
  indexes: [
    { fields: ['department_id'] },
    { fields: ['session_date'] },
    { fields: ['status'] },
    { unique: true, fields: ['department_id', 'session_date', 'start_time'] },
  ],
});

OperatingSession.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(OperatingSession, { foreignKey: 'department_id', as: 'operatingSessions' });

export default OperatingSession;