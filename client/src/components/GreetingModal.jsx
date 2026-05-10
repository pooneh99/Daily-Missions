import { useState, useEffect } from 'react';
import BuddyAvatar from './BuddyAvatar.jsx';
import { useVoice } from '../context/VoiceContext.jsx';

export default function GreetingModal({ missions, onClose }) {
  const { speak } = useVoice();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    speak("Welcome to another day together Razi joon, I'm excited to help you throughout today!");

    const streaks = {};
    missions.forEach((m) => {
      if (m.streak > 0) streaks[m.label] = m.streak;
    });

    fetch('/api/greeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streaks }),
    })
      .then((r) => r.json())
      .then((data) => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch(() => {
        setMessage("New day, fresh missions. Let's make it count!");
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <BuddyAvatar size={90} bob={true} />
        <h2 className="modal-greeting">Hey Razi joon! 👋</h2>
        <p className={`modal-message${loading ? ' loading' : ''}`}>
          {loading ? '\u00A0' : message}
        </p>
        <button className="modal-cta" onClick={onClose} disabled={loading}>
          {loading ? 'One sec…' : "Let's go!"}
        </button>
      </div>
    </div>
  );
}
