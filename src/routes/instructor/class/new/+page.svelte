<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<main>
	<a href="/instructor" class="back">← 대시보드</a>

	<header>
		<h1>새 클래스</h1>
	</header>

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label for="name">클래스 이름</label>
		<input
			id="name"
			name="name"
			type="text"
			required
			maxlength="80"
			placeholder="예: 초급 중국어 6월반"
			value={form?.name ?? ''}
		/>

		<label for="description">설명 (선택)</label>
		<textarea
			id="description"
			name="description"
			rows="3"
			maxlength="500"
			placeholder="이 클래스의 학습 내용이나 대상을 짧게..."
			value={form?.description ?? ''}
		></textarea>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<button type="submit" disabled={submitting}>
			{submitting ? '만드는 중…' : '만들기'}
		</button>
	</form>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.back {
		color: var(--text-secondary);
		font-size: 0.9rem;
		align-self: flex-start;
	}
	header h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	label {
		font-size: 0.85rem;
		color: var(--text-secondary);
		font-weight: 600;
		margin-top: 0.5rem;
	}
	input,
	textarea {
		background: var(--bg-elevated);
		border: 1px solid transparent;
		border-radius: 10px;
		padding: 0.875rem 1rem;
		font-size: 1rem;
		color: var(--text);
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
		resize: vertical;
	}
	input:focus,
	textarea:focus {
		border-color: var(--accent);
	}
	button[type='submit'] {
		background: var(--accent);
		color: white;
		border-radius: 10px;
		padding: 0.875rem;
		font-size: 1rem;
		font-weight: 600;
		margin-top: 1rem;
	}
	button[type='submit']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: var(--accent);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
