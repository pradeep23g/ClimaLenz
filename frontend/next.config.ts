/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Cloud Shell to load the client-side JavaScript
  allowedDevOrigins: [
    '3000-cs-917466083917-default.cs-asia-southeast1-kelp.cloudshell.dev'
  ],
};

export default nextConfig;