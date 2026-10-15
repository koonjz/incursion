"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "intro" | "burst" | "exit" | "done";

type IntroLoaderProps = {
  /** Minimum time the rings run before the burst, in ms. */
  minMs?: number;
  /** sessionStorage key. The loader plays once per browser session. */
  onceKey?: string;
};

const R_PROGRESS = 100;
const C_PROGRESS = 2 * Math.PI * R_PROGRESS;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [200 + r * Math.cos(a), 200 + r * Math.sin(a)];
}
function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function statusFor(p: number) {
  if (p < 30) return "Booting scheduler";
  if (p < 60) return "Syncing venues";
  if (p < 92) return "Scanning for clashes";
  return "Radar active";
}

const CSS = `
.ir-box{transform-box:view-box;transform-origin:50% 50%}
@keyframes ir-spin{to{transform:rotate(360deg)}}
@keyframes ir-spin-rev{to{transform:rotate(-360deg)}}
@keyframes ir-in{from{opacity:0;transform:scale(.72)}to{opacity:1;transform:scale(1)}}
@keyframes ir-flare{0%{transform:scale(0);opacity:0}22%{transform:scale(1.7);opacity:1}55%{transform:scale(1.05);opacity:1}100%{transform:scale(.3);opacity:.9}}
@keyframes ir-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ir-in{animation:ir-in .8s cubic-bezier(.2,.8,.2,1) both}
.ir-d1{animation-delay:.55s}.ir-d2{animation-delay:.7s}.ir-d3{animation-delay:.85s}
.ir-d4{animation-delay:1s}.ir-d5{animation-delay:1.15s}.ir-d6{animation-delay:1.3s}
.ir-sa{animation:ir-spin 40s linear infinite}
.ir-sb{animation:ir-spin-rev 60s linear infinite}
.ir-sc{animation:ir-spin 18s linear infinite}
.ir-sd{animation:ir-spin-rev 90s linear infinite}
.ir-se{animation:ir-spin-rev 30s linear infinite}
.ir-sf{animation:ir-spin-rev 14s linear infinite}
.ir-flare{animation:ir-flare 1.7s ease-out forwards}
.ir-fade{animation:ir-fade .7s ease-out 1s both}
@media (prefers-reduced-motion: reduce){
  .ir-in,.ir-sa,.ir-sb,.ir-sc,.ir-sd,.ir-se,.ir-sf,.ir-flare,.ir-fade{animation:none}
}
`;

/**
 * Full-screen intro loader: lens flare, HUD rings that assemble and spin
 * (the inner ring fills as the page loads), then a burst into a drifting
 * network and a fade out. Plays once per browser session. Click Skip or
 * press Escape to dismiss early.
 */
