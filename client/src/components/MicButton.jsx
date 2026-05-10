export default function MicButton({ isListening, onClick, disabled }) {
  return (
    <button
      className={`mic-btn${isListening ? ' listening' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={isListening ? 'Stop listening' : 'Speak to Buddy'}
      title={isListening ? 'Tap to stop' : 'Speak to Buddy'}
    >
      {isListening ? (
        <span className="mic-waves">
          <span /><span /><span />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 10a7 7 0 0 0 14 0" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="9" y1="22" x2="15" y2="22" />
        </svg>
      )}
    </button>
  );
}
