import XPBar from '../components/XPBar.jsx';
import MissionCard from '../components/MissionCard.jsx';
import BuddyAvatar from '../components/BuddyAvatar.jsx';

const QUOTES = [
  "Done is better than perfect. Start anywhere.",
  "Small steps build real momentum.",
  "You showed up. That's already a win.",
  "Progress, not perfection — one mission at a time.",
  "Every rep, every meal, every application counts.",
  "The hardest part is starting. You've got this.",
  "Consistency beats intensity every time.",
];

const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

export default function Dashboard({ missions, stats, onMissionStart }) {
  const doneTodayCount = missions.filter((m) => m.completed_today).length;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="app-title">Daily Missions</h1>
        <p className="app-subtitle">
          {doneTodayCount === 0
            ? "Ready when you are."
            : doneTodayCount === missions.length
            ? "All missions complete! 🎉"
            : `${doneTodayCount} of ${missions.length} done today`}
        </p>
      </div>
      <div className="quote-card">
        <span className="quote-mark">"</span>
        {todayQuote}
      </div>

      <XPBar xp={stats.xp} level={stats.level} levelXP={stats.levelXP} />

      <div className="missions-list">
        <p className="missions-section-label">Today's Missions</p>
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} onClick={onMissionStart} />
        ))}
      </div>

      <div className="buddy-banner">
        <BuddyAvatar size={34} bob={false} />
        <p className="buddy-banner-text">
          Donroz Mariano is with you — start any mission and I lock in for the whole session.
        </p>
      </div>
    </div>
  );
}
