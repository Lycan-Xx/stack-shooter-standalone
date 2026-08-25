import './StatRow.css';

export default function StatRow({ label, value, detail, accent = 'default', className = '' }) {
  return (
    <div className={`stat-row stat-row--${accent} ${className}`.trim()}>
      <span className="stat-row__label">{label}</span>
      <strong className="stat-row__value">{value}</strong>
      {detail && <span className="stat-row__detail">{detail}</span>}
    </div>
  );
}
