<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let creating = $state(false);
	let copied = $state(false);

	// Server returns newest-first, so [0] is the latest invite to highlight.
	const latestInvite = $derived(data.invites[0] ?? null);

	function inviteUrl(code: string): string {
		return `${page.url.origin}/invite/${code}`;
	}

	async function copy(code: string) {
		await navigator.clipboard.writeText(inviteUrl(code));
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<main>
	<a href="/instructor" class="back">← 대시보드</a>

	<header>
		<h1>{data.klass.name}</h1>
		{#if data.klass.description}
			<p class="description">{data.klass.description}</p>
		{/if}
	</header>

	<section class="invite-section">
		<h2>학생 초대</h2>

		{#if latestInvite}
			<div class="invite-card">
				<div class="invite-label">초대 링크</div>
				<div class="invite-url">{inviteUrl(latestInvite.code)}</div>
				<button type="button" onclick={() => copy(latestInvite.code)} class="copy">
					{copied ? '✓ 복사됨' : '복사'}
				</button>
			</div>
			<p class="hint">학생에게 위 링크를 공유하면 가입 시 이 클래스에 자동으로 합류합니다.</p>

			{#if data.invites.length > 1}
				<details class="older">
					<summary>이전 초대 링크 {data.invites.length - 1}개</summary>
					<ul>
						{#each data.invites.slice(1) as invite (invite.id)}
							<li>
								<code>{invite.code}</code>
								<span class="meta"
									>{new Date(invite.created_at).toLocaleDateString('ko-KR')} · 사용 {invite.used_count}회</span
								>
							</li>
						{/each}
					</ul>
				</details>
			{/if}

			<form
				method="POST"
				action="?/createInvite"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						await update();
						creating = false;
					};
				}}
			>
				<button type="submit" disabled={creating} class="secondary">
					{creating ? '발급 중…' : '+ 새 초대 링크'}
				</button>
			</form>
		{:else}
			<p class="empty">아직 발급된 초대 링크가 없습니다.</p>
			<form
				method="POST"
				action="?/createInvite"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						await update();
						creating = false;
					};
				}}
			>
				<button type="submit" disabled={creating} class="primary">
					{creating ? '발급 중…' : '초대 링크 만들기'}
				</button>
			</form>
		{/if}

		{#if form && 'error' in form && form.error}
			<p class="error">{form.error}</p>
		{/if}
	</section>

	<section class="placeholder">
		<p>이 클래스에 음원을 업로드하는 기능은 다음 PR에서 추가됩니다.</p>
	</section>
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
	.back {
		color: var(--text-secondary);
		font-size: 0.9rem;
		align-self: flex-start;
	}
	header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.description {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.95rem;
		line-height: 1.5;
	}
	.invite-section {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	.invite-section h2 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.invite-card {
		background: var(--bg-elevated);
		border-radius: 14px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.invite-label {
		font-size: 0.8rem;
		color: var(--text-tertiary);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.invite-url {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.95rem;
		color: var(--text);
		word-break: break-all;
	}
	.copy {
		background: var(--accent);
		color: white;
		border-radius: 8px;
		padding: 0.5rem 0.875rem;
		font-size: 0.85rem;
		font-weight: 600;
		align-self: flex-start;
	}
	.hint {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.85rem;
		line-height: 1.5;
	}
	.empty {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}
	.older {
		margin-top: 0.5rem;
	}
	.older summary {
		color: var(--text-secondary);
		font-size: 0.85rem;
		cursor: pointer;
		padding: 0.5rem 0;
	}
	.older ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.older li {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 0.625rem 0.875rem;
		font-size: 0.85rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.older code {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		color: var(--text);
	}
	.older .meta {
		color: var(--text-tertiary);
		font-size: 0.8rem;
	}
	.primary,
	.secondary {
		border-radius: 10px;
		padding: 0.75rem 1rem;
		font-size: 0.95rem;
		font-weight: 600;
		align-self: flex-start;
	}
	.primary {
		background: var(--accent);
		color: white;
	}
	.secondary {
		background: var(--bg-elevated);
		color: var(--text-secondary);
	}
	.primary:disabled,
	.secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: var(--accent);
		font-size: 0.85rem;
		margin: 0;
	}
	.placeholder {
		background: var(--bg-elevated);
		border-radius: 14px;
		padding: 1rem 1.25rem;
		color: var(--text-secondary);
		font-size: 0.85rem;
	}
	.placeholder p {
		margin: 0;
	}
</style>