export default function IntroLoader({
  minMs = 2800,
  onceKey = "acm-resolve-intro-seen",
}: IntroLoaderProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState(0);
  const phaseRef = useRef<Phase>("intro");
  const skipRef = useRef<(() => void) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const go = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  // Lifecycle: progress, phase changes, scroll lock
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(onceKey) === "1";
    } catch {
      /* ignore */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      phaseRef.current = "done";
      setPhase("done");
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const restore = () => {
      document.body.style.overflow = prevOverflow;
    };

    const timers: number[] = [];
    let raf = 0;
    let lastShown = -1;
    const t0 = performance.now();
    let loaded = document.readyState === "complete";
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener("load", onLoad);

    const finish = () => {
      try {
        sessionStorage.setItem(onceKey, "1");
      } catch {
        /* ignore */
      }
      restore();
      go("done");
    };
    const toExit = () => {
      if (phaseRef.current === "exit" || phaseRef.current === "done") return;
      go("exit");
      timers.push(window.setTimeout(finish, 650));
    };
    const toBurst = () => {
      if (phaseRef.current !== "intro") return;
      go("burst");
      timers.push(window.setTimeout(toExit, 950));
    };

    const loop = (now: number) => {
      let p = Math.min((now - t0) / minMs, 1);
      if (!loaded) p = Math.min(p, 0.92);
      const shown = Math.round(p * 100);
      if (shown !== lastShown) {
        lastShown = shown;
        setProgress(shown);
      }
      if (p >= 1 && loaded) {
        timers.push(window.setTimeout(toBurst, 250));
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    skipRef.current = () => {
      cancelAnimationFrame(raf);
      setProgress(100);
      toExit();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skipRef.current?.();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(window.clearTimeout);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("keydown", onKey);
      restore();
    };
  }, [minMs, onceKey]);

  // Network canvas: runs only during the burst and exit phases
  const active = phase === "burst" || phase === "exit";
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    const N = W < 768 ? 38 : 75;
    const LINK = W < 768 ? 110 : 150;
    const x = new Float32Array(N);
    const y = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const z = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      x[i] = Math.random() * W;
      y[i] = Math.random() * H;
      vx[i] = (Math.random() - 0.5) * 0.5;
      vy[i] = (Math.random() - 0.5) * 0.5;
      z[i] = 0.4 + Math.random() * 0.6;
    }

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const zoom = 1 + (now - start) * 0.00022;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-W / 2, -H / 2);

      for (let i = 0; i < N; i++) {
        x[i] += vx[i] * z[i];
        y[i] += vy[i] * z[i];
        if (x[i] < 0) x[i] = W;
        else if (x[i] > W) x[i] = 0;
        if (y[i] < 0) y[i] = H;
        else if (y[i] > H) y[i] = 0;
      }

      ctx.lineWidth = 0.8;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = x[i] - x[j];
          const dy = y[i] - y[j];
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(103,232,249,${(1 - d / LINK) * 0.5 * z[i]})`;
            ctx.beginPath();
            ctx.moveTo(x[i], y[i]);
            ctx.lineTo(x[j], y[j]);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(186,230,253,0.85)";
      for (let i = 0; i < N; i++) {
        ctx.beginPath();
        ctx.arc(x[i], y[i], 1.2 * z[i], 0, 6.2832);
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (phase === "done") return null;

  const burst = active;
  const status = statusFor(progress);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading ACM Resolve"
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#02050a] transition-opacity duration-[650ms] ease-out ${
        phase === "exit" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <style>{CSS}</style>

      {/* Deep blue-teal vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#06263d_0%,#03101c_45%,#02050a_80%)]" />

      {/* Network (appears during the burst) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          burst ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Lens flare */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          transform: `translate(-50%, -50%) scale(${burst ? 2.6 : 1})`,
          opacity: phase === "exit" ? 0 : 1,
          transition:
            "transform 900ms cubic-bezier(.5,0,.2,1), opacity 650ms ease-out",
        }}
      >
        <div className="ir-flare relative">
          <div
            className="size-5 rounded-full bg-white"
            style={{
              boxShadow:
                "0 0 30px 12px rgba(125,211,252,.9), 0 0 90px 40px rgba(34,211,238,.45)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-px w-[70vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        </div>
      </div>

      {/* HUD rings */}
      <div
        aria-hidden="true"
        className="relative"
        style={{
          transform: `scale(${burst ? 6 : 1})`,
          opacity: burst ? 0 : 1,
          transition:
            "transform 900ms cubic-bezier(.55,0,.25,1), opacity 800ms ease-in",
        }}
      >
        <svg
          viewBox="0 0 400 400"
          className="h-auto w-[min(78vw,26rem)]"
          fill="none"
        >
          {/* outer hairline */}
          <g className="ir-box ir-in ir-d1">
            <circle cx="200" cy="200" r="192" stroke="rgba(125,211,252,.28)" strokeWidth="1" />
          </g>

          {/* bright segmented outer ring */}
          <g className="ir-box ir-in ir-d1">
            <g className="ir-box ir-sa">
              <circle
                cx="200"
                cy="200"
                r="186"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="70 160 30 240 12 657"
                opacity=".9"
              />
            </g>
          </g>

          {/* dotted ring */}
          <g className="ir-box ir-in ir-d2">
            <g className="ir-box ir-sb">
              <circle
                cx="200"
                cy="200"
                r="170"
                stroke="rgba(186,230,253,.6)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="0.1 7"
              />
            </g>
          </g>

          {/* thick arcs */}
          <g className="ir-box ir-in ir-d3">
            <g className="ir-box ir-sc">
              <circle
                cx="200"
                cy="200"
                r="152"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeDasharray="120 90 40 60 645"
                opacity=".85"
              />
            </g>
          </g>

          {/* tick marks */}
          <g className="ir-box ir-in ir-d4">
            <g className="ir-box ir-sd">
              <circle
                cx="200"
                cy="200"
                r="132"
                stroke="rgba(125,211,252,.45)"
                strokeWidth="7"
                strokeDasharray="1.5 6.8"
              />
            </g>
          </g>

          {/* segmented bar arc */}
          <g className="ir-box ir-in ir-d5">
            <g className="ir-box ir-se">
              <path
                d={arc(118, 150, 250)}
                stroke="rgba(165,243,252,.8)"
                strokeWidth="9"
                strokeDasharray="3 3"
              />
            </g>
          </g>

          {/* inner thin spinner */}
          <g className="ir-box ir-in ir-d5">
            <g className="ir-box ir-sf">
              <circle
                cx="200"
                cy="200"
                r="84"
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="180 14 120 14 200"
                opacity=".7"
              />
            </g>
          </g>

          {/* progress ring: fills as the page loads */}
          <g className="ir-box ir-in ir-d6">
            <circle
              cx="200"
              cy="200"
              r={R_PROGRESS}
              stroke="rgba(34,211,238,.18)"
              strokeWidth="3"
            />
            <circle
              cx="200"
              cy="200"
              r={R_PROGRESS}
              stroke="#a5f3fc"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(C_PROGRESS * progress) / 100} ${C_PROGRESS}`}
              transform="rotate(-90 200 200)"
              style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,.9))" }}
            />
            <text
              x="200"
              y="212"
              textAnchor="middle"
              fill="#e0f7ff"
              fontSize="36"
              fontWeight="600"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            >
              {progress}%
            </text>
          </g>
        </svg>
      </div>

      {/* Wordmark + status */}
      <div
        className="ir-fade absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-4 text-center transition-opacity duration-500 sm:bottom-14"
        style={{ opacity: burst ? 0 : undefined }}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs tracking-[0.3em] text-cyan-300">ACM</span>
          <span className="font-display text-2xl text-white">Resolve</span>
        </div>
        <span
          key={status}
          className="animate-in fade-in font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-400 duration-300"
        >
          {status}
        </span>
      </div>

      {/* Skip */}
      <button
        type="button"
        onClick={() => skipRef.current?.()}
        className="absolute bottom-4 right-4 rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-400 transition-colors hover:border-cyan-400/40 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400 sm:bottom-6 sm:right-6"
      >
        Skip
      </button>
    </div>
  );
}