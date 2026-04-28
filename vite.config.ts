import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		// 모든 인터페이스에 listen — LAN 폰 + Tailscale에서 접속 가능
		host: true,
		// Vite 8은 Host 헤더를 엄격히 검사. IP는 자동 허용되지만 호스트명은
		// 명시적으로 화이트리스트에 있어야 함. 개발 친화적이고 일반적인
		// 패턴 위주로 등록.
		//   - 'localhost'    : 표준 로컬 개발
		//   - '.local'       : Bonjour/mDNS (예: my-mac.local)
		//   - '.ts.net'      : Tailscale MagicDNS (예: my-mac.tail-net.ts.net)
		// 보유 IP 기반 접근(LAN 192.168.x.x, Tailscale CGNAT 100.x.x.x)은
		// `host: true`만으로 자동 허용됨.
		allowedHosts: ['localhost', '.local', '.ts.net']
	}
});
