<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main>
	<header>
		<h1>강사 대시보드</h1>
		<p class="email">{data.email}</p>
	</header>

	<div class="card">
		<p>클래스 목록·생성 UI가 여기에 들어갑니다 (Phase 1 다음 PR).</p>
	</div>

	<form method="POST" action="/logout">
		<button type="submit" class="logout">로그아웃</button>
	</form>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	header h1 {
		margin: 0 0 0.25rem;
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.email {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}
	.card {
		background: var(--bg-elevated);
		border-radius: 14px;
		padding: 1.25rem;
		color: var(--text-secondary);
	}
	.card p {
		margin: 0;
	}
	.logout {
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border-radius: 10px;
		padding: 0.75rem;
		font-size: 0.9rem;
		font-weight: 500;
		align-self: flex-start;
	}
	.logout:active {
		background: var(--bg-card);
	}
</style>
