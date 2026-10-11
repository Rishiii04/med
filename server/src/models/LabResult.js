import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import LabOrder from './LabOrder.js';
import User from './User.js';

const LabResult = sequelize.define('LabResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  lab_order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'lab_orders',
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  result_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  report_reference: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  entered_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  },
  entered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'lab_results',
  indexes: [
    { fields: ['lab_order_id'] },
    { fields: ['entered_by'] },
    { fields: ['entered_at'] },
  ],
});

LabResult.belongsTo(LabOrder, { foreignKey: 'lab_order_id', as: 'labOrder' });
LabResult.belongsTo(User, { foreignKey: 'entered_by', as: 'enteredBy' });
LabOrder.hasOne(LabResult, { foreignKey: 'lab_order_id', as: 'result' });
User.hasMany(LabResult, { foreignKey: 'entered_by', as: 'labResults' });

export default LabResult;