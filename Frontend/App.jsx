import * as React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Alert, Badge, Button, Card, Col, Container, Form, Navbar, Row, Stack } from 'react-bootstrap';

const tools = [
  ['basic','Basic Calculator','＋','Everyday arithmetic'],
  ['scientific','Scientific Calculator','∑','Functions, powers & roots'],
  ['expression','Expression Calculator','ƒ','Evaluate formulas'],
  ['algebra','Algebra & Equations','x²','Solve equations'],
  ['matrix','Matrix Calculator','▦','Matrix operations'],
  ['statistics','Statistics & Probability','σ','Analyze datasets'],
  ['number','Number Theory','№','Primes, GCD & factors'],
  ['geometry','Geometry','△','Shapes & measurements'],
  ['physics','Physics','⚙','Mechanics formulas'],
  ['chemistry','Chemistry','⚗','Moles & solutions'],
  ['biology','Biology & Bioinformatics','DNA','Sequence analysis'],
  ['finance','Finance','$','Interest & payments'],
  ['units','Unit Converter','⇄','Convert common units'],
  ['programmer','Programmer Calculator','01','Bases & bitwise'],
  ['calculus','Calculus & Numerical','∫','Derivatives & roots'],
  ['complex','Complex Numbers','i','Complex arithmetic'],
  ['constants','Constants','π','Reference values'],
  ['history','Calculation History','↺','Saved calculations']
].map(([id,label,icon,description], index) => ({ id, label, icon, description, number: index + 1 }));

const constants = [
  ['π', 'Pi', Math.PI, 'Circle constant'],
  ['e', "Euler's number", Math.E, 'Natural logarithm base'],
  ['φ', 'Golden ratio', (1 + Math.sqrt(5)) / 2, 'Ratio in geometry'],
  ['c', 'Speed of light', 299792458, 'm/s'],
  ['G', 'Gravitational constant', 6.6743e-11, 'N·m²/kg²'],
  ['g', 'Earth gravity', 9.80665, 'm/s²'],
  ['Nₐ', 'Avogadro constant', 6.02214076e23, 'particles/mol'],
  ['kB', 'Boltzmann constant', 1.380649e-23, 'J/K']
];

const fmt = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toPrecision(10).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/, '').replace(/\.0+$/, '') : '—';
};
const parseNumber = (value, label = 'Value') => {
  if (value === '' || value === null || value === undefined || !Number.isFinite(Number(value))) throw Error(`${label} must be a finite number.`);
  return Number(value);
};
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;

function factorial(n) {
  if (!Number.isInteger(n) || n < 0 || n > 170) throw Error('Use an integer from 0 to 170.');
  return n < 2 ? 1 : n * factorial(n - 1);
}

