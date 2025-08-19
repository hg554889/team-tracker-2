import { Schema, model } from 'mongoose';

const InquirySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['general', 'technical', 'account', 'feature', 'bug', 'other'], 
    default: 'general' 
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: { 
    type: String, 
    enum: ['pending', 'in_progress', 'resolved', 'closed'], 
    default: 'pending' 
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  response: { type: String },
  processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  clubId: { type: String, index: true },
  attachments: [{ 
    filename: String, 
    originalName: String, 
    path: String 
  }]
}, { timestamps: true });

// Indexes for efficient queries
InquirySchema.index({ status: 1, clubId: 1 });
InquirySchema.index({ userId: 1, status: 1 });
InquirySchema.index({ assignedTo: 1, status: 1 });
InquirySchema.index({ createdAt: -1 });

export const Inquiry = model('Inquiry', InquirySchema);