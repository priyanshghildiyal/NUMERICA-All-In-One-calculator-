import { Router } from 'express';
import { MODULES } from '../engine.js';
import { historyStore } from '../db.js';

const router = Router();

// POST /api/calculate/:module
// Body shape depends on the module — see README.md for examples of each.
// Optional body.save (boolean, default true) also writes the result to history.
router.post('/:module', (req, res) => {
  const { module } = req.params;
  const fn = MODULES[module];

  if (!fn) {
    return res.status(404).json({
      error: `Unknown module "${module}". Valid modules: ${Object.keys(MODULES).join(', ')}`
    });
  }

  try {
    if (module === 'scientific') req.body.degrees = req.body.degrees ?? true;

    const output = fn(req.body);

    const { save = true, label } = req.body;
    let historyEntry = null;
    if (save) {
      const expressionLabel = label || describeRequest(module, req.body);
      historyEntry = historyStore.add(module, expressionLabel, output.result ?? JSON.stringify(output));
    }

    res.json({ ...output, history: historyEntry });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Calculation failed.' });
  }
});

function describeRequest(module, body) {
  if (module === 'basic' || module === 'scientific' || module === 'expression') return body.expression;
  if (module === 'statistics') return 'Statistics dataset';
  if (module === 'units') return `${body.value} (${module}: ${body.category})`;
  if (body.option) return `${module}: ${body.option}`;
  return module;
}

export default router;
