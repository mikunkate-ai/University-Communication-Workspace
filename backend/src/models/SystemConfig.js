import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    departments: [
      {
        type: String,
        trim: true,
      },
    ],
    groups: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
export default SystemConfig;
