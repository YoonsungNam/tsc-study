<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<main>
	<header>
		<h1>강사 대시보드</h1>
		<p class="email">{data.email}</p>
	</header>

	{#if data.classes.length === 0}
		<div class="empty">
			<p>아직 클래스가 없습니다.</p>
			<a href="/instructor/class/new" class="cta">+ 새 클래스 만들기</a>
		</div>
	{:else}
		<section>
			<div class="section-head">
				<h2>내 클래스</h2>
				<a href="/instructor/class/new" class="new-link">+ 새 클래스</a>
			</div>
			<ul class="class-list">
				{#each data.classes as klass (klass.id)}
					<li>
						<a href="/instructor/class/{klass.id}" class="class-card">
							<div class="class-name">{klass.name}</div>
							{#if klass.description}
								<div class="class-desc">{klass.description}</div>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

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
	.empty {
		background: var(--bg-elevated);
		border-radius: 14px;
		padding: 2rem 1.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}
	.empty p {
		margin: 0;
		color: var(--text-secondary);
	}
	.cta {
		background: var(--accent);
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 10px;
		font-weight: 600;
	}
	.section-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}
	.section-head h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.new-link {
		color: var(--accent);
		font-size: 0.9rem;
		font-weight: 500;
	}
	.class-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.class-card {
		display: block;
		background: var(--bg-elevated);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		transition: background 0.15s;
	}
	.class-card:active {
		background: var(--bg-card);
	}
	.class-name {
		font-weight: 600;
		margin-bottom: 0.15rem;
	}
	.class-desc {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	.logout {
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border-radius: 10px;
		padding: 0.75rem;
		font-size: 0.9rem;
		font-weight: 500;
		align-self: flex-start;
		margin-top: 1rem;
	}
	.logout:active {
		background: var(--bg-card);
	}
</style>
