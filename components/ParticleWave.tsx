// // "use client";

// // import React, { useEffect, useRef } from "react";

// // /**
// //  * Animated Particle-Wave Background for ACM Resolve Hero.
// //  * - Single HTML5 <canvas> element (no external libraries)
// //  * - 3 flowing 3D-looking ribbons that cross each other diagonally (bottom-left to upper-right)
// //  * - Dots denser & brighter along crests; 4 to 8 thin guide lines along ribbon length
// //  * - Pre-computed typed arrays for zero GC allocation in the animation loop
// //  * - Adaptive dot counts: ~6,000–7,500 on desktop, ~1,800–2,200 on mobile (< 768px)
// //  * - Handles devicePixelRatio (capped at 2), ResizeObserver, visibilitychange, and IntersectionObserver
// //  * - Full prefers-reduced-motion support (renders a single static frame)
// //  * - pointer-events: none and aria-hidden="true" (never blocks clicks)
// //  */
// // export function ParticleWave() {
// //   const containerRef = useRef<HTMLDivElement>(null);
// //   const canvasRef = useRef<HTMLCanvasElement>(null);

// //   useEffect(() => {
// //     const canvas = canvasRef.current;
// //     const container = containerRef.current;
// //     if (!canvas || !container) return;

// //     const ctx = canvas.getContext("2d", { alpha: false });
// //     if (!ctx) return;

// //     let animFrameId = 0;
// //     let isVisible = true;
// //     let isDocumentVisible = !document.hidden;
// //     let width = 0;
// //     let height = 0;
// //     let dpr = 1;

// //     // Prefers-reduced-motion detection
// //     const prefersReducedMotion =
// //       typeof window !== "undefined" &&
// //       window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// //     // Ribbon geometry definition
// //     interface RibbonConfig {
// //       // Bezier spine control points in normalized coordinates [0..1]
// //       p0: { x: number; y: number };
// //       p1: { x: number; y: number };
// //       p2: { x: number; y: number };
// //       p3: { x: number; y: number };
// //       p4: { x: number; y: number };
// //       baseWidthRatio: number;
// //       // Harmonics
// //       freq1: number;
// //       freq2: number;
// //       speed1: number;
// //       speed2: number;
// //       amp1: number;
// //       amp2: number;
// //       phaseShift: number;
// //       guideTracks: number[]; // constant v values for hairline guide lines
// //       colorR: number;
// //       colorG: number;
// //       colorB: number;
// //       uSteps: number;
// //       vSteps: number;
// //     }

// //     // Ribbon data holding pre-allocated typed arrays for zero-alloc rendering
// //     interface RibbonBuffer {
// //       cfg: RibbonConfig;
// //       totalPoints: number;
// //       uValues: Float32Array;
// //       vValues: Float32Array;
// //       randomJitter: Float32Array;
// //       lineTrackIndices: number[][]; // indices along u for each guide track
// //     }

// //     let ribbonBuffers: RibbonBuffer[] = [];

// //     // Helper: Quartic Bezier spine point
// //     function getSpinePoint(u: number, cfg: RibbonConfig, w: number, h: number) {
// //       const omt = 1 - u;
// //       const omt2 = omt * omt;
// //       const omt3 = omt2 * omt;
// //       const u2 = u * u;
// //       const u3 = u2 * u;

// //       const b0 = omt2 * omt2;
// //       const b1 = 4 * omt3 * u;
// //       const b2 = 6 * omt2 * u2;
// //       const b3 = 4 * omt * u3;
// //       const b4 = u2 * u2;

// //       const x = (b0 * cfg.p0.x + b1 * cfg.p1.x + b2 * cfg.p2.x + b3 * cfg.p3.x + b4 * cfg.p4.x) * w;
// //       const y = (b0 * cfg.p0.y + b1 * cfg.p1.y + b2 * cfg.p2.y + b3 * cfg.p3.y + b4 * cfg.p4.y) * h;

// //       return { x, y };
// //     }

