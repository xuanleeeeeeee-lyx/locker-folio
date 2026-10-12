import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const GITHUB_PAGES = process.env.GITHUB_PAGES === 'true'
const GITHUB_PAGES_BASE = '/locker-folio/'

// This app intentionally uses root-absolute public asset URLs for its Cloudflare
// custom domain. Rewrite those only for the GitHub Pages project-site subpath.
const githubPagesAssetPrefix = {
  name: 'github-pages-asset-prefix',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!GITHUB_PAGES || id.includes('/node_modules/')) return null
    const transformed = code.replace(/(["'`])\/assets\//g, `$1${GITHUB_PAGES_BASE}assets/`)
    return transformed === code ? null : transformed
  },
}

// https://vite.dev/config/
export default defineConfig({
  base: GITHUB_PAGES ? GITHUB_PAGES_BASE : '/',
  plugins: [react(), githubPagesAssetPrefix],
  // 监听所有网卡，方便手机等同一局域网设备用 IP:端口 访问；
  // allowedHosts 放行云沙箱的预览域名（*.e2b.app），局域网 IP 不受影响。
  server: { host: true, port: 5178, allowedHosts: ['.e2b.app'] },
  preview: { host: true, port: 4178, allowedHosts: ['.e2b.app'] },
})
