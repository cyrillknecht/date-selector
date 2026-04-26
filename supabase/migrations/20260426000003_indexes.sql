-- ─────────────────────────────────────────────
-- Indexes for common query patterns
-- ─────────────────────────────────────────────

-- Token lookup on every selector page load
create unique index flows_token_idx
  on public.flows(token)
  where token is not null;

-- Filter draft/archived from dashboard list
create index flows_status_idx
  on public.flows(status);

-- Ordered module fetch per flow (both module types)
create index decision_modules_flow_position_idx
  on public.decision_modules(flow_id, position);

create index quiz_modules_flow_position_idx
  on public.quiz_modules(flow_id, position);

-- Ordered card fetch per decision module
create index cards_module_position_idx
  on public.cards(decision_module_id, position);

-- Ordered question fetch per quiz module
create index quiz_questions_module_position_idx
  on public.quiz_questions(quiz_module_id, position);

-- Latest selections per flow (creator dashboard)
create index selections_flow_submitted_idx
  on public.selections(flow_id, submitted_at desc);

-- All answers for a given selection
create index selection_answers_selection_idx
  on public.selection_answers(selection_id);