// //     // Rebuild grid buffers when canvas size or mobile breakpoint changes
// //     function buildRibbons(isMobile: boolean) {
// //       const configs: RibbonConfig[] = [
// //         // Ribbon 1: Main sweeping diagonal ribbon (cyan #22d3ee)
// //         {
// //           p0: { x: -0.06, y: 0.98 },
// //           p1: { x: 0.25, y: 0.91 },
// //           p2: { x: 0.52, y: 0.71 },
// //           p3: { x: 0.76, y: 0.41 },
// //           p4: { x: 1.05, y: -0.04 },
// //           baseWidthRatio: isMobile ? 0.28 : 0.23,
// //           freq1: 4.8,
// //           freq2: 2.5,
// //           speed1: 0.32,
// //           speed2: 0.22,
// //           amp1: isMobile ? 22 : 34,
// //           amp2: isMobile ? 12 : 18,
// //           phaseShift: 0,
// //           guideTracks: isMobile ? [-0.65, 0.0, 0.65] : [-0.8, -0.4, 0.0, 0.4, 0.8],
// //           colorR: 34,
// //           colorG: 211,
// //           colorB: 238, // Cyan
// //           uSteps: isMobile ? 60 : 115,
// //           vSteps: isMobile ? 18 : 32, // 60*18 = 1080 mobile, 115*32 = 3680 desktop
// //         },
// //         // Ribbon 2: Crossing ribbon (teal #2dd4bf) weaving in and out
// //         {
// //           p0: { x: 0.05, y: 1.04 },
// //           p1: { x: 0.32, y: 0.84 },
// //           p2: { x: 0.58, y: 0.62 },
// //           p3: { x: 0.82, y: 0.32 },
// //           p4: { x: 1.08, y: 0.08 },
// //           baseWidthRatio: isMobile ? 0.22 : 0.18,
// //           freq1: 3.6,
// //           freq2: 4.8,
// //           speed1: -0.26,
// //           speed2: 0.34,
// //           amp1: isMobile ? 18 : 28,
// //           amp2: isMobile ? 10 : 15,
// //           phaseShift: 1.5,
// //           guideTracks: isMobile ? [-0.5, 0.5] : [-0.6, 0.0, 0.6],
// //           colorR: 45,
// //           colorG: 212,
// //           colorB: 191, // Teal
// //           uSteps: isMobile ? 45 : 90,
// //           vSteps: isMobile ? 14 : 24, // 45*14 = 630 mobile, 90*24 = 2160 desktop
// //         },
// //         // Ribbon 3: Delicate sky-blue accent echo (#38bdf8)
// //         {
// //           p0: { x: -0.02, y: 0.94 },
// //           p1: { x: 0.28, y: 0.88 },
// //           p2: { x: 0.48, y: 0.64 },
// //           p3: { x: 0.72, y: 0.36 },
// //           p4: { x: 0.98, y: -0.02 },
// //           baseWidthRatio: isMobile ? 0.16 : 0.13,
// //           freq1: 5.4,
// //           freq2: 3.2,
// //           speed1: 0.28,
// //           speed2: -0.2,
// //           amp1: isMobile ? 14 : 20,
// //           amp2: isMobile ? 8 : 12,
// //           phaseShift: 3.14,
// //           guideTracks: [-0.4, 0.4],
// //           colorR: 56,
// //           colorG: 189,
// //           colorB: 248, // Sky Blue
// //           uSteps: isMobile ? 35 : 70,
// //           vSteps: isMobile ? 10 : 16, // 35*10 = 350 mobile, 70*16 = 1120 desktop
// //         },
// //       ];

// //       ribbonBuffers = configs.map((cfg) => {
// //         const totalPoints = (cfg.uSteps + 1) * (cfg.vSteps + 1);
// //         const uValues = new Float32Array(totalPoints);
// //         const vValues = new Float32Array(totalPoints);
// //         const randomJitter = new Float32Array(totalPoints);

// //         let idx = 0;
// //         for (let i = 0; i <= cfg.uSteps; i++) {
// //           const u = i / cfg.uSteps;
// //           for (let j = 0; j <= cfg.vSteps; j++) {
// //             const v = (j / cfg.vSteps - 0.5) * 2; // -1 to 1
// //             uValues[idx] = u;
// //             vValues[idx] = v;
// //             // Deterministic pseudo-random number for jitter
// //             const dot = i * 12.9898 + j * 78.233;
// //             randomJitter[idx] = (Math.sin(dot) * 43758.5453) % 1;
// //             idx++;
// //           }
// //         }

// //         return {
// //           cfg,
// //           totalPoints,
// //           uValues,
// //           vValues,
// //           randomJitter,
// //           lineTrackIndices: cfg.guideTracks.map(() => []),
// //         };
// //       });
// //     }

// //     let lastIsMobile: boolean | null = null;

// //     function resize() {
// //       if (!container || !canvas) return;
// //       const rect = container.getBoundingClientRect();
// //       width = Math.floor(rect.width);
// //       height = Math.floor(rect.height);
// //       dpr = Math.min(window.devicePixelRatio || 1, 2);

// //       canvas.width = Math.floor(width * dpr);
// //       canvas.height = Math.floor(height * dpr);
// //       canvas.style.width = `${width}px`;
// //       canvas.style.height = `${height}px`;

// //       ctx!.scale(dpr, dpr);

// //       const isMobile = width < 768;
// //       if (lastIsMobile !== isMobile) {
// //         lastIsMobile = isMobile;
// //         buildRibbons(isMobile);
// //       }
// //     }

// //     resize();
// //     const ro = new ResizeObserver(() => {
// //       resize();
// //       if (prefersReducedMotion) render(0);
// //     });
// //     ro.observe(container);

// //     // Pause animation when hero is scrolled out of viewport
// //     const io = new IntersectionObserver(
// //       (entries) => {
// //         const entry = entries[0];
// //         isVisible = entry.isIntersecting;
// //         if (isVisible && isDocumentVisible && !prefersReducedMotion && !animFrameId) {
// //           lastTimestamp = performance.now();
// //           tick(lastTimestamp);
// //         }
// //       },
// //       { threshold: 0.05 }
// //     );
// //     io.observe(container);

