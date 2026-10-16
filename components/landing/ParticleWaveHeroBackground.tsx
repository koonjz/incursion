"use client";

import React, { useEffect, useRef } from "react";

/**
 * Animated Particle-Wave Background for ACM Resolve Hero.
 * Inspired directly by the visual reference:
 * - Pure black / ink-dark background
 * - Flowing cyan and teal particle wave ribbons running diagonally across the viewport
 * - Fine dotted patterns forming undulating meshes and ribbons
 * - Thin, elegant glowing cyan hairline curves interwoven through the particles
 * - Slow, organic undulation and breathing opacity
 * - Highly optimized Canvas 2D rendering with DPR scaling, mobile particle decimation,
 *   prefers-reduced-motion detection, and IntersectionObserver pause.
 */
export function ParticleWaveHeroBackground() {
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
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Spline control points for the main diagonal ribbon
    // Sweeps from bottom-left (-5% w, 96% h) through (28% w, 90% h),
    // (52% w, 70% h), (72% w, 44% h) up to (104% w, -4% h)
    function getSpinePoint(u: number, w: number, h: number) {
      // 5-point Bezier / polynomial curve
      const p0 = { x: -0.05 * w, y: 0.98 * h };
      const p1 = { x: 0.26 * w, y: 0.92 * h };
      const p2 = { x: 0.52 * w, y: 0.70 * h };
      const p3 = { x: 0.76 * w, y: 0.40 * h };
      const p4 = { x: 1.05 * w, y: -0.04 * h };

      const omt = 1 - u;
      const omt3 = omt * omt * omt;
      const omt2 = omt * omt;
      const u2 = u * u;
      const u3 = u2 * u;

      // Quartic Bernstein basis
      const b0 = omt2 * omt2;
      const b1 = 4 * omt3 * u;
      const b2 = 6 * omt2 * u2;
      const b3 = 4 * omt * u3;
      const b4 = u2 * u2;

      const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x + b4 * p4.x;
      const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y + b4 * p4.y;

      return { x, y };
    }

    // Secondary whisper ribbon spine (offset slightly higher and more to the right)
    function getEchoSpinePoint(u: number, w: number, h: number) {
      const p0 = { x: 0.15 * w, y: 1.02 * h };
      const p1 = { x: 0.38 * w, y: 0.88 * h };
      const p2 = { x: 0.62 * w, y: 0.60 * h };
      const p3 = { x: 0.84 * w, y: 0.30 * h };
      const p4 = { x: 1.08 * w, y: 0.08 * h };

      const omt = 1 - u;
      const omt3 = omt * omt * omt;
      const omt2 = omt * omt;
      const u2 = u * u;
      const u3 = u2 * u;

      const b0 = omt2 * omt2;
      const b1 = 4 * omt3 * u;
      const b2 = 6 * omt2 * u2;
      const b3 = 4 * omt * u3;
      const b4 = u2 * u2;

      const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x + b4 * p4.x;
      const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y + b4 * p4.y;

      return { x, y };
    }

    // Deterministic pseudo-random jitter for natural particle dust
    function pseudoRandom(i: number, j: number) {
      const dot = i * 12.9898 + j * 78.233;
      return (Math.sin(dot) * 43758.5453) % 1;
    }

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
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) render(0);
    });
    ro.observe(container);

    // IntersectionObserver to pause loop when hero is not in viewport
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
        if (isVisible && !prefersReducedMotion && !animFrameId) {
          startTime = performance.now() - accumulatedTime;
          tick();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(container);

    let startTime = performance.now();
    let accumulatedTime = 0;

    function render(timeSec: number) {
      if (!ctx || width === 0 || height === 0) return;

      // 1. Pure dark tech canvas clear
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, width, height);

      // Subtle ambient vignette gradient
      const ambGrad = ctx.createRadialGradient(
        width * 0.75,
        height * 0.45,
        50,
        width * 0.75,
        height * 0.45,
        Math.max(width, height) * 0.8
      );
      ambGrad.addColorStop(0, "rgba(6, 42, 60, 0.18)");
      ambGrad.addColorStop(0.5, "rgba(3, 16, 28, 0.08)");
      ambGrad.addColorStop(1, "rgba(2, 4, 8, 0)");
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, width, height);

      const isMobile = width < 768;

      // Grid resolution: high precision on desktop, lightweight on mobile
      const uSteps = isMobile ? 65 : 115;
      const vSteps = isMobile ? 18 : 28;

      // Base ribbon half-width
      const baseWidth = Math.min(width * 0.24, 280);

      // Continuous hairline line tracks (selected v fractions from -1 to 1)
      const lineTracks = isMobile
        ? [-0.75, -0.2, 0.3, 0.8]
        : [-0.85, -0.5, -0.15, 0.15, 0.5, 0.85];

      const linePoints: { x: number; y: number }[][] = lineTracks.map(() => []);

      // -------------------------------------------------------------
      // PRIMARY WAVE RIBBON
      // -------------------------------------------------------------
      for (let i = 0; i <= uSteps; i++) {
        const u = i / uSteps;

        // Spine and tangent for normal
        const spine = getSpinePoint(u, width, height);
        const eps = 0.005;
        const sNext = getSpinePoint(Math.min(1, u + eps), width, height);
        const sPrev = getSpinePoint(Math.max(0, u - eps), width, height);
        const tx = sNext.x - sPrev.x;
        const ty = sNext.y - sPrev.y;
        const tLen = Math.hypot(tx, ty) || 1;
        const nx = -ty / tLen;
        const ny = tx / tLen;

        // Dynamic ribbon width profile: gentle swell in the midsection
        const widthFactor = 0.75 + 0.45 * Math.sin(u * Math.PI);
        const ribbonW = baseWidth * widthFactor;

        // Wave propagation displacements (harmonics)
        const waveA = Math.sin(u * 5.2 - timeSec * 0.45) * 32;
        const waveB = Math.cos(u * 2.8 + timeSec * 0.28) * 18;

        for (let j = 0; j <= vSteps; j++) {
          const v = (j / vSteps - 0.5) * 2; // -1 to 1

          const crossWave = Math.sin(v * 3.2 - timeSec * 0.35 + u * 2.2) * 14;
          const totalNormalDisp = (waveA + waveB + crossWave) * (1 - Math.abs(v) * 0.3);

          // Subtle organic jitter
          const pr = pseudoRandom(i, j);
          const jitterX = (pr - 0.5) * 4;
          const jitterY = (pseudoRandom(j, i) - 0.5) * 4;

          const px = spine.x + nx * (v * ribbonW * 0.5 + totalNormalDisp) + jitterX;
          const py = spine.y + ny * (v * ribbonW * 0.5 + totalNormalDisp) + jitterY;

          // Boundary fade for smooth screen entrance & exit
          const edgeFadeU = Math.sin(u * Math.PI);
          const edgeFadeV = 1 - Math.pow(v, 2) * 0.65;
          const breath = 0.8 + 0.2 * Math.sin(u * 7 + timeSec * 0.7 + v * 2.5);

          const alpha = Math.max(0, Math.min(1, edgeFadeU * edgeFadeV * breath * 0.85));

          if (alpha > 0.02) {
            // Particle palette: glowing cyan, electric teal, bright aqua highlights
            let r = 34, g = 211, b = 238; // Default cyan #22d3ee
            if (pr > 0.85) {
              // Luminous white-cyan core highlight
              r = 210; g = 248; b = 255;
            } else if (pr > 0.5) {
              // Electric teal #2dd4bf
              r = 45; g = 212; b = 191;
            } else if (v > 0.4) {
              // Deep sea cyan #06b6d4
              r = 6; g = 182; b = 212;
            }

            // Dot radius
            const dotRadius = (0.7 + Math.abs(pr) * 0.7) * (1 + 0.2 * Math.sin(timeSec + u * 4));

            ctx.beginPath();
            ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
            ctx.fill();
          }

          // Check if this (u, v) matches one of the continuous hairline curves
          for (let k = 0; k < lineTracks.length; k++) {
            const trackV = lineTracks[k];
            // If v is close to trackV, record point
            if (Math.abs(v - trackV) < 1 / vSteps + 0.001) {
              linePoints[k].push({
                x: spine.x + nx * (trackV * ribbonW * 0.5 + totalNormalDisp),
                y: spine.y + ny * (trackV * ribbonW * 0.5 + totalNormalDisp),
              });
            }
          }
        }
      }

      // Render the thin, elegant cyan continuous curves running through particles
      ctx.save();
      for (let k = 0; k < lineTracks.length; k++) {
        const pts = linePoints[k];
        if (pts.length < 2) continue;

        const trackV = lineTracks[k];
        const lineAlpha = (0.35 + 0.25 * (1 - Math.abs(trackV))) * (0.85 + 0.15 * Math.sin(timeSec * 0.6 + k));

        // Hairline glow pass
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let p = 1; p < pts.length; p++) {
          ctx.lineTo(pts[p].x, pts[p].y);
        }
        ctx.strokeStyle = `rgba(34, 211, 238, ${(lineAlpha * 0.4).toFixed(3)})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Crisp hairline pass
        ctx.strokeStyle = `rgba(103, 232, 249, ${lineAlpha.toFixed(3)})`;
        ctx.lineWidth = 0.95;
        ctx.stroke();
      }
      ctx.restore();

      // -------------------------------------------------------------
      // SECONDARY ECHO WAVE RIBBON (Fainter, delicate branch seen in image)
      // -------------------------------------------------------------
      const echoUSteps = isMobile ? 35 : 65;
      const echoVSteps = isMobile ? 8 : 14;
      const echoLinePts: { x: number; y: number }[] = [];

      for (let i = 0; i <= echoUSteps; i++) {
        const u = i / echoUSteps;
        const spine = getEchoSpinePoint(u, width, height);

        const eps = 0.006;
        const sNext = getEchoSpinePoint(Math.min(1, u + eps), width, height);
        const sPrev = getEchoSpinePoint(Math.max(0, u - eps), width, height);
        const tx = sNext.x - sPrev.x;
        const ty = sNext.y - sPrev.y;
        const tLen = Math.hypot(tx, ty) || 1;
        const nx = -ty / tLen;
        const ny = tx / tLen;

        const echoW = baseWidth * 0.45 * (0.6 + 0.4 * Math.sin(u * Math.PI));
        const wave = Math.sin(u * 4.4 + timeSec * 0.3) * 20;

        for (let j = 0; j <= echoVSteps; j++) {
          const v = (j / echoVSteps - 0.5) * 2;
          const cross = Math.cos(v * 2.8 - timeSec * 0.25) * 8;
          const disp = (wave + cross);

          const px = spine.x + nx * (v * echoW * 0.5 + disp);
          const py = spine.y + ny * (v * echoW * 0.5 + disp);

          const edgeFade = Math.sin(u * Math.PI) * (1 - Math.pow(v, 2) * 0.5);
          const alpha = edgeFade * 0.42 * (0.8 + 0.2 * Math.sin(u * 6 + timeSec * 0.5));

          if (alpha > 0.03) {
            ctx.beginPath();
            ctx.arc(px, py, 0.75, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
            ctx.fill();
          }

          if (j === Math.floor(echoVSteps / 2)) {
            echoLinePts.push({ x: px, y: py });
          }
        }
      }

      // Secondary hairline trace
      if (echoLinePts.length > 2) {
        ctx.beginPath();
        ctx.moveTo(echoLinePts[0].x, echoLinePts[0].y);
        for (let p = 1; p < echoLinePts.length; p++) {
          ctx.lineTo(echoLinePts[p].x, echoLinePts[p].y);
        }
        ctx.strokeStyle = "rgba(45, 212, 191, 0.28)";
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      // -------------------------------------------------------------
      // 3. SEAMLESS BOTTOM AND LEFT BLEND
      // -------------------------------------------------------------
      // Left-side vignette so headline text contrast is 100% crystal clear
      const leftMask = ctx.createLinearGradient(0, 0, width * 0.55, 0);
      leftMask.addColorStop(0, "rgba(2, 4, 8, 0.65)");
      leftMask.addColorStop(0.7, "rgba(2, 4, 8, 0.25)");
      leftMask.addColorStop(1, "rgba(2, 4, 8, 0)");
      ctx.fillStyle = leftMask;
      ctx.fillRect(0, 0, width * 0.6, height);

      // Bottom fade into page background (#07090e)
      const bottomFade = ctx.createLinearGradient(0, height * 0.72, 0, height);
      bottomFade.addColorStop(0, "rgba(7, 9, 14, 0)");
      bottomFade.addColorStop(0.65, "rgba(7, 9, 14, 0.6)");
      bottomFade.addColorStop(1, "rgba(7, 9, 14, 1)");
      ctx.fillStyle = bottomFade;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);
    }

    function tick() {
      if (!isVisible) {
        animFrameId = 0;
        return;
      }
      accumulatedTime = (performance.now() - startTime) / 1000;
      render(accumulatedTime);
      animFrameId = requestAnimationFrame(tick);
    }

    if (prefersReducedMotion) {
      render(0);
    } else {
      tick();
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
      io.disconnect();
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
