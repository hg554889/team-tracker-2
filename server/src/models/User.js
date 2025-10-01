import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { Roles } from '../utils/roles.js';

export const BCRYPT_MAX_BYTES = 72;

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  password: {
    type: String,
    required: true,
    validate: {
      validator(value) {
        return typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_BYTES;
      },
      message: `Password must be at most ${BCRYPT_MAX_BYTES} bytes`
    }
  },
  studentId: { type: String, required: false, index: true }, // 학번 중복 검사 위한 인덱스 추가
  role: { type: String, enum: Object.values(Roles), default: Roles.MEMBER },
  clubId: { type: String, index: true },
  isApproved: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  if (typeof this.password !== 'string') {
    return next(new TypeError('Password must be a string'));
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidate) {
  if (typeof candidate !== 'string') {
    return false;
  }

  if (Buffer.byteLength(candidate, 'utf8') > BCRYPT_MAX_BYTES) {
    return false;
  }

  try {
    if (typeof this.password !== 'string') {
      return false;
    }

    return await bcrypt.compare(candidate, this.password);
  } catch (error) {
    console.error('bcrypt comparison error:', error);
    return false;
  }
};

export const User = model('User', UserSchema);