// //     // Pause animation when browser tab is inactive
// //     const handleVisibility = () => {
// //       isDocumentVisible = !document.hidden;
// //       if (isVisible && isDocumentVisible && !prefersReducedMotion && !animFrameId) {
// //         lastTimestamp = performance.now();
// //         tick(lastTimestamp);
// //       }
// //     };
// //     document.addEventListener("visibilitychange", handleVisibility);

// //     let lastTimestamp = performance.now();
// //     let accumulatedTime = 0;

// //     // RENDER FRAME (Strictly zero object allocations inside loop)
// //     function render(timeSec: number) {
// //       if (!ctx || width === 0 || height === 0) return;

// //       // 1. Clear background to dark canvas base (#020408)
// //       ctx.fillStyle = "#020408";
// //       ctx.fillRect(0, 0, width, height);

// //       // 2. Render each flowing ribbon
// //       for (let r = 0; r < ribbonBuffers.length; r++) {
// //         const buffer = ribbonBuffers[r];
// //         const cfg = buffer.cfg;
// //         const total = buffer.totalPoints;
// //         const uArr = buffer.uValues;
// //         const vArr = buffer.vValues;
// //         const rJitter = buffer.randomJitter;

// //         const maxRibbonWidth = Math.min(width * cfg.baseWidthRatio, 300);

// //         // Guide line tracking coordinates along length
// //         // We reuse an array of points per track
// //         const trackCount = cfg.guideTracks.length;
// //         const tracksX: number[][] = [];
// //         const tracksY: number[][] = [];
// //         for (let t = 0; t < trackCount; t++) {
// //           tracksX[t] = [];
// //           tracksY[t] = [];
// //         }

// //         // Loop through precomputed points
// //         for (let idx = 0; idx < total; idx++) {
// //           const u = uArr[idx];
// //           const v = vArr[idx];
// //           const pr = rJitter[idx];

// //           // Compute spline point and tangent for normal
// //           const spine = getSpinePoint(u, cfg, width, height);
// //           const eps = 0.005;
// //           const sNext = getSpinePoint(Math.min(1, u + eps), cfg, width, height);
// //           const sPrev = getSpinePoint(Math.max(0, u - eps), cfg, width, height);
// //           const tx = sNext.x - sPrev.x;
// //           const ty = sNext.y - sPrev.y;
// //           const tLen = Math.hypot(tx, ty) || 1;
// //           const nx = -ty / tLen;
// //           const ny = tx / tLen;

// //           // Ribbon width pinch & twist: narrows at tips, widens in middle, undulates slowly
// //           const widthPinch = (0.65 + 0.55 * Math.sin(u * Math.PI)) * (0.85 + 0.15 * Math.cos(u * 3 - timeSec * 0.2 + cfg.phaseShift));
// //           const currentWidth = maxRibbonWidth * widthPinch;

// //           // Wave displacement along normal & depth
// //           const wave1 = Math.sin(u * cfg.freq1 + timeSec * cfg.speed1 + v * 1.5 + cfg.phaseShift) * cfg.amp1;
// //           const wave2 = Math.cos(u * cfg.freq2 - timeSec * cfg.speed2) * cfg.amp2;
// //           const crossWave = Math.sin(v * 3.2 - timeSec * 0.25 + u * 2.5) * 8;
// //           const totalDisp = (wave1 + wave2 + crossWave) * (1 - Math.abs(v) * 0.35);

// //           // Simulated 3D depth value z: affects dot radius and brightness
// //           const fakeZ = (wave1 + wave2) / (cfg.amp1 + cfg.amp2); // -1 to 1

// //           // Particle position
// //           const jitterX = (pr - 0.5) * 3;
// //           const jitterY = (pr * 1.7 % 1 - 0.5) * 3;
// //           const px = spine.x + nx * (v * currentWidth * 0.5 + totalDisp) + jitterX;
// //           const py = spine.y + ny * (v * currentWidth * 0.5 + totalDisp) + jitterY;

// //           // Natural fading:
// //           // - Denser & brighter along crest (v = 0), fading toward ribbon edges
// //           // - Fade smoothly at start and end of screen (u = 0, u = 1)
// //           const edgeFadeU = Math.sin(u * Math.PI);
// //           const edgeFadeV = Math.max(0, 1 - Math.pow(v, 2) * 0.7);
// //           const depthShade = 0.75 + 0.25 * fakeZ;
// //           const breath = 0.85 + 0.15 * Math.sin(u * 6 + timeSec * 0.6 + v * 2 + cfg.phaseShift);

// //           const alpha = edgeFadeU * edgeFadeV * depthShade * breath * 0.75;

// //           if (alpha > 0.02) {
// //             // Dot radius: 0.4px to 1.4px varied with depth & jitter
// //             const dotRadius = Math.max(0.4, Math.min(1.4, (0.65 + Math.abs(pr) * 0.55) * (1 + 0.2 * fakeZ)));

// //             // Color variation: luminous white-cyan on crest highlights
// //             let cr = cfg.colorR;
// //             let cg = cfg.colorG;
// //             let cb = cfg.colorB;
// //             if (pr > 0.88 && Math.abs(v) < 0.35) {
// //               cr = 224; cg = 250; cb = 255; // White-cyan spark
// //             }

