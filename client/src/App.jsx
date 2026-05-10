import { useState, useEffect } from 'react';
import { VoiceProvider, useVoice } from './context/VoiceContext.jsx';
import Dashboard from './screens/Dashboard.jsx';
import FocusTimer from './screens/FocusTimer.jsx';
import MissionComplete from './screens/MissionComplete.jsx';
import Chat from './screens/Chat.jsx';
import GreetingModal from './components/GreetingModal.jsx';
import InstallBanner from './components/InstallBanner.jsx';

export const MISSIONS = [
  {
    id: 1,
    label: 'Job hunt',
    emoji: '💼',
    duration: 45,
    xp: 150,
    color: '#D85A30',
    tip: "Break it into 3 tasks: one email, one application, one connection. You're building toward the life you want.",
  },
  {
    id: 2,
    label: 'Exercise',
    emoji: '🏋️',
    duration: 30,
    xp: 100,
    color: '#BA7517',
    tip: "Show up. That's 80% of it. The energy you build here spills into everything else.",
  },
  {
    id: 3,
    label: 'Cook a meal',
    emoji: '🍳',
    duration: 25,
    xp: 80,
    color: '#3B6D11',
    tip: 'One good meal = taking care of yourself so you can show up for the people you love.',
  },
  {
    id: 4,
    label: 'Clean & tidy',
    emoji: '🧹',
    duration: 20,
    xp: 60,
    color: '#185FA5',
    tip: 'Your space reflects your headspace. A clear environment = a clearer mind.',
  },
  {
    id: 5,
    label: 'Self care',
    emoji: '🚿',
    duration: 15,
    xp: 50,
    color: '#533AB7',
    tip: 'How you show up for yourself is how you show up for others. This one counts.',
  },
];

function AppInner() {
  const { isMuted, toggleMute, isSpeaking, stopSpeaking } = useVoice();

  const [screen, setScreen] = useState('dashboard');
  const [activeMission, setActiveMission] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [stats, setStats] = useState({ xp: 720, level: 1, levelXP: 720, missions: [] });
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    loadStats(true);
  }, []);

  async function loadStats(isInit = false) {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
      if (isInit && data.isNewDay) setShowGreeting(true);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }

  const enrichedMissions = MISSIONS.map((m) => {
    const db = stats.missions.find((d) => d.id === m.id) || {};
    return { ...m, streak: db.streak || 0, completed_today: db.completed_today || false };
  });

  const handleMissionStart = (mission) => {
    stopSpeaking();
    setActiveMission(mission);
    setScreen('focus');
  };

  const handleMissionComplete = async (missionId) => {
    const mission = MISSIONS.find((m) => m.id === missionId);
    if (!mission) return;

    let newStreak = 1;
    let xpEarned = mission.xp;

    try {
      const res = await fetch('/api/complete-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId, xpAmount: mission.xp }),
      });
      const data = await res.json();
      newStreak = data.newStreak || 1;
      if (data.alreadyDone) xpEarned = 0;
    } catch {}

    const doneCount =
      enrichedMissions.filter((m) => m.completed_today).length + (xpEarned > 0 ? 1 : 0);

    setCompletionData({ missionId, missionLabel: mission.label, xpEarned, newStreak, missionsDoneToday: doneCount });
    await loadStats();
    setScreen('complete');
  };

  const handleBackToDashboard = () => {
    stopSpeaking();
    setScreen('dashboard');
    setActiveMission(null);
    setCompletionData(null);
  };

  const handleTabChange = (tab) => {
    stopSpeaking();
    if (tab === 'buddy') setScreen('chat');
    else setScreen('dashboard');
  };

  const activeTab = screen === 'chat' ? 'buddy' : 'missions';
  const showTabBar = screen === 'dashboard' || screen === 'chat';

  return (
    <div className="app">
      <InstallBanner />
      {showGreeting && (
        <GreetingModal missions={enrichedMissions} onClose={() => setShowGreeting(false)} />
      )}

      {screen === 'focus' && activeMission && (
        <FocusTimer
          mission={activeMission}
          onComplete={handleMissionComplete}
          onBack={() => { stopSpeaking(); setScreen('dashboard'); }}
        />
      )}

      {screen === 'complete' && completionData && (
        <MissionComplete completionData={completionData} onBack={handleBackToDashboard} />
      )}

      {showTabBar && (
        <>
          <div className="screen-content">
            {screen === 'dashboard' && (
              <Dashboard missions={enrichedMissions} stats={stats} onMissionStart={handleMissionStart} />
            )}
            {screen === 'chat' && <Chat />}
          </div>
          <TabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isMuted={isMuted}
            toggleMute={toggleMute}
            isSpeaking={isSpeaking}
          />
        </>
      )}
    </div>
  );
}

function TabBar({ activeTab, onTabChange, isMuted, toggleMute, isSpeaking }) {
  return (
    <nav className="tab-bar">
      <button
        className={`tab-btn${activeTab === 'missions' ? ' active' : ''}`}
        onClick={() => onTabChange('missions')}
      >
        <span className="tab-icon">🎯</span>
        <span className="tab-label">Missions</span>
      </button>
      <button
        className={`tab-btn${activeTab === 'buddy' ? ' active' : ''}`}
        onClick={() => onTabChange('buddy')}
      >
        <span className="tab-icon">💬</span>
        <span className="tab-label">Donroz Mariano</span>
      </button>
      <button
        className={`tab-btn${isMuted ? ' muted' : ''}`}
        onClick={toggleMute}
        title={isMuted ? 'Unmute Donroz Mariano' : 'Mute Donroz Mariano'}
      >
        <span className={`tab-icon${isSpeaking && !isMuted ? ' speaking-pulse' : ''}`}>
          {isMuted ? '🔇' : '🔊'}
        </span>
        <span className="tab-label">{isMuted ? 'Muted' : 'Voice'}</span>
      </button>
    </nav>
  );
}

export default function App() {
  return (
    <VoiceProvider>
      <AppInner />
    </VoiceProvider>
  );
}
