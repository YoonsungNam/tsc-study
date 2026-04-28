import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		// 모든 인터페이스에 listen — LAN 폰 + Tailscale에서 접속 가능
		host: true,
		// Vite 8은 Host 헤더를 엄격히 검사 (DNS rebinding 방어).
		// 보유 IP(LAN 192.168.x.x, Tailscale CGNAT 100.x.x.x)는 `host: true`로
		// 자동 허용되므로, 호스트명만 좁게 명시.
		//
		// 보안 노트: `.local`(mDNS)이나 `.ts.net`(Tailscale 전체)처럼 공유
		// 네임스페이스를 광범위하게 허용하면 DNS rebinding 보호가 약해짐
		// (악성 LAN 피어가 *.local을 advertise하거나 다른 tailnet 소유자가
		// *.ts.net 이름을 컨트롤할 수 있음). 따라서 본인이 통제하는 정확한
		// suffix만 등록한다.
		//
		// 다른 개발자가 합류하면 본인의 tailnet suffix(또는 mDNS 머신명)를
		// 추가하거나, 환경별 수정이 잦아지면 환경변수로 분리 검토.
		allowedHosts: [
			'localhost',
			'.tail0c2792.ts.net' // 이 사용자의 Tailscale tailnet 전용
		]
	}
});
