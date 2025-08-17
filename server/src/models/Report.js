import { Schema, model, Types } from 'mongoose';

const CommentSchema = new Schema({
  author: { type: Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true }
}, { timestamps: true });

const ReportSchema = new Schema({
  team: { type: Types.ObjectId, ref: 'Team', required: true, index: true },
  author: { type: Types.ObjectId, ref: 'User', required: true },
  clubId: { type: String, required: true, index: true },
  weekOf: { type: Date, required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  goals: { type: String, default: '' },
  issues: { type: String, default: '' },
  dueAt: { type: Date },
  title: { type: String, default: '' },
  comments: { type: [CommentSchema], default: [] }
}, { timestamps: true });

// 복합 인덱스 추가
ReportSchema.index({ team: 1, weekOf: 1 }, { unique: true });
ReportSchema.index({ clubId: 1, weekOf: 1 });
ReportSchema.index({ clubId: 1, author: 1 });
ReportSchema.index({ clubId: 1, dueAt: 1 });

export const Report = model('Report', ReportSchema);
