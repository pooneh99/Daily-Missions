import { useState, useEffect, useRef } from 'react';
import BuddyAvatar from '../components/BuddyAvatar.jsx';
import ChatBubble from '../components/ChatBubble.jsx';
import TypingIndicator from '../components/TypingIndicator.jsx';
import MicButton from '../components/MicButton.jsx';
import { useVoice } from '../context/VoiceContext.jsx';

async function fetchStream(message, history, onChunk, onDone) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone(); return; }
        try {
          const { text } = JSON.parse(data);
          if (text) onChunk(text);
        } catch {}
      }
    }
  }
  onDone();
}

export default function Chat() {
  const { speak, startListening, stopListening, isListening, interimTranscript, sttSupported } = useVoice();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then(setMessages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, streamingText]);

  // Show interim transcript in the input field while listening
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInput(interimTranscript);
    }
  }, [interimTranscript, isListening]);

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim();
    if (!text || isStreamingRef.current) return;

    const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    isStreamingRef.current = true;

    let accumulated = '';
    setStreamingText('');

    try {
      await fetchStream(
        text,
        messages.slice(-30),
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
          setIsTyping(false);
        },
        () => {
          const assistantMsg = {
            role: 'assistant',
            content: accumulated,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingText('');
          setIsTyping(false);
          isStreamingRef.current = false;
          // Buddy speaks his response when it's done streaming
          speak(accumulated);
        }
      );
    } catch {
      const fallback = "Hey, having a small hiccup — but I'm still here!";
      setMessages((prev) => [...prev, { role: 'assistant', content: fallback, created_at: new Date().toISOString() }]);
      setStreamingText('');
      setIsTyping(false);
      isStreamingRef.current = false;
      speak(fallback);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      // Send whatever was captured
      if (input.trim()) handleSend(input.trim());
    } else {
      setInput('');
      startListening(
        (finalText) => {
          setInput(finalText);
        },
        () => {
          // Auto-send on speech end if there's text
          setTimeout(() => {
            setInput((current) => {
              if (current.trim()) handleSend(current.trim());
              return current;
            });
          }, 300);
        }
      );
    }
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <BuddyAvatar size={46} bob={false} />
        <div className="chat-header-info">
          <h2>Buddy</h2>
          <p>Your personal hype companion</p>
        </div>
        <div className="online-dot" />
      </div>

      <div className="chat-messages">
        {messages.length === 0 && !isTyping && (
          <div className="chat-empty">
            <p>Say hey to Buddy — he's been waiting for you.</p>
            {sttSupported && (
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-tertiary)' }}>
                Tap the mic to speak, or type below.
              </p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatBubble key={i} role={msg.role} content={msg.content} created_at={msg.created_at} />
        ))}

        {streamingText && (
          <div className="chat-bubble-wrap assistant">
            <div className="chat-bubble assistant">{streamingText}</div>
          </div>
        )}

        {isTyping && !streamingText && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-wrap">
        {sttSupported && (
          <MicButton
            isListening={isListening}
            onClick={handleMicToggle}
            disabled={isStreamingRef.current}
          />
        )}
        <textarea
          ref={inputRef}
          className={`chat-input${isListening ? ' listening-input' : ''}`}
          placeholder={isListening ? 'Listening…' : 'Talk to Buddy…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isStreamingRef.current}
          readOnly={isListening}
        />
        <button
          className="chat-send-btn"
          onClick={() => handleSend()}
          disabled={!input.trim() || isStreamingRef.current}
          aria-label="Send"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
