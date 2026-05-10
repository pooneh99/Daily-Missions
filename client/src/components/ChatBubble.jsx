function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble({ role, content, created_at }) {
  return (
    <div className={`chat-bubble-wrap ${role}`}>
      <div className={`chat-bubble ${role}`}>{content}</div>
      {created_at && (
        <span className="chat-timestamp">{formatTime(created_at)}</span>
      )}
    </div>
  );
}
