export default function imageLoader({ src, width, quality }) {
  // For static export, return absolute paths as-is
  // This ensures images work correctly when deployed to CDN
  return src
}
