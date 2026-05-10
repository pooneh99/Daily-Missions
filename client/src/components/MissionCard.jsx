export default function MissionCard({ mission, onClick }) {
  const { label, emoji, duration, xp, color, streak, completed_today } = mission;

  return (
    <div
      className={`mission-card${completed_today ? ' completed' : ''}`}
      onClick={() => !completed_today && onClick(mission)}
      role="button"
      tabIndex={completed_today ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !completed_today && onClick(mission)}
    >
      <div className="mission-card-accent" style={{ background: color }} />
      <div className="mission-card-body">
        <div className="mission-card-top">
          <span className="mission-emoji">{emoji}</span>
          <span className="mission-name">{label}</span>
        </div>
        <div className="mission-card-meta">
          <span className="meta-item">
            <span className="meta-icon">⏱</span>
            {duration} min
          </span>
          <span className="meta-item">
            <span className="meta-icon">⚡</span>
            {xp} XP
          </span>
          {streak > 0 && (
            <span className="streak-badge">
              🔥 {streak}d
            </span>
          )}
        </div>
      </div>
      <div className="mission-card-right">
        {completed_today ? '✓' : '›'}
      </div>
    </div>
  );
}
