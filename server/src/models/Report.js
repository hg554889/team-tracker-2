import { Schema, model, Types } from 'mongoose';

const CommentSchema = new Schema({
  author: { type: Types.ObjectId, ref: 'User', required: true },
  text:   { type: String, required: true, trim: true }
}, { timestamps: true });

const ReportSchema = new Schema({
  team: { type: Types.ObjectId, ref: 'Team', required: true, index: true },
  author: { type: Types.ObjectId, ref: 'User', required: true },
  weekOf: { type: Date, required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  goals: { type: String, default: '' },
  issues: { type: String, default: '' },
  dueAt: { type: Date },
  attachments: [{
    name: String, url: String, size: Number, type: String
  }],
  comments: [CommentSchema]
}, { timestamps: true });

ReportSchema.index({ team: 1, weekOf: 1 }, { unique: true });

export const Report = model('Report', ReportSchema);
