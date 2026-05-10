import BuddyAvatar from './BuddyAvatar.jsx';

export default function CompanionBox({ message, loading }) {
  return (
    <div className="companion-box">
      <BuddyAvatar size={44} bob={false} />
      <div className="speech-bubble" key={message}>
        <p className={`speech-bubble-text${loading ? ' loading' : ''}`}>
          {loading ? 'Donroz Mariano is thinking…' : message}
        </p>
      </div>
    </div>
  );
}
