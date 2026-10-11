import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2';
import config from './env.js';

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    dialectModule: mysql2,
    logging: config.nodeEnv === 'development' ? (msg) => console.debug('[DB]', msg) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    timezone: '+00:00',
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    return false;
  }
};

export const syncDatabase = async (force = false, alter = false) => {
  try {
    await sequelize.sync({ force, alter });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Database synchronization failed:', error.message);
    throw error;
  }
};

export default sequelize;