import ParticleWave from "@/components/ParticleWave";

type SiteBackgroundProps = {
  /**
   * "edge"    = thin vertical ribbon hugging the page edge (default)
   * "margins" = wider vertical waves in both side margins
   * "full"    = one wave across the whole screen
   */
  variant?: "edge" | "margins" | "full";
  /** Brightness multiplier. */
  intensity?: number;
};

const fadeLeft = "linear-gradient(to left, #000 45%, transparent 100%)";
const fadeRight = "linear-gradient(to right, #000 45%, transparent 100%)";

/**
 * Fixed, site-wide background. Render once in app/layout.tsx.
 * Sits behind all page content and never blocks interaction.
 */
export default function SiteBackground({
  variant = "edge",
  intensity = 1,
}: SiteBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#03060a]"
    >
      {variant === "full" && (
        <ParticleWave
          intensity={intensity}
          className="absolute inset-0 h-full w-full"
        />
      )}

      {variant === "margins" && (
        <>
          <ParticleWave
            orientation="vertical"
            side="right"
            intensity={intensity * 0.9}
            className="absolute inset-y-0 right-0 h-full w-[34vw] max-w-[420px] md:w-[24vw]"
            style={{ WebkitMaskImage: fadeLeft, maskImage: fadeLeft }}
          />
          <ParticleWave
            orientation="vertical"
            side="left"
            density={0.7}
            intensity={intensity * 0.6}
            className="absolute inset-y-0 left-0 hidden h-full w-[18vw] max-w-[320px] md:block"
            style={{ WebkitMaskImage: fadeRight, maskImage: fadeRight }}
          />
        </>
      )}

      {variant === "edge" && (
        <>
          {/* Right edge: thin ribbon, visible on every screen size */}
          <ParticleWave
            orientation="vertical"
            side="right"
            density={0.6}
            intensity={intensity}
            className="absolute inset-y-0 right-0 h-full w-[72px] sm:w-[110px] md:w-[140px]"
            style={{ WebkitMaskImage: fadeLeft, maskImage: fadeLeft }}
          />
          {/* Left edge: fainter companion, tablet and desktop only */}
          <ParticleWave
            orientation="vertical"
            side="left"
            density={0.5}
            intensity={intensity * 0.55}
            className="absolute inset-y-0 left-0 hidden h-full w-[100px] md:block"
            style={{ WebkitMaskImage: fadeRight, maskImage: fadeRight }}
          />
        </>
      )}
    </div>
  );
}