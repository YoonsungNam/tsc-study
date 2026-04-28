<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<main>
	<div class="hero">
		<h1>어떻게 시작하시겠어요?</h1>
		<p class="subtitle">{data.email}</p>
	</div>

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
		<button type="submit" name="role" value="instructor" class="role" disabled={submitting}>
			<div class="icon">📚</div>
			<div class="text">
				<h2>강사</h2>
				<p>음원을 업로드하고 클래스를 만들어 학생에게 공유합니다.</p>
			</div>
		</button>

		<button type="submit" name="role" value="student" class="role" disabled={submitting}>
			<div class="icon">🎧</div>
			<div class="text">
				<h2>학생</h2>
				<p>강사가 공유한 음원으로 가사를 보며 학습합니다.</p>
			</div>
		</button>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}
	</form>
</main>

<style>
	main {
		min-height: 100dvh;
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 2rem;
		max-width: 480px;
		margin: 0 auto;
	}
	.hero {
		text-align: center;
	}
	h1 {
		font-size: 1.75rem;
		margin: 0 0 0.25rem;
		letter-spacing: -0.02em;
		font-weight: 700;
	}
	.subtitle {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.95rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	.role {
		background: var(--bg-elevated);
		border: 2px solid transparent;
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		gap: 1rem;
		align-items: center;
		text-align: left;
		transition:
			border-color 0.15s,
			transform 0.05s;
		cursor: pointer;
	}
	.role:active:not(:disabled) {
		transform: scale(0.98);
		border-color: var(--accent);
	}
	.role:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.icon {
		font-size: 2.5rem;
		flex-shrink: 0;
		line-height: 1;
	}
	.text {
		flex: 1;
	}
	.role h2 {
		margin: 0 0 0.25rem;
		font-size: 1.1rem;
		font-weight: 600;
	}
	.role p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
		line-height: 1.4;
	}
	.error {
		color: var(--accent);
		font-size: 0.85rem;
		margin: 0.5rem 0 0;
		text-align: center;
	}
</style>
