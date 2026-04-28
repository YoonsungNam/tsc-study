<script lang="ts">
	// Phase 0 셋업 확인용 placeholder. Phase 1에서 인증/리다이렉트로 대체.
</script>

<main>
	<div class="logo">中</div>
	<h1>TSC Study</h1>
	<p>중국어 학습 PWA</p>
	<p class="muted">Phase 0 셋업 완료 · 다음: 인증 + 강사 업로드</p>
</main>

<style>
	main {
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
	}
	.logo {
		font-family: 'PingFang SC', 'Hiragino Sans GB', sans-serif;
		font-size: 5rem;
		color: var(--accent);
		font-weight: 700;
		line-height: 1;
		margin-bottom: 1rem;
	}
	h1 {
		font-size: 2.25rem;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
		font-weight: 700;
	}
	p {
		margin: 0.25rem 0;
		color: var(--text-secondary);
	}
	.muted {
		color: var(--text-tertiary);
		font-size: 0.875rem;
		margin-top: 1.25rem;
	}
</style>
