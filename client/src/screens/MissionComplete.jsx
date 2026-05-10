import { useState, useEffect } from 'react';
import BuddyAvatar from '../components/BuddyAvatar.jsx';
import StatCard from '../components/StatCard.jsx';
import { useVoice } from '../context/VoiceContext.jsx';

export default function MissionComplete({ completionData, onBack }) {
  const { xpEarned, newStreak, missionsDoneToday, missionLabel } = completionData;
  const { speak } = useVoice();
  const [celebMsg, setCelebMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mission-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission: missionLabel, streak: newStreak, xpEarned, totalDoneToday: missionsDoneToday }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCelebMsg(data.message);
        setLoading(false);
        speak(data.message);
      })
      .catch(() => {
        const fallback = "YES! You did it — that's what I'm talking about!";
        setCelebMsg(fallback);
        setLoading(false);
        speak(fallback);
      });
  }, [missionLabel, newStreak, xpEarned, missionsDoneToday]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="complete-screen">
      <BuddyAvatar size={80} bob={true} />
      <h2 className="complete-title">Mission Complete!</h2>
      <p className="complete-subtitle">{missionLabel} ✓</p>

      <div className="stats-grid">
        <StatCard emoji="⚡" value={`+${xpEarned}`} label="XP earned" />
        <StatCard emoji="🔥" value={newStreak} label="Day streak" />
        <StatCard emoji="✅" value={missionsDoneToday} label="Done today" />
      </div>

      <div className={`celebration-msg${loading ? ' loading' : ''}`}>
        {!loading && celebMsg}
      </div>

      <button className="btn-back" onClick={onBack}>
        Back to missions
      </button>
    </div>
  );
}
