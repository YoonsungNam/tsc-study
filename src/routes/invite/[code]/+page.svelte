<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const sent = $derived(form && 'sent' in form ? form.sent : false);
	const sentEmail = $derived(form && 'email' in form ? (form.email ?? null) : null);
	const errorMsg = $derived(form && 'error' in form ? (form.error ?? null) : null);
	const inputEmail = $derived(form && 'email' in form ? (form.email ?? '') : '');
</script>

<main>
	{#if !data.preview}
		<div class="card error">
			<div class="icon">⚠️</div>
			<h1>유효하지 않은 초대 링크</h1>
			<p>이 링크는 존재하지 않거나 잘못된 코드입니다.</p>
			<p class="hint">강사에게 새 링크를 요청해주세요.</p>
			<a href="/" class="back-home">홈으로</a>
		</div>
	{:else if !data.preview.valid}
		<div class="card error">
			<div class="icon">⏰</div>
			<h1>만료된 초대 링크</h1>
			<p>이 링크는 만료되었거나 사용 횟수를 초과했습니다.</p>
			<p class="hint">강사에게 새 링크를 요청해주세요.</p>
			<a href="/" class="back-home">홈으로</a>
		</div>
	{:else}
		<div class="card">
			<div class="icon">🎉</div>
			<h1>클래스 초대</h1>
			<p class="join-info">
				<strong>{data.preview.instructor_name}</strong>님이<br />
				<strong class="class-name">{data.preview.class_name}</strong> 클래스에 초대했습니다.
			</p>

			{#if data.signedIn}
				<p class="hint">{data.email}으로 로그인되어 있습니다.</p>
				<form
					method="POST"
					action="?/redeem"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<button type="submit" disabled={submitting} class="primary">
						{submitting ? '가입 중…' : '이 클래스에 가입하기'}
					</button>
				</form>
			{:else if sent}
				<div class="sent">
					<div class="sent-icon">📧</div>
					<p><strong>{sentEmail}</strong>로 로그인 링크를 보냈습니다.</p>
					<p class="hint">메일의 링크를 클릭하면 자동으로 이 클래스에 가입됩니다.</p>
				</div>
			{:else}
				<p class="hint">가입할 이메일을 입력하세요. 비밀번호 없이 매직링크로 로그인합니다.</p>
				<form
					method="POST"
					action="?/signIn"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<input
						name="email"
						type="email"
						required
						autocomplete="email"
						inputmode="email"
						placeholder="you@example.com"
						value={inputEmail}
					/>
					<button type="submit" disabled={submitting} class="primary">
						{submitting ? '전송 중…' : '로그인 링크 받기'}
					</button>
				</form>
			{/if}

			{#if errorMsg}
				<p class="error-msg">{errorMsg}</p>
			{/if}
		</div>
	{/if}
</main>

<style>
	main {
		min-height: 100dvh;
		padding: max(2rem, var(--safe-top)) 1.5rem max(2rem, var(--safe-bottom));
		max-width: 460px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.card {
		background: var(--bg-elevated);
		border-radius: 16px;
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		text-align: center;
		align-items: center;
	}
	.icon {
		font-size: 3rem;
		line-height: 1;
	}
	.card h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.card p {
		margin: 0;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.card .hint {
		color: var(--text-tertiary);
		font-size: 0.85rem;
	}
	.join-info {
		font-size: 1rem;
		color: var(--text);
	}
	.class-name {
		color: var(--accent);
		font-size: 1.05rem;
	}
	.card form {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin-top: 0.5rem;
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
	.primary {
		background: var(--accent);
		color: white;
		border-radius: 10px;
		padding: 0.875rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error h1 {
		color: var(--text);
	}
	.back-home {
		color: var(--text-secondary);
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
	.sent {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		align-items: center;
	}
	.sent-icon {
		font-size: 2.25rem;
	}
	.error-msg {
		color: var(--accent);
		font-size: 0.85rem;
		margin: 0;
	}
</style>
