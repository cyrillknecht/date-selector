-- ─────────────────────────────────────────────
-- Initial schema: all application tables
-- ─────────────────────────────────────────────

-- flows: top-level entity for a date selection experience
create table public.flows (
  id              uuid primary key default gen_random_uuid(),
  title           text not null check (char_length(title) <= 100),
  intro_message   text check (char_length(intro_message) <= 500),
  outro_message   text check (char_length(outro_message) <= 500),
  status          text not null default 'draft'
                    check (status in ('draft','published','unpublished','archived')),
  token           uuid unique,
  created_at      timestamptz not null default now(),
  published_at    timestamptz,
  archived_at     timestamptz
);

-- decision_modules: a step presenting cards to choose from
create table public.decision_modules (
  id                uuid primary key default gen_random_uuid(),
  flow_id           uuid not null references public.flows(id) on delete cascade,
  position          integer not null check (position >= 0),
  prompt_text       text not null check (char_length(prompt_text) <= 200),
  allow_multi_select boolean not null default false,
  created_at        timestamptz not null default now()
);

-- cards: an individual option within a decision module
create table public.cards (
  id                    uuid primary key default gen_random_uuid(),
  decision_module_id    uuid not null references public.decision_modules(id) on delete cascade,
  position              integer not null check (position >= 0),
  title                 text not null check (char_length(title) <= 100),
  description           text check (char_length(description) <= 500),
  location              text check (char_length(location) <= 200),
  price_range           text check (price_range in ('€','€€','€€€')),
  mood_tags             text[] not null default '{}',
  photo_urls            text[] not null default '{}',
  created_at            timestamptz not null default now()
);

-- quiz_modules: a step presenting preference questions
create table public.quiz_modules (
  id          uuid primary key default gen_random_uuid(),
  flow_id     uuid not null references public.flows(id) on delete cascade,
  position    integer not null check (position >= 0),
  title       text not null check (char_length(title) <= 100),
  created_at  timestamptz not null default now()
);

-- quiz_questions: individual questions within a quiz module
create table public.quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_module_id  uuid not null references public.quiz_modules(id) on delete cascade,
  position        integer not null check (position >= 0),
  question_text   text not null check (char_length(question_text) <= 200),
  options         text[] not null check (array_length(options, 1) >= 2),
  created_at      timestamptz not null default now()
);

-- selections: a completed submission from the selector
create table public.selections (
  id            uuid primary key default gen_random_uuid(),
  flow_id       uuid not null references public.flows(id) on delete restrict,
  message       text check (char_length(message) <= 1000),
  submitted_at  timestamptz not null default now()
);

-- selection_answers: individual answers within a selection
create table public.selection_answers (
  id                  uuid primary key default gen_random_uuid(),
  selection_id        uuid not null references public.selections(id) on delete cascade,
  module_id           uuid not null,
  module_type         text not null check (module_type in ('decision','quiz')),
  chosen_card_ids     uuid[],
  chosen_option_text  text check (char_length(chosen_option_text) <= 200)
);
