import { Schema, model } from 'mongoose';

const ChatMessageSchema = new Schema({
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 1000 },
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'system'], 
    default: 'text' 
  },
  fileUrl: { type: String },
  fileName: { type: String },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  replyTo: { type: Schema.Types.ObjectId, ref: 'ChatMessage' }
}, { timestamps: true });

export const ChatMessage = model('ChatMessage', ChatMessageSchema);