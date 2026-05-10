import { useState, useEffect } from 'react';

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-install-dismissed') === '1'
  );

  useEffect(() => {
    if (isInStandaloneMode || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  useEffect(() => {
    if (isIOS && !isInStandaloneMode && !dismissed) {
      // Small delay so it doesn't pop immediately on load
      const t = setTimeout(() => setShowIOSHint(true), 2000);
      return () => clearTimeout(t);
    }
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSHint(false);
  };

  const installAndroid = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    else setDeferredPrompt(null);
  };

  // Already installed or dismissed — render nothing
  if (isInStandaloneMode || dismissed) return null;

  // Android — native install prompt available
  if (deferredPrompt) {
    return (
      <div style={styles.banner}>
        <span style={styles.icon}>📲</span>
        <span style={styles.text}>Add to your home screen for the full experience</span>
        <button style={styles.btn} onClick={installAndroid}>Install</button>
        <button style={styles.close} onClick={dismiss}>✕</button>
      </div>
    );
  }

  // iOS — no native prompt, show manual instructions
  if (showIOSHint) {
    return (
      <div style={{ ...styles.banner, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>📲 Add to Home Screen</span>
          <button style={styles.close} onClick={dismiss}>✕</button>
        </div>
        <span style={{ ...styles.text, fontSize: 13 }}>
          Tap <strong>Share</strong> <span style={{ fontSize: 16 }}>⎙</span> then <strong>Add to Home Screen</strong>
        </span>
      </div>
    );
  }

  return null;
}

const styles = {
  banner: {
    position: 'fixed',
    bottom: 72, // above tab bar
    left: 12,
    right: 12,
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    animation: 'fadeIn 0.3s ease',
  },
  icon: { fontSize: 20, flexShrink: 0 },
  text: {
    flex: 1,
    color: '#e5e5e5',
    fontSize: 14,
    lineHeight: 1.4,
  },
  btn: {
    background: '#D85A30',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '7px 14px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    flexShrink: 0,
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 6px',
    flexShrink: 0,
  },
};
