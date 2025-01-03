/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    
    // Ensure PDF.js worker is handled properly
    config.resolve.alias['pdfjs-dist/build/pdf.worker.entry'] = false;
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/proxy-pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600', // Cache PDFs for 1 hour
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
