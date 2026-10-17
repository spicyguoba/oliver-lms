export default {
  poweredByHeader: false,
  distDir: process.env.LMS_NEXT_DIST_DIR || ".next",
  outputFileTracingIncludes: {
    "/api/*": [
      "./legacy/*.html",
      "./content/stories.json",
      "./content/discoveries.json",
      "./content/additions.json",
      "./content/vocabulary/*.json",
    ],
  },
  outputFileTracingExcludes: {
    "*": [
      "./.data/**/*",
      "./.env*",
      "./materials-private/**/*",
      "./output/**/*",
    ],
  },
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: ["postgres"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};
