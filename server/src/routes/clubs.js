import { Router } from 'express';
import { Club } from '../models/Club.js';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await Club.find();
  if (items.length === 0) {
    await Club.insertMany([
      { key: 'Aunae', name: 'Aunae' },
      { key: 'KIS', name: 'KIS' }
    ]);
  }
  const list = await Club.find().sort({ name: 1 });
  res.json(list);
});

export default router;