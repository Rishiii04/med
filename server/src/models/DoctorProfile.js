import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';
import Hospital from './Hospital.js';
import Department from './Department.js';

const DoctorProfile = sequelize.define('DoctorProfile', {
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
  registration_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 50],
    },
  },
  specialization: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'doctor_profiles',
  indexes: [
    { unique: true, fields: ['registration_number'] },
    { fields: ['user_id'] },
    { fields: ['hospital_id'] },
    { fields: ['department_id'] },
    { fields: ['is_active'] },
  ],
});

DoctorProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
DoctorProfile.belongsTo(Hospital, { foreignKey: 'hospital_id', as: 'hospital' });
DoctorProfile.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
User.hasOne(DoctorProfile, { foreignKey: 'user_id', as: 'doctorProfile' });
Hospital.hasMany(DoctorProfile, { foreignKey: 'hospital_id', as: 'doctors' });
Department.hasMany(DoctorProfile, { foreignKey: 'department_id', as: 'doctors' });

export default DoctorProfile;