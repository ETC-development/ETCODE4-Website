import type { NextConfig } from "next";

// Baseline security headers for the public site. Applied to everything EXCEPT
// /admin (negative lookahead) so they never duplicate the stricter admin set
// below. HSTS is included so it covers the whole origin.
const BASELINE_SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Public pages need none of these capabilities — deny by default.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Stricter set for the admin area: never cache, never frame, no referrer leak.
// The check-in QR scanner needs the camera, so camera is allowed for self here.
const ADMIN_SECURITY_HEADERS = [
  { key: "Cache-Control", value: "no-store, max-age=0" }, // never cache admin pages
  { key: "X-Frame-Options", value: "DENY" }, // no clickjacking via iframe
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/((?!admin).*)", headers: BASELINE_SECURITY_HEADERS },
      { source: "/admin/:path*", headers: ADMIN_SECURITY_HEADERS },
    ];
  },
};

export default nextConfig;
