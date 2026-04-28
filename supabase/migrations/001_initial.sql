-- TSC Study: 초기 스키마
-- 강사가 클래스를 만들고 학생을 초대해 음원을 공유하는 학습 PWA
-- 적용: Supabase 대시보드 → SQL Editor에서 이 파일 전체를 실행

--------------------------------------------------------------------------------
-- profiles: auth.users 확장
--------------------------------------------------------------------------------

create type user_role as enum ('instructor', 'student');

create table profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null unique,
	display_name text,
	role user_role not null default 'student',
	created_at timestamptz not null default now()
);

-- 새 유저 생성 시 자동으로 profiles 행 생성
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	insert into public.profiles (id, email)
	values (new.id, new.email);
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function handle_new_user();

--------------------------------------------------------------------------------
-- classes: 강사의 클래스 (콘텐츠 라이브러리 단위)
--------------------------------------------------------------------------------

create table classes (
	id uuid primary key default gen_random_uuid(),
	instructor_id uuid not null references profiles(id) on delete cascade,
	name text not null,
	description text,
	created_at timestamptz not null default now()
);

create index classes_instructor_idx on classes(instructor_id);

--------------------------------------------------------------------------------
-- memberships: 학생 ↔ 클래스 연결
--------------------------------------------------------------------------------

create table memberships (
	class_id uuid not null references classes(id) on delete cascade,
	student_id uuid not null references profiles(id) on delete cascade,
	joined_at timestamptz not null default now(),
	primary key (class_id, student_id)
);

create index memberships_student_idx on memberships(student_id);

--------------------------------------------------------------------------------
-- invites: 강사 발급 초대코드
--------------------------------------------------------------------------------

create table invites (
	id uuid primary key default gen_random_uuid(),
	code text not null unique,
	class_id uuid not null references classes(id) on delete cascade,
	created_by uuid not null references profiles(id) on delete cascade,
	max_uses int,                        -- null = 무제한
	used_count int not null default 0,
	expires_at timestamptz,
	created_at timestamptz not null default now()
);

create index invites_class_idx on invites(class_id);

--------------------------------------------------------------------------------
-- tracks: 개별 음원
--------------------------------------------------------------------------------

create type transcript_status as enum ('pending', 'transcribing', 'ready', 'error');

