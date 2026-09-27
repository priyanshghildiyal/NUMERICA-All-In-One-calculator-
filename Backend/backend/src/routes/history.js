import { Router } from 'express';
import { historyStore } from '../db.js';

const router = Router();

// GET /api/history?limit=100
router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  res.json({ history: historyStore.list(limit) });
});

// POST /api/history  { module?, expression, result }
router.post('/', (req, res) => {
  const { module, expression, result } = req.body;
  if (!expression || result === undefined) {
    return res.status(400).json({ error: 'Both "expression" and "result" are required.' });
  }
  const entry = historyStore.add(module, expression, String(result));
  res.status(201).json({ history: entry });
});

// DELETE /api/history/:id
router.delete('/:id', (req, res) => {
  const info = historyStore.remove(Number(req.params.id));
  if (info.changes === 0) return res.status(404).json({ error: 'History entry not found.' });
  res.status(204).end();
});

// DELETE /api/history
router.delete('/', (req, res) => {
  historyStore.clear();
  res.status(204).end();
});

export default router;
