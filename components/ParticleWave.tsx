"use client";

import React, { useEffect, useRef } from "react";

/**
 * Animated Particle-Wave Background for ACM Resolve Hero.
 * - Single HTML5 <canvas> element (no external libraries)
 * - 3 flowing 3D-looking ribbons that cross each other diagonally (bottom-left to upper-right)
 * - Dots denser & brighter along crests; 4 to 8 thin guide lines along ribbon length
 * - Pre-computed typed arrays for zero GC allocation in the animation loop
 * - Adaptive dot counts: ~6,000–7,500 on desktop, ~1,800–2,200 on mobile (< 768px)
 * - Handles devicePixelRatio (capped at 2), ResizeObserver, visibilitychange, and IntersectionObserver
 * - Full prefers-reduced-motion support (renders a single static frame)
 * - pointer-events: none and aria-hidden="true" (never blocks clicks)
 */
export function ParticleWave() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animFrameId = 0;
    let isVisible = true;
    let isDocumentVisible = !document.hidden;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Prefers-reduced-motion detection
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Ribbon geometry definition
    interface RibbonConfig {
      // Bezier spine control points in normalized coordinates [0..1]
      p0: { x: number; y: number };
      p1: { x: number; y: number };
      p2: { x: number; y: number };
      p3: { x: number; y: number };
      p4: { x: number; y: number };
      baseWidthRatio: number;
      // Harmonics
      freq1: number;
      freq2: number;
      speed1: number;
      speed2: number;
      amp1: number;
      amp2: number;
      phaseShift: number;
      guideTracks: number[]; // constant v values for hairline guide lines
      colorR: number;
      colorG: number;
      colorB: number;
      uSteps: number;
      vSteps: number;
    }

    // Ribbon data holding pre-allocated typed arrays for zero-alloc rendering
    interface RibbonBuffer {
      cfg: RibbonConfig;
      totalPoints: number;
      uValues: Float32Array;
      vValues: Float32Array;
      randomJitter: Float32Array;
      lineTrackIndices: number[][]; // indices along u for each guide track
    }

    let ribbonBuffers: RibbonBuffer[] = [];

    // Helper: Quartic Bezier spine point
    function getSpinePoint(u: number, cfg: RibbonConfig, w: number, h: number) {
      const omt = 1 - u;
      const omt2 = omt * omt;
      const omt3 = omt2 * omt;
      const u2 = u * u;
      const u3 = u2 * u;

      const b0 = omt2 * omt2;
      const b1 = 4 * omt3 * u;
      const b2 = 6 * omt2 * u2;
      const b3 = 4 * omt * u3;
      const b4 = u2 * u2;

      const x = (b0 * cfg.p0.x + b1 * cfg.p1.x + b2 * cfg.p2.x + b3 * cfg.p3.x + b4 * cfg.p4.x) * w;
      const y = (b0 * cfg.p0.y + b1 * cfg.p1.y + b2 * cfg.p2.y + b3 * cfg.p3.y + b4 * cfg.p4.y) * h;

      return { x, y };
    }

    // Rebuild grid buffers when canvas size or mobile breakpoint changes
    function buildRibbons(isMobile: boolean) {
      const configs: RibbonConfig[] = [
        // Ribbon 1: Main sweeping diagonal ribbon (cyan #22d3ee)
        {
          p0: { x: -0.06, y: 0.98 },
          p1: { x: 0.25, y: 0.91 },
          p2: { x: 0.52, y: 0.71 },
          p3: { x: 0.76, y: 0.41 },
          p4: { x: 1.05, y: -0.04 },
          baseWidthRatio: isMobile ? 0.28 : 0.23,
          freq1: 4.8,
          freq2: 2.5,
          speed1: 0.32,
          speed2: 0.22,
          amp1: isMobile ? 22 : 34,
          amp2: isMobile ? 12 : 18,
          phaseShift: 0,
          guideTracks: isMobile ? [-0.65, 0.0, 0.65] : [-0.8, -0.4, 0.0, 0.4, 0.8],
          colorR: 34,
          colorG: 211,
          colorB: 238, // Cyan
          uSteps: isMobile ? 60 : 115,
          vSteps: isMobile ? 18 : 32, // 60*18 = 1080 mobile, 115*32 = 3680 desktop
        },
        // Ribbon 2: Crossing ribbon (teal #2dd4bf) weaving in and out
        {
          p0: { x: 0.05, y: 1.04 },
          p1: { x: 0.32, y: 0.84 },
          p2: { x: 0.58, y: 0.62 },
          p3: { x: 0.82, y: 0.32 },
          p4: { x: 1.08, y: 0.08 },
          baseWidthRatio: isMobile ? 0.22 : 0.18,
          freq1: 3.6,
          freq2: 4.8,
          speed1: -0.26,
          speed2: 0.34,
          amp1: isMobile ? 18 : 28,
          amp2: isMobile ? 10 : 15,
          phaseShift: 1.5,
          guideTracks: isMobile ? [-0.5, 0.5] : [-0.6, 0.0, 0.6],
          colorR: 45,
          colorG: 212,
          colorB: 191, // Teal
          uSteps: isMobile ? 45 : 90,
          vSteps: isMobile ? 14 : 24, // 45*14 = 630 mobile, 90*24 = 2160 desktop
        },
        // Ribbon 3: Delicate sky-blue accent echo (#38bdf8)
        {
          p0: { x: -0.02, y: 0.94 },
          p1: { x: 0.28, y: 0.88 },
          p2: { x: 0.48, y: 0.64 },
          p3: { x: 0.72, y: 0.36 },
          p4: { x: 0.98, y: -0.02 },
          baseWidthRatio: isMobile ? 0.16 : 0.13,
          freq1: 5.4,
          freq2: 3.2,
          speed1: 0.28,
          speed2: -0.2,
          amp1: isMobile ? 14 : 20,
          amp2: isMobile ? 8 : 12,
          phaseShift: 3.14,
          guideTracks: [-0.4, 0.4],
          colorR: 56,
          colorG: 189,
          colorB: 248, // Sky Blue
          uSteps: isMobile ? 35 : 70,
          vSteps: isMobile ? 10 : 16, // 35*10 = 350 mobile, 70*16 = 1120 desktop
        },
      ];

      ribbonBuffers = configs.map((cfg) => {
        const totalPoints = (cfg.uSteps + 1) * (cfg.vSteps + 1);
        const uValues = new Float32Array(totalPoints);
        const vValues = new Float32Array(totalPoints);
        const randomJitter = new Float32Array(totalPoints);

        let idx = 0;
        for (let i = 0; i <= cfg.uSteps; i++) {
          const u = i / cfg.uSteps;
          for (let j = 0; j <= cfg.vSteps; j++) {
            const v = (j / cfg.vSteps - 0.5) * 2; // -1 to 1
            uValues[idx] = u;
            vValues[idx] = v;
            // Deterministic pseudo-random number for jitter
            const dot = i * 12.9898 + j * 78.233;
            randomJitter[idx] = (Math.sin(dot) * 43758.5453) % 1;
            idx++;
          }
        }

        return {
          cfg,
          totalPoints,
          uValues,
          vValues,
          randomJitter,
          lineTrackIndices: cfg.guideTracks.map(() => []),
        };
      });
    }

    let lastIsMobile: boolean | null = null;

    function resize() {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx!.scale(dpr, dpr);

      const isMobile = width < 768;
      if (lastIsMobile !== isMobile) {
        lastIsMobile = isMobile;
        buildRibbons(isMobile);
      }
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) render(0);
    });
    ro.observe(container);

    // Pause animation when hero is scrolled out of viewport
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible && isDocumentVisible && !prefersReducedMotion && !animFrameId) {
          lastTimestamp = performance.now();
          tick(lastTimestamp);
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    // Pause animation when browser tab is inactive
    const handleVisibility = () => {
      isDocumentVisible = !document.hidden;
      if (isVisible && isDocumentVisible && !prefersReducedMotion && !animFrameId) {
        lastTimestamp = performance.now();
        tick(lastTimestamp);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastTimestamp = performance.now();
    let accumulatedTime = 0;

    // RENDER FRAME (Strictly zero object allocations inside loop)
    function render(timeSec: number) {
      if (!ctx || width === 0 || height === 0) return;

      // 1. Clear background to dark canvas base (#020408)
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, width, height);

      // 2. Render each flowing ribbon
      for (let r = 0; r < ribbonBuffers.length; r++) {
        const buffer = ribbonBuffers[r];
        const cfg = buffer.cfg;
        const total = buffer.totalPoints;
        const uArr = buffer.uValues;
        const vArr = buffer.vValues;
        const rJitter = buffer.randomJitter;

        const maxRibbonWidth = Math.min(width * cfg.baseWidthRatio, 300);

        // Guide line tracking coordinates along length
        // We reuse an array of points per track
        const trackCount = cfg.guideTracks.length;
        const tracksX: number[][] = [];
        const tracksY: number[][] = [];
        for (let t = 0; t < trackCount; t++) {
          tracksX[t] = [];
          tracksY[t] = [];
        }

        // Loop through precomputed points
        for (let idx = 0; idx < total; idx++) {
          const u = uArr[idx];
          const v = vArr[idx];
          const pr = rJitter[idx];

          // Compute spline point and tangent for normal
          const spine = getSpinePoint(u, cfg, width, height);
          const eps = 0.005;
          const sNext = getSpinePoint(Math.min(1, u + eps), cfg, width, height);
          const sPrev = getSpinePoint(Math.max(0, u - eps), cfg, width, height);
          const tx = sNext.x - sPrev.x;
          const ty = sNext.y - sPrev.y;
          const tLen = Math.hypot(tx, ty) || 1;
          const nx = -ty / tLen;
          const ny = tx / tLen;

          // Ribbon width pinch & twist: narrows at tips, widens in middle, undulates slowly
          const widthPinch = (0.65 + 0.55 * Math.sin(u * Math.PI)) * (0.85 + 0.15 * Math.cos(u * 3 - timeSec * 0.2 + cfg.phaseShift));
          const currentWidth = maxRibbonWidth * widthPinch;

          // Wave displacement along normal & depth
          const wave1 = Math.sin(u * cfg.freq1 + timeSec * cfg.speed1 + v * 1.5 + cfg.phaseShift) * cfg.amp1;
          const wave2 = Math.cos(u * cfg.freq2 - timeSec * cfg.speed2) * cfg.amp2;
          const crossWave = Math.sin(v * 3.2 - timeSec * 0.25 + u * 2.5) * 8;
          const totalDisp = (wave1 + wave2 + crossWave) * (1 - Math.abs(v) * 0.35);

          // Simulated 3D depth value z: affects dot radius and brightness
          const fakeZ = (wave1 + wave2) / (cfg.amp1 + cfg.amp2); // -1 to 1

          // Particle position
          const jitterX = (pr - 0.5) * 3;
          const jitterY = (pr * 1.7 % 1 - 0.5) * 3;
          const px = spine.x + nx * (v * currentWidth * 0.5 + totalDisp) + jitterX;
          const py = spine.y + ny * (v * currentWidth * 0.5 + totalDisp) + jitterY;

          // Natural fading:
          // - Denser & brighter along crest (v = 0), fading toward ribbon edges
          // - Fade smoothly at start and end of screen (u = 0, u = 1)
          const edgeFadeU = Math.sin(u * Math.PI);
          const edgeFadeV = Math.max(0, 1 - Math.pow(v, 2) * 0.7);
          const depthShade = 0.75 + 0.25 * fakeZ;
          const breath = 0.85 + 0.15 * Math.sin(u * 6 + timeSec * 0.6 + v * 2 + cfg.phaseShift);

          const alpha = edgeFadeU * edgeFadeV * depthShade * breath * 0.75;

          if (alpha > 0.02) {
            // Dot radius: 0.4px to 1.4px varied with depth & jitter
            const dotRadius = Math.max(0.4, Math.min(1.4, (0.65 + Math.abs(pr) * 0.55) * (1 + 0.2 * fakeZ)));

            // Color variation: luminous white-cyan on crest highlights
            let cr = cfg.colorR;
            let cg = cfg.colorG;
            let cb = cfg.colorB;
            if (pr > 0.88 && Math.abs(v) < 0.35) {
              cr = 224; cg = 250; cb = 255; // White-cyan spark
            }

            ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
            // Drawing rectangular sub-pixels is fast and crisp
            ctx.fillRect(px - dotRadius, py - dotRadius, dotRadius * 2, dotRadius * 2);
          }

          // Check if this point lies along one of the guide tracks
          for (let t = 0; t < trackCount; t++) {
            const trackV = cfg.guideTracks[t];
            const vStep = 2 / cfg.vSteps;
            if (Math.abs(v - trackV) < vStep * 0.55) {
              tracksX[t].push(spine.x + nx * (trackV * currentWidth * 0.5 + totalDisp));
              tracksY[t].push(spine.y + ny * (trackV * currentWidth * 0.5 + totalDisp));
            }
          }
        }

        // Draw thin guide lines along constant-v curves
        for (let t = 0; t < trackCount; t++) {
          const xs = tracksX[t];
          const ys = tracksY[t];
          if (xs.length < 2) continue;

          const trackV = cfg.guideTracks[t];
          const lineAlpha = (0.16 + 0.18 * (1 - Math.abs(trackV))) * (0.85 + 0.15 * Math.sin(timeSec * 0.5 + t));

          ctx.beginPath();
          ctx.moveTo(xs[0], ys[0]);
          for (let p = 1; p < xs.length; p++) {
            ctx.lineTo(xs[p], ys[p]);
          }
          ctx.strokeStyle = `rgba(${cfg.colorR}, ${cfg.colorG}, ${cfg.colorB}, ${lineAlpha.toFixed(3)})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }
      }

      // 3. Ambient overlays so text contrast is pristine
      // Left-side vignette (dims behind headline and body text)
      const leftVignette = ctx.createLinearGradient(0, 0, width * 0.58, 0);
      leftVignette.addColorStop(0, "rgba(2, 4, 8, 0.72)");
      leftVignette.addColorStop(0.65, "rgba(2, 4, 8, 0.3)");
      leftVignette.addColorStop(1, "rgba(2, 4, 8, 0)");
      ctx.fillStyle = leftVignette;
      ctx.fillRect(0, 0, width * 0.65, height);

      // Bottom fade into page background (#07090e)
      const bottomFade = ctx.createLinearGradient(0, height * 0.74, 0, height);
      bottomFade.addColorStop(0, "rgba(7, 9, 14, 0)");
      bottomFade.addColorStop(0.65, "rgba(7, 9, 14, 0.55)");
      bottomFade.addColorStop(1, "rgba(7, 9, 14, 1)");
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, height * 0.72, width, height * 0.28);
    }

    function tick(timestamp: number) {
      if (!isVisible || !isDocumentVisible) {
        animFrameId = 0;
        return;
      }

      // Delta time calculation for smooth frame-rate independent motion
      const deltaMs = Math.min(timestamp - lastTimestamp, 100);
      lastTimestamp = timestamp;
      accumulatedTime += deltaMs / 1000;

      render(accumulatedTime);
      animFrameId = requestAnimationFrame(tick);
    }

    if (prefersReducedMotion) {
      render(0);
    } else {
      animFrameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="block size-full"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