create table tracks (
	id uuid primary key default gen_random_uuid(),
	class_id uuid not null references classes(id) on delete cascade,
	uploaded_by uuid references profiles(id) on delete set null,
	title text not null,
	audio_key text not null,            -- R2 object key (signed URL은 동적 생성)
	duration_sec numeric,
	transcript jsonb,
	transcript_status transcript_status not null default 'pending',
	published boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index tracks_class_idx on tracks(class_id);
create index tracks_published_idx on tracks(class_id, published);

create function set_updated_at()
returns trigger language plpgsql as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger tracks_updated_at
	before update on tracks
	for each row execute function set_updated_at();

--------------------------------------------------------------------------------
-- playlists: 강사 큐레이션
--------------------------------------------------------------------------------

create table playlists (
	id uuid primary key default gen_random_uuid(),
	class_id uuid not null references classes(id) on delete cascade,
	name text not null,
	description text,
	created_at timestamptz not null default now()
);

create index playlists_class_idx on playlists(class_id);

create table playlist_tracks (
	playlist_id uuid not null references playlists(id) on delete cascade,
	track_id uuid not null references tracks(id) on delete cascade,
	position int not null,
	primary key (playlist_id, track_id)
);

create index playlist_tracks_position_idx on playlist_tracks(playlist_id, position);

--------------------------------------------------------------------------------
-- favorites: 학생 즐겨찾기
--------------------------------------------------------------------------------

create table favorites (
	student_id uuid not null references profiles(id) on delete cascade,
	track_id uuid not null references tracks(id) on delete cascade,
	added_at timestamptz not null default now(),
	primary key (student_id, track_id)
);

--------------------------------------------------------------------------------
-- RLS (Row Level Security) 정책
--------------------------------------------------------------------------------

alter table profiles enable row level security;
alter table classes enable row level security;
alter table memberships enable row level security;
alter table invites enable row level security;
alter table tracks enable row level security;
alter table playlists enable row level security;
alter table playlist_tracks enable row level security;
alter table favorites enable row level security;

-- profiles: 본인만
create policy "profiles: own row select" on profiles for select using (auth.uid() = id);
create policy "profiles: own row update" on profiles for update using (auth.uid() = id);

-- classes: 강사 본인 또는 멤버 학생만 SELECT, 강사만 CUD
create policy "classes: instructor or member select" on classes for select
	using (
		auth.uid() = instructor_id
		or exists (select 1 from memberships m where m.class_id = classes.id and m.student_id = auth.uid())
	);

create policy "classes: instructor insert" on classes for insert
	with check (auth.uid() = instructor_id);

create policy "classes: instructor update" on classes for update
	using (auth.uid() = instructor_id);

create policy "classes: instructor delete" on classes for delete
	using (auth.uid() = instructor_id);

-- memberships: 본인 또는 클래스 강사만 SELECT, 강사 DELETE 가능
-- INSERT는 redeem_invite RPC만 (security definer)
create policy "memberships: self or instructor select" on memberships for select
	using (
		auth.uid() = student_id
		or exists (select 1 from classes c where c.id = memberships.class_id and c.instructor_id = auth.uid())
	);

create policy "memberships: instructor remove" on memberships for delete
	using (exists (select 1 from classes c where c.id = memberships.class_id and c.instructor_id = auth.uid()));

create policy "memberships: self leave" on memberships for delete
	using (auth.uid() = student_id);

-- invites: 강사만
create policy "invites: instructor manage" on invites for all
	using (auth.uid() = created_by) with check (auth.uid() = created_by);

-- tracks: 강사 본인 = 전체, 학생 = published만
create policy "tracks: instructor select all" on tracks for select
	using (exists (select 1 from classes c where c.id = tracks.class_id and c.instructor_id = auth.uid()));

create policy "tracks: member select published" on tracks for select
	using (
		published = true
		and exists (select 1 from memberships m where m.class_id = tracks.class_id and m.student_id = auth.uid())
	);

create policy "tracks: instructor insert" on tracks for insert
	with check (exists (select 1 from classes c where c.id = class_id and c.instructor_id = auth.uid()));

create policy "tracks: instructor update" on tracks for update
	using (exists (select 1 from classes c where c.id = tracks.class_id and c.instructor_id = auth.uid()));

create policy "tracks: instructor delete" on tracks for delete
	using (exists (select 1 from classes c where c.id = tracks.class_id and c.instructor_id = auth.uid()));

-- playlists: 클래스 멤버(강사 포함) SELECT, 강사 CUD
create policy "playlists: class members select" on playlists for select
	using (
		exists (
			select 1 from classes c
			where c.id = playlists.class_id
				and (
					c.instructor_id = auth.uid()
					or exists (select 1 from memberships m where m.class_id = c.id and m.student_id = auth.uid())
				)
		)
	);

create policy "playlists: instructor manage" on playlists for all
	using (exists (select 1 from classes c where c.id = playlists.class_id and c.instructor_id = auth.uid()))
	with check (exists (select 1 from classes c where c.id = class_id and c.instructor_id = auth.uid()));

-- playlist_tracks: 상위 playlist 정책에 위임
create policy "playlist_tracks: select via playlist" on playlist_tracks for select
	using (exists (select 1 from playlists p where p.id = playlist_tracks.playlist_id));

create policy "playlist_tracks: instructor manage" on playlist_tracks for all
	using (
		exists (
			select 1 from playlists p
			join classes c on c.id = p.class_id
			where p.id = playlist_tracks.playlist_id and c.instructor_id = auth.uid()
		)
	)
	with check (
		exists (
			select 1 from playlists p
			join classes c on c.id = p.class_id
			where p.id = playlist_id and c.instructor_id = auth.uid()
		)
	);

-- favorites: 본인만
create policy "favorites: own select" on favorites for select using (auth.uid() = student_id);
create policy "favorites: own insert" on favorites for insert with check (auth.uid() = student_id);
create policy "favorites: own delete" on favorites for delete using (auth.uid() = student_id);

--------------------------------------------------------------------------------
-- redeem_invite: 초대코드로 멤버십 생성하는 보안 함수
--   - 인증된 사용자만 호출 가능
--   - SECURITY DEFINER로 RLS 우회하여 멤버십 INSERT
--------------------------------------------------------------------------------

create function redeem_invite(invite_code text)
returns uuid                              -- 가입한 class_id 반환
language plpgsql
security definer
set search_path = public
as $$
declare
	v_invite invites%rowtype;
begin
	if auth.uid() is null then
		raise exception 'Authentication required';
	end if;

	select * into v_invite from invites where code = invite_code for update;

	if not found then
		raise exception 'Invalid invite code';
	end if;

	if v_invite.expires_at is not null and v_invite.expires_at < now() then
		raise exception 'Invite expired';
	end if;

	if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
		raise exception 'Invite usage limit reached';
	end if;

	insert into memberships (class_id, student_id)
	values (v_invite.class_id, auth.uid())
	on conflict do nothing;

	update invites set used_count = used_count + 1 where id = v_invite.id;

	return v_invite.class_id;
end;
$$;

grant execute on function redeem_invite(text) to authenticated;
