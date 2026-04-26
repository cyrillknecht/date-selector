# Sequence Diagram — Creator Building and Publishing a Flow

---

## Happy Path

```mermaid
sequenceDiagram
  actor C as Creator (Cyrill)
  participant B as Browser
  participant N as Next.js Server
  participant DB as Supabase DB
  participant ST as Supabase Storage

  C->>B: Navigates to /creator/flows/new
  B->>N: POST /api/flows { title, intro_message, outro_message }
  N->>N: Validate JWT (middleware)
  N->>DB: INSERT flow { status: 'draft', ... }
  DB-->>N: flow.id
  N-->>B: 201 { id: flow.id }
  B->>B: Redirect to /creator/flows/:id

  loop For each module added
    C->>B: Adds Decision or Quiz module
    B->>N: POST /api/flows/:id/modules { type, position, prompt }
    N->>DB: INSERT decision_module or quiz_module
    DB-->>N: module.id
    N-->>B: 201 { id: module.id }
  end

  loop For each card added to a Decision Module
    C->>B: Fills card fields (title, description, tags, price range)
    C->>B: Selects photo(s) from local disk

    B->>N: POST /api/upload { filename, contentType }
    N->>N: Validate JWT
    N->>ST: Generate signed upload URL (expires: 60s)
    ST-->>N: { signedUrl, publicUrl }
    N-->>B: { signedUrl, publicUrl }

    B->>ST: PUT photo file directly to signedUrl
    ST-->>B: 200 OK

    B->>N: POST /api/flows/:id/modules/:moduleId/cards { ...fields, photoUrls: [publicUrl] }
    N->>DB: INSERT card
    DB-->>N: card.id
    N-->>B: 201 { id: card.id }
  end

  C->>B: Reorders modules via drag-and-drop
  B->>N: PATCH /api/flows/:id/modules/order { orderedIds: [...] }
  N->>DB: UPDATE position on each module
  DB-->>N: OK
  N-->>B: 200

  C->>B: Clicks "Preview" — opens preview modal
  Note over B: Selector experience renders in an iframe<br/>using the draft flow data (creator session bypasses published check)

  C->>B: Satisfied — clicks "Publish"
  B->>N: POST /api/flows/:id/publish
  N->>N: Validate JWT
  N->>N: Generate crypto.randomUUID() as token
  N->>DB: UPDATE flow SET status = 'published', token = :token
  DB-->>N: OK
  N-->>B: 200 { shareUrl: "https://app.com/:token" }

  B->>B: Share modal opens with URL + QR code
  C->>C: Copies link and sends to girlfriend
```

---

## Error Cases

| Scenario | Behaviour |
|---|---|
| JWT expired during editing | Middleware refreshes automatically; if refresh fails, redirect to login with a "session expired" message |
| Photo upload fails (storage error) | Signed URL step returns error; browser shows inline "Upload failed, try again" under the photo field |
| Publish with no modules | Server returns 422 with `{ error: "A flow must have at least one module before publishing" }` |
| Publish with a card that has no photo | Warning shown in preview; creator can still publish (photo is optional per card) |
| Network drop during card save | Optimistic UI reverts; unsaved changes indicator shown; user retries manually |
