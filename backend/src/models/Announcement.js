import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'urgent', 'deadline', 'class'],
      default: 'general',
    },
    targetAudience: {
      type: String,
      enum: ['all', 'students', 'lecturers', 'specific_group'],
      default: 'all',
    },
    targetGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      default: null,
    },
    department: {
      type: String,
      required: true,
    },
    group: {
      type: String,
      required: true,
    },
    relatedCourse: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
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
announcementSchema.index({ authorId: 1 });
announcementSchema.index({ category: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ isActive: 1 });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
