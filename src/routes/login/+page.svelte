<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<main>
	<div class="hero">
		<div class="logo">中</div>
		<h1>TSC Study</h1>
		<p class="subtitle">중국어 학습 PWA</p>
	</div>

	{#if form && 'sent' in form && form.sent}
		<div class="card sent">
			<div class="icon">📧</div>
			<h2>이메일을 확인하세요</h2>
			<p class="muted">
				<strong>{form.email}</strong>로<br />
				로그인 링크를 보냈습니다
			</p>
			<p class="hint">메일이 안 보이면 스팸함도 확인해주세요</p>
		</div>
	{:else}
		<form
			method="POST"
			class="card"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<label for="email">이메일</label>
			<input
				id="email"
				name="email"
				type="email"
				required
				autocomplete="email"
				inputmode="email"
				placeholder="you@example.com"
				value={form && 'email' in form ? (form.email ?? '') : ''}
			/>
			{#if form && 'error' in form && form.error}
				<p class="error">{form.error}</p>
			{/if}
			<button type="submit" disabled={submitting}>
				{submitting ? '전송 중…' : '로그인 링크 받기'}
			</button>
		</form>
	{/if}
</main>

<style>
	main {
		min-height: 100dvh;
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2rem;
		max-width: 420px;
		margin: 0 auto;
	}
	.hero {
		text-align: center;
	}
	.logo {
		font-family: 'PingFang SC', 'Hiragino Sans GB', sans-serif;
		font-size: 4.5rem;
		color: var(--accent);
		font-weight: 700;
		line-height: 1;
		margin-bottom: 0.75rem;
	}
	h1 {
		font-size: 2rem;
		margin: 0 0 0.25rem;
		letter-spacing: -0.02em;
		font-weight: 700;
	}
	.subtitle {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.95rem;
	}
	.card {
		background: var(--bg-elevated);
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 600;
	}
	input {
		background: var(--bg-card);
		border: 1px solid transparent;
		border-radius: 10px;
		padding: 0.875rem 1rem;
		font-size: 1rem;
		color: var(--text);
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}
	input:focus {
		border-color: var(--accent);
	}
	button {
		background: var(--accent);
		color: white;
		border-radius: 10px;
		padding: 0.875rem;
		font-size: 1rem;
		font-weight: 600;
		margin-top: 0.5rem;
		transition: opacity 0.15s;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: var(--accent);
		font-size: 0.85rem;
		margin: 0;
	}
	.sent {
		text-align: center;
		padding: 2rem 1.5rem;
		align-items: center;
	}
	.icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}
	.sent h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}
	.muted {
		margin: 0;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.hint {
		margin: 0;
		color: var(--text-tertiary);
		font-size: 0.85rem;
	}
</style>
