# Supabase Edge Functions — Deployment Guide

> All commands use the official **Supabase CLI** (`supabase`).
> Docs: https://supabase.com/docs/guides/cli

---

## Prerequisites

### Install the Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# npm (any OS)
npm install -g supabase

# Verify
supabase --version
```

### Log in to Supabase

```bash
supabase login
```

This opens a browser window. Authorize the CLI with your Supabase account.

### Link your project

```bash
cd /path/to/your/project-root
supabase link --project-ref jelhetcesvqjyfhnuxyb
```

You'll be prompted for your **database password** (the one you set when creating the Supabase project). If you forgot it, reset it in the Supabase Dashboard under **Settings → Database**.

---

## 1. Required Local Folder Structure

The Supabase CLI expects edge functions under `supabase/functions/`:

```
your-project-root/
├── supabase/
│   ├── config.toml                              ← already exists
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   ├── db.ts
│       │   └── openai.ts
│       ├── mentor-chat/
│       │   └── index.ts
│       ├── build-student-avatar/
│       │   └── index.ts
│       ├── generate-learning-path/
│       │   └── index.ts
│       ├── analyze-records/
│       │   └── index.ts
│       └── generate-report/
│           └── index.ts
```

---

## 2. Copy Source Files Into the Correct Structure

Your source code currently lives in `edge-functions/`. Copy it into `supabase/functions/`:

```bash
# Run from your project root (where supabase/ and edge-functions/ both exist)

# Create directories
mkdir -p supabase/functions/_shared
mkdir -p supabase/functions/mentor-chat
mkdir -p supabase/functions/build-student-avatar
mkdir -p supabase/functions/generate-learning-path
mkdir -p supabase/functions/analyze-records
mkdir -p supabase/functions/generate-report

# Copy shared utilities
cp edge-functions/_shared/cors.ts    supabase/functions/_shared/cors.ts
cp edge-functions/_shared/db.ts      supabase/functions/_shared/db.ts
cp edge-functions/_shared/openai.ts  supabase/functions/_shared/openai.ts

# Copy each function
cp edge-functions/mentor-chat/index.ts             supabase/functions/mentor-chat/index.ts
cp edge-functions/build-student-avatar/index.ts     supabase/functions/build-student-avatar/index.ts
cp edge-functions/generate-learning-path/index.ts   supabase/functions/generate-learning-path/index.ts
cp edge-functions/analyze-records/index.ts           supabase/functions/analyze-records/index.ts
cp edge-functions/generate-report/index.ts           supabase/functions/generate-report/index.ts
```

### Verify the copy worked

```bash
find supabase/functions -name "*.ts" | sort
```

Expected output:

```
supabase/functions/_shared/cors.ts
supabase/functions/_shared/db.ts
supabase/functions/_shared/openai.ts
supabase/functions/analyze-records/index.ts
supabase/functions/build-student-avatar/index.ts
supabase/functions/generate-learning-path/index.ts
supabase/functions/generate-report/index.ts
supabase/functions/mentor-chat/index.ts
```

---

## 3. Set Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-your-real-openai-key-here
```

