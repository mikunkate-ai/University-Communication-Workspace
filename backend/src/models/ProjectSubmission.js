import mongoose from 'mongoose';

const projectSubmissionSchema = new mongoose.Schema(
  {
    projectGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      required: [true, 'Project group ID is required'],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitted by user ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Submission title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    version: {
      type: Number,
      default: 1,
    },
    feedback: [
      {
        feedbackBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'approved', 'rejected'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
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
projectSubmissionSchema.index({ projectGroupId: 1 });
projectSubmissionSchema.index({ submittedBy: 1 });
projectSubmissionSchema.index({ status: 1 });

const ProjectSubmission = mongoose.model('ProjectSubmission', projectSubmissionSchema);
export default ProjectSubmission;