// //             ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
// //             // Drawing rectangular sub-pixels is fast and crisp
// //             ctx.fillRect(px - dotRadius, py - dotRadius, dotRadius * 2, dotRadius * 2);
// //           }

// //           // Check if this point lies along one of the guide tracks
// //           for (let t = 0; t < trackCount; t++) {
// //             const trackV = cfg.guideTracks[t];
// //             const vStep = 2 / cfg.vSteps;
// //             if (Math.abs(v - trackV) < vStep * 0.55) {
// //               tracksX[t].push(spine.x + nx * (trackV * currentWidth * 0.5 + totalDisp));
// //               tracksY[t].push(spine.y + ny * (trackV * currentWidth * 0.5 + totalDisp));
// //             }
// //           }
// //         }

// //         // Draw thin guide lines along constant-v curves
// //         for (let t = 0; t < trackCount; t++) {
// //           const xs = tracksX[t];
// //           const ys = tracksY[t];
// //           if (xs.length < 2) continue;

// //           const trackV = cfg.guideTracks[t];
// //           const lineAlpha = (0.16 + 0.18 * (1 - Math.abs(trackV))) * (0.85 + 0.15 * Math.sin(timeSec * 0.5 + t));

// //           ctx.beginPath();
// //           ctx.moveTo(xs[0], ys[0]);
// //           for (let p = 1; p < xs.length; p++) {
// //             ctx.lineTo(xs[p], ys[p]);
// //           }
// //           ctx.strokeStyle = `rgba(${cfg.colorR}, ${cfg.colorG}, ${cfg.colorB}, ${lineAlpha.toFixed(3)})`;
// //           ctx.lineWidth = 0.85;
// //           ctx.stroke();
// //         }
// //       }

// //       // 3. Ambient overlays so text contrast is pristine
// //       // Left-side vignette (dims behind headline and body text)
// //       const leftVignette = ctx.createLinearGradient(0, 0, width * 0.58, 0);
// //       leftVignette.addColorStop(0, "rgba(2, 4, 8, 0.72)");
// //       leftVignette.addColorStop(0.65, "rgba(2, 4, 8, 0.3)");
// //       leftVignette.addColorStop(1, "rgba(2, 4, 8, 0)");
// //       ctx.fillStyle = leftVignette;
// //       ctx.fillRect(0, 0, width * 0.65, height);

// //       // Bottom fade into page background (#07090e)
// //       const bottomFade = ctx.createLinearGradient(0, height * 0.74, 0, height);
// //       bottomFade.addColorStop(0, "rgba(7, 9, 14, 0)");
// //       bottomFade.addColorStop(0.65, "rgba(7, 9, 14, 0.55)");
// //       bottomFade.addColorStop(1, "rgba(7, 9, 14, 1)");
// //       ctx.fillStyle = bottomFade;
// //       ctx.fillRect(0, height * 0.72, width, height * 0.28);
// //     }

// //     function tick(timestamp: number) {
// //       if (!isVisible || !isDocumentVisible) {
// //         animFrameId = 0;
// //         return;
// //       }

// //       // Delta time calculation for smooth frame-rate independent motion
// //       const deltaMs = Math.min(timestamp - lastTimestamp, 100);
// //       lastTimestamp = timestamp;
// //       accumulatedTime += deltaMs / 1000;

// //       render(accumulatedTime);
// //       animFrameId = requestAnimationFrame(tick);
// //     }

// //     if (prefersReducedMotion) {
// //       render(0);
// //     } else {
// //       animFrameId = requestAnimationFrame(tick);
// //     }

// //     return () => {
// //       cancelAnimationFrame(animFrameId);
// //       ro.disconnect();
// //       io.disconnect();
// //       document.removeEventListener("visibilitychange", handleVisibility);
// //     };
// //   }, []);

// //   return (
// //     <div
// //       ref={containerRef}
// //       aria-hidden="true"
// //       role="presentation"
// //       className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
// //     >
// //       <canvas
// //         ref={canvasRef}
// //         className="block size-full"
// //         style={{ pointerEvents: "none" }}
// //       />
// //     </div>
// //   );
// // }

// "use client";

// import { useEffect, useRef } from "react";

// type ParticleWaveProps = {
//   /** Extra classes for the <canvas>. Default positions it behind content. */
//   className?: string;
//   /** Overall brightness multiplier. 1 = default, lower = subtler. */
//   intensity?: number;
// };

// type Ribbon = {
//   phase: number;
//   yShift: number;
//   widthScale: number;
//   speed: number;
//   c1: string;
//   c2: string;
//   seed: Float32Array;
// };

// const CYAN = "#22d3ee";
// const TEAL = "#2dd4bf";
// const BLUE = "#38bdf8";

// const RIBBON_PRESETS = [
//   { phase: 0, yShift: 0, widthScale: 1, speed: 1, c1: CYAN, c2: TEAL },
//   { phase: 2.1, yShift: 0.02, widthScale: 0.8, speed: 0.85, c1: TEAL, c2: CYAN },
//   { phase: 4.2, yShift: -0.03, widthScale: 0.6, speed: 1.15, c1: BLUE, c2: CYAN },
// ];

