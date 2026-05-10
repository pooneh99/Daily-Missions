export default function XPBar({ xp, level, levelXP }) {
  const pct = Math.min(100, (levelXP / 1000) * 100);

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-header">
        <span className="xp-level-label">Level {level}</span>
        <span className="xp-value">{levelXP} / 1000 XP</span>
      </div>
      <div className="xp-track">
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
