# Entity Relationship Diagram

---

## Diagram

```mermaid
erDiagram
  flows {
    uuid id PK
    text title
    text intro_message
    text outro_message
    text status "draft | published | unpublished | archived"
    uuid token UK "null until published"
    timestamptz created_at
    timestamptz published_at
    timestamptz archived_at
  }

  decision_modules {
    uuid id PK
    uuid flow_id FK
    int position
    text prompt_text
    bool allow_multi_select
    timestamptz created_at
  }

  cards {
    uuid id PK
    uuid decision_module_id FK
    int position
    text title
    text description
    text location
    text price_range "€ | €€ | €€€"
    text[] mood_tags
    text[] photo_urls
    timestamptz created_at
  }

  quiz_modules {
    uuid id PK
    uuid flow_id FK
    int position
    text title
    timestamptz created_at
  }

  quiz_questions {
    uuid id PK
    uuid quiz_module_id FK
    int position
    text question_text
    text[] options
    timestamptz created_at
  }

  selections {
    uuid id PK
    uuid flow_id FK
    text message "optional, from selector"
    timestamptz submitted_at
  }

  selection_answers {
    uuid id PK
    uuid selection_id FK
    uuid module_id "references decision_module or quiz_module"
    text module_type "decision | quiz"
    uuid[] chosen_card_ids "populated for decision modules"
    text chosen_option_text "populated for quiz modules"
  }

  flows ||--o{ decision_modules : "has"
  flows ||--o{ quiz_modules : "has"
  flows ||--o{ selections : "receives"

  decision_modules ||--o{ cards : "contains"

  quiz_modules ||--o{ quiz_questions : "contains"

  selections ||--o{ selection_answers : "composed of"
```

---

## Key Relationships

| Relationship | Cardinality | Notes |
|---|---|---|
| Flow → Decision Modules | 1 to many | A flow can have 0 or more decision modules |
| Flow → Quiz Modules | 1 to many | A flow can have 0 or more quiz modules |
| Decision Module → Cards | 1 to many | Minimum 2 cards required to be meaningful |
| Quiz Module → Quiz Questions | 1 to many | Minimum 1 question required |
| Flow → Selections | 1 to many | A published flow accumulates selections over time |
| Selection → Selection Answers | 1 to many | One answer row per module in the flow |

---

## Design Decisions

**Modules share a `position` space per flow** — decision modules and quiz modules both have a `position` field relative to their parent flow. The `FlowController` on the client merges both sets, sorted by position, to render the correct step order.

**`selection_answers.module_id` is untyped** — it references either `decision_modules.id` or `quiz_modules.id` depending on `module_type`. A true polymorphic FK is not supported in PostgreSQL; a check constraint ensures `module_type` is always set. This avoids the complexity of a union table.

**`photo_urls` is an array column** — each card stores an ordered array of Supabase Storage CDN URLs. This avoids a separate `card_photos` junction table for what is a simple ordered list.

**No soft-delete on modules/cards** — deleting a module or card is permanent. The flow must be in `draft` or `unpublished` status to edit, so there is no risk of deleting data that a selector is currently viewing.
