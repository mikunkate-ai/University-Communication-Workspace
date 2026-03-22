import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://mikunkate_db_user:jea2Qd1ruTpmwQ4Q@cluster0.eeatv89.mongodb.net/ucw_db?retryWrites=true&w=majority&appName=Cluster0';

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`✓ MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    logger.error(`✗ Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('✓ MongoDB disconnected');
  } catch (error) {
    logger.error(`✗ Error disconnecting from MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default mongoose;
