// ---------------------------------------------------------------------------
// NUMERICA calculation engine
// Server-side port of the pure math/logic from the React frontend (App.jsx).
// Every exported `calc*` function takes plain JSON-friendly arguments and
// either returns a result or throws an Error with a user-facing message.
// ---------------------------------------------------------------------------

export const fmt = value => {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toPrecision(10).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, '').replace(/\.0+$/, '')
    : '—';
};

const num = value => (Number.isFinite(Number(value)) ? Number(value) : 0);

const numAt = (values, i, label = `Value ${i + 1}`) => {
  const value = values?.[i];
  if (value === '' || value === undefined || value === null || !Number.isFinite(Number(value))) {
    throw new Error(`${label} must be a finite number.`);
  }
  return Number(value);
};

const requireNonZero = (value, name) => {
  if (value === 0) throw new Error(`${name} cannot be zero.`);
  return value;
};

export function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw new Error('Use an integer from 0 to 170.');
  return n < 2 ? 1 : n * factorial(n - 1);
}

// ---------------------------------------------------------------------------
// Expression evaluator (basic / scientific / expression / algebra polynomial /
// calculus function input)
// ---------------------------------------------------------------------------
export function evaluate(input, degrees = true, ans = 0, x = 0) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('Enter an expression.');
  const names = { pi: Math.PI, e: Math.E, phi: (1 + Math.sqrt(5)) / 2, ans, x };
  const functions = {
    sin: v => Math.sin(degrees ? (v * Math.PI) / 180 : v),
    cos: v => Math.cos(degrees ? (v * Math.PI) / 180 : v),
    tan: v => Math.tan(degrees ? (v * Math.PI) / 180 : v),
    asin: v => (degrees ? (Math.asin(v) * 180) / Math.PI : Math.asin(v)),
    acos: v => (degrees ? (Math.acos(v) * 180) / Math.PI : Math.acos(v)),
    atan: v => (degrees ? (Math.atan(v) * 180) / Math.PI : Math.atan(v)),
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
    exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh
  };
  const source = input.replaceAll('π', 'pi');
  const namesAndFunctions = Object.keys(names).concat(Object.keys(functions)).sort((a, b) => b.length - a.length).join('|');
  const tokenPattern = new RegExp(`\\s*(\\d+(?:\\.\\d*)?|\\.\\d+|(?:${namesAndFunctions})|[-+*/%^!()]|.)`, 'gi');
  const tokens = [...source.matchAll(tokenPattern)].map(m => m[1].trim());
  if (tokens.some(t => !t || /[^0-9a-z.+*\/%^!()\-]/i.test(t)) || tokens.join('') !== source.replace(/\s/g, '')) {
    throw new Error('Check the expression syntax.');
  }
  let p = 0;
  const peek = () => tokens[p];
  const take = () => tokens[p++];
  const primary = () => {
    const t = peek();
    if (t === '(') { take(); const v = expression(); if (take() !== ')') throw new Error('Missing closing parenthesis.'); return v; }
    if (!t) throw new Error('Incomplete expression.');
    if (!Number.isNaN(Number(t))) { take(); return Number(t); }
    const n = t.toLowerCase();
    if (Object.hasOwn(names, n)) { take(); return names[n]; }
    if (Object.hasOwn(functions, n)) {
      take(); if (take() !== '(') throw new Error(`${t} requires parentheses.`);
      const v = expression(); if (take() !== ')') throw new Error('Missing closing parenthesis.');
      return functions[n](v);
    }
    throw new Error(`Unknown name "${t}".`);
  };
  const post = () => { let v = primary(); while (peek() === '!') { take(); v = factorial(v); } return v; };
  const power = () => { const v = post(); return peek() === '^' ? (take(), v ** unary()) : v; };
  const unary = () => (peek() === '-' ? (take(), -unary()) : peek() === '+' ? (take(), unary()) : power());
  const term = () => {
    let v = unary();
    while (['*', '/', '%'].includes(peek()) || /^(\d|\.|[a-zA-Z(])/.test(peek() || '')) {
      const op = ['*', '/', '%'].includes(peek()) ? take() : '*';
      const r = unary();
      if ((op === '/' || op === '%') && r === 0) throw new Error('Division by zero.');
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  };
  const expression = () => { let v = term(); while (peek() === '+' || peek() === '-') { const op = take(); const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const result = expression();
  if (p !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid or non-finite result.');
  return result;
}

// ---------------------------------------------------------------------------
// Number theory helpers
// ---------------------------------------------------------------------------
export const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

export const lcm = (a, b) => {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) throw new Error('LCM requires safe integers.');
  return a === 0 || b === 0 ? 0 : Math.abs((a / gcd(a, b)) * b);
};

export function powMod(base, exp, mod) {
  if (!Number.isSafeInteger(base) || !Number.isSafeInteger(exp) || !Number.isSafeInteger(mod) || mod <= 0 || exp < 0) {
    throw new Error('Use a positive modulo and non-negative safe integer values.');
  }
  let result = 1 % mod;
  base = ((base % mod) + mod) % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Matrix helpers
// ---------------------------------------------------------------------------
export const parseMatrix = text => {
  if (!text || !text.trim()) throw new Error('Matrix cannot be empty.');
  const rows = text.split(';').map(row => row.split(',').map(Number));
  if (!rows.length || !rows[0].length) throw new Error('Matrix has no data.');
  if (rows.some(row => row.some(v => !Number.isFinite(v)))) throw new Error('Matrix contains non-numeric values.');
  const cols = rows[0].length;
  if (!rows.every(row => row.length === cols)) throw new Error('All matrix rows must have the same length.');
  return rows;
};
export const matrixText = m => m.map(row => `[ ${row.map(fmt).join(', ')} ]`).join('\n');
export const determinant = m => {
  if (m.length === 0) return 0;
  if (m.length !== m[0].length) throw new Error('Matrix must be square for determinant.');
  if (m.length === 1) return m[0][0];
  if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  return m[0].reduce((s, v, j) => s + (j % 2 ? -1 : 1) * v * determinant(m.slice(1).map(row => row.filter((_, k) => k !== j))), 0);
};
export const matrixRank = M => {
  const m = M.map(x => x.slice());
  let rank = 0;
  for (let c = 0; c < (m[0]?.length || 0) && rank < m.length; c++) {
    let p = rank;
    while (p < m.length && !m[p][c]) p++;
    if (p === m.length) continue;
    [m[p], m[rank]] = [m[rank], m[p]];
    const pivot = m[rank][c];
    for (let i = rank + 1; i < m.length; i++) {
      const q = m[i][c] / pivot;
      for (let j = c; j < m[i].length; j++) m[i][j] -= q * m[rank][j];
    }
    rank++;
  }
  return rank;
};
export const matrixInverse = A => {
  if (A.length !== A[0].length) throw new Error('Matrix must be square for inverse.');
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    if (Math.abs(aug[pivot][col]) < 1e-12) throw new Error('Matrix is singular (determinant is zero).');
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const divisor = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= divisor;
    for (let row = 0; row < n; row++) if (row !== col) {
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
};

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------
export const convertUnits = {
  Length: [['m', 1], ['km', 1000], ['cm', 0.01], ['mm', 0.001], ['mi', 1609.344], ['ft', 0.3048]],
  Mass: [['kg', 1], ['g', 0.001], ['mg', 1e-6], ['lb', 0.45359237]],
  Temperature: [['°C', 0], ['°F', 1], ['K', 2]],
  Area: [['m²', 1], ['km²', 1e6], ['cm²', 1e-4], ['ft²', 0.092903]],
  Volume: [['L', 1], ['mL', 0.001], ['m³', 1000], ['gal', 3.78541]],
  Speed: [['m/s', 1], ['km/h', 0.277778], ['mph', 0.44704]],
  Pressure: [['Pa', 1], ['kPa', 1000], ['bar', 1e5], ['atm', 101325]],
  Energy: [['J', 1], ['kJ', 1000], ['cal', 4.184], ['kWh', 3.6e6]],
  Power: [['W', 1], ['kW', 1000], ['hp', 745.7]],
  Time: [['s', 1], ['min', 60], ['h', 3600], ['day', 86400]],
  Angle: [['rad', 1], ['deg', Math.PI / 180]],
  'Data storage': [['B', 1], ['KB', 1024], ['MB', 1048576], ['GB', 1073741824]]
};

export const constants = [
  ['π', 'Pi', Math.PI, 'Circle constant'],
  ['e', "Euler's number", Math.E, 'Natural logarithm base'],
  ['φ', 'Golden ratio', (1 + Math.sqrt(5)) / 2, 'Ratio in geometry'],
  ['c', 'Speed of light', 299792458, 'm/s'],
  ['G', 'Gravitational constant', 6.6743e-11, 'N·m²/kg²'],
  ['g', 'Earth gravity', 9.80665, 'm/s²'],
  ['Nₐ', 'Avogadro constant', 6.02214076e23, 'particles/mol'],
  ['kB', 'Boltzmann constant', 1.380649e-23, 'J/K']
].map(([symbol, name, value, unit]) => ({ symbol, name, value, unit }));

// ---------------------------------------------------------------------------
// Module calculators — each mirrors the corresponding frontend UI's logic
// ---------------------------------------------------------------------------

export function calcBasic({ expression, degrees = true }) {
  const result = evaluate(expression, degrees);
  return { result: fmt(result), raw: result };
}

export function calcExpression({ expression, x = 0 }) {
  const result = evaluate(expression, true, 0, num(x));
  return { result: fmt(result), raw: result };
}

export function calcStatistics({ values }) {
  const n = (Array.isArray(values) ? values : String(values).split(','))
    .map(v => (typeof v === 'string' ? v.trim() : v))
    .filter(v => v !== '' && Number.isFinite(Number(v)))
    .map(Number);
  if (!n.length) throw new Error('Provide at least one valid number.');
  const sorted = [...n].sort((a, b) => a - b);
  const len = n.length;
  const mean = n.reduce((a, b) => a + b, 0) / len;
  const median = len % 2 ? sorted[(len - 1) / 2] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2;
  const mode = (() => {
    const map = {};
    n.forEach(v => (map[v] = (map[v] || 0) + 1));
    const max = Math.max(...Object.values(map));
    const modes = Object.keys(map).filter(k => map[k] === max).map(Number);
    return modes.length === n.length ? 'No mode' : modes.join(', ');
  })();
  const variance = n.reduce((s, v) => s + (v - mean) ** 2, 0) / len;
  const sampleVariance = len > 1 ? n.reduce((s, v) => s + (v - mean) ** 2, 0) / (len - 1) : 0;
  const popStd = Math.sqrt(variance);
  const sampleStd = Math.sqrt(sampleVariance);
  const range = sorted[len - 1] - sorted[0];
  const q1 = (() => { const m = Math.floor(len / 2); const lower = sorted.slice(0, m); const l = lower.length; return l % 2 ? lower[(l - 1) / 2] : (lower[l / 2 - 1] + lower[l / 2]) / 2; })();
  const q3 = (() => { const m = Math.ceil(len / 2); const upper = sorted.slice(m); const l = upper.length; return l % 2 ? upper[(l - 1) / 2] : (upper[l / 2 - 1] + upper[l / 2]) / 2; })();
  return {
    count: len, mean: fmt(mean), median: fmt(median), mode,
    populationVariance: fmt(variance), sampleVariance: fmt(sampleVariance),
    populationStdDev: fmt(popStd), sampleStdDev: fmt(sampleStd),
    range: fmt(range), q1: fmt(q1), q3: fmt(q3),
    min: fmt(sorted[0]), max: fmt(sorted[len - 1])
  };
}

export function calcAlgebra({ option, values = [] }) {
  const n = i => numAt(values, i);
  let r;
  if (option === 'Quadratic equation') {
    const a = n(0), b = n(1), c = n(2);
    if (a === 0) throw new Error('Coefficient a cannot be zero.');
    const d = b * b - 4 * a * c;
    r = d < 0 ? `No real roots (discriminant = ${fmt(d)})` : `x₁ = ${fmt((-b + Math.sqrt(d)) / (2 * a))}, x₂ = ${fmt((-b - Math.sqrt(d)) / (2 * a))}`;
  } else if (option === 'Linear equation ax+b=0') {
    r = n(0) ? `x = ${fmt(-n(1) / n(0))}` : n(1) ? `No solution (0 ≠ ${n(1)})` : 'Infinite solutions (0 = 0)';
  } else if (option === 'Evaluate polynomial/expression') {
    r = fmt(evaluate(values[0], true, 0, n(1)));
  } else if (option === '2x2 simultaneous equations') {
    const a = n(0), b = n(1), c = n(2), d = n(3), e = n(4), f = n(5);
    const det = a * d - b * c;
    r = Math.abs(det) < 1e-15 ? 'No unique solution (singular matrix)' : `x = ${fmt((e * d - b * f) / det)}, y = ${fmt((a * f - e * c) / det)}`;
  } else if (option === '3x3 simultaneous equations') {
    const a = n(0), b = n(1), c = n(2), d = n(3), e = n(4), f = n(5), g = n(6), h = n(7), i = n(8);
    const j = n(9), k = n(10), l = n(11);
    const det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    if (Math.abs(det) < 1e-15) { r = 'No unique solution or singular matrix'; }
    else {
      const dx = j * (e * i - f * h) - b * (k * i - f * l) + c * (k * h - e * l);
      const dy = a * (k * i - f * l) - j * (d * i - f * g) + c * (d * l - k * g);
      const dz = a * (e * l - k * h) - b * (d * l - k * g) + j * (d * h - e * g);
      r = `x = ${fmt(dx / det)}, y = ${fmt(dy / det)}, z = ${fmt(dz / det)}`;
    }
  } else {
    throw new Error(`Unknown algebra option "${option}".`);
  }
  return { result: r };
}

export function calcMatrix({ option, matrixA, matrixB }) {
  const A = parseMatrix(matrixA);
  const needsB = ['Addition', 'Subtraction', 'Multiplication', 'Solve Ax=b'].includes(option);
  const B = needsB ? parseMatrix(matrixB) : null;
  let r;
  if (option === 'Transpose') {
    r = matrixText(A[0].map((_, j) => A.map(row => row[j])));
  } else if (option === 'Determinant') {
    if (A.length !== A[0].length) throw new Error('Matrix must be square.');
    r = fmt(determinant(A));
  } else if (option === 'Rank') {
    r = String(matrixRank(A));
  } else if (option === 'Multiplication') {
    if (A[0].length !== B.length) throw new Error(`Columns of A (${A[0].length}) must equal rows of B (${B.length}).`);
    const result = A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * (B[k]?.[j] ?? 0), 0)));
    r = matrixText(result);
  } else if (option === 'Inverse') {
    r = matrixText(matrixInverse(A));
  } else if (option === 'Solve Ax=b') {
    if (A.length !== A[0].length) throw new Error('A must be square to solve Ax=b.');
    const n2 = A.length;
    if (B.length !== A.length || B[0].length !== 1) throw new Error('B must be a column matrix with one value per row of A.');
    const aug = A.map((row, i) => [...row, B[i][0]]);
    for (let col = 0; col < n2; col++) {
      let pivot = col;
      while (pivot < n2 && Math.abs(aug[pivot][col]) < 1e-15) pivot++;
      if (pivot === n2) continue;
      [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
      const pv = aug[col][col];
      for (let j = col; j <= n2; j++) aug[col][j] /= pv;
      for (let row = 0; row < n2; row++) {
        if (row !== col) {
          const q = aug[row][col];
          for (let j = col; j <= n2; j++) aug[row][j] -= q * aug[col][j];
        }
      }
    }
    if (aug.some(row => Math.abs(row[n2]) > 1e-10 && row.slice(0, n2).every(v => Math.abs(v) < 1e-10))) throw new Error('System is inconsistent.');
    if (aug.some(row => row.slice(0, n2).every(v => Math.abs(v) < 1e-10))) throw new Error('System has no unique solution.');
    const sol = aug.map(row => row[n2]);
    r = matrixText(sol.map(v => [v]));
  } else {
    if (A.length !== B.length || A[0].length !== B[0].length) throw new Error('Matrices must have the same dimensions for addition/subtraction.');
    const C = option === 'Addition' ? 1 : -1;
    r = matrixText(A.map((row, i) => row.map((v, j) => v + C * (B[i]?.[j] || 0))));
  }
  return { result: r };
}

export function calcNumberTheory({ option, values = [] }) {
  const n = i => Math.trunc(numAt(values, i));
  const x = n(0);
  let r;
  if (option === 'Prime test') {
    if (x < 2) { r = 'Not prime'; }
    else { let isPrime = true; for (let i = 2; i * i <= x; i++) { if (x % i === 0) { isPrime = false; break; } } r = isPrime ? 'Prime' : 'Not prime'; }
  } else if (option === 'Prime factorization') {
    let q = Math.abs(x), f = [];
    for (let i = 2; i * i <= q; i++) { while (q % i === 0) { f.push(i); q /= i; } }
    if (q > 1) f.push(q);
    r = f.length ? f.join(' × ') : String(x === 0 ? 0 : x < 0 ? -1 : 1);
  } else if (option === 'GCD') {
    r = String(gcd(x, n(1)));
  } else if (option === 'LCM') {
    r = String(lcm(x, n(1)));
  } else if (option === 'Euler Phi') {
    if (x < 1) { r = '0'; } else {
      let count = 0;
      for (let i = 1; i <= x; i++) { if (gcd(i, x) === 1) count++; }
      r = String(count);
    }
  } else if (option === 'Modular exponentiation') {
    r = String(powMod(x, n(1), n(2)));
  } else if (option === 'Divisors') {
    const divs = [];
    for (let i = 1; i <= Math.abs(x); i++) { if (x % i === 0) divs.push(i); }
    r = divs.join(', ');
  } else if (option === 'Digit sum') {
    r = String(String(Math.abs(x)).split('').reduce((a, d) => a + Number(d), 0));
  } else if (option === 'Reverse number') {
    const s = String(Math.abs(x)).split('').reverse().join('');
    r = String(Number(s) * (x < 0 ? -1 : 1));
  } else {
    throw new Error(`Unknown number theory option "${option}".`);
  }
  return { result: r };
}

export function calcGeometry({ option, values = [] }) {
  const n = i => numAt(values, i);
  const x = n(0), y = values[1] !== undefined ? n(1) : 0, z = values[2] !== undefined ? n(2) : 0;
  const formulas = {
    Circle: `Area = ${fmt(Math.PI * x * x)}, circumference = ${fmt(2 * Math.PI * x)}`,
    Rectangle: `Area = ${fmt(x * y)}, perimeter = ${fmt(2 * (x + y))}`,
    Triangle: (() => { const s = (x + y + z) / 2; const area = s > 0 ? Math.sqrt(Math.max(0, s * (s - x) * (s - y) * (s - z))) : 0; return `Area = ${fmt(area)}${area ? '' : ' (invalid triangle)'}`; })(),
    Square: `Area = ${fmt(x * x)}, perimeter = ${fmt(4 * x)}`,
    Cube: `Volume = ${fmt(x ** 3)}, surface area = ${fmt(6 * x * x)}`,
    Cuboid: `Volume = ${fmt(x * y * z)}, surface area = ${fmt(2 * (x * y + y * z + x * z))}`,
    Sphere: `Volume = ${fmt((4 * Math.PI * x ** 3) / 3)}, surface area = ${fmt(4 * Math.PI * x * x)}`,
    Cylinder: `Volume = ${fmt(Math.PI * x * x * y)}, surface area = ${fmt(2 * Math.PI * x * (x + y))}`,
    Cone: `Volume = ${fmt((Math.PI * x * x * y) / 3)}`,
    'Pythagorean theorem': `c = ${fmt(Math.hypot(x, y))}`
  };
  if (!(option in formulas)) throw new Error(`Unknown geometry option "${option}".`);
  return { result: formulas[option] };
}

export function calcPhysics({ option, values = [] }) {
  const n = i => numAt(values, i);
  const x = n(0), y = values[1] !== undefined ? n(1) : 0, z = values[2] !== undefined ? n(2) : 0;
  const formulas = {
    'F = ma': `${fmt(x * y)} N`,
    'Kinetic energy': `${fmt(0.5 * x * y * y)} J`,
    'Potential energy': `${fmt(x * y * (z || 0))} J`,
    Momentum: `${fmt(x * y)} kg·m/s`,
    Work: `${fmt(x * y)} J`,
    Power: y ? `${fmt(x / y)} W` : 'Division by zero',
    "Ohm's law": `${fmt(x * y)} V`,
    'Electrical power': `${fmt(x * y)} W`,
    'Coulomb force': `${fmt((8.9875517923e9 * x * y) / (z * z || 1))} N`,
    'Gravitational force': `${fmt((6.6743e-11 * x * y) / (z * z || 1))} N`,
    'Wave speed': `${fmt(x * y)} m/s`,
    'Lens equation': x && y ? `${fmt(1 / (1 / x + 1 / y))}` : 'Need both distances',
    'Relativistic energy': `${fmt(x * 299792458 ** 2)} J`,
    Density: y ? `${fmt(x / y)} kg/m³` : 'Division by zero',
    Pressure: y ? `${fmt(x / y)} Pa` : 'Division by zero',
    'Spring SHM period': y > 0 ? `${fmt(2 * Math.PI * Math.sqrt(x / y))} s` : 'k must be positive',
    'Simple pendulum period': y > 0 ? `${fmt(2 * Math.PI * Math.sqrt(x / y))} s` : 'g must be positive',
    'Kinematics v=u+at': `${fmt(x + y * z)} m/s`,
    'Kinematics s=ut+1/2at^2': `${fmt(x * y + 0.5 * z * y * y)} m`,
    'v²=u²+2as': `${fmt(Math.sqrt(x * x + 2 * y * z))} m/s`
  };
  if (!(option in formulas)) throw new Error(`Unknown physics option "${option}".`);
  return { result: formulas[option] };
}

export function calcChemistry({ option, values = [] }) {
  const v = i => numAt(values, i);
  const x = v(0), y = values[1] !== undefined ? v(1) : 0, z = values[2] !== undefined ? v(2) : 0, w = values[3] !== undefined ? v(3) : 0;
  let q;
  switch (option) {
    case 'Moles from mass': q = x / requireNonZero(y, 'Molar mass'); break;
    case 'Mass from moles': q = x * y; break;
    case 'Molarity': q = x / requireNonZero(y, 'Volume'); break;
    case 'Dilution M1V1=M2V2': q = (x * y) / requireNonZero(z, 'M2'); break;
    case 'Molality': q = x / requireNonZero(y, 'Solvent mass'); break;
    case 'pH from [H+]': if (x <= 0) throw new Error('[H+] must be positive.'); q = -Math.log10(x); break;
    case 'pOH': if (x <= 0) throw new Error('[OH−] must be positive.'); q = -Math.log10(x); break;
    case 'Henderson-Hasselbalch': if (y <= 0 || z <= 0) throw new Error('Both concentrations must be positive.'); q = x + Math.log10(y / z); break;
    case 'Ideal gas law': q = (x * y) / (8.314 * requireNonZero(w, 'Temperature')); break;
    case 'Beer-Lambert law': q = x / requireNonZero(z, 'Path length'); break;
    case 'First-order half-life': q = Math.log(2) / requireNonZero(x, 'Rate constant'); break;
    case 'Arrhenius equation': if (z <= 0) throw new Error('Temperature must be positive.'); q = x * Math.exp(-y / (8.314 * z)); break;
    case 'Nernst equation at 25 C': if (y === 0 || z <= 0) throw new Error('Electrons cannot be zero and Q must be positive.'); q = x - (0.05916 / y) * Math.log10(z); break;
    default: throw new Error(`Unknown chemistry option "${option}".`);
  }
  return { result: fmt(q) };
}

const CODON_TABLE = {
  TAA: '*', TAG: '*', TGA: '*', ATG: 'M', TGG: 'W',
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L', CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S', CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T', GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q', AAT: 'N', AAC: 'N',
  AAA: 'K', AAG: 'K', GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E', TGT: 'C', TGC: 'C',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R', AGA: 'R', AGG: 'R', GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G'
};

export function calcBiology({ option, sequence = '', values = [] }) {
  const s = String(sequence).toUpperCase().replace(/[^ACGTU]/g, '');
  const needsSequence = !option.includes('PCR') && !option.includes('Michaelis') && !option.includes('Dilution');
  if (needsSequence && !s) throw new Error('Enter a valid DNA/RNA sequence.');
  const v = i => numAt(values, i);
  let r;
  if (option === 'DNA base count') {
    r = `A: ${[...s].filter(c => c === 'A').length}, C: ${[...s].filter(c => c === 'C').length}, G: ${[...s].filter(c => c === 'G').length}, T/U: ${[...s].filter(c => c === 'T' || c === 'U').length}`;
  } else if (option === 'GC percentage') {
    r = s.length ? `${fmt((100 * [...s].filter(c => c === 'G' || c === 'C').length) / s.length)}%` : '—';
  } else if (option === 'DNA complement' || option === 'Reverse complement') {
    const comp = s.replace(/[ACGTU]/g, q => ({ A: 'T', T: 'A', U: 'A', C: 'G', G: 'C' }[q]));
    r = option === 'Reverse complement' ? [...comp].reverse().join('') : comp;
  } else if (option.includes('translation')) {
    r = Array.from({ length: Math.floor(s.length / 3) }, (_, i) => CODON_TABLE[s.slice(i * 3, i * 3 + 3)] || 'X').join('');
  } else if (option.includes('melting')) {
    const a = [...s].filter(c => c === 'A' || c === 'T').length;
    const g = [...s].filter(c => c === 'G' || c === 'C').length;
    r = s.length ? `${fmt(2 * a + 4 * g)} °C` : '—';
  } else if (option.includes('PCR')) {
    r = fmt(v(0) * Math.pow(1 + v(1) / 100, v(2)));
  } else if (option.includes('Michaelis')) {
    const vmax = v(0), km = v(1), s_ = v(2);
    r = km + s_ ? fmt((vmax * s_) / (km + s_)) : '0';
  } else if (option.includes('Dilution')) {
    const c1 = v(0), v1 = v(1), c2 = v(2);
    r = c2 ? fmt((c1 * v1) / c2) : 'Division by zero';
  } else {
    throw new Error(`Unknown biology option "${option}".`);
  }
  return { result: r };
}

export function calcFinance({ option, values = [] }) {
  const v = i => numAt(values, i);
  const x = v(0), y = values[1] !== undefined ? v(1) : 0, z = values[2] !== undefined ? v(2) : 0, w = values[3] !== undefined ? v(3) : 0;
  let r;
  if (option === 'Simple interest') {
    r = fmt(x * (1 + (y / 100) * z));
  } else if (option === 'Compound interest') {
    if (w <= 0) throw new Error('Compounding periods per year must be positive.');
    r = fmt(x * Math.pow(1 + y / 100 / w, w * z));
  } else if (option === 'EMI') {
    if (x < 0 || z <= 0) throw new Error('Principal must be non-negative and months must be positive.');
    const m = y / 1200;
    r = fmt(m === 0 ? x / z : (x * m * Math.pow(1 + m, z)) / (Math.pow(1 + m, z) - 1));
  } else if (option === 'CAGR') {
    if (x <= 0 || y <= 0 || z <= 0) throw new Error('Values and years must be positive.');
    r = `${fmt((Math.pow(y / x, 1 / z) - 1) * 100)}%`;
  } else if (option === 'Future value') {
    if (1 + y / 100 <= 0) throw new Error('Rate produces an invalid growth factor.');
    r = fmt(x * Math.pow(1 + y / 100, z));
  } else if (option === 'Present value') {
    if (1 + y / 100 <= 0) throw new Error('Rate produces an invalid discount factor.');
    r = fmt(x / Math.pow(1 + y / 100, z));
  } else if (option.includes('Percentage')) {
    r = x ? `${fmt(((y - x) / Math.abs(x)) * 100)}%` : 'Original value cannot be zero';
  } else if (option.includes('SIP')) {
    if (x < 0 || z <= 0) throw new Error('Investment must be non-negative and months must be positive.');
    const m = y / 1200;
    r = fmt(m === 0 ? x * z : x * ((Math.pow(1 + m, z) - 1) / m) * (1 + m));
  } else {
    throw new Error(`Unknown finance option "${option}".`);
  }
  return { result: r };
}

export function calcUnits({ category, from, to, value }) {
  const u = convertUnits[category];
  if (!u) throw new Error(`Unknown unit category "${category}".`);
  const x = numAt([value], 0, 'Value');
  let r;
  if (category === 'Temperature') {
    let c;
    if (from === 0) c = x;
    else if (from === 1) c = (x - 32) * (5 / 9);
    else c = x - 273.15;
    let result;
    if (to === 0) result = c;
    else if (to === 1) result = (c * 9) / 5 + 32;
    else result = c + 273.15;
    r = `${fmt(result)} ${u[to][0]}`;
  } else {
    r = `${fmt((x * u[from][1]) / u[to][1])} ${u[to][0]}`;
  }
  return { result: r };
}

export function calcProgrammer({ option, values = [], text = '' }) {
  const v = i => numAt(values, i);
  const a = Math.trunc(v(0));
  let r;
  if (option.startsWith('Decimal')) {
    r = `BIN ${(a >>> 0).toString(2)} · OCT ${(a >>> 0).toString(8)} · HEX ${(a >>> 0).toString(16).toUpperCase()}`;
  } else if (option.startsWith('Binary')) {
    if (!/^[01]+$/.test(text.trim())) throw new Error('Enter a valid binary value.');
    r = String(parseInt(text.trim(), 2));
  } else if (option.startsWith('Hex')) {
    if (!/^[0-9a-fA-F]+$/.test(text.trim())) throw new Error('Enter a valid hexadecimal value.');
    r = String(parseInt(text.trim(), 16));
  } else {
    const b = Math.trunc(v(1));
    if (option.includes('AND')) r = String(a & b);
    else if (option.includes('OR')) r = String(a | b);
    else if (option.includes('XOR')) r = String(a ^ b);
    else if (option.includes('NOT')) r = String(~a);
    else if (option.includes('Left')) r = String(a << b);
    else if (option.includes('Right')) r = String(a >> b);
    else throw new Error(`Unknown programmer option "${option}".`);
  }
  return { result: r };
}

export function calcComplex({ option, values = [] }) {
  const v = i => numAt(values, i);
  const x = v(0), y = values[1] !== undefined ? v(1) : 0, z = values[2] !== undefined ? v(2) : 0, w = values[3] !== undefined ? v(3) : 0;
  const a = { r: x, i: y }, b = { r: z, i: w };
  let r;
  if (option === 'Magnitude') {
    r = fmt(Math.sqrt(a.r * a.r + a.i * a.i));
  } else if (option === 'Phase') {
    r = fmt(Math.atan2(a.i, a.r));
  } else if (option === 'Conjugate') {
    r = `${fmt(a.r)} ${a.i < 0 ? '+' : '−'} ${fmt(Math.abs(a.i))}i`;
  } else if (option === 'Power') {
    const p = Math.trunc(z);
    const mag = Math.sqrt(a.r * a.r + a.i * a.i);
    const ph = Math.atan2(a.i, a.r);
    const real = Math.pow(mag, p) * Math.cos(p * ph);
    const imag = Math.pow(mag, p) * Math.sin(p * ph);
    r = `${fmt(real)} ${imag < 0 ? '−' : '+'} ${fmt(Math.abs(imag))}i`;
  } else {
    let q;
    if (option === 'Addition') q = [a.r + b.r, a.i + b.i];
    else if (option === 'Subtraction') q = [a.r - b.r, a.i - b.i];
    else if (option === 'Multiplication') q = [a.r * b.r - a.i * b.i, a.r * b.i + a.i * b.r];
    else if (option === 'Division') {
      const denom = b.r * b.r + b.i * b.i;
      if (Math.abs(denom) < 1e-15) throw new Error('Division by zero (denominator is zero).');
      q = [(a.r * b.r + a.i * b.i) / denom, (a.i * b.r - a.r * b.i) / denom];
    } else {
      throw new Error(`Unknown complex-number option "${option}".`);
    }
    r = `${fmt(q[0])} ${q[1] < 0 ? '−' : '+'} ${fmt(Math.abs(q[1]))}i`;
  }
  return { result: r };
}

export function calcCalculus({ option, expression, values = [] }) {
  const v = i => numAt(values, i);
  const x = v(0), y = values[1] !== undefined ? v(1) : 0, z = values[2] !== undefined ? v(2) : 0;
  const f = t => {
    const val = evaluate(expression, true, 0, t);
    if (!Number.isFinite(val)) throw new Error('Function returned a non-finite value.');
    return val;
  };
  const h = Math.abs(y) || 0.0001;
  let r;
  if (option === 'Numerical derivative') {
    r = fmt((f(x + h) - f(x - h)) / (2 * h));
  } else if (option === 'Second derivative') {
    r = fmt((f(x + h) - 2 * f(x) + f(x - h)) / (h * h));
  } else if (option === 'Definite integral (Simpson)' || option === 'Definite integral (Trapezoidal)') {
    const lo = x, hi = y;
    if (lo >= hi) throw new Error('Lower bound must be less than upper bound.');
    const steps = Math.max(2, Math.trunc(z) || 100);
    const dx = (hi - lo) / steps;
    if (option.includes('Simpson')) {
      let sum = f(lo) + f(hi);
      for (let i = 1; i < steps; i++) sum += f(lo + i * dx) * (i % 2 ? 4 : 2);
      r = fmt((sum * dx) / 3);
    } else {
      let sum = f(lo) + f(hi);
      for (let i = 1; i < steps; i++) sum += 2 * f(lo + i * dx);
      r = fmt((sum * dx) / 2);
    }
  } else if (option === 'Bisection root') {
    let a = x, b = y;
    if (a >= b) throw new Error('Lower bound must be less than upper bound.');
    let fa = f(a), fb = f(b);
    if (fa === 0) return { result: fmt(a) };
    if (fb === 0) return { result: fmt(b) };
    if (fa * fb > 0) throw new Error('Function must have opposite signs at bounds (f(a)·f(b) < 0).');
    let mid;
    for (let i = 0; i < 100; i++) {
      mid = (a + b) / 2;
      const fmid = f(mid);
      if (Math.abs(fmid) < 1e-10) break;
      if (fa * fmid < 0) b = mid; else a = mid;
    }
    r = fmt(mid);
  } else if (option === 'Newton-Raphson root') {
    const tol = Math.abs(z) || 1e-10;
    let xn = x;
    for (let i = 0; i < 100; i++) {
      const fxn = f(xn);
      if (Math.abs(fxn) < tol) break;
      const dfxn = (f(xn + 1e-8) - f(xn - 1e-8)) / 2e-8;
      if (Math.abs(dfxn) < 1e-15) throw new Error('Derivative too small; Newton-Raphson failed.');
      xn = xn - fxn / dfxn;
      if (!Number.isFinite(xn)) throw new Error('Newton-Raphson diverged.');
    }
    r = fmt(xn);
  } else {
    throw new Error(`Unknown calculus option "${option}".`);
  }
  return { result: r };
}

// Dispatch table used by the /api/calculate/:module route
export const MODULES = {
  basic: calcBasic,
  scientific: calcBasic,
  expression: calcExpression,
  statistics: calcStatistics,
  algebra: calcAlgebra,
  matrix: calcMatrix,
  number: calcNumberTheory,
  geometry: calcGeometry,
  physics: calcPhysics,
  chemistry: calcChemistry,
  biology: calcBiology,
  finance: calcFinance,
  units: calcUnits,
  programmer: calcProgrammer,
  complex: calcComplex,
  calculus: calcCalculus
};
