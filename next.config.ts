import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for contact import (70k+ contacts)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'static.zara.net',
      },
      {
        protocol: 'https',
        hostname: 'image.hm.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'quickshopil-storage.s3.amazonaws.com',
      },
      // Vercel Blob storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.blob.vercel-storage.com',
      },
    ],
  },
  
  // ============================================
  // SECURITY HEADERS
  // Prevents XSS, Clickjacking, MIME sniffing
  // ============================================
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking - only allow embedding from same origin
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy - disable unnecessary features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts - allow inline for Next.js + external services (PayMe, Pelecard, Stripe, PayPal, reCAPTCHA, Analytics)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://connect.facebook.net https://js.stripe.com https://www.paypal.com https://cdn.payme.io https://*.payme.io https://gateway.pelecard.biz",
              // Styles - allow inline for styled-components/emotion
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.payme.io",
              // Images - allow data URIs, blob, and CDNs
              "img-src 'self' data: blob: https: http:",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Connect - API calls (including Israeli payment providers)
              "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://api.cloudinary.com https://res.cloudinary.com https://*.stripe.com https://*.paypal.com https://*.payme.io https://gateway.pelecard.biz https://vercel.com https://*.vercel.com https://*.blob.vercel-storage.com wss:",
              // Frame ancestors - prevent embedding (clickjacking protection)
              "frame-ancestors 'self'",
              // Frames - for payment iframes (Stripe, PayPal, PayMe, Pelecard, reCAPTCHA)
              "frame-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://js.stripe.com https://*.stripe.com https://www.paypal.com https://*.paypal.com https://*.payme.io https://gateway.pelecard.biz",
              // Workers for Next.js
              "worker-src 'self' blob:",
              // Media
              "media-src 'self' https: blob:",
              // Base URI
              "base-uri 'self'",
              // Form action (allow payment provider redirects)
              "form-action 'self' https://*.payme.io https://gateway.pelecard.biz https://*.stripe.com https://*.paypal.com",
            ].join('; '),
          },
        ],
      },
      {
        // Strict Transport Security for all routes (HTTPS only)
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
