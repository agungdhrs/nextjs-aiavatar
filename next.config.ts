const nextConfig = {
  /* config options here */
  reactCompiler: true,

  // Increase body size limit for Server Actions to handle base64 images
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Default is 1mb, increase to handle images from n8n
    },
  },

  // Dev server configuration
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
};

export default nextConfig;
