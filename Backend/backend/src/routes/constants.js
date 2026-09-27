import { Router } from 'express';
import { constants } from '../engine.js';

const router = Router();

// GET /api/constants
router.get('/', (req, res) => {
  res.json({ constants });
});

export default router;
