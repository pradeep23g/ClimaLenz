/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Cloud Shell to load the client-side JavaScript
  ...(process.env.CLOUD_SHELL_ORIGIN ? {
    allowedDevOrigins: [
      process.env.CLOUD_SHELL_ORIGIN
    ]
  } : {}),
};

export default nextConfig;