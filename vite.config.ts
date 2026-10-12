import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 监听所有网卡，方便手机等同一局域网设备用 IP:端口 访问；
  // allowedHosts 放行云沙箱的预览域名（*.e2b.app），局域网 IP 不受影响。
  server: { host: true, port: 5178, allowedHosts: ['.e2b.app'] },
  preview: { host: true, port: 4178, allowedHosts: ['.e2b.app'] },
})