**Rules:**
- The key **must** start with `sk-` (a real OpenAI API key)
- No quotes around the value
- No spaces around the `=`
- This is the **only** secret required — `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by Supabase

### Verify secrets

```bash
supabase secrets list
```

You should see `OPENAI_API_KEY` in the list (value is hidden).

---

## 4. Deploy All 5 Functions

Deploy them one at a time, in this order:

```bash
supabase functions deploy mentor-chat --no-verify-jwt
supabase functions deploy build-student-avatar --no-verify-jwt
supabase functions deploy generate-learning-path --no-verify-jwt
supabase functions deploy analyze-records --no-verify-jwt
supabase functions deploy generate-report --no-verify-jwt
```

**Why `--no-verify-jwt`?** These functions handle their own auth or are called from the frontend with the anon key. The `config.toml` also sets `verify_jwt = false` for each, but the CLI flag ensures it during deploy.

### What success looks like

Each deploy command prints:

```
Version X of function mentor-chat has been deployed
```

If you see that for all 5, you're done deploying.

---

## 5. Verify Deployment

```bash
supabase functions list
```

Expected output:

```
┌──────────────────────────┬────────┬───────────────────────┐
│ Name                     │ Status │ Created At            │
├──────────────────────────┼────────┼───────────────────────┤
│ mentor-chat              │ Active │ 2026-04-01T...        │
│ build-student-avatar     │ Active │ 2026-04-01T...        │
│ generate-learning-path   │ Active │ 2026-04-01T...        │
│ analyze-records          │ Active │ 2026-04-01T...        │
│ generate-report          │ Active │ 2026-04-01T...        │
└──────────────────────────┴────────┴───────────────────────┘
```

All 5 must show **Active**.

---

## 6. Smoke Tests

Replace `YOUR_ANON_KEY` with your project's anon/public key.
Find it in the Supabase Dashboard: **Settings → API → Project API keys → anon/public**.

### Smoke Test 1: mentor-chat

```bash
curl -i -X POST \
  https://jelhetcesvqjyfhnuxyb.supabase.co/functions/v1/mentor-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "messages": [{"sender": "student", "text": "Why is the sky blue?"}],
    "studentProfile": {"name": "Test", "age": 10, "gradeBand": "3-5"}
  }'
```

**Expected success response** (HTTP 200):

```json
{
  "message": "Have you ever noticed that...",
  "plan": {
    "topic": "light_scattering",
    "intent": "...",
    "strategy": "ask_to_discover",
    "concept": "Rayleigh scattering",
    "domains": ["science"]
  },
  "nextChoices": [...],
  "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "turnNumber": 1,
  "skillsTracked": {"science": 1},
  "xpEarned": 5,
  "breakSuggested": false
}
```

The `message` field contains the AI mentor's natural-language response. The `plan` field contains the hidden teaching plan (used by the frontend for tracking).

### Smoke Test 2: build-student-avatar

```bash
curl -i -X POST \
  https://jelhetcesvqjyfhnuxyb.supabase.co/functions/v1/build-student-avatar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "studentId": "test-user-00000000-0000-0000-0000-000000000001",
    "basicInfo": {"name": "TestKid", "age": 10, "gradeLevel": "5"},
    "personalityAnswers": [],
    "learningPrefAnswers": [],
    "interests": ["Science", "Gaming", "Space"],
    "strengths": ["curiosity", "persistence"],
    "aptitudeResults": {"reading": 0.6, "math": 0.7, "logic": 0.65}
  }'
```

**Expected success response** (HTTP 200):

```json
{
  "success": true,
  "studentId": "test-user-00000000-0000-0000-0000-000000000001",
  "tablesWritten": 10,
  "aiSynthesis": true
}
```

**Note:** This writes to 10 database tables. If those tables don't exist yet, you'll get a 500 error with a message like `relation "student_identity_profiles" does not exist`. That means you need to run your database migrations first.

### Smoke Test 3: generate-learning-path

```bash
curl -i -X POST \
  https://jelhetcesvqjyfhnuxyb.supabase.co/functions/v1/generate-learning-path \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "topic": "Volcanoes",
    "studentName": "TestKid",
    "age": 10,
    "gradeLevel": "5",
    "interests": ["Science", "Nature"],
    "learningStyle": "visual"
  }'
```

**Expected success response** (HTTP 200):

```json
{
  "modules": [
    {
      "title": "The Day the Mountain Exploded",
      "subject_display": "History & Science",
      "subject_color": "bg-amber-100 text-amber-700",
      "subject_tags": ["Science", "History"],
      "time_estimate_minutes": 15,
      "description": "TestKid, volcanoes have destroyed entire civilizations...",
      "activity_type": "explore"
    },
    { "...3 more modules..." }
  ],
  "tomorrow_teaser": "Tomorrow we'll explore...",
  "path_summary": "A deep dive into volcanoes..."
}
```

The `modules` array always has exactly 4 items.

---

## 7. Common Errors and Fixes

### `Error: fetch failed` or `OpenAI API error`

**Cause:** `OPENAI_API_KEY` is missing, invalid, or expired.

**Fix:**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key
# Then redeploy the failing function:
supabase functions deploy mentor-chat --no-verify-jwt
```