// const LINE_COUNT = 5;

// export default function ParticleWave({
//   className = "absolute inset-0 -z-10 h-full w-full pointer-events-none",
//   intensity = 1,
// }: ParticleWaveProps) {
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
//     let reduced = reduceMQ.matches;

//     let W = 0;
//     let H = 0;
//     let dpr = 1;
//     let mobile = false;
//     let nu = 0;
//     let nv = 0;
//     let ribbons: Ribbon[] = [];

//     // Per-column scratch buffers (reused every frame, no allocation in the loop)
//     let cx = new Float32Array(0);
//     let cy = new Float32Array(0);
//     let nx = new Float32Array(0);
//     let ny = new Float32Array(0);
//     let hw = new Float32Array(0);
//     let fo = new Float32Array(0);
//     let tw = new Float32Array(0);

//     let px = 0;
//     let py = 0;

//     let raf = 0;
//     let last = 0;
//     let t = 12; // start offset so the first static frame looks good
//     let running = false;
//     let pageVisible = !document.hidden;
//     let inView = true;

//     const clamp = (v: number, a: number, b: number) =>
//       v < a ? a : v > b ? b : v;

//     const build = () => {
//       mobile = W < 768;
//       nu = mobile ? 60 : 120;
//       nv = mobile ? 18 : 34;
//       const count = mobile ? 2 : 3;

//       cx = new Float32Array(nu);
//       cy = new Float32Array(nu);
//       nx = new Float32Array(nu);
//       ny = new Float32Array(nu);
//       hw = new Float32Array(nu);
//       fo = new Float32Array(nu);
//       tw = new Float32Array(nu);

//       ribbons = RIBBON_PRESETS.slice(0, count).map((p) => {
//         const seed = new Float32Array(nu * nv);
//         for (let i = 0; i < seed.length; i++) seed[i] = Math.random();
//         return { ...p, seed };
//       });
//     };

//     const measure = () => {
//       const rect = canvas.getBoundingClientRect();
//       W = Math.max(1, Math.floor(rect.width));
//       H = Math.max(1, Math.floor(rect.height));
//       dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2);
//       canvas.width = Math.floor(W * dpr);
//       canvas.height = Math.floor(H * dpr);
//       build();
//     };

//     // Compute the position of column i at cross-ribbon offset v (-1..1)
//     const place = (i: number, v: number, tt: number, r: Ribbon) => {
//       const off = v * hw[i] * fo[i];
//       const ripple =
//         Math.sin(v * 2.2 + i * 0.045 + tt * 0.5 + r.phase) * hw[i] * 0.1;
//       px = cx[i] + nx[i] * off;
//       py = cy[i] + ny[i] * off + ripple;
//     };

//     const render = () => {
//       ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//       ctx.globalAlpha = 1;
//       ctx.clearRect(0, 0, W, H);

//       const S = (W + H) / 2;
//       const k = intensity * (mobile ? 0.7 : 1);

//       for (let ri = 0; ri < ribbons.length; ri++) {
//         const r = ribbons[ri];
//         const tt = t * r.speed;

//         // 1) Centre line positions for every column
//         for (let i = 0; i < nu; i++) {
//           const u = i / (nu - 1);
//           const yBase = 0.92 - 0.82 * Math.pow(u, 1.7) + r.yShift;
//           const yWave =
//             0.035 * Math.sin(u * 5 + tt * 0.35 + r.phase) +
//             0.02 * Math.sin(u * 9 - tt * 0.25 + r.phase * 1.7);
//           cx[i] = (-0.05 + 1.1 * u) * W;
//           cy[i] = (yBase + yWave) * H;
//           hw[i] =
//             S *
//             0.12 *
//             r.widthScale *
//             (0.6 + 0.25 * Math.sin(u * 3.2 + tt * 0.2 + r.phase)) *
//             (0.4 + 0.9 * u);
//           const twist = Math.cos(u * 3.4 + tt * 0.28 + r.phase * 1.3);
//           tw[i] = twist;
//           fo[i] = 0.18 + 0.82 * Math.abs(twist);
//         }

//         // 2) Normals from neighbouring columns (points to the upper-left side)
//         for (let i = 0; i < nu; i++) {
//           const a = i === 0 ? 0 : i - 1;
//           const b = i === nu - 1 ? nu - 1 : i + 1;
//           const tx = cx[b] - cx[a];
//           const ty = cy[b] - cy[a];
//           const len = Math.hypot(tx, ty) || 1;
//           nx[i] = ty / len;
//           ny[i] = -tx / len;
//         }

//         // 3) Thin guide lines running along the ribbon
//         ctx.lineWidth = 0.7;
//         ctx.lineJoin = "round";
//         for (let l = 0; l < LINE_COUNT; l++) {
//           const base = -0.85 + (1.7 * l) / (LINE_COUNT - 1);
//           const v = base + 0.05 * Math.sin(tt * 0.4 + l);
//           const edge = Math.pow((v + 1) / 2, 1.6);
//           ctx.strokeStyle = l % 2 ? r.c1 : r.c2;
//           ctx.globalAlpha = (0.1 + 0.28 * edge) * k;
//           ctx.beginPath();
//           for (let i = 0; i < nu; i++) {
//             place(i, v, tt, r);
//             if (i === 0) ctx.moveTo(px, py);
//             else ctx.lineTo(px, py);
//           }
//           ctx.stroke();
//         }

