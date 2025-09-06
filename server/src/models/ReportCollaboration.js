import { Schema, model } from 'mongoose';

const ReportCollaborationSchema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true, index: true },
  field: { 
    type: String, 
    enum: ['shortTermGoals', 'longTermGoals', 'actionPlans', 'milestones', 'issues', 'content'], 
    default: 'content',
    index: true 
  },
  content: { type: String, default: '' },
  collaborators: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now },
    cursor: { type: Number, default: 0 }
  }],
  operations: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    operation: {
      type: { type: String, enum: ['insert', 'delete', 'replace', 'retain'], required: true },
      position: { type: Number, required: true },
      content: { type: String },
      length: { type: Number }
    },
    timestamp: { type: Date, default: Date.now }
  }],
  version: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// reportId와 field 조합에 대한 복합 unique 인덱스 생성
ReportCollaborationSchema.index({ reportId: 1, field: 1 }, { unique: true });

export const ReportCollaboration = model('ReportCollaboration', ReportCollaborationSchema);