### `401 Unauthorized` / `Invalid JWT`

**Cause:** Wrong or missing `Authorization` header in your curl command.

**Fix:** Use your project's **anon key** (not the service role key):
```bash
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Find it: Supabase Dashboard → **Settings → API → Project API keys → anon / public**.

### `500 Internal Server Error` with `relation "..." does not exist`

**Cause:** The database tables haven't been created yet.

**Fix:** Run your SQL migrations to create all required tables before calling functions that write to the database (mentor-chat, build-student-avatar, analyze-records, generate-report).

**Check logs:**
```bash
supabase functions logs mentor-chat --limit 20
supabase functions logs build-student-avatar --limit 20
```

### `Error: Cannot find project`

**Cause:** You haven't linked the project yet.

**Fix:**
```bash
supabase link --project-ref jelhetcesvqjyfhnuxyb
```

### `Error: Access token not provided`

**Cause:** You haven't logged in to the CLI.

**Fix:**
```bash
supabase login
```

### `Error: Function not found` (during deploy)

**Cause:** The `index.ts` file is not in the expected location.

**Fix:** Verify the file exists:
```bash
ls -la supabase/functions/mentor-chat/index.ts
```

Each function **must** have an `index.ts` directly inside its named folder.

### Deploy succeeds but function returns `500` with no useful error

**Check the function logs:**
```bash
supabase functions logs mentor-chat --limit 50
supabase functions logs build-student-avatar --limit 50
supabase functions logs generate-learning-path --limit 50
supabase functions logs analyze-records --limit 50
supabase functions logs generate-report --limit 50
```

---

## 8. Do I Need to Publish the Frontend First?

**No. Deploy and test the backend first.**

The order is:

1. Run database migrations (create tables)
2. Set secrets (`supabase secrets set OPENAI_API_KEY=...`)
3. Deploy all 5 functions (`supabase functions deploy ...`)
4. Smoke test each function with curl
5. **Only after all 5 pass** → publish the frontend

The frontend calls these functions at runtime. If the functions aren't deployed and working, the frontend will show errors. Get the backend solid first.

---

## Architecture Reference

| Function | AI Model(s) | DB Writes | Purpose |
|----------|-------------|-----------|---------|
| `mentor-chat` | gpt-4o-mini (planner) + gpt-4o (mentor) | 17 tables per turn | Adaptive tutoring: safety check → hidden plan → visible response → background storage |
| `build-student-avatar` | gpt-4o-mini (synthesis) | 10 normalized tables + legacy | Onboarding: scores assessments, maps interests, AI synthesis, writes full avatar |
| `generate-learning-path` | gpt-4o-mini | 0 (stateless) | Creates personalized 4-module learning paths from a topic |
| `analyze-records` | gpt-4o-mini | 0 (read-only) | Analyzes learning sessions, mastery, engagement for insights |
| `generate-report` | gpt-4o-mini | 1 (saves report) | Parent portal: 11 actions including weekly reports, goals, comparisons |

All functions use `_shared/openai.ts` which calls `https://api.openai.com/v1/chat/completions` directly with `Authorization: Bearer ${OPENAI_API_KEY}`.

---

## Quick Reference: All Deploy Commands

```bash
# From project root
supabase login
supabase link --project-ref jelhetcesvqjyfhnuxyb
supabase secrets set OPENAI_API_KEY=sk-your-key-here
supabase functions deploy mentor-chat --no-verify-jwt
supabase functions deploy build-student-avatar --no-verify-jwt
supabase functions deploy generate-learning-path --no-verify-jwt
supabase functions deploy analyze-records --no-verify-jwt
supabase functions deploy generate-report --no-verify-jwt
supabase functions list
supabase secrets list
```