function evaluate(input, degrees = true, ans = 0, x = 0) {
  if (typeof input !== 'string' || !input.trim()) throw Error('Enter an expression.');
  const names = { pi: Math.PI, e: Math.E, phi: (1 + Math.sqrt(5)) / 2, ans, x };
  const functions = {
    sin: v => Math.sin(degrees ? v * Math.PI / 180 : v), cos: v => Math.cos(degrees ? v * Math.PI / 180 : v),
    tan: v => Math.tan(degrees ? v * Math.PI / 180 : v), asin: v => degrees ? Math.asin(v) * 180 / Math.PI : Math.asin(v),
    acos: v => degrees ? Math.acos(v) * 180 / Math.PI : Math.acos(v), atan: v => degrees ? Math.atan(v) * 180 / Math.PI : Math.atan(v),
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
    exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh
  };
  const source = input.replaceAll('π', 'pi');
  const namesAndFunctions = Object.keys(names).concat(Object.keys(functions)).sort((a, b) => b.length - a.length).join('|');
  const tokenPattern = new RegExp(`\\s*(\\d+(?:\\.\\d*)?|\\.\\d+|(?:${namesAndFunctions})|[-+*/%^!()]|.)`, 'gi');
  const tokens = [...source.matchAll(tokenPattern)].map(m => m[1].trim());
  if (tokens.some(t => !t || /[^0-9a-z.+*\/%^!()\-]/i.test(t)) || tokens.join('') !== source.replace(/\s/g, '')) throw Error('Check the expression syntax.');
  let p = 0;
  const peek = () => tokens[p];
  const take = () => tokens[p++];
  const primary = () => {
    const t = peek();
    if (t === '(') { take(); const v = expression(); if (take() !== ')') throw Error('Missing closing parenthesis.'); return v; }
    if (!t) throw Error('Incomplete expression.');
    if (!Number.isNaN(Number(t))) { take(); return Number(t); }
    const n = t.toLowerCase();
    if (Object.hasOwn(names, n)) { take(); return names[n]; }
    if (Object.hasOwn(functions, n)) {
      take(); if (take() !== '(') throw Error(`${t} requires parentheses.`);
      const v = expression(); if (take() !== ')') throw Error('Missing closing parenthesis.');
      return functions[n](v);
    }
    throw Error(`Unknown name "${t}".`);
  };
  const post = () => { let v = primary(); while (peek() === '!') { take(); v = factorial(v); } return v; };
  const power = () => { const v = post(); return peek() === '^' ? (take(), v ** unary()) : v; };
  const unary = () => peek() === '-' ? (take(), -unary()) : peek() === '+' ? (take(), unary()) : power();
  const term = () => {
    let v = unary();
    while (['*','/','%'].includes(peek()) || /^(\\d|\\.|[a-zA-Z(])/.test(peek() || '')) {
      const op = ['*','/','%'].includes(peek()) ? take() : '*'; const r = unary();
      if ((op === '/' || op === '%') && r === 0) throw Error('Division by zero.');
      v = op === '*' ? v * r : op === '/' ? v / r : v % r;
    }
    return v;
  };
  const expression = () => { let v = term(); while (peek() === '+' || peek() === '-') { const op = take(); const r = term(); v = op === '+' ? v + r : v - r; } return v; };
  const result = expression();
  if (p !== tokens.length || !Number.isFinite(result)) throw Error('Invalid or non-finite result.');
  return result;
}

function Panel({ title, subtitle, children }) {
  return (
    <Card className="workspace-card">
      <Card.Body className="p-4">
        <div className="panel-heading">
          <div>
            <Badge bg="primary">WORKSPACE</Badge>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
        </div>
        {children}
      </Card.Body>
    </Card>
  );
}

function Output({ label = 'Result', value }) {
  return (
    <div className="output">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function Input({ label, value, onChange, type = 'number' }) {
  return (
    <Form.Group>
      <Form.Label>{label}</Form.Label>
      <Form.Control type={type} value={value} onChange={e => onChange(e.target.value)} />
    </Form.Group>
  );
}

function Guide({ text, extra }) {
  return (
    <div className="guide-box">
      <strong>SHOWCASE / GUIDE</strong>
      <p>{text}</p>
      {extra && <code>{extra}</code>}
    </div>
  );
}

const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

const lcm = (a, b) => {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) throw Error('LCM requires safe integers.');
  return a === 0 || b === 0 ? 0 : Math.abs((a / gcd(a, b)) * b);
};

function powMod(base, exp, mod) {
  if (!Number.isSafeInteger(base) || !Number.isSafeInteger(exp) || !Number.isSafeInteger(mod) || mod <= 0 || exp < 0) {
    throw Error('Use a positive modulo and non-negative safe integer values.');
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

// ---------- MATRIX HELPERS ----------
const parseMatrix = text => {
  if (!text || !text.trim()) throw Error('Matrix cannot be empty.');
  const rows = text.split(';').map(row => row.split(',').map(Number));
  if (!rows.length || !rows[0].length) throw Error('Matrix has no data.');
  if (rows.some(row => row.some(v => !Number.isFinite(v)))) throw Error('Matrix contains non-numeric values.');
  const cols = rows[0].length;
  if (!rows.every(row => row.length === cols)) throw Error('All matrix rows must have the same length.');
  return rows;
};
const matrixText = m => m.map(row => `[ ${row.map(fmt).join(', ')} ]`).join('\n');
const determinant = m => {
  if (m.length === 0) return 0;
  if (m.length !== m[0].length) throw Error('Matrix must be square for determinant.');
  if (m.length === 1) return m[0][0];
  if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
  return m[0].reduce((s, v, j) => s + (j % 2 ? -1 : 1) * v * determinant(m.slice(1).map(row => row.filter((_, k) => k !== j))), 0);
};
const matrixRank = M => {
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
const matrixInverse = A => {
  if (A.length !== A[0].length) throw Error('Matrix must be square for inverse.');
  const n = A.length;
  const aug = A.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    if (Math.abs(aug[pivot][col]) < 1e-12) throw Error('Matrix is singular (determinant is zero).');
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

// ---------- UNITS ----------
const convertUnits = {
  Length: [['m',1],['km',1000],['cm',0.01],['mm',0.001],['mi',1609.344],['ft',0.3048]],
  Mass: [['kg',1],['g',0.001],['mg',1e-6],['lb',0.45359237]],
  Temperature: [['°C',0],['°F',1],['K',2]],
  Area: [['m²',1],['km²',1e6],['cm²',1e-4],['ft²',0.092903]],
  Volume: [['L',1],['mL',0.001],['m³',1000],['gal',3.78541]],
  Speed: [['m/s',1],['km/h',0.277778],['mph',0.44704]],
  Pressure: [['Pa',1],['kPa',1000],['bar',1e5],['atm',101325]],
  Energy: [['J',1],['kJ',1000],['cal',4.184],['kWh',3.6e6]],
  Power: [['W',1],['kW',1000],['hp',745.7]],
  Time: [['s',1],['min',60],['h',3600],['day',86400]],
  Angle: [['rad',1],['deg',Math.PI / 180]],
  'Data storage': [['B',1],['KB',1024],['MB',1048576],['GB',1073741824]]
};

// ---------- BASIC / SCIENTIFIC CALCULATOR ----------
function Calculator({ scientific = false, onSave }) {
  const [value, setValue] = React.useState('');
  const [degrees, setDegrees] = React.useState(true);
  const calculate = () => {
    try {
      const result = evaluate(value, degrees);
      onSave(value, result);
      setValue(fmt(result));
    } catch (e) {
      setValue(e.message);
    }
  };
  const add = v => setValue(s => s.startsWith('Check') || s.startsWith('Invalid') || s.includes('requires') || s.includes('Division') || s.includes('integer') ? v : s + v);
  const keys = scientific
    ? ['sin(','cos(','tan(','sqrt(','ln(','log(','7','8','9','÷','^','4','5','6','×','%','1','2','3','-','(','0','.','!',')','+']
    : ['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','(',')','+'];
  return (
    <Panel title={scientific ? 'Scientific Calculator' : 'Basic Calculator'}
      subtitle={scientific ? 'Advanced functions with degree/radian control.' : 'Fast, clean arithmetic for everyday work.'}>
      <Form.Control className="display mb-3" value={value} onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="0" />
      <Stack direction="horizontal" className="justify-content-between mb-3">
        <span className="muted">Expression input · press Enter to calculate</span>
        {scientific && <Button size="sm" variant="outline-primary" onClick={() => setDegrees(!degrees)}>{degrees ? 'DEG' : 'RAD'}</Button>}
      </Stack>
      <Row className="g-2">
        {keys.map((k, i) => (
          <Col xs={3} sm={scientific ? 2 : 3} key={k + i}>
            <Button className="calc-key w-100"
              variant={['+','-','×','÷','^','%'].includes(k) ? 'primary' : 'light'}
              onClick={() => add(k.replace('÷','/').replace('×','*'))}>{k}</Button>
          </Col>
        ))}
      </Row>
      <Stack direction="horizontal" gap={2} className="mt-3">
        <Button className="flex-grow-1" onClick={calculate}>Calculate</Button>
        <Button variant="outline-secondary" onClick={() => setValue('')}>Clear</Button>
      </Stack>
    </Panel>
  );
}

// ---------- EXPRESSION CALCULATOR ----------
function Expression({ onSave }) {
  const [text, setText] = React.useState('2*sin(30)+sqrt(25)');
  const [x, setX] = React.useState('2');
  const [result, setResult] = React.useState('—');
  const run = () => {
    try {
      const r = evaluate(text, true, 0, num(x));
      setResult(fmt(r));
      onSave(text, r);
    } catch (e) {
      setResult(e.message);
    }
  };
  return (
    <Panel title="Expression Calculator" subtitle="Evaluate formulas, constants, functions, implicit multiplication, x and factorials.">
      <Form.Label>Expression</Form.Label>
      <Form.Control className="expression-input mb-3" value={text}
        onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && run()} />
      <Row className="g-3 align-items-end">
        <Col md={4}><Input label="x value" value={x} onChange={setX} /></Col>
        <Col md={8}><Button className="w-100" onClick={run}>Evaluate expression</Button></Col>
      </Row>
      <Output label="Computed result" value={result} />
      <div className="chip-list">
        {['sin(30)','x^3 + 2*x - 5','2*pi','5!','log10(1000)','3(4+1)'].map(v => (
          <Button key={v} size="sm" variant="outline-secondary" onClick={() => setText(v)}>{v}</Button>
        ))}
      </div>
    </Panel>
  );
}

// ---------- STATISTICS ----------
function Statistics({ onSave }) {
  const [input, setInput] = React.useState('12, 18, 14, 20, 16, 15, 19, 13, 17, 11');
  const rawValues = input.split(',').map(v => v.trim());
  const n = rawValues.filter(v => v !== '' && Number.isFinite(Number(v))).map(Number);
  const invalid = rawValues.some(v => v === '' || !Number.isFinite(Number(v)));
  const sorted = [...n].sort((a, b) => a - b);
  const len = n.length;
  const mean = len ? n.reduce((a, b) => a + b, 0) / len : 0;
  const median = len ? (len % 2 ? sorted[(len - 1) / 2] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2) : 0;
  const mode = len ? (() => {
    const map = {}; n.forEach(v => map[v] = (map[v] || 0) + 1);
    const max = Math.max(...Object.values(map));
    const modes = Object.keys(map).filter(k => map[k] === max).map(Number);
    return modes.length === n.length ? 'No mode' : modes.join(', ');
  })() : '—';
  const variance = len ? n.reduce((s, v) => s + (v - mean) ** 2, 0) / len : 0;
  const sampleVariance = len > 1 ? n.reduce((s, v) => s + (v - mean) ** 2, 0) / (len - 1) : 0;
  const popStd = Math.sqrt(variance);
  const sampleStd = Math.sqrt(sampleVariance);
  const range = len ? sorted[len - 1] - sorted[0] : 0;
  const q1 = len ? (() => { const m = Math.floor(len / 2); const lower = sorted.slice(0, m); const l = lower.length; return l % 2 ? lower[(l - 1) / 2] : (lower[l / 2 - 1] + lower[l / 2]) / 2; })() : 0;
  const q3 = len ? (() => { const m = Math.ceil(len / 2); const upper = sorted.slice(m); const l = upper.length; return l % 2 ? upper[(l - 1) / 2] : (upper[l / 2 - 1] + upper[l / 2]) / 2; })() : 0;
  return (
    <Panel title="Statistics & Probability" subtitle="Summarize a dataset with descriptive statistics.">
      <Form.Control value={input} onChange={e => setInput(e.target.value)} placeholder="Comma-separated values (e.g. 12, 18, 14)" />
      {invalid && <Alert variant="warning" className="mt-3 mb-0">Use only comma-separated finite numbers.</Alert>}
      <Row className="g-2 mt-3">
        {[
          ['Count', len],
          ['Mean', fmt(mean)],
          ['Median', fmt(median)],
          ['Mode', mode],
          ['Population variance', fmt(variance)],
          ['Sample variance', fmt(sampleVariance)],
          ['Pop. std deviation', fmt(popStd)],
          ['Sample std deviation', fmt(sampleStd)],
          ['Range', fmt(range)],
          ['Q1', fmt(q1)],
          ['Q3', fmt(q3)],
          ['Min', fmt(len ? sorted[0] : '—')],
          ['Max', fmt(len ? sorted[len - 1] : '—')],
        ].map(x => (
          <Col sm={6} lg={4} key={x[0]}>
            <div className="metric"><small>{x[0]}</small><strong>{x[1]}</strong></div>
          </Col>
        ))}
      </Row>
      <Button className="mt-3" onClick={() => onSave('Statistics dataset', mean)}>Save calculation</Button>
    </Panel>
  );
}

// ---------- CONSTANTS ----------
function Constants() {
  return (
    <Panel title="Mathematical & Scientific Constants" subtitle="Copy reliable reference values into your calculations.">
      <Row className="g-3">
        {constants.map(c => (
          <Col sm={6} lg={3} key={c[0]}>
            <div className="constant-card">
              <strong>{c[0]}</strong>
              <span>{c[1]}</span>
              <code>{c[2].toExponential(8)}</code>
              <small>{c[3]}</small>
            </div>
          </Col>
        ))}
      </Row>
    </Panel>
  );
}

// ---------- HISTORY ----------
function History({ history, onClear }) {
  return (
    <Panel title="Calculation History" subtitle="Your saved results remain available during this session.">
      {history.length ? (
        <>
          {history.map((h, i) => (
            <div className="history-line" key={i}>
              <span>{h.expression}</span>
              <strong>{h.result}</strong>
            </div>
          ))}
          <Button variant="outline-danger" className="mt-3" onClick={onClear}>Clear history</Button>
        </>
      ) : (
        <div className="empty-state">No calculations saved yet. Use any workspace to create history.</div>
      )}
    </Panel>
  );
}

// ---------- ALGEBRA / MATRIX / NUMBER / GEOMETRY / PHYSICS ----------
function AdvancedFeature({ tool, onSave }) {
  const optionSets = {
    algebra: ['Quadratic equation', 'Linear equation ax+b=0', '2x2 simultaneous equations', '3x3 simultaneous equations', 'Evaluate polynomial/expression'],
    matrix: ['Addition', 'Subtraction', 'Multiplication', 'Transpose', 'Determinant', 'Inverse', 'Rank', 'Solve Ax=b'],
    number: ['Prime test', 'Prime factorization', 'GCD', 'LCM', 'Euler Phi', 'Modular exponentiation', 'Divisors', 'Digit sum', 'Reverse number'],
    geometry: ['Circle', 'Rectangle', 'Triangle', 'Square', 'Cube', 'Cuboid', 'Sphere', 'Cylinder', 'Cone', 'Pythagorean theorem'],
    physics: ['F = ma', 'Kinetic energy', 'Potential energy', 'Momentum', 'Work', 'Power', "Ohm's law", 'Electrical power', 'Coulomb force', 'Gravitational force', 'Wave speed', 'Lens equation', 'Relativistic energy', 'Density', 'Pressure', 'Spring SHM period', 'Simple pendulum period', 'Kinematics v=u+at', 'Kinematics s=ut+1/2at^2', 'v²=u²+2as']
  };
  const guides = {
    algebra: 'Choose an equation type. Enter coefficients or an expression; simultaneous equations use coefficients row by row.',
    matrix: 'Enter matrices as rows separated by semicolons, with values separated by commas. Example: 1,2;3,4.',
    number: 'Enter integer values. GCD, LCM and modular exponentiation use the first three values.',
    geometry: 'Choose a shape and enter dimensions in the order shown. Results include the relevant area, volume or surface measure.',
    physics: 'Choose a formula and enter values in the displayed order. Use SI units for meaningful results.'
  };
  const [option, setOption] = React.useState(optionSets[tool.id][0]);
  const [values, setValues] = React.useState(['12','8','5','3','2','1','0','0','0','0','0','0']);
  const [matrixA, setMatrixA] = React.useState('1,2;3,4');
  const [matrixB, setMatrixB] = React.useState('5,6;7,8');
  const [result, setResult] = React.useState('—');
  React.useEffect(() => { setOption(optionSets[tool.id][0]); setResult('—'); }, [tool.id]);
  const setValue = (i, v) => setValues(a => {
    const b = [...a];
    while (b.length <= i) b.push('0');
    b[i] = v;
    return b;
  });
  const n = i => {
    const value = values[i];
    if (value === '' || value === undefined || !Number.isFinite(Number(value))) throw Error(`Value ${i + 1} must be a finite number.`);
    return Number(value);
  };
  const calculate = () => {
    try {
      let r;
      const id = tool.id;
      if (id === 'algebra') {
        if (option === 'Quadratic equation') {
          const a = n(0), b = n(1), c = n(2);
          if (a === 0) throw Error('Coefficient a cannot be zero.');
          const d = b * b - 4 * a * c;
          r = d < 0 ? `No real roots (discriminant = ${fmt(d)})` : `x₁ = ${fmt((-b + Math.sqrt(d)) / (2 * a))}, x₂ = ${fmt((-b - Math.sqrt(d)) / (2 * a))}`;
        } else if (option === 'Linear equation ax+b=0') {
          r = n(0) ? `x = ${fmt(-n(1) / n(0))}` : n(1) ? 'No solution (0 ≠ ' + n(1) + ')' : 'Infinite solutions (0 = 0)';
        } else if (option === 'Evaluate polynomial/expression') {
          r = fmt(evaluate(values[0], true, 0, n(1)));
        } else if (option === '2x2 simultaneous equations') {
          const a = n(0), b = n(1), c = n(2), d = n(3), e = n(4), f = n(5);
          const det = a * d - b * c;
          r = Math.abs(det) < 1e-15 ? 'No unique solution (singular matrix)' : `x = ${fmt((e * d - b * f) / det)}, y = ${fmt((a * f - e * c) / det)}`;
        } else {
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
        }
      } else if (id === 'matrix') {
        const A = parseMatrix(matrixA);
        const op = option;
        const needsB = ['Addition', 'Subtraction', 'Multiplication', 'Solve Ax=b'].includes(op);
        const B = needsB ? parseMatrix(matrixB) : null;
        if (op === 'Transpose') {
          const cols = A[0].length;
          r = matrixText(A[0].map((_, j) => A.map(row => row[j])));
        } else if (op === 'Determinant') {
          if (A.length !== A[0].length) throw Error('Matrix must be square.');
          r = fmt(determinant(A));
        } else if (op === 'Rank') {
          r = String(matrixRank(A));
        } else if (op === 'Multiplication') {
          if (A[0].length !== B.length) throw Error(`Columns of A (${A[0].length}) must equal rows of B (${B.length}).`);
          const result = A.map((row, i) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * (B[k]?.[j] ?? 0), 0)));
          r = matrixText(result);
        } else if (op === 'Inverse') {
          r = matrixText(matrixInverse(A));
        } else if (op === 'Solve Ax=b') {
          if (A.length !== A[0].length) throw Error('A must be square to solve Ax=b.');
          const n2 = A.length;
          if (B.length !== A.length || B[0].length !== 1) throw Error('B must be a column matrix with one value per row of A.');
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
          if (aug.some(row => Math.abs(row[n2]) > 1e-10 && row.slice(0, n2).every(v => Math.abs(v) < 1e-10))) throw Error('System is inconsistent.');
          if (aug.some(row => row.slice(0, n2).every(v => Math.abs(v) < 1e-10))) throw Error('System has no unique solution.');
          const sol = aug.map(row => row[n2]);
          r = matrixText(sol.map(v => [v]));
        } else {
          if (A.length !== B.length || A[0].length !== B[0].length) throw Error('Matrices must have the same dimensions for addition/subtraction.');
          const C = op === 'Addition' ? 1 : op === 'Subtraction' ? -1 : 0;
          r = matrixText(A.map((row, i) => row.map((v, j) => v + C * (B[i]?.[j] || 0))));
        }
      } else if (id === 'number') {
        const x = Math.trunc(n(0)), y = Math.trunc(n(1)), z = Math.trunc(n(2));
        if (option === 'Prime test') {
          if (x < 2) { r = 'Not prime'; }
          else { let isPrime = true; for (let i = 2; i * i <= x; i++) { if (x % i === 0) { isPrime = false; break; } } r = isPrime ? 'Prime' : 'Not prime'; }
        } else if (option === 'Prime factorization') {
          let q = Math.abs(x), f = [];
          for (let i = 2; i * i <= q; i++) { while (q % i === 0) { f.push(i); q /= i; } }
          if (q > 1) f.push(q);
          r = f.length ? f.join(' × ') : String(x === 0 ? 0 : x < 0 ? -1 : 1);
        } else if (option === 'GCD') {
          r = String(gcd(x, y));
        } else if (option === 'LCM') {
          r = String(lcm(x, y));
        } else if (option === 'Euler Phi') {
          if (x < 1) { r = '0'; } else {
            let count = 0;
            for (let i = 1; i <= x; i++) { if (gcd(i, x) === 1) count++; }
            r = String(count);
          }
        } else if (option === 'Modular exponentiation') {
          r = String(powMod(x, y, z));
        } else if (option === 'Divisors') {
          const divs = [];
          for (let i = 1; i <= Math.abs(x); i++) { if (x % i === 0) divs.push(i); }
          r = divs.join(', ');
        } else if (option === 'Digit sum') {
          r = String(String(Math.abs(x)).split('').reduce((a, d) => a + Number(d), 0));
        } else if (option === 'Reverse number') {
          const s = String(Math.abs(x)).split('').reverse().join('');
          r = String(Number(s) * (x < 0 ? -1 : 1));
        }
      } else if (id === 'geometry') {
        const x = n(0), y = n(1), z = n(2);
        const formulas = {
          'Circle': `Area = ${fmt(Math.PI * x * x)}, circumference = ${fmt(2 * Math.PI * x)}`,
          'Rectangle': `Area = ${fmt(x * y)}, perimeter = ${fmt(2 * (x + y))}`,
          'Triangle': (() => { const s = (x + y + z) / 2; const area = s > 0 ? Math.sqrt(Math.max(0, s * (s - x) * (s - y) * (s - z))) : 0; return `Area = ${fmt(area)}${area ? '' : ' (invalid triangle)'}`; })(),
          'Square': `Area = ${fmt(x * x)}, perimeter = ${fmt(4 * x)}`,
          'Cube': `Volume = ${fmt(x ** 3)}, surface area = ${fmt(6 * x * x)}`,
          'Cuboid': `Volume = ${fmt(x * y * z)}, surface area = ${fmt(2 * (x * y + y * z + x * z))}`,
          'Sphere': `Volume = ${fmt(4 * Math.PI * x ** 3 / 3)}, surface area = ${fmt(4 * Math.PI * x * x)}`,
          'Cylinder': `Volume = ${fmt(Math.PI * x * x * y)}, surface area = ${fmt(2 * Math.PI * x * (x + y))}`,
          'Cone': `Volume = ${fmt(Math.PI * x * x * y / 3)}`,
          'Pythagorean theorem': `c = ${fmt(Math.hypot(x, y))}`
        };
        r = formulas[option];
      } else if (id === 'physics') {
        const x = n(0), y = n(1), z = n(2);
        const formulas = {
          'F = ma': `${fmt(x * y)} N`,
          'Kinetic energy': `${fmt(0.5 * x * y * y)} J`,
          'Potential energy': `${fmt(x * y * (z || 0))} J`,
          'Momentum': `${fmt(x * y)} kg·m/s`,
          'Work': `${fmt(x * y)} J`,
          'Power': y ? `${fmt(x / y)} W` : 'Division by zero',
          "Ohm's law": `${fmt(x * y)} V`,
          'Electrical power': `${fmt(x * y)} W`,
          'Coulomb force': `${fmt(8.9875517923e9 * x * y / (z * z || 1))} N`,
          'Gravitational force': `${fmt(6.6743e-11 * x * y / (z * z || 1))} N`,
          'Wave speed': `${fmt(x * y)} m/s`,
          'Lens equation': x && y ? `${fmt(1 / (1 / x + 1 / y))}` : 'Need both distances',
          'Relativistic energy': `${fmt(x * 299792458 ** 2)} J`,
          'Density': y ? `${fmt(x / y)} kg/m³` : 'Division by zero',
          'Pressure': y ? `${fmt(x / y)} Pa` : 'Division by zero',
          'Spring SHM period': y > 0 ? `${fmt(2 * Math.PI * Math.sqrt(x / y))} s` : 'k must be positive',
          'Simple pendulum period': y > 0 ? `${fmt(2 * Math.PI * Math.sqrt(x / y))} s` : 'g must be positive',
          'Kinematics v=u+at': `${fmt(x + y * z)} m/s`,
          'Kinematics s=ut+1/2at^2': `${fmt(x * y + 0.5 * z * y * y)} m`,
          'v²=u²+2as': `${fmt(Math.sqrt(x * x + 2 * y * z))} m/s`
        };
        r = formulas[option];
      }
      setResult(r);
      onSave(`${tool.label}: ${option}`, r);
    } catch (e) {
      setResult(e.message || 'Check the entered values.');
    }
  };
  const labels = option.includes('polynomial') ? ['Expression', 'x value']
    : option === '3x3 simultaneous equations' ? ['a₁₁', 'a₁₂', 'a₁₃', 'a₂₁', 'a₂₂', 'a₂₃', 'a₃₁', 'a₃₂', 'a₃₃', 'b₁', 'b₂', 'b₃']
    : option === 'Quadratic equation' ? ['a', 'b', 'c']
    : option.includes('simultaneous') ? ['a₁', 'a₂', 'a₃', 'b₁', 'b₂', 'b₃']
    : option === 'Prime test' || option === 'Prime factorization' || option === 'Divisors' || option === 'Digit sum' || option === 'Reverse number' ? ['Value']
    : option === 'Euler Phi' ? ['n']
    : option === 'Modular exponentiation' ? ['Base', 'Exponent', 'Modulo']
    : option === 'Circle' || option === 'Square' || option === 'Cube' || option === 'Sphere' ? ['Radius / side']
    : option === 'Rectangle' || option === 'Cylinder' ? ['Length / radius', 'Width / height']
    : option === 'Triangle' ? ['Side a', 'Side b', 'Side c']
    : option === 'Cuboid' ? ['Length', 'Width', 'Height']
    : option === 'Cone' ? ['Radius', 'Height']
    : option === 'Pythagorean theorem' || option === 'F = ma' || option === 'Momentum' || option === 'Work' || option === 'Density' || option === 'Pressure' || option === 'Wave speed' || option === 'Lens equation' || option.includes('v=u+at') || option === 'Relativistic energy' ? ['Value 1', 'Value 2']
    : ['Value 1', 'Value 2', 'Value 3'];
  return (
    <Panel title={tool.label} subtitle={tool.description}>
      <Guide text={guides[tool.id]} extra={tool.id === 'matrix' ? 'Example: 1,2;3,4' : null} />
      <Form.Label>Choose an operation</Form.Label>
      <Form.Select className="mb-3" value={option} onChange={e => setOption(e.target.value)}>
        {optionSets[tool.id].map((x, i) => <option key={x} value={x}>{i + 1}. {x}</option>)}
      </Form.Select>
      {tool.id === 'matrix' ? (
        <Row className="g-3">
          <Col md={6}><Input label="Matrix A" type="text" value={matrixA} onChange={setMatrixA} /></Col>
          <Col md={6}><Input label="Matrix B" type="text" value={matrixB} onChange={setMatrixB} /></Col>
        </Row>
      ) : (
        <Row className="g-3">
          {labels.map((label, i) => (
            <Col md={4} key={label + i}>
              <Input label={label} type={i === 0 && option.includes('polynomial') ? 'text' : 'number'}
                value={values[i] || ''} onChange={v => setValue(i, v)} />
            </Col>
          ))}
        </Row>
      )}
      <Button className="mt-4" onClick={calculate}>Calculate</Button>
      <Output value={result} />
    </Panel>
  );
}

// ---------- FEATURE (CHEMISTRY, BIOLOGY, FINANCE, UNITS, PROGRAMMER, CALCULUS, COMPLEX) ----------
function Feature({ tool, onSave }) {
  const optionSets = {
    chemistry: ['Moles from mass','Mass from moles','Molarity','Dilution M1V1=M2V2','Molality','pH from [H+]','pOH','Henderson-Hasselbalch','Ideal gas law','Beer-Lambert law','First-order half-life','Arrhenius equation','Nernst equation at 25 C'],
    biology: ['DNA base count','GC percentage','DNA complement','Reverse complement','DNA → protein translation','Approximate DNA melting temperature','PCR copy calculator','Michaelis-Menten equation','Dilution calculator'],
    finance: ['Simple interest','Compound interest','EMI','CAGR','Future value','Present value','Percentage increase/decrease','SIP future value'],
    units: ['Length','Mass','Temperature','Area','Volume','Speed','Pressure','Energy','Power','Time','Angle','Data storage'],
    programmer: ['Decimal → Binary/Octal/Hex','Binary → Decimal','Hex → Decimal','Bitwise AND','Bitwise OR','Bitwise XOR','Bitwise NOT','Left shift','Right shift'],
    calculus: ['Numerical derivative','Second derivative','Definite integral (Simpson)','Definite integral (Trapezoidal)','Bisection root','Newton-Raphson root'],
    complex: ['Addition','Subtraction','Multiplication','Division','Magnitude','Phase','Conjugate','Power']
  };
  const guides = {
    chemistry: 'Choose a formula and enter the quantities in the order displayed. Use positive concentrations for pH and pOH calculations. The ideal gas option uses SI units.',
    biology: 'Enter a DNA or RNA sequence for base counts, GC percentage, complements, or translation. Sequences are cleaned automatically and are case-insensitive.',
    finance: 'Enter monetary values, rates in percent, and time in the units requested. EMI uses loan principal, annual rate, and number of months.',
    units: 'Choose a category, source unit, target unit, and enter a value. Supported categories include length, mass, temperature, area, volume, speed, pressure, energy, power, time, angle, and data.',
    programmer: 'Decimal conversion displays binary, octal, and hexadecimal forms. Bitwise operations use integer values; NOT uses one value and shifts use a value plus positions.',
    calculus: 'Enter f(x) using expression syntax such as x^2+2*x-3. Derivatives use x and h; integration uses limits and intervals.',
    complex: 'Enter each complex number as real and imaginary values. For example, 3 and 4 represents 3 + 4i.'
  };
  const [option, setOption] = React.useState(optionSets[tool.id][0]);
  const [values, setValues] = React.useState(['12','8','5','3']);
  const [text, setText] = React.useState('ATCGGCTA');
  const [result, setResult] = React.useState('—');
  const [unitCat, setUnitCat] = React.useState('Length');
  const [from, setFrom] = React.useState(0);
  const [to, setTo] = React.useState(1);
  const setValue = (i, v) => setValues(a => a.map((x, n) => n === i ? v : x));
  const v = i => {
    const value = values[i];
    if (value === '' || value === undefined || !Number.isFinite(Number(value))) throw Error(`Value ${i + 1} must be a finite number.`);
    return Number(value);
  };
  React.useEffect(() => { setOption(optionSets[tool.id][0]); setResult('—'); }, [tool.id]);

  const calculate = () => {
    try {
      let r, label = `${tool.label}: ${option}`;
      const x = v(0), y = v(1), z = v(2), w = v(3);
      const requireNonZero = (value, name) => { if (value === 0) throw Error(`${name} cannot be zero.`); return value; };

      if (tool.id === 'chemistry') {
        let q;
        switch (option) {
          case 'Moles from mass': q = x / requireNonZero(y, 'Molar mass'); break;
          case 'Mass from moles': q = x * y; break;
          case 'Molarity': q = x / requireNonZero(y, 'Volume'); break;
          case 'Dilution M1V1=M2V2': q = x * y / requireNonZero(z, 'M2'); break;
          case 'Molality': q = x / requireNonZero(y, 'Solvent mass'); break;
          case 'pH from [H+]': if (x <= 0) throw Error('[H+] must be positive.'); q = -Math.log10(x); break;
          case 'pOH': if (x <= 0) throw Error('[OH−] must be positive.'); q = -Math.log10(x); break;
          case 'Henderson-Hasselbalch': if (y <= 0 || z <= 0) throw Error('Both concentrations must be positive.'); q = x + Math.log10(y / z); break;
          case 'Ideal gas law': q = (x * y) / (8.314 * requireNonZero(w, 'Temperature')); break;
          case 'Beer-Lambert law': q = x / requireNonZero(z, 'Path length'); break;
          case 'First-order half-life': q = Math.log(2) / requireNonZero(x, 'Rate constant'); break;
          case 'Arrhenius equation': if (z <= 0) throw Error('Temperature must be positive.'); q = x * Math.exp(-y / (8.314 * z)); break;
          case 'Nernst equation at 25 C': if (y === 0 || z <= 0) throw Error('Electrons cannot be zero and Q must be positive.'); q = x - (0.05916 / y) * Math.log10(z); break;
          default: q = 0;
        }
        r = fmt(q);
      } else if (tool.id === 'biology') {
        const s = text.toUpperCase().replace(/[^ACGTU]/g, '');
        if (!s && !option.includes('PCR') && !option.includes('Michaelis') && !option.includes('Dilution')) throw Error('Enter a valid DNA/RNA sequence.');
        if (option === 'DNA base count') {
          r = `A: ${[...s].filter(c => c === 'A').length}, C: ${[...s].filter(c => c === 'C').length}, G: ${[...s].filter(c => c === 'G').length}, T/U: ${[...s].filter(c => c === 'T' || c === 'U').length}`;
        } else if (option === 'GC percentage') {
          r = s.length ? `${fmt(100 * [...s].filter(c => c === 'G' || c === 'C').length / s.length)}%` : '—';
        } else if (option === 'DNA complement' || option === 'Reverse complement') {
          const comp = s.replace(/[ACGTU]/g, q => ({ A: 'T', T: 'A', U: 'A', C: 'G', G: 'C' }[q]));
          r = option === 'Reverse complement' ? [...comp].reverse().join('') : comp;
        } else if (option.includes('translation')) {
          const table = {
            'TAA':'*','TAG':'*','TGA':'*','ATG':'M','TGG':'W',
            'TTT':'F','TTC':'F','TTA':'L','TTG':'L','CTT':'L','CTC':'L','CTA':'L','CTG':'L',
            'ATT':'I','ATC':'I','ATA':'I','GTT':'V','GTC':'V','GTA':'V','GTG':'V',
            'TCT':'S','TCC':'S','TCA':'S','TCG':'S','CCT':'P','CCC':'P','CCA':'P','CCG':'P',
            'ACT':'T','ACC':'T','ACA':'T','ACG':'T','GCT':'A','GCC':'A','GCA':'A','GCG':'A',
            'TAT':'Y','TAC':'Y','CAT':'H','CAC':'H','CAA':'Q','CAG':'Q','AAT':'N','AAC':'N',
            'AAA':'K','AAG':'K','GAT':'D','GAC':'D','GAA':'E','GAG':'E','TGT':'C','TGC':'C',
            'CGT':'R','CGC':'R','CGA':'R','CGG':'R','AGA':'R','AGG':'R','GGT':'G','GGC':'G','GGA':'G','GGG':'G'
          };
          r = Array.from({ length: Math.floor(s.length / 3) }, (_, i) => table[s.slice(i * 3, i * 3 + 3)] || 'X').join('');
        } else if (option.includes('melting')) {
          const a = [...s].filter(c => c === 'A' || c === 'T').length;
          const g = [...s].filter(c => c === 'G' || c === 'C').length;
          r = s.length ? `${fmt(2 * a + 4 * g)} °C` : '—';
        } else if (option.includes('PCR')) {
          r = fmt(x * Math.pow(1 + y / 100, z));
        } else if (option.includes('Michaelis')) {
          r = y + z ? fmt(x * z / (y + z)) : '0';
        } else if (option.includes('Dilution')) {
          r = z ? fmt(x * y / z) : 'Division by zero';
        }
      } else if (tool.id === 'finance') {
        if (option === 'Simple interest') {
          r = fmt(x * (1 + y / 100 * z));
        } else if (option === 'Compound interest') {
          if (w <= 0) throw Error('Compounding periods per year must be positive.');
          r = fmt(x * Math.pow(1 + y / 100 / w, w * z));
        } else if (option === 'EMI') {
          if (x < 0 || z <= 0) throw Error('Principal must be non-negative and months must be positive.');
          const m = y / 1200;
          r = fmt(m === 0 ? x / z : x * m * Math.pow(1 + m, z) / (Math.pow(1 + m, z) - 1));
        } else if (option === 'CAGR') {
          if (x <= 0 || y <= 0 || z <= 0) throw Error('Values and years must be positive.');
          r = fmt((Math.pow(y / x, 1 / z) - 1) * 100) + '%';
        } else if (option === 'Future value') {
          if (1 + y / 100 <= 0) throw Error('Rate produces an invalid growth factor.');
          r = fmt(x * Math.pow(1 + y / 100, z));
        } else if (option === 'Present value') {
          if (1 + y / 100 <= 0) throw Error('Rate produces an invalid discount factor.');
          r = fmt(x / Math.pow(1 + y / 100, z));
        } else if (option.includes('Percentage')) {
          r = x ? fmt((y - x) / Math.abs(x) * 100) + '%' : 'Original value cannot be zero';
        } else if (option.includes('SIP')) {
          if (x < 0 || z <= 0) throw Error('Investment must be non-negative and months must be positive.');
          const m = y / 1200;
          r = fmt(m === 0 ? x * z : x * ((Math.pow(1 + m, z) - 1) / m) * (1 + m));
        }
      } else if (tool.id === 'units') {
        const u = convertUnits[unitCat];
        if (unitCat === 'Temperature') {
          let c;
          if (from === 0) c = x;
          else if (from === 1) c = (x - 32) * (5 / 9);
          else c = x - 273.15;
          let result;
          if (to === 0) result = c;
          else if (to === 1) result = c * 9 / 5 + 32;
          else result = c + 273.15;
          r = fmt(result) + ' ' + u[to][0];
        } else {
          r = fmt(x * u[from][1] / u[to][1]) + ' ' + u[to][0];
        }
      } else if (tool.id === 'programmer') {
        const a = Math.trunc(x), b = Math.trunc(y);
        if (option.startsWith('Decimal')) {
          r = `BIN ${(a >>> 0).toString(2)} · OCT ${(a >>> 0).toString(8)} · HEX ${(a >>> 0).toString(16).toUpperCase()}`;
        } else if (option.startsWith('Binary')) {
          if (!/^[01]+$/.test(text.trim())) throw Error('Enter a valid binary value.');
          r = String(parseInt(text.trim(), 2));
        } else if (option.startsWith('Hex')) {
          if (!/^[0-9a-fA-F]+$/.test(text.trim())) throw Error('Enter a valid hexadecimal value.');
          r = String(parseInt(text.trim(), 16));
        } else if (option.includes('AND')) { r = String(a & b); }
        else if (option.includes('OR')) { r = String(a | b); }
        else if (option.includes('XOR')) { r = String(a ^ b); }
        else if (option.includes('NOT')) { r = String(~a); }
        else if (option.includes('Left')) { r = String(a << b); }
        else { r = String(a >> b); }
      } else if (tool.id === 'complex') {
        const a = { r: x, i: y }, b = { r: z, i: w };
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
          else {
            const denom = b.r * b.r + b.i * b.i;
            if (Math.abs(denom) < 1e-15) throw Error('Division by zero (denominator is zero).');
            q = [(a.r * b.r + a.i * b.i) / denom, (a.i * b.r - a.r * b.i) / denom];
          }
          r = `${fmt(q[0])} ${q[1] < 0 ? '−' : '+'} ${fmt(Math.abs(q[1]))}i`;
        }
      } else if (tool.id === 'calculus') {
        const f = t => {
          const val = evaluate(text, true, 0, t);
          if (!Number.isFinite(val)) throw Error('Function returned a non-finite value.');
          return val;
        };
        const h = Math.abs(y) || 0.0001;
        if (option === 'Numerical derivative') {
          r = fmt((f(x + h) - f(x - h)) / (2 * h));
        } else if (option === 'Second derivative') {
          r = fmt((f(x + h) - 2 * f(x) + f(x - h)) / (h * h));
        } else if (option === 'Definite integral (Simpson)') {
          const lo = x, hi = y;
          if (lo >= hi) throw Error('Lower bound must be less than upper bound.');
          const steps = Math.max(2, Math.trunc(z) || 100);
          const dx = (hi - lo) / steps;
          let sum = f(lo) + f(hi);
          for (let i = 1; i < steps; i++) sum += f(lo + i * dx) * (i % 2 ? 4 : 2);
          r = fmt(sum * dx / 3);
        } else if (option === 'Definite integral (Trapezoidal)') {
          const lo = x, hi = y;
          if (lo >= hi) throw Error('Lower bound must be less than upper bound.');
          const steps = Math.max(2, Math.trunc(z) || 100);
          const dx = (hi - lo) / steps;
          let sum = f(lo) + f(hi);
          for (let i = 1; i < steps; i++) sum += 2 * f(lo + i * dx);
          r = fmt(sum * dx / 2);
        } else if (option === 'Bisection root') {
          let a = x, b = y;
          if (a >= b) throw Error('Lower bound must be less than upper bound.');
          let fa = f(a), fb = f(b);
          if (fa === 0) { r = fmt(a); setResult(r); onSave(label, r); return; }
          if (fb === 0) { r = fmt(b); setResult(r); onSave(label, r); return; }
          if (fa * fb > 0) throw Error('Function must have opposite signs at bounds (f(a)·f(b) < 0).');
          let mid;
          for (let i = 0; i < 100; i++) {
            mid = (a + b) / 2;
            const fmid = f(mid);
            if (Math.abs(fmid) < 1e-10) break;
            if (fa * fmid < 0) { b = mid; } else { a = mid; }
          }
          r = fmt(mid);
        } else if (option === 'Newton-Raphson root') {
          const tol = Math.abs(z) || 1e-10;
          let xn = x;
          for (let i = 0; i < 100; i++) {
            const fxn = f(xn);
            if (Math.abs(fxn) < tol) break;
            const dfxn = (f(xn + 1e-8) - f(xn - 1e-8)) / (2e-8);
            if (Math.abs(dfxn) < 1e-15) throw Error('Derivative too small; Newton-Raphson failed.');
            xn = xn - fxn / dfxn;
            if (!Number.isFinite(xn)) throw Error('Newton-Raphson diverged.');
          }
          r = fmt(xn);
        }
      }
      setResult(r);
      onSave(label, r);
    } catch (e) {
      setResult(e.message || 'Check the entered values.');
    }
  };

  const fields = {
    chemistry: {
      'Moles from mass': ['Mass (g)', 'Molar mass (g/mol)'],
      'Mass from moles': ['Moles', 'Molar mass (g/mol)'],
      'Molarity': ['Moles', 'Volume (L)'],
      'Dilution M1V1=M2V2': ['M1', 'V1', 'M2'],
      'Molality': ['Moles solute', 'Mass solvent (kg)'],
      'pH from [H+]': ['[H+] concentration'],
      'pOH': ['[OH−] concentration'],
      'Henderson-Hasselbalch': ['pKa', '[A−]', '[HA]'],
      'Ideal gas law': ['Pressure (Pa)', 'Volume (m³)', 'Moles (mol)', 'Temperature (K)'],
      'Beer-Lambert law': ['Absorbance', 'Molar absorptivity', 'Path length (cm)'],
      'First-order half-life': ['Rate constant k (s⁻¹)'],
      'Arrhenius equation': ['A (frequency)', 'Ea (J/mol)', 'Temperature (K)'],
      'Nernst equation at 25 C': ['E° (V)', 'n (electrons)', 'Q (reaction quotient)']
    },
    biology: {
      'PCR copy calculator': ['Initial copies', 'Cycles', 'Efficiency %'],
      'Michaelis-Menten equation': ['Vmax', 'Km', '[S]'],
      'Dilution calculator': ['C1', 'V1', 'C2'],
      default: ['Sequence / values']
    },
    finance: {
      'Simple interest': ['Principal', 'Rate %', 'Time (years)'],
      'Compound interest': ['Principal', 'Rate %', 'Times/year', 'Years'],
      'EMI': ['Loan principal', 'Annual rate %', 'Months'],
      'CAGR': ['Beginning value', 'Ending value', 'Years'],
      'Future value': ['Present value', 'Rate %', 'Periods'],
      'Present value': ['Future value', 'Rate %', 'Periods'],
      'Percentage increase/decrease': ['Original value', 'New value'],
      'SIP future value': ['Monthly investment', 'Rate %', 'Months']
    }
  };

  const labels = fields[tool.id]?.[option] || fields[tool.id]?.default || (
    {
      calculus: ['f(x) expression', 'x / lower bound', 'h / upper bound', 'Intervals'],
      complex: ['Real A', 'Imaginary A', 'Real B', 'Imaginary B'],
      programmer: ['Value A', 'Value B', 'Shift / base']
    }[tool.id] || ['Value 1', 'Value 2', 'Value 3']
  );

  const showText = tool.id === 'biology' || tool.id === 'calculus' || (tool.id === 'programmer' && (option.startsWith('Binary') || option.startsWith('Hex')));

  return (
    <Panel title={tool.label} subtitle={tool.description}>
      <Guide text={guides[tool.id]} />
      <Form.Label>Choose an operation</Form.Label>
      <Form.Select className="mb-3" value={option} onChange={e => setOption(e.target.value)}>
        {optionSets[tool.id].map((x, i) => <option key={x} value={x}>{i + 1}. {x}</option>)}
      </Form.Select>
      {tool.id === 'biology' && (
        <Form.Group className="mb-3">
          <Form.Label>Sequence input</Form.Label>
          <Form.Control type="text" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. ATCGGCTA" />
        </Form.Group>
      )}
      {tool.id === 'units' && (
        <Row className="g-3 mb-3">
          <Col md={4}>
            <Form.Label>Category</Form.Label>
            <Form.Select value={unitCat} onChange={e => { setUnitCat(e.target.value); setFrom(0); setTo(1); }}>
              {Object.keys(convertUnits).map(x => <option key={x}>{x}</option>)}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>From unit</Form.Label>
            <Form.Select value={from} onChange={e => setFrom(Number(e.target.value))}>
              {convertUnits[unitCat].map((u, i) => <option value={i} key={u[0]}>{i + 1}. {u[0]}</option>)}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>To unit</Form.Label>
            <Form.Select value={to} onChange={e => setTo(Number(e.target.value))}>
              {convertUnits[unitCat].map((u, i) => <option value={i} key={u[0]}>{i + 1}. {u[0]}</option>)}
            </Form.Select>
          </Col>
        </Row>
      )}
      {tool.id === 'calculus' && (
        <Form.Group className="mb-3">
          <Form.Label>Function f(x)</Form.Label>
          <Form.Control type="text" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. x^2 - 4" />
        </Form.Group>
      )}
      {(tool.id === 'programmer' && (option.startsWith('Binary') || option.startsWith('Hex'))) && (
        <Form.Group className="mb-3">
          <Form.Label>{option.startsWith('Binary') ? 'Binary input' : 'Hexadecimal input'}</Form.Label>
          <Form.Control type="text" value={text} onChange={e => setText(e.target.value)}
            placeholder={option.startsWith('Binary') ? 'e.g. 1010' : 'e.g. FF'} />
        </Form.Group>
      )}
      <Row className="g-3">
        {labels.map((label, i) => (
          <Col md={4} key={label + i}>
            <Input label={label} value={values[i] || ''} onChange={x => setValue(i, x)} type="number" />
          </Col>
        ))}
      </Row>
      <Button className="mt-4" onClick={calculate}>Calculate</Button>
      <Output value={result} />
    </Panel>
  );
}

// ---------- APP ----------
export default function App() {
  const [active, setActive] = React.useState('basic');
  const [history, setHistory] = React.useState([]);
  const save = (expression, result) => setHistory(h => [{ expression, result: String(result) }, ...h].slice(0, 100));
  const tool = tools.find(t => t.id === active);
  let content;
  if (['basic', 'scientific'].includes(active)) content = <Calculator scientific={active === 'scientific'} onSave={save} />;
  else if (active === 'expression') content = <Expression onSave={save} />;
  else if (active === 'statistics') content = <Statistics onSave={save} />;
  else if (active === 'constants') content = <Constants />;
  else if (active === 'history') content = <History history={history} onClear={() => setHistory([])} />;
  else if (['algebra', 'matrix', 'number', 'geometry', 'physics'].includes(active)) content = <AdvancedFeature tool={tool} onSave={save} />;
  else content = <Feature tool={tool} onSave={save} />;
  return (
    <>
      <Navbar className="topbar">
        <Container>
          <Navbar.Brand>
            <span className="brand-mark">∑</span>
            <strong>NUMERICA</strong>
          </Navbar.Brand>
          <span className="top-status">ALL-IN-ONE CALCULATION PLATFORM <Badge bg="success">READY</Badge></span>
        </Container>
      </Navbar>
      <main className="app-shell">
        <Container>
          <section className="hero">
            <div>
              <Badge bg="primary" className="eyebrow">PROFESSIONAL TOOLKIT · 18 MODULES</Badge>
              <h1>One workspace.<br /><span>Every calculation.</span></h1>
              <p>Choose a module below to work with mathematics, science, finance, engineering and data.</p>
            </div>
            <div className="hero-stat">
              <strong>18</strong>
              <span>specialist tools</span>
            </div>
          </section>
          <section className="module-grid">
            {tools.map(t => (
              <button key={t.id}
                className={`module-card ${active === t.id ? 'selected' : ''}`}
                onClick={() => setActive(t.id)}>
                <span className="module-number">{String(t.number).padStart(2, '0')}</span>
                <span className="module-icon">{t.icon}</span>
                <strong>{t.label}</strong>
                <small>{t.description}</small>
              </button>
            ))}
          </section>
          <div className="active-title">
            <span className="active-dot" /> Module {String(tool.number).padStart(2, '0')} / 18 <strong>{tool.label}</strong>
          </div>
          {content}
          <Alert variant="light" className="mt-4 border-0 small text-secondary">
            <strong>Tip:</strong> Results are saved automatically to Calculation History. All calculations run locally in your browser.
          </Alert>
        </Container>
      </main>
      <footer>
        <Container>
          <span>NUMERICA CALCULATION PLATFORM</span>
          <span>Precision tools for everyday decisions</span>
        </Container>
      </footer>
    </>
  );
}