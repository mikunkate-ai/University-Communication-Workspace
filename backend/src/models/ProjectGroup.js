import mongoose from 'mongoose';

const projectGroupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Supervisor ID is required'],
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
projectGroupSchema.index({ supervisorId: 1 });
projectGroupSchema.index({ members: 1 });
projectGroupSchema.index({ status: 1 });

const ProjectGroup = mongoose.model('ProjectGroup', projectGroupSchema);
export default ProjectGroup;
