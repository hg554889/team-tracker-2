import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Roles } from '../utils/roles.js';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: Object.values(Roles), default: Roles.MEMBER },
  clubId: { type: String, index: true }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(candidate){
  return bcrypt.compare(candidate, this.password);
};

export const User = model('User', UserSchema);