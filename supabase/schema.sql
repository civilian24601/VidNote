create extension if not exists "uuid-ossp";

-- USERS TABLE
create table users (
  id uuid primary key default auth.uid(),
  email text not null unique,
  username text not null unique,
  full_name text,
  role text check (role in ('student', 'teacher')) not null default 'student',
  instruments text[],
  experience_level text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table users enable row level security;
create policy "Users can view self" on users for select using (auth.uid() = id);
create policy "Users can insert self" on users for insert with check (auth.uid() = id);
create policy "Users can update self" on users for update using (true) with check (auth.uid() = id);

-- VIDEOS TABLE
create table videos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  piece_name text,
  composer text,
  practice_goals text,
  url text not null,
  thumbnail_url text,
  duration int,
  is_public boolean default false,
  video_status text default 'processing' check (video_status in ('processing', 'ready', 'error')),
  created_at timestamp with time zone default now()
);

alter table videos enable row level security;
create policy "Users can view own videos" on videos for select using (auth.uid() = user_id);
create policy "Users can insert videos" on videos for insert with check (auth.uid() = user_id);
create policy "Users can update own videos" on videos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own videos" on videos for delete using (auth.uid() = user_id);

-- COMMENTS TABLE
create table comments (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  timestamp int not null,
  category text,
  parent_comment_id uuid references comments(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table comments enable row level security;
create policy "Users can view own comments" on comments for select using (auth.uid() = user_id);
create policy "Users can insert comments" on comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments" on comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- VIDEO SHARING TABLE
create table video_shares (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade,
  shared_with uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(video_id, shared_with)
);

alter table video_shares enable row level security;
create policy "Viewer or owner can view shares" on video_shares for select using (
  auth.uid() = shared_with or auth.uid() = (select user_id from videos where id = video_id)
);
create policy "Owner can insert shares" on video_shares for insert with check (
  auth.uid() = (select user_id from videos where id = video_id)
);
create policy "Owner can delete shares" on video_shares for delete using (
  auth.uid() = (select user_id from videos where id = video_id)
);

-- RELATIONSHIPS TABLE
create table relationships (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references users(id) on delete cascade,
  teacher_id uuid references users(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'active', 'declined')),
  created_at timestamp with time zone default now()
);

alter table relationships enable row level security;
create policy "Users can view their relationships" on relationships for select using (
  auth.uid() = student_id or auth.uid() = teacher_id
);
create policy "Users can insert relationship requests" on relationships for insert with check (
  auth.uid() = student_id
);
create policy "Users can update own relationships" on relationships for update using (
  auth.uid() = student_id or auth.uid() = teacher_id
) with check (
  auth.uid() = student_id or auth.uid() = teacher_id
);
create policy "Users can delete own relationships" on relationships for delete using (
  auth.uid() = student_id or auth.uid() = teacher_id
);

-- NOTIFICATIONS TABLE
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  type text not null,
  title text not null,
  content text not null,
  related_id uuid,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table notifications enable row level security;
create policy "Users can read their notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can insert notifications" on notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own notifications" on notifications for delete using (auth.uid() = user_id);