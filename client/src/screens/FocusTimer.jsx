import { useState, useEffect, useRef, useCallback } from 'react';
import TimerRing from '../components/TimerRing.jsx';
import CompanionBox from '../components/CompanionBox.jsx';
import { useVoice } from '../context/VoiceContext.jsx';

export default function FocusTimer({ mission, onComplete, onBack }) {
  const { id, label, emoji, duration, color, tip, streak } = mission;
  const totalSeconds = duration * 60;
  const { speak } = useVoice();

  const startTimeRef = useRef(Date.now());
  const midpointTriggeredRef = useRef(false);
  const intervalRef = useRef(null);

  const [remaining, setRemaining] = useState(totalSeconds);
  const [companionMsg, setCompanionMsg] = useState('');
  const [companionLoading, setCompanionLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  // Fetch send-off message on mount and speak it
  useEffect(() => {
    fetch('/api/mission-start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission: label, streak }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCompanionMsg(data.message);
        setCompanionLoading(false);
        speak(data.message);
      })
      .catch(() => {
        const fallback = "Let's go! Lock in and get it done.";
        setCompanionMsg(fallback);
        setCompanionLoading(false);
        speak(fallback);
      });
  }, [label, streak]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMidway = useCallback(() => {
    const mins = Math.ceil(remaining / 60);
    fetch('/api/mission-midway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mission: label, timeRemaining: mins }),
    })
      .then((r) => r.json())
      .then((data) => {
        setCompanionMsg(data.message);
        speak(data.message);
      })
      .catch(() => {
        const fallback = "Halfway there — keep going!";
        setCompanionMsg(fallback);
        speak(fallback);
      });
  }, [label, remaining, speak]);

  // Timer tick
  useEffect(() => {
    startTimeRef.current = Date.now() - (totalSeconds - remaining) * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const rem = Math.max(0, totalSeconds - elapsed);
      setRemaining(rem);

      if (!midpointTriggeredRef.current && rem <= totalSeconds / 2) {
        midpointTriggeredRef.current = true;
        fetchMidway();
      }

      if (rem === 0) {
        clearInterval(intervalRef.current);
        onComplete(id);
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckin = async () => {
    if (checkingIn) return;
    setCheckingIn(true);
    const mins = Math.ceil(remaining / 60);
    try {
      const r = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission: label, timeRemaining: mins }),
      });
      const data = await r.json();
      setCompanionMsg(data.message);
      speak(data.message);
    } catch {
      const fallback = "Still locked in with you. Keep pushing!";
      setCompanionMsg(fallback);
      speak(fallback);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleDoneEarly = () => {
    clearInterval(intervalRef.current);
    onComplete(id);
  };

  return (
    <div className="focus-screen">
      <div className="focus-header">
        <button className="back-btn" onClick={onBack} aria-label="Back">‹</button>
        <div className="focus-mission-badge">
          <span className="mission-emoji">{emoji}</span>
          <span className="focus-mission-title">{label}</span>
        </div>
      </div>

      <div className="focus-body">
        <TimerRing remaining={remaining} total={totalSeconds} color={color} />
        <CompanionBox message={companionMsg} loading={companionLoading} />

        <div className="focus-actions">
          <button className="btn-checkin" onClick={handleCheckin} disabled={checkingIn}>
            {checkingIn ? 'Checking in…' : 'Check in'}
          </button>
          <button className="btn-done-early" onClick={handleDoneEarly}>
            Done early ✓
          </button>
        </div>

        <div className="tip-card" style={{ borderLeftColor: color }}>
          <p className="tip-label">Buddy's tip</p>
          <p className="tip-text">{tip}</p>
        </div>
      </div>
    </div>
  );
}
