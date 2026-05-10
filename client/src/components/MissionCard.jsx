function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function MissionCard({ mission, onClick }) {
  const { label, emoji, duration, xp, color, streak, completed_today } = mission;
  const rgb = hexToRgb(color);

  return (
    <div
      className={`mission-card${completed_today ? ' completed' : ''}`}
      onClick={() => !completed_today && onClick(mission)}
      role="button"
      tabIndex={completed_today ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !completed_today && onClick(mission)}
      style={{ '--card-rgb': rgb }}
    >
      <div className="mission-card-body">
        <div className="mission-card-top">
          <div
            className="mission-icon-3d"
            style={{
              background: `linear-gradient(145deg, rgba(${rgb}, 0.18), rgba(${rgb}, 0.08))`,
              boxShadow: `0 4px 12px rgba(${rgb}, 0.28), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(${rgb}, 0.15)`,
              border: `1px solid rgba(${rgb}, 0.22)`,
            }}
          >
            <span className="mission-emoji">{emoji}</span>
          </div>
          <div className="mission-card-labels">
            <span className="mission-name">{label}</span>
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
        </div>
      </div>
      <div className="mission-card-right" style={{ color: completed_today ? color : undefined }}>
        {completed_today ? '✓' : '›'}
      </div>
    </div>
  );
}
