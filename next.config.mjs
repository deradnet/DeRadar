import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: "out",
  trailingSlash: true,

  // Enable compression
  compress: true,

  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
  },

  // Enable Turbopack (Next.js 16+)
  turbopack: {},

  // Optimize bundle
  experimental: {
    esmExternals: true,
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'date-fns',
      'highcharts',
      'highcharts-react-official',
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: {
      exclude: ["error", "warn"],
    },
  },

  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  generateEtags: false,

  // Webpack optimizations (for webpack mode fallback)
  webpack: (config, { isServer, dev }) => {
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

    // Production optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
        usedExports: true,
        sideEffects: true,
        concatenateModules: true,
        // Remove comments and minimize
        minimizer: [
          ...config.optimization.minimizer || [],
        ],
      }
    }

    return config
  },
}

export default withBundleAnalyzer(nextConfig)
