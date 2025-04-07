/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Add fallback for WASM files
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      'qcms_bg.wasm': false,
      'openjpeg.wasm': false,
    };

    return config;
  },
  // Disable static generation for analyze page
  output: 'standalone',
  // Add custom headers for PDF.js worker
  async headers() {
    return [
      {
        source: '/pdf.worker.min.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 