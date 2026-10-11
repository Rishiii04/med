import sequelize from '../config/database.js';
import models from '../models/index.js';

const migrate = async () => {
  try {
    console.log('Running database migrations...');
    await sequelize.sync({ alter: true });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrate;