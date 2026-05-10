export default function BuddyAvatar({ size = 60, bob = false }) {
  return (
    <div className={`buddy-avatar${bob ? ' bob' : ''}`} style={{ width: size, height: 'auto' }}>
      <svg viewBox="0 0 100 126" xmlns="http://www.w3.org/2000/svg" width={size}>
        <rect x="26" y="106" width="48" height="22" rx="11" fill="#D85A30"/>
        <path d="M43,106 L50,115 L57,106" fill="#B84020"/>
        <rect x="42" y="100" width="16" height="10" rx="4" fill="#FDBF94"/>
        <circle cx="8" cy="71" r="9" fill="#FDBF94"/>
        <circle cx="8" cy="71" r="5" fill="#F0A87A"/>
        <circle cx="92" cy="71" r="9" fill="#FDBF94"/>
        <circle cx="92" cy="71" r="5" fill="#F0A87A"/>
        <circle cx="50" cy="67" r="43" fill="#FDBF94"/>
        <path d="M8,61 Q6,17 50,15 Q94,17 92,61 Q83,36 50,34 Q17,36 8,61Z" fill="#2C1810"/>
        <path d="M15,30 Q15,4 50,2 Q85,4 85,30 Z" fill="#1A3A6B"/>
        <rect x="37" y="17" width="26" height="9" rx="3" fill="#F5C842"/>
        <rect x="40" y="10" width="20" height="10" rx="3" fill="#F5C842"/>
        <rect x="41" y="11" width="7" height="6.5" rx="1.5" fill="#A8D8EA"/>
        <rect x="50" y="11" width="7" height="6.5" rx="1.5" fill="#A8D8EA"/>
        <circle cx="43" cy="26" r="3.5" fill="#222"/>
        <circle cx="43" cy="26" r="1.5" fill="#999"/>
        <circle cx="57" cy="26" r="3.5" fill="#222"/>
        <circle cx="57" cy="26" r="1.5" fill="#999"/>
        <rect x="62" y="19" width="2.5" height="4" rx="1" fill="#FFF5A0"/>
        <rect x="35.5" y="20" width="2.5" height="3" rx="1" fill="#FF6644"/>
        <ellipse cx="50" cy="30" rx="40" ry="6" fill="#152E58"/>
        <circle cx="50" cy="3" r="3" fill="#152E58"/>
        <circle cx="34" cy="65" r="13" fill="white"/>
        <circle cx="34" cy="66" r="9" fill="#4A7CC4"/>
        <circle cx="34" cy="66" r="5.5" fill="#18243E"/>
        <circle cx="28" cy="60" r="4" fill="white"/>
        <circle cx="39" cy="70" r="2" fill="white"/>
        <circle cx="66" cy="65" r="13" fill="white"/>
        <circle cx="66" cy="66" r="9" fill="#4A7CC4"/>
        <circle cx="66" cy="66" r="5.5" fill="#18243E"/>
        <circle cx="60" cy="60" r="4" fill="white"/>
        <circle cx="71" cy="70" r="2" fill="white"/>
        <path d="M23,52 Q34,44 45,50" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M55,50 Q66,44 77,52" stroke="#2C1810" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M45,79 Q50,84 55,79" stroke="#D8906A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M41,88 Q50,94 59,88" stroke="#C4785A" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="17" cy="82" rx="12" ry="7" fill="#F4A0A0" opacity="0.5"/>
        <ellipse cx="83" cy="82" rx="12" ry="7" fill="#F4A0A0" opacity="0.5"/>
      </svg>
    </div>
  );
}
