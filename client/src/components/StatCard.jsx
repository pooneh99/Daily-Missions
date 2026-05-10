export default function StatCard({ emoji, value, label }) {
  return (
    <div className="stat-card">
      {emoji && <div className="stat-emoji">{emoji}</div>}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
