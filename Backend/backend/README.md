# NUMERICA Backend

Express API backend for the NUMERICA all-in-one calculator frontend. It ports every
calculation module's logic to the server, and persists calculation history in a
local SQLite file (`data/numerica.db`).

## Setup

```bash
cd Backend/backend
npm install
npm start          # runs on http://localhost:4000
# or, for auto-restart on changes:
npm run dev
```

No environment variables are required. `PORT` (default `4000`) and `DB_PATH`
(default `./data/numerica.db`) can be overridden if needed.

## Project structure

```
backend/
  server.js              # Express app entry point
  src/
    engine.js             # All calculation logic (pure functions, no deps)
    db.js                 # SQLite setup + history queries (better-sqlite3)
    routes/
      calculate.js        # POST /api/calculate/:module
      constants.js        # GET  /api/constants
      history.js          # GET/POST/DELETE /api/history
  data/numerica.db         # created automatically on first run
```

## API reference

### `GET /api/health`
Returns `{ status: "ok" }`.

### `GET /api/constants`
Returns the reference constants table (π, e, φ, c, G, g, Nₐ, kB).

### `POST /api/calculate/:module`
`:module` is one of: `basic`, `scientific`, `expression`, `statistics`,
`algebra`, `matrix`, `number`, `geometry`, `physics`, `chemistry`, `biology`,
`finance`, `units`, `programmer`, `complex`, `calculus`.

Every response is `{ result, history }` on success (`history` is the row just
written, unless you pass `"save": false`), or `{ error }` (HTTP 400) on
invalid input.

Body shape per module:

| Module | Body | Example |
|---|---|---|
| `basic` | `{ expression }` | `{ "expression": "2*sin(30)+sqrt(25)" }` |
| `scientific` | `{ expression, degrees }` | `{ "expression": "sin(30)", "degrees": true }` |
| `expression` | `{ expression, x }` | `{ "expression": "x^3+2*x-5", "x": 2 }` |
| `statistics` | `{ values }` (array or comma string) | `{ "values": [12,18,14,20] }` |
| `algebra` | `{ option, values }` | `{ "option": "Quadratic equation", "values": [1,-3,2] }` |
| `matrix` | `{ option, matrixA, matrixB }` | `{ "option": "Determinant", "matrixA": "1,2;3,4" }` |
| `number` | `{ option, values }` | `{ "option": "GCD", "values": [12,18] }` |
| `geometry` | `{ option, values }` | `{ "option": "Circle", "values": [5] }` |
| `physics` | `{ option, values }` | `{ "option": "F = ma", "values": [10,2] }` |
| `chemistry` | `{ option, values }` | `{ "option": "Molarity", "values": [2,0.5] }` |
| `biology` | `{ option, sequence, values }` | `{ "option": "GC percentage", "sequence": "ATCGGCTA" }` |
| `finance` | `{ option, values }` | `{ "option": "EMI", "values": [100000,8,12] }` |
| `units` | `{ category, from, to, value }` | `{ "category": "Length", "from": 0, "to": 1, "value": 1500 }` |
| `programmer` | `{ option, values, text }` | `{ "option": "Decimal → Binary/Octal/Hex", "values": [42] }` |
| `complex` | `{ option, values }` | `{ "option": "Addition", "values": [1,2,3,4] }` |
| `calculus` | `{ option, expression, values }` | `{ "option": "Numerical derivative", "expression": "x^2", "values": [3,0.0001] }` |

The `option` strings match exactly the dropdown labels already used in your
`App.jsx` (`optionSets` objects), so the frontend can pass through whatever
the user picked without translation. `from`/`to` for `units` are the same
numeric indices used by the frontend's `<Form.Select>`.

Every request accepts two optional fields:
- `"save": false` — skip writing to history (default is `true`).
- `"label"` — custom text to store as the history "expression" (otherwise
  auto-generated, e.g. `"finance: EMI"`).

### `GET /api/history?limit=100`
Returns `{ history: [...] }`, newest first.

### `POST /api/history`
Manually add a history row: `{ module?, expression, result }`.

### `DELETE /api/history/:id`
Deletes one entry.

### `DELETE /api/history`
Clears all history.

## Frontend integration

The React frontend calls `POST /api/calculate/:module` for calculations. These
requests save history automatically unless the body includes `"save": false`.
Client-side fallback calculations and the Statistics module use `POST
/api/history` to persist their results. The history view loads from
`GET /api/history` on startup, and clearing history calls `DELETE /api/history`.

For local development, the Vite config proxies `/api` to
`http://localhost:4000`. Set `VITE_API_URL` in `Frontend/.env` only when the
backend is hosted at a different base URL. Start the frontend separately with
`npm run dev` from `Frontend/`.
