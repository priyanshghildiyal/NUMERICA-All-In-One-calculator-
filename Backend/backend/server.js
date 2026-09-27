import express from 'express';
import cors from 'cors';
import calculateRoutes from './src/routes/calculate.js';
import constantsRoutes from './src/routes/constants.js';
import historyRoutes from './src/routes/history.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

app.use(
  cors(
    FRONTEND_ORIGIN
      ? {
          origin: FRONTEND_ORIGIN,
          credentials: true,
        }
      : undefined
  )
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/calculate', calculateRoutes);
app.use('/api/constants', constantsRoutes);
app.use('/api/history', historyRoutes);

// Fallback 404 for unmatched API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, HOST, () => {
  console.log(`NUMERICA backend running on http://${HOST}:${PORT}`);
});
