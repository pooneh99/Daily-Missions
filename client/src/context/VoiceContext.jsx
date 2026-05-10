import { createContext, useContext } from 'react';
import { useSpeech } from '../hooks/useSpeech.js';

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const voice = useSpeech();
  return <VoiceContext.Provider value={voice}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used inside VoiceProvider');
  return ctx;
}
