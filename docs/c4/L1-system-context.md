# C4 Level 1 — System Context

Answers: **What does the system do, and who/what does it interact with?**

---

## Diagram

```mermaid
C4Context
  title System Context — Date Night Selector

  Person(creator, "Creator (Cyrill)", "Builds and manages date flows, views selections")
  Person(selector, "Selector (Girlfriend)", "Browses date options and submits her choice via a private link")

  System(app, "Date Night Selector", "Web application for curating and presenting romantic date options in an animated, interactive experience")

  System_Ext(supabase, "Supabase", "Managed PostgreSQL database, file storage, and authentication")
  System_Ext(resend, "Resend", "Transactional email delivery")
  System_Ext(vercel, "Vercel", "Hosting and edge delivery network")
  System_Ext(terraform_cloud, "Terraform Cloud", "Remote infrastructure state management")
  System_Ext(github, "GitHub", "Source control and CI/CD trigger")

  Rel(creator, app, "Creates flows, uploads photos, views submissions", "HTTPS / Browser")
  Rel(selector, app, "Opens private link, browses options, submits selection", "HTTPS / Browser")

  Rel(app, supabase, "Reads/writes data and files", "HTTPS / Supabase JS SDK")
  Rel(app, resend, "Sends selection notification email to creator", "HTTPS / Resend API")

  Rel(github, vercel, "Triggers deployment on push to main", "GitHub Integration")
  Rel(github, terraform_cloud, "Runs terraform plan/apply via GitHub Actions", "HTTPS / Terraform CLI")
  Rel(terraform_cloud, vercel, "Provisions project config and env vars", "HTTPS / Vercel API")
  Rel(terraform_cloud, supabase, "Provisions project and storage buckets", "HTTPS / Supabase Management API")
```

---

## Notes

- The selector has **no account**. Access is controlled by a secret UUID token embedded in the URL.
- The creator is the **only authenticated user** in the system. There is no multi-tenancy.
- Vercel and Supabase are external managed services — the application does not run its own servers or databases.
- GitHub Actions is the CI/CD engine; it delegates infrastructure state to Terraform Cloud.
