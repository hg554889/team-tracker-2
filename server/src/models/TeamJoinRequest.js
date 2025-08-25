import { Schema, model } from 'mongoose';

const TeamJoinRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  message: { type: String, default: '' }, // Optional message from the requester
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  clubId: { type: String, index: true, required: true }
}, { timestamps: true });

// Prevent duplicate requests
TeamJoinRequestSchema.index({ userId: 1, teamId: 1 }, { unique: true });

// Index for efficient queries
TeamJoinRequestSchema.index({ status: 1, clubId: 1 });
TeamJoinRequestSchema.index({ teamId: 1, status: 1 });
TeamJoinRequestSchema.index({ userId: 1, status: 1 });

export const TeamJoinRequest = model('TeamJoinRequest', TeamJoinRequestSchema);