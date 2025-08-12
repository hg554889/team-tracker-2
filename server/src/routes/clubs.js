import { Router } from 'express';
import { Club } from '../models/Club.js';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await Club.find();
  if (items.length === 0) {
    await Club.insertMany([
      { key: 'CLUB_A', name: '동아리 A' },
      { key: 'CLUB_B', name: '동아리 B' }
    ]);
  }
  const list = await Club.find().sort({ name: 1 });
  res.json(list);
});

export default router;