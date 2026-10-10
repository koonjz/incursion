/**
 * Glossy dark backdrop: glass ribbons, a luminous dome and a copper streak,
 * drawn in SVG (no images) with slow-drifting colour orbs.
 */
export function Backdrop() {
  return (
    <div className="backdrop-art" aria-hidden="true">
      <div className="backdrop-orb backdrop-orb--a" />
      <div className="backdrop-orb backdrop-orb--b" />
      <div className="backdrop-orb backdrop-orb--c" />

      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" fill="none">
        <defs>
          <linearGradient id="bd-ribbon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1d3a8a" stopOpacity="0" />
            <stop offset="0.25" stopColor="#4f7cff" stopOpacity="0.9" />
            <stop offset="0.55" stopColor="#c9d8ff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#3b5bdb" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bd-copper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e9833a" stopOpacity="0" />
            <stop offset="0.3" stopColor="#f5a15c" stopOpacity="0.95" />
            <stop offset="0.7" stopColor="#ffd9b0" stopOpacity="0.7" />
            <stop offset="1" stopColor="#f5a15c" stopOpacity="0" />
          </linearGradient>
         <linearGradient id="bd-glass" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stopColor="#3a56e0" stopOpacity="0.2" />
  <stop offset="0.6" stopColor="#121e60" stopOpacity="0.08" />
  <stop offset="1" stopColor="#020510" stopOpacity="0" />
</linearGradient>
          <radialGradient id="bd-dome" cx="0.5" cy="0.15" r="0.9">
  <stop offset="0" stopColor="#2a46c4" stopOpacity="0.2" />
  <stop offset="0.55" stopColor="#101c60" stopOpacity="0.12" />
  <stop offset="1" stopColor="#02040c" stopOpacity="0" />
</radialGradient>
          <linearGradient id="bd-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8fa8ff" stopOpacity="0" />
            <stop offset="0.35" stopColor="#8fa8ff" stopOpacity="0.55" />
            <stop offset="0.8" stopColor="#f5a15c" stopOpacity="0.5" />
            <stop offset="1" stopColor="#f5a15c" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dome, lower right */}
        <ellipse cx="1180" cy="1010" rx="640" ry="520" fill="url(#bd-dome)" />
        <path d="M560 760 C 760 470, 1180 400, 1700 560" stroke="url(#bd-rim)" strokeWidth="2" />
        <path d="M640 800 C 840 540, 1210 470, 1700 610" stroke="url(#bd-rim)" strokeWidth="1" opacity="0.6" />

        {/* Main glass ribbon, upper left */}
        <path
          d="M-120 250 C 220 40, 640 20, 980 150 S 1480 220 1720 70"
          stroke="url(#bd-ribbon)"
          strokeWidth="46"
          strokeLinecap="round"
          opacity="0.07"
        />
        <path
          d="M-120 250 C 220 40, 640 20, 980 150 S 1480 220 1720 70"
          stroke="url(#bd-ribbon)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M-120 282 C 220 78, 650 62, 990 186 S 1470 262 1720 110"
          stroke="url(#bd-glass)"
          strokeWidth="26"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Copper streak */}
        <path
          d="M-80 205 C 240 120, 560 105, 900 190"
          stroke="url(#bd-copper)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M-80 205 C 240 120, 560 105, 900 190"
          stroke="url(#bd-copper)"
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.12"
        />

        {/* Light streaks, lower left */}
        <path d="M120 820 L 330 650" stroke="#8fa8ff" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M170 840 L 360 690" stroke="#8fa8ff" strokeOpacity="0.2" strokeWidth="1" />
        <path d="M60 790 L 270 640" stroke="#c9d8ff" strokeOpacity="0.25" strokeWidth="1" />
      </svg>

      <div className="backdrop-vignette" />
    </div>
  );
}