//         // 4) Dots across the ribbon surface
//         for (let j = 0; j < nv; j++) {
//           const v = -1 + (2 * j) / (nv - 1);
//           const edge = Math.pow((v + 1) / 2, 2.2); // brighter crest on v = +1
//           const core = 1 - Math.abs(v);
//           ctx.fillStyle = j % 2 ? r.c1 : r.c2;

//           for (let i = 0; i < nu; i++) {
//             place(i, v, tt, r);
//             const jitter = r.seed[j * nu + i];
//             const d = 0.5 + 0.5 * tw[i] * v; // fake depth 0..1
//             const u = i / (nu - 1);
//             const breathe = 0.85 + 0.15 * Math.sin(tt * 0.6 + u * 3 + r.phase);
//             const mask = clamp((px / W + py / H - 0.35) * 2, 0.1, 1);

//             const a =
//               (0.12 + 0.55 * edge + 0.2 * core) *
//               (0.45 + 0.55 * d) *
//               (0.6 + 0.4 * jitter) *
//               breathe *
//               mask *
//               k;
//             if (a < 0.02) continue;

//             const s = 0.5 + 0.9 * d * (0.5 + 0.5 * jitter) + edge * 0.3;
//             ctx.globalAlpha = a > 1 ? 1 : a;
//             ctx.fillRect(px - s / 2, py - s / 2, s, s);
//           }
//         }
//       }

//       ctx.globalAlpha = 1;
//     };

//     const loop = (now: number) => {
//       raf = requestAnimationFrame(loop);
//       const dt = Math.min((now - last) / 1000, 0.05);
//       last = now;
//       t += dt;
//       render();
//     };

//     const start = () => {
//       if (running || reduced || !pageVisible || !inView) return;
//       running = true;
//       last = performance.now();
//       raf = requestAnimationFrame(loop);
//     };

//     const stop = () => {
//       if (!running) return;
//       running = false;
//       cancelAnimationFrame(raf);
//     };

//     measure();
//     render();
//     start();

//     const ro = new ResizeObserver(() => {
//       measure();
//       render();
//     });
//     ro.observe(canvas);

//     const io = new IntersectionObserver(
//       (entries) => {
//         inView = entries[0]?.isIntersecting ?? true;
//         if (inView) start();
//         else stop();
//       },
//       { threshold: 0 }
//     );
//     io.observe(canvas);

//     const onVisibility = () => {
//       pageVisible = !document.hidden;
//       if (pageVisible) start();
//       else stop();
//     };
//     document.addEventListener("visibilitychange", onVisibility);

//     const onReduceChange = (e: MediaQueryListEvent) => {
//       reduced = e.matches;
//       if (reduced) {
//         stop();
//         render();
//       } else {
//         start();
//       }
//     };
//     reduceMQ.addEventListener("change", onReduceChange);

//     return () => {
//       stop();
//       ro.disconnect();
//       io.disconnect();
//       document.removeEventListener("visibilitychange", onVisibility);
//       reduceMQ.removeEventListener("change", onReduceChange);
//     };
//   }, [intensity]);

//   return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
// }

"use client";

import { useEffect, useRef } from "react";

type ParticleWaveProps = {
  /** Brightness multiplier. 1 = default, lower = subtler. */
  intensity?: number;
  /** How many drifting bubbles to emit. 0 turns them off. Default 1. */
  bubbles?: number;
  /** Override the size / position classes if you want. */
  className?: string;
};

const CYAN = "#22d3ee";
const TEAL = "#2dd4bf";
const SKY = "#38bdf8";

const RIBBONS = [
  { phase: 0, shift: 0, width: 1, speed: 1, alpha: 1, c1: CYAN, c2: TEAL },
  { phase: 2.1, shift: -0.08, width: 0.8, speed: 0.85, alpha: 0.75, c1: TEAL, c2: CYAN },
  { phase: 4.2, shift: 0.07, width: 0.6, speed: 1.15, alpha: 0.6, c1: SKY, c2: CYAN },
];

const LINES = [-0.85, -0.45, -0.05, 0.35, 0.7, 1.0];

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Thin vertical particle-wave ribbon on the RIGHT edge of the screen.
 * Small bubble-like dots peel off the ribbon and slowly drift to the left,
 * fading as they go. Mount once in app/layout.tsx. Never blocks clicks.
 */
