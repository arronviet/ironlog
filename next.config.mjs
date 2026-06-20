/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Bỏ qua lỗi eslint khi build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Bỏ qua lỗi kiểu dữ liệu nghiêm ngặt khi build
    ignoreBuildErrors: true,
  },
};

export default nextConfig; 