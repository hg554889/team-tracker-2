import { Schema, model, Types } from 'mongoose';

const TeamSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['STUDY', 'PROJECT'], required: true },
  description: { type: String },
  clubId: { type: String, index: true, required: true },
  goal: { type: String },
  startAt: { type: Date },
  endAt: { type: Date },
  leader: { type: Types.ObjectId, ref: 'User', required: true },
  members: [{ user: { type: Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['LEADER','MEMBER'], default: 'MEMBER' } }],
  status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

export const Team = model('Team', TeamSchema);