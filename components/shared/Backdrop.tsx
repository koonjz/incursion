/**
 * Ultra-premium dark theme backdrop for ACM Resolve.
 * Features a subtle technical blueprint grid, ambient focal vignette,
 * and high-contrast dark surfaces adhering strictly to the creative direction.
 */
export function Backdrop() {
  return (
    <div className="backdrop-art fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#07090e]" aria-hidden="true">
      {/* Deep focal ambiance */}
      <div
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[120px] opacity-25 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(37, 99, 235, 0.45), rgba(15, 23, 42, 0) 70%)",
        }}
      />
      <div
        className="absolute top-[45%] -right-[15%] w-[600px] h-[600px] rounded-full blur-[140px] opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(59, 130, 246, 0.35), rgba(15, 23, 42, 0) 70%)",
        }}
      />
      <div
        className="absolute bottom-[5%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[130px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0) 70%)",
        }}
      />

      {/* High-precision blueprint grid */}
      <svg className="absolute inset-0 size-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="acm-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#ffffff" strokeWidth="1" />
            <circle cx="48" cy="48" r="1" fill="#60a5fa" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#acm-grid)" />
      </svg>

      {/* Subtle edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 30%, transparent 20%, #07090e 95%)",
        }}
      />
    </div>
  );
}
