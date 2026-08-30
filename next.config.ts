import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    outputFileTracingRoot: process.cwd(),
    turbopack: {
        root: process.cwd(),
    },
    async headers() {
        const contentSecurityPolicy = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "object-src 'none'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "worker-src 'self' blob:",
            process.env.NODE_ENV === "production"
                ? "upgrade-insecure-requests"
                : "",
        ]
            .filter(Boolean)
            .join("; ");

        const securityHeaders = [
            {
                key: "Content-Security-Policy",
                value: contentSecurityPolicy,
            },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            {
                key: "Referrer-Policy",
                value: "strict-origin-when-cross-origin",
            },
            {
                key: "Permissions-Policy",
                value: "camera=(), microphone=(), geolocation=(), payment=()",
            },
            ...(process.env.NODE_ENV === "production"
                ? [
                      {
                          key: "Strict-Transport-Security",
                          value: "max-age=31536000; includeSubDomains",
                      },
                  ]
                : []),
        ];

        return [{ source: "/(.*)", headers: securityHeaders }];
    },
};

export default nextConfig;
