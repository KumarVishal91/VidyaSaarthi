'use client';

export const LEVEL_LABEL = { high: 'Needs attention', medium: 'Watch', low: 'On track' };

export function Pill({ level, children }) {
  return <span className={`pill ${level}`}>{children || LEVEL_LABEL[level]}</span>;
}

export function Meter({ value }) {
  const color = value >= 85 ? 'var(--good)' : value >= 75 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div className="meter">
      <span className="track"><span className="fill" style={{ width: `${value}%`, background: color }} /></span>
      <span className="mono">{value}%</span>
    </div>
  );
}

export function Delta({ value }) {
  return value >= 0
    ? <span className="up">▲ +{value}</span>
    : <span className="down">▼ −{Math.abs(value)}</span>;
}

export function Dots({ text }) {
  return (
    <div className="dots">
      {[...text].map((c, i) => <span key={i} className={`dot ${c}`}>{c}</span>)}
    </div>
  );
}

export function Spark({ values }) {
  const w = 84, h = 26;
  const pts = values.map((v, i) => [4 + (i * (w - 8)) / (values.length - 1), h - 4 - (v / 100) * (h - 8)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Weekly attendance: ${values.join(', ')} percent`}>
      <polyline fill="none" stroke="var(--accent)" strokeWidth="2" points={pts.map((p) => p.join(',')).join(' ')} />
      <circle cx={last[0]} cy={last[1]} r="3" fill="var(--accent)" />
    </svg>
  );
}

export function Status({ loading, error, children }) {
  if (loading) return <p className="muted">Loading…</p>;
  if (error) return <p className="error" role="alert">{error}</p>;
  return children;
}
