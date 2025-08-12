import { Schema, model } from 'mongoose';

const ClubSchema = new Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

export const Club = model('Club', ClubSchema);