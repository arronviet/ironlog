/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ép Vercel bỏ qua mọi cảnh báo lỗi cú pháp eslint khi đang build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ép Vercel bỏ qua mọi lỗi kiểm tra kiểu dữ liệu TypeScript khi đang build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;