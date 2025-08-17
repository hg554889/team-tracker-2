import { Schema, model } from 'mongoose';

const RoleRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  currentRole: { type: String, required: true },
  requestedRole: { type: String, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  clubId: { type: String, index: true }
}, { timestamps: true });

// Index for efficient queries
RoleRequestSchema.index({ status: 1, clubId: 1 });
RoleRequestSchema.index({ userId: 1, status: 1 });

export const RoleRequest = model('RoleRequest', RoleRequestSchema);