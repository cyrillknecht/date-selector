-- ─────────────────────────────────────────────
-- Row-level security: enable on all tables,
-- then define per-table policies.
-- Creator = authenticated role (Supabase Auth JWT)
-- Selector = anon role (token validated at app layer)
-- ─────────────────────────────────────────────

alter table public.flows             enable row level security;
alter table public.decision_modules  enable row level security;
alter table public.cards             enable row level security;
alter table public.quiz_modules      enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.selections        enable row level security;
alter table public.selection_answers enable row level security;

-- ── flows ─────────────────────────────────────

-- Creator: full access
create policy "creator_all_flows"
  on public.flows for all
  to authenticated
  using (true)
  with check (true);

-- Selector: read published flows only.
-- Token matching is enforced at the API route layer before any query;
-- this policy ensures anon can never read draft/archived flows even directly.
create policy "selector_read_published_flows"
  on public.flows for select
  to anon
  using (status = 'published');

-- ── decision_modules ──────────────────────────

create policy "creator_all_decision_modules"
  on public.decision_modules for all
  to authenticated
  using (true)
  with check (true);

create policy "selector_read_decision_modules"
  on public.decision_modules for select
  to anon
  using (
    exists (
      select 1 from public.flows f
      where f.id = flow_id and f.status = 'published'
    )
  );

-- ── cards ─────────────────────────────────────

create policy "creator_all_cards"
  on public.cards for all
  to authenticated
  using (true)
  with check (true);

create policy "selector_read_cards"
  on public.cards for select
  to anon
  using (
    exists (
      select 1 from public.decision_modules dm
      join public.flows f on f.id = dm.flow_id
      where dm.id = decision_module_id and f.status = 'published'
    )
  );

-- ── quiz_modules ──────────────────────────────

create policy "creator_all_quiz_modules"
  on public.quiz_modules for all
  to authenticated
  using (true)
  with check (true);

create policy "selector_read_quiz_modules"
  on public.quiz_modules for select
  to anon
  using (
    exists (
      select 1 from public.flows f
      where f.id = flow_id and f.status = 'published'
    )
  );

-- ── quiz_questions ────────────────────────────

create policy "creator_all_quiz_questions"
  on public.quiz_questions for all
  to authenticated
  using (true)
  with check (true);

create policy "selector_read_quiz_questions"
  on public.quiz_questions for select
  to anon
  using (
    exists (
      select 1 from public.quiz_modules qm
      join public.flows f on f.id = qm.flow_id
      where qm.id = quiz_module_id and f.status = 'published'
    )
  );

-- ── selections ────────────────────────────────

-- Creator: read all selections
create policy "creator_read_selections"
  on public.selections for select
  to authenticated
  using (true);

-- Selector: insert only — cannot read back their own submission
create policy "selector_insert_selections"
  on public.selections for insert
  to anon
  with check (
    exists (
      select 1 from public.flows f
      where f.id = flow_id and f.status = 'published'
    )
  );

-- ── selection_answers ─────────────────────────

create policy "creator_read_selection_answers"
  on public.selection_answers for select
  to authenticated
  using (true);

create policy "selector_insert_selection_answers"
  on public.selection_answers for insert
  to anon
  with check (
    exists (
      select 1 from public.selections s
      join public.flows f on f.id = s.flow_id
      where s.id = selection_id and f.status = 'published'
    )
  );
