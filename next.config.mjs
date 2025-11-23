/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "out",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // Enable SWC minification for faster builds
  swcMinify: true,

  // Optimize bundle
  experimental: {
    esmExternals: true,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Handle node modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      }
    }
    return config
  },
}

export default nextConfig
