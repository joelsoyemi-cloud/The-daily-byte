const storageHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
const imageHosts = ['images.unsplash.com', ...(process.env.IMAGE_HOSTS || '').split(',').map(host => host.trim()).filter(Boolean)];

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: '3mb' } },
  images: {
    remotePatterns: [
      ...imageHosts.map(hostname => ({ protocol: 'https', hostname })),
      ...(storageHost ? [{ protocol: 'https', hostname: storageHost, pathname: '/storage/v1/object/public/**' }] : []),
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ] },
      ...['admin', 'editor', 'dashboard', 'login', 'signup', 'forgot-password', 'reset-password', 'unauthorized', 'feedback', 'auth', 'api'].map(route => ({
        source: '/' + route + '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ];
  },
};
module.exports = nextConfig;
