/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // This becomes "[your-project-id].supabase.co"
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL
          ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
          : 'localhost',
        pathname: '**',
      },
    ],
  },
};

// Runtime warnings for missing environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("Warning: NEXT_PUBLIC_SUPABASE_URL is missing. Using fallback for image hostname.");
}

export default nextConfig;