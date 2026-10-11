import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Hospital from './Hospital.js';

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'departments',
  indexes: [
    { fields: ['hospital_id'] },
    { fields: ['is_active'] },
    { unique: true, fields: ['hospital_id', 'name'] },
  ],
});

Department.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
Hospital.hasMany(Department, { foreignKey: 'hospital_id', as: 'departments' });

export default Department;