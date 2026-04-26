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

  C->>B: Navigates to /creator/dashboard
  C->>B: Submits "New Flow" form
  B->>N: Server Action — createFlow()
  N->>N: Auth check via SSR cookie
  N->>DB: INSERT flow { status: 'draft', ... }
  DB-->>N: flow.id
  N-->>B: redirect to /creator/flows/:id

  loop For each module added
    C->>B: Clicks "Add Decision Module" or "Add Quiz Module"
    B->>N: Server Action — createDecisionModule() / createQuizModule()
    N->>DB: INSERT decision_module or quiz_module
    DB-->>N: module.id
    N-->>B: revalidatePath (page refreshes)
  end

  loop For each card added
    C->>B: Fills card fields, uploads photos via PhotoUploader
    B->>N: POST /api/upload (multipart)
    N->>N: Validate session cookie
    N->>ST: Upload file to date-photos bucket (service role)
    ST-->>N: publicUrl
    N-->>B: { url: publicUrl }
    C->>B: Submits "Save card" form
    B->>N: Server Action — updateCard() with photo_urls
    N->>DB: UPDATE card
    DB-->>N: OK
    N-->>B: revalidatePath
  end

  C->>B: Clicks "Publish"
  B->>N: Server Action — publishFlow()
  N->>N: Generate crypto.randomUUID() as token
  N->>DB: UPDATE flow SET status = 'published', token = :token
  DB-->>N: OK
  N-->>B: revalidatePath (share URL appears)

  C->>B: Clicks "Copy link"
  B->>B: navigator.clipboard.writeText(shareUrl)
  C->>C: Pastes link and sends to girlfriend
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