export default function ParticleWave({
  intensity = 1,
  bubbles = 1,
  className = "pointer-events-none fixed right-0 top-0 z-[5] h-[100dvh] w-[min(75vw,1000px)]",
}: ParticleWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMQ.matches;

    let W = 0;
    let H = 0;
    let RW = 160; // width of the ribbon itself (the rest of the canvas is for drifting bubbles)
    let dpr = 1;
    let nu = 0;
    let nv = 0;
    let seeds: Float32Array[] = [];

    let cx = new Float32Array(0);
    let cy = new Float32Array(0);
    let nx = new Float32Array(0);
    let ny = new Float32Array(0);
    let hw = new Float32Array(0);
    let fo = new Float32Array(0);
    let tw = new Float32Array(0);

    // Bubble pool
    let nb = 0;
    let bx = new Float32Array(0);
    let by = new Float32Array(0);
    let bvx = new Float32Array(0);
    let bvy = new Float32Array(0);
    let bsz = new Float32Array(0);
    let blife = new Float32Array(0);
    let bmax = new Float32Array(0);
    let bph = new Float32Array(0);
    let bring = new Uint8Array(0);
    let needInit = true;

    let px = 0;
    let py = 0;
    let raf = 0;
    let last = 0;
    let dtFrame = 0;
    let t = 8;
    let running = false;
    let pageVisible = !document.hidden;
    let scrollTarget = window.scrollY;
    let scrollSmooth = scrollTarget;

    const build = () => {
      const w = window.innerWidth;
      const small = w < 768;
      RW = w < 640 ? 80 : w < 768 ? 120 : 160;
      nu = small ? 70 : 110;
      nv = small ? 12 : 18;
      cx = new Float32Array(nu);
      cy = new Float32Array(nu);
      nx = new Float32Array(nu);
      ny = new Float32Array(nu);
      hw = new Float32Array(nu);
      fo = new Float32Array(nu);
      tw = new Float32Array(nu);
      seeds = RIBBONS.map((_, idx) => {
        const rand = mulberry32(900 + idx * 53);
        const s = new Float32Array(nu * nv);
        for (let i = 0; i < s.length; i++) s[i] = rand();
        return s;
      });

      nb = Math.round((small ? 26 : 60) * Math.max(0, bubbles));
      bx = new Float32Array(nb);
      by = new Float32Array(nb);
      bvx = new Float32Array(nb);
      bvy = new Float32Array(nb);
      bsz = new Float32Array(nb);
      blife = new Float32Array(nb);
      bmax = new Float32Array(nb);
      bph = new Float32Array(nb);
      bring = new Uint8Array(nb);
      needInit = true;
    };

    const measure = (force = false) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      if (!force && Math.abs(w - W) < 1 && Math.abs(h - H) < 120) return false;
      W = w;
      H = h;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      build();
      return true;
    };

    const place = (i: number, v: number, tt: number, phase: number) => {
      const off = v * hw[i] * fo[i];
      const ripple = Math.sin(v * 2.2 + i * 0.05 + tt * 0.5 + phase) * hw[i] * 0.1;
      px = cx[i] + nx[i] * off + ripple;
      py = cy[i] + ny[i] * off;
    };

    // Put bubble n on the ribbon surface (biased toward the bright outer edge)
    const spawn = (n: number) => {
      const y = Math.random() * H;
      const i = Math.max(0, Math.min(nu - 1, Math.round((y / H) * (nu - 1))));
      const v = -0.3 + Math.random() * 1.3;
      const off = v * hw[i] * fo[i];
      bx[n] = cx[i] + nx[i] * off;
      by[n] = cy[i] + ny[i] * off;
      bvx[n] = -(12 + Math.random() * 34); // px per second, drifting left
      bvy[n] = (Math.random() - 0.5) * 6;
      bsz[n] = 0.7 + Math.random() * 1.5;
      blife[n] = 0;
      bmax[n] = 7 + Math.random() * 9;
      bph[n] = Math.random() * 6.28;
      bring[n] = Math.random() < 0.15 ? 1 : 0;
    };

    const updateBubbles = () => {
      for (let n = 0; n < nb; n++) {
        if (needInit) {
          spawn(n);
          // Start mid-flight so the first frame already looks populated
          const age = Math.random() * bmax[n];
          blife[n] = age;
          bx[n] += bvx[n] * age;
          continue;
        }
        blife[n] += dtFrame;
        if (blife[n] >= bmax[n]) {
          spawn(n);
          continue;
        }
        bx[n] += bvx[n] * dtFrame;
        by[n] += (bvy[n] + Math.sin(t * 0.7 + bph[n]) * 7) * dtFrame;
      }
      needInit = false;
    };

    const drawBubbles = (k: number) => {
      for (let n = 0; n < nb; n++) {
        const lf = blife[n] / bmax[n];
        // Soft fade in and out
        const env = Math.pow(Math.sin(Math.PI * lf), 0.9);
        const a = env * 0.75 * k;
        if (a < 0.03 || bx[n] < -10) continue;
        ctx.globalAlpha = a > 1 ? 1 : a;
        if (bring[n]) {
          ctx.strokeStyle = n % 2 ? CYAN : TEAL;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.arc(bx[n], by[n], bsz[n] * 2.2, 0, 6.2832);
          ctx.stroke();
          ctx.globalAlpha = (a > 1 ? 1 : a) * 0.6;
        }
        ctx.fillStyle = n % 3 === 0 ? SKY : n % 2 ? CYAN : TEAL;
        ctx.beginPath();
        ctx.arc(bx[n], by[n], bsz[n], 0, 6.2832);
        ctx.fill();
      }
    };

    const render = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      const sway = 0.04 * Math.sin(scrollSmooth * 0.0006);
      const flow = scrollSmooth * 0.0009;
      const k = intensity * (RW < 100 ? 0.8 : 1);
      const x0 = W - RW; // left edge of the ribbon zone

      for (let ri = 0; ri < RIBBONS.length; ri++) {
        const r = RIBBONS[ri];
        const seed = seeds[ri];
        const tt = t * r.speed + flow * (1 + ri * 0.2);
        const rk = k * r.alpha;

        for (let i = 0; i < nu; i++) {
          const u = i / (nu - 1);
          const xFrac =
            0.68 -
            0.18 * u +
            r.shift +
            sway +
            0.07 * Math.sin(u * 5 + tt * 0.35 + r.phase) +
            0.04 * Math.sin(u * 9 - tt * 0.25 + r.phase * 1.7);
          cx[i] = x0 + xFrac * RW;
          cy[i] = u * H;
          hw[i] =
            RW * 0.2 * r.width * (0.65 + 0.3 * Math.sin(u * 6 + tt * 0.2 + r.phase));
          const twist = Math.cos(u * 6 + tt * 0.28 + r.phase * 1.3);
          tw[i] = twist;
          fo[i] = 0.2 + 0.8 * Math.abs(twist);
        }

        for (let i = 0; i < nu; i++) {
          const a = i === 0 ? 0 : i - 1;
          const b = i === nu - 1 ? nu - 1 : i + 1;
          const tx = cx[b] - cx[a];
          const ty = cy[b] - cy[a];
          const len = Math.hypot(tx, ty) || 1;
          nx[i] = ty / len;
          ny[i] = -tx / len;
        }

        // Bubbles are emitted from the main ribbon's current shape
        if (ri === 0 && nb > 0) updateBubbles();

        ctx.lineJoin = "round";
        for (let l = 0; l < LINES.length; l++) {
          const v = LINES[l] + 0.04 * Math.sin(tt * 0.4 + l);
          const crest = l === LINES.length - 1;
          const edge = Math.pow((v + 1) / 2, 1.6);
          ctx.lineWidth = crest ? 0.9 : 0.6;
          ctx.strokeStyle = l % 2 ? r.c1 : r.c2;
          ctx.globalAlpha = Math.min(1, (0.14 + 0.32 * edge + (crest ? 0.14 : 0)) * rk);
          ctx.beginPath();
          for (let i = 0; i < nu; i++) {
            place(i, v, tt, r.phase);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        for (let j = 0; j < nv; j++) {
          const vBase = -1 + (2 * j) / (nv - 1);
          const core = 1 - Math.abs(vBase);
          ctx.fillStyle = j % 2 ? r.c1 : r.c2;

          for (let i = 0; i < nu; i++) {
            const jitter = seed[j * nu + i];
            // Slight scatter so the dots read as particles, not a rigid grid
            const v = vBase + (jitter - 0.5) * (2 / nv) * 0.9;
            const edge = Math.pow((Math.max(-1, Math.min(1, v)) + 1) / 2, 2.2);
            place(i, v, tt, r.phase);
            const d = 0.5 + 0.5 * tw[i] * v;
            const u = i / (nu - 1);
            const breathe = 0.85 + 0.15 * Math.sin(tt * 0.6 + u * 3 + r.phase);
            const a =
              (0.2 + 0.6 * edge + 0.2 * core) *
              (0.5 + 0.5 * d) *
              (0.6 + 0.4 * jitter) *
              breathe *
              rk;
            if (a < 0.03) continue;
            const s = 0.7 + 1 * d * (0.5 + 0.5 * jitter) + edge * 0.3;
            ctx.globalAlpha = a > 1 ? 1 : a;
            ctx.fillRect(px - s / 2, py - s / 2, s, s);
          }
        }
      }

      if (nb > 0) drawBubbles(k);
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      dtFrame = dt;
      t += dt;
      scrollSmooth += (scrollTarget - scrollSmooth) * Math.min(1, dt * 5);
      render();
    };

    const start = () => {
      if (running || reduced || !pageVisible) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    measure(true);
    render();
    start();

    const ro = new ResizeObserver(() => {
      if (measure()) render();
    });
    ro.observe(canvas);

    const onScroll = () => {
      scrollTarget = window.scrollY;
      if (!running) {
        scrollSmooth = scrollTarget;
        if (reduced) render();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => {
      pageVisible = !document.hidden;
      if (pageVisible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onReduce = (e: MediaQueryListEvent) => {
      reduced = e.matches;
      if (reduced) {
        stop();
        render();
      } else start();
    };
    reduceMQ.addEventListener("change", onReduce);

    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      reduceMQ.removeEventListener("change", onReduce);
    };
  }, [intensity, bubbles]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        WebkitMaskImage: "linear-gradient(to left, #000 40%, transparent 100%)",
        maskImage: "linear-gradient(to left, #000 40%, transparent 100%)",
      }}
    />
  );
}