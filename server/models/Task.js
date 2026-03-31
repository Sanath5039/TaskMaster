const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    order: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'pending_review', 'done'],
      default: 'todo',
    },
    dueDate: {
      type: Date,
    },
    // Reference file attached by admin when creating the task
    attachment: {
      filename:     { type: String },   // stored filename on disk
      originalName: { type: String },   // original upload name
      mimetype:     { type: String },
      size:         { type: Number },   // bytes
      uploadedAt:   { type: Date, default: Date.now },
    },
    // Note left by member when submitting for review
    submissionNote: {
      type: String,
      trim: true,
    },
    // Note left by admin when rejecting (requesting changes)
    reviewNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
