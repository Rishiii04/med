import { Sequelize } from 'sequelize';
import config from '../config/env.js';

const setupDatabase = async () => {
  const tempSequelize = new Sequelize(
    undefined,
    config.database.user,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'mysql',
      dialectModule: await import('mysql2'),
      logging: false,
    }
  );

  try {
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`Database '${config.database.name}' created or already exists.`);
  } catch (error) {
    console.error('Failed to create database:', error.message);
    throw error;
  } finally {
    await tempSequelize.close();
  }
};

export default setupDatabase;