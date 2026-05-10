import { useState, useEffect, useRef, useCallback } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Exact-name matches first — macOS expressive voices are the most natural
  const exactPreferred = [
    'Rocko (English (US))',  // energetic, friendly
    'Rocko',
    'Eddy (English (US))',   // macOS Monterey+ expressive — conversational, warm
    'Eddy',                  // same voice, shorter name in some browsers
    'Reed (English (US))',   // confident, clear
    'Reed',
    'Daniel',                // classic British — warm and natural
    'Google US English',     // Chrome fallback — decent quality
    'Google UK English Male',
    'Rishi',                 // warm Indian English
    'Alex',                  // older macOS fallback
  ];

  for (const name of exactPreferred) {
    const v = voices.find((v) => v.name === name);
    if (v) return v;
  }

  // Partial-match fallback
  for (const name of exactPreferred) {
    const v = voices.find((v) => v.name.includes(name));
    if (v) return v;
  }

  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en-')) ||
    voices[0]
  );
}

export function useSpeech() {
  const [isMuted, setIsMuted] = useState(() => {
    try { return localStorage.getItem('buddy-muted') === 'true'; } catch { return false; }
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);
  const voiceRef = useRef(null);

  // Voices load asynchronously in some browsers
  useEffect(() => {
    const loadVoices = () => { voiceRef.current = pickVoice(); };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Stop any in-flight ElevenLabs audio
  const audioRef = useRef(null);

  const browserSpeak = useCallback((text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) utterance.voice = voiceRef.current;
    utterance.rate = 1.1;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text) => {
    if (!text || isMuted) return;

    // Stop anything currently playing
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('TTS unavailable');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; browserSpeak(text); };

      await audio.play();
    } catch {
      // ElevenLabs not configured or failed — fall back to browser TTS
      browserSpeak(text);
    }
  }, [isMuted, browserSpeak]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try { localStorage.setItem('buddy-muted', String(next)); } catch {}
      if (next) window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  const sttSupported = !!SpeechRecognition;

  const startListening = useCallback((onResult, onEnd) => {
    if (!SpeechRecognition || isListening) return;
    window.speechSynthesis.cancel(); // don't talk over the mic

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (const result of e.results) {
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      setInterimTranscript(interim || final);
      if (final) onResult(final.trim());
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      if (onEnd) onEnd();
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('STT error:', e.error);
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      if (onEnd) onEnd();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  return {
    speak,
    stopSpeaking,
    isMuted,
    toggleMute,
    isSpeaking,
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    sttSupported,
  };
}
