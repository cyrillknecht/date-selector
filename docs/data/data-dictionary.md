# Data Dictionary

Complete reference for all database tables, columns, types, and constraints.

---

## Table: `flows`

The top-level entity. Represents one complete date selection experience shared with the selector.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `title` | `text` | NO | — | NOT NULL, max 100 chars | Internal name for the creator's reference. Not shown to the selector. |
| `intro_message` | `text` | YES | NULL | max 500 chars | Personal message shown to the selector on the landing page before they start. |
| `outro_message` | `text` | YES | NULL | max 500 chars | Message shown on the confirmation screen after submission. |
| `status` | `text` | NO | `'draft'` | CHECK IN ('draft','published','unpublished','archived') | Lifecycle state. Controls selector access and editability. |
| `token` | `uuid` | YES | NULL | UNIQUE | Secret URL token. Generated on publish. NULL while in draft. |
| `created_at` | `timestamptz` | NO | `now()` | — | Creation timestamp (UTC). |
| `published_at` | `timestamptz` | YES | NULL | — | Timestamp of first publish. Not updated on re-publish. |
| `archived_at` | `timestamptz` | YES | NULL | — | Timestamp of archive. NULL if not archived. |

**RLS:** Creator full access. Anon SELECT where `status = 'published'` and token matches.

---

## Table: `decision_modules`

A step in the flow that presents the selector with cards to choose from.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `flow_id` | `uuid` | NO | — | FK → flows.id ON DELETE CASCADE | Parent flow |
| `position` | `integer` | NO | — | NOT NULL, CHECK >= 0 | Display order within the flow (shared space with quiz_modules). |
| `prompt_text` | `text` | NO | — | NOT NULL, max 200 chars | Question shown above the cards. E.g. "Where would you like to eat?" |
| `allow_multi_select` | `boolean` | NO | `false` | NOT NULL | If true, selector can pick more than one card. |
| `created_at` | `timestamptz` | NO | `now()` | — | Creation timestamp (UTC). |

**RLS:** Creator full access. Anon SELECT via published flow join.

---

## Table: `cards`

An individual option within a decision module.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `decision_module_id` | `uuid` | NO | — | FK → decision_modules.id ON DELETE CASCADE | Parent module |
| `position` | `integer` | NO | — | NOT NULL, CHECK >= 0 | Display order within the module. |
| `title` | `text` | NO | — | NOT NULL, max 100 chars | Card headline. E.g. "Dinner at Kronenhalle" |
| `description` | `text` | YES | NULL | max 500 chars | Short description of the option. |
| `location` | `text` | YES | NULL | max 200 chars | Place name or address. |
| `price_range` | `text` | YES | NULL | CHECK IN ('€','€€','€€€') | Rough cost indicator. |
| `mood_tags` | `text[]` | NO | `'{}'` | — | Array of mood labels. E.g. ['cozy', 'romantic', 'indoor'] |
| `photo_urls` | `text[]` | NO | `'{}'` | — | Ordered array of Supabase Storage CDN URLs. First URL is the cover photo. |
| `created_at` | `timestamptz` | NO | `now()` | — | Creation timestamp (UTC). |

**RLS:** Creator full access. Anon SELECT via published flow join.

---

## Table: `quiz_modules`

A step in the flow that asks the selector a series of preference questions.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `flow_id` | `uuid` | NO | — | FK → flows.id ON DELETE CASCADE | Parent flow |
| `position` | `integer` | NO | — | NOT NULL, CHECK >= 0 | Display order within the flow (shared space with decision_modules). |
| `title` | `text` | NO | — | NOT NULL, max 100 chars | Title shown at the top of the quiz section. |
| `created_at` | `timestamptz` | NO | `now()` | — | Creation timestamp (UTC). |

**RLS:** Creator full access. Anon SELECT via published flow join.

---

## Table: `quiz_questions`

An individual question within a quiz module.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `quiz_module_id` | `uuid` | NO | — | FK → quiz_modules.id ON DELETE CASCADE | Parent quiz module |
| `position` | `integer` | NO | — | NOT NULL, CHECK >= 0 | Display order within the quiz module. |
| `question_text` | `text` | NO | — | NOT NULL, max 200 chars | The question. E.g. "Fancy or casual tonight?" |
| `options` | `text[]` | NO | — | NOT NULL, array length CHECK >= 2 | Answer choices. E.g. ['Fancy', 'Casual'] |
| `created_at` | `timestamptz` | NO | `now()` | — | Creation timestamp (UTC). |

**RLS:** Creator full access. Anon SELECT via published flow join.

---

## Table: `selections`

A single completed submission from the selector.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `flow_id` | `uuid` | NO | — | FK → flows.id ON DELETE RESTRICT | The flow this selection was made for. ON DELETE RESTRICT prevents losing selections if a flow is archived. |
| `message` | `text` | YES | NULL | max 1000 chars | Optional personal message from the selector to the creator. |
| `submitted_at` | `timestamptz` | NO | `now()` | — | Submission timestamp (UTC). |

**RLS:** Creator SELECT all. Anon INSERT only (no SELECT back). No UPDATE or DELETE for anon.

---

## Table: `selection_answers`

Individual answers within a selection — one row per module answered.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK | Unique identifier |
| `selection_id` | `uuid` | NO | — | FK → selections.id ON DELETE CASCADE | Parent selection |
| `module_id` | `uuid` | NO | — | NOT NULL | References either decision_modules.id or quiz_modules.id (polymorphic). |
| `module_type` | `text` | NO | — | CHECK IN ('decision','quiz') | Discriminator for the polymorphic module_id. |
| `chosen_card_ids` | `uuid[]` | YES | NULL | — | For decision modules: array of selected card IDs. NULL for quiz answers. |
| `chosen_option_text` | `text` | YES | NULL | max 200 chars | For quiz modules: the text of the selected option. NULL for decision answers. |

**RLS:** Creator SELECT all. Anon INSERT only. No UPDATE or DELETE for anon.

---

## Indexes

| Table | Column(s) | Type | Rationale |
|---|---|---|---|
| `flows` | `token` | UNIQUE BTREE | Fast token lookup on every selector page load |
| `flows` | `status` | BTREE | Filters draft/archived flows from dashboard list |
| `decision_modules` | `flow_id, position` | BTREE | Ordered module fetch per flow |
| `quiz_modules` | `flow_id, position` | BTREE | Ordered module fetch per flow |
| `cards` | `decision_module_id, position` | BTREE | Ordered card fetch per module |
| `quiz_questions` | `quiz_module_id, position` | BTREE | Ordered question fetch per module |
| `selections` | `flow_id, submitted_at` | BTREE | Creator dashboard: latest selections per flow |
| `selection_answers` | `selection_id` | BTREE | Fetch all answers for a given selection |
