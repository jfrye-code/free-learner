# EDGE FUNCTION DEPLOYMENT GUIDE
## FreeLearner.ai — Beginner-Friendly, Copy-Paste Checklist
### Last Updated: March 31, 2026

---

## BEFORE YOU START

You need:
- A Mac computer with Terminal access
- Your Supabase account credentials (email + password)
- Your project's **anon key** (found in Supabase Dashboard → Settings → API → `anon` `public`)
- Your **OpenAI API key** (from https://platform.openai.com/api-keys)
- ~10 minutes

Your project reference ID is: `jelhetcesvqjyfhnuxyb`
Your project URL is: `https://jelhetcesvqjyfhnuxyb.supabase.co`

---

## STEP 1: INSTALL THE SUPABASE CLI

Yes, you need to install it first. Open **Terminal** (press `Cmd + Space`, type "Terminal", hit Enter).

Copy and paste this command:

```bash
brew install supabase/tap/supabase
```

**Don't have Homebrew?** Install it first with this one-liner:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then run the `brew install supabase/tap/supabase` command above.

### Verify it installed:

```bash
supabase --version
```

You should see something like `Supabase CLI 1.x.x`. Any version number is fine.

---

## STEP 2: LOG IN TO SUPABASE

```bash
supabase login
```

This will open your browser. Log in with your Supabase account. Once you see **"Token saved to ~/.supabase/access-token"** (or similar success message) in Terminal, continue.

**If the browser doesn't open automatically**, Terminal will show a URL — copy and paste it into your browser manually.

---

## STEP 3: NAVIGATE TO YOUR PROJECT FOLDER

```bash
cd /path/to/your/project
```

Replace `/path/to/your/project` with the actual folder where this codebase lives. For example, if it's on your Desktop:

```bash
cd ~/Desktop/freelearner
```

**How to check you're in the right folder:**

```bash
ls package.json
```

If it prints `package.json`, you're in the right place. If it says "No such file", you're in the wrong folder.

---

## STEP 4: LINK YOUR SUPABASE PROJECT

```bash
supabase link --project-ref jelhetcesvqjyfhnuxyb
```

It may ask for your **database password**. Enter it when prompted.

**Expected output:** Something like `Finished supabase link.`

**If you don't know your database password:** Go to your Supabase Dashboard → Project Settings → Database → Reset database password.

---

## STEP 5: VERIFY YOUR EDGE FUNCTIONS EXIST LOCALLY

Before deploying, make sure the function folders exist:

```bash
ls supabase/functions/
```

You should see these 5 folders:

```
mentor-chat/
build-student-avatar/
generate-learning-path/
analyze-records/
generate-report/
```

Each folder should contain an `index.ts` file. You can verify with:

```bash
ls supabase/functions/mentor-chat/index.ts
ls supabase/functions/build-student-avatar/index.ts
ls supabase/functions/generate-learning-path/index.ts
ls supabase/functions/analyze-records/index.ts
ls supabase/functions/generate-report/index.ts
```

All 5 should print the filename back. If any says "No such file", that function's source code is missing.

---

## STEP 6: SET YOUR OPENAI API KEY

This is the **most important step**. All 5 tutoring functions call OpenAI directly and need this key at runtime.

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

Replace `sk-your-openai-api-key-here` with your actual OpenAI API key.

> **Where to get your key:** https://platform.openai.com/api-keys
> **Important:** The key must start with `sk-`. If it doesn't, it's not an OpenAI key.

### Verify the secret is set:

```bash
supabase secrets list
```

You should see `OPENAI_API_KEY` in the output.

> **Note:** These functions use OpenAI directly (`https://api.openai.com/v1/chat/completions`) with `Authorization: Bearer` header. They do NOT use any gateway or proxy service.

---

## STEP 7: DEPLOY ALL 5 FUNCTIONS (ONE AT A TIME)

Run these **one at a time**, waiting for each to finish before running the next.

### Function 1: mentor-chat

```bash
supabase functions deploy mentor-chat --no-verify-jwt
```

**Expected output:**
```
Version 1 of function mentor-chat has been deployed
```
(or "Created function mentor-chat" or "Updated function mentor-chat")

Did you see a success message? → Continue to the next function.
Got an error? → Jump to the Troubleshooting section below.

---

### Function 2: build-student-avatar

```bash
supabase functions deploy build-student-avatar --no-verify-jwt
```

Wait for success message → Continue.

---

### Function 3: generate-learning-path

```bash
supabase functions deploy generate-learning-path --no-verify-jwt
```

Wait for success message → Continue.

---

### Function 4: analyze-records

```bash
supabase functions deploy analyze-records --no-verify-jwt
```

Wait for success message → Continue.

---

### Function 5: generate-report

```bash
supabase functions deploy generate-report --no-verify-jwt
```

Wait for success message → Continue.

---

## STEP 8: VERIFY ALL 5 DEPLOYED SUCCESSFULLY

Run this to list all deployed functions:

```bash
supabase functions list
```

You should see a table with all 5 functions. Look for today's date in the `Updated at` column:

| Name                    | Status | Updated at         |
|-------------------------|--------|--------------------|
| mentor-chat             | Active | 2026-03-31 ...     |
| build-student-avatar    | Active | 2026-03-31 ...     |
| generate-learning-path  | Active | 2026-03-31 ...     |
| analyze-records         | Active | 2026-03-31 ...     |
| generate-report         | Active | 2026-03-31 ...     |

If any function is missing from this list, re-run its deploy command from Step 7.

---

## STEP 9: SMOKE TEST — RUN THIS IMMEDIATELY

This curl command calls the `mentor-chat` function directly to verify it's alive and can respond.

**Before running:** Replace `YOUR_ANON_KEY` below with your project's anon key.
Find it at: **Supabase Dashboard → Settings → API → Project API keys → `anon` `public`**

```bash
curl -i -X POST \
  'https://jelhetcesvqjyfhnuxyb.supabase.co/functions/v1/mentor-chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"action": "health-check"}'
```

### How to read the response:

| What you see                                      | What it means                                              |
|---------------------------------------------------|------------------------------------------------------------|
| `HTTP/2 200` + any JSON body                      | Function is deployed and running                           |
| `{"status":"ok"}` or a JSON response with content | Function works and can process requests                    |
| `{"error":"OPENAI_API_KEY not configured"}`        | Function runs but can't find the secret — re-run Step 6    |
| `HTTP/2 404` or `"Relay Error"`                   | Function not found — re-run its deploy command from Step 7 |
| `HTTP/2 401` or `"Invalid JWT"`                   | Wrong anon key — double-check it from your dashboard       |
| Connection refused / timeout                      | Wrong project URL — verify your project ref                |

### Full end-to-end app test:

1. Open your FreeLearner.ai app in the browser
2. Log in as a test student
3. Navigate to the **AI Chat** page
4. Type a message like: **"Hi, can you teach me about volcanoes?"**
5. If you receive a thoughtful AI response → **ALL FUNCTIONS ARE WORKING**

---

## TROUBLESHOOTING

### "Command not found: supabase"

Homebrew didn't add it to your PATH. Try:

```bash
export PATH="/opt/homebrew/bin:$PATH"
supabase --version
```

If that works, make it permanent:

```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Error: Cannot find project" or "Project not linked"

Your project ref might be wrong. Double-check at: **Supabase Dashboard → Project Settings → General → Reference ID**.

Then re-link:

```bash
supabase link --project-ref YOUR_CORRECT_REF
```

### "Error: Cannot find function" or "Missing function file"

The function source code isn't in `supabase/functions/<name>/index.ts`. Make sure:
1. You're in the correct project directory (Step 3)
2. The `supabase/functions/` folder exists with all 5 subfolders (Step 5)

### "Error: Invalid JWT" or "Unauthorized" during deploy

Your login token expired. Re-login:

```bash
supabase login
```

Then retry the deploy command.

### Deploy succeeds but function returns "Missing API key" at runtime

The OPENAI_API_KEY secret wasn't set. Fix it:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

No need to redeploy — secrets are read at runtime, not at deploy time.

### "Error: Docker is not running"

Some Supabase CLI versions require Docker for local development, but **NOT for remote deploys**. The `--no-verify-jwt` flag (already included in all commands above) should bypass this. If you still see this error, try:

```bash
supabase functions deploy mentor-chat --no-verify-jwt --legacy-bundle
```

### On Windows instead of Mac?

Replace the `brew install` step with:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Or download the binary directly from: https://github.com/supabase/cli/releases

All other commands (`supabase login`, `supabase link`, `supabase functions deploy`, etc.) are the same on Windows.

---

## QUICK-REFERENCE CHECKLIST

Copy this into a text file and check off each step as you go:

```
[ ] 1. Installed Supabase CLI          → brew install supabase/tap/supabase
[ ] 2. Verified CLI version            → supabase --version
[ ] 3. Logged in                       → supabase login
[ ] 4. Navigated to project folder     → cd ~/Desktop/freelearner
[ ] 5. Linked project                  → supabase link --project-ref jelhetcesvqjyfhnuxyb
[ ] 6. Verified function folders exist → ls supabase/functions/
[ ] 7. Set OPENAI_API_KEY              → supabase secrets set OPENAI_API_KEY=sk-...
[ ] 8. Deployed mentor-chat            → supabase functions deploy mentor-chat --no-verify-jwt
[ ] 9. Deployed build-student-avatar   → supabase functions deploy build-student-avatar --no-verify-jwt
[ ] 10. Deployed generate-learning-path → supabase functions deploy generate-learning-path --no-verify-jwt
[ ] 11. Deployed analyze-records       → supabase functions deploy analyze-records --no-verify-jwt
[ ] 12. Deployed generate-report       → supabase functions deploy generate-report --no-verify-jwt
[ ] 13. Verified all 5 deployed        → supabase functions list
[ ] 14. Smoke test passed              → curl test returned 200 OK
[ ] 15. App test passed                → Sent chat message, got AI response
```

**Estimated time:** 5–10 minutes if everything goes smoothly.

---

## WHAT EACH FUNCTION DOES AFTER DEPLOYMENT

| Function                 | Purpose                                        | OpenAI Model(s)                     |
|--------------------------|------------------------------------------------|-------------------------------------|
| `mentor-chat`            | All student AI conversations                   | `gpt-4o-mini` (planning) + `gpt-4o` (responses) |
| `build-student-avatar`   | Synthesizes student profile during onboarding  | `gpt-4o-mini`                       |
| `generate-learning-path` | Creates personalized learning paths            | `gpt-4o-mini`                       |
| `analyze-records`        | Analyzes student learning records              | `gpt-4o-mini`                       |
| `generate-report`        | Generates weekly parent reports                | `gpt-4o-mini`                       |

All functions read `OPENAI_API_KEY` via `Deno.env.get("OPENAI_API_KEY")` at runtime and call `https://api.openai.com/v1/chat/completions` with the `Authorization: Bearer` header.

---

## PREVIOUS "FETCH FAILED" BUG — ROOT CAUSE

The previous "AI generation error: fetch failed" was caused by a **secret/endpoint mismatch**:
- The code was calling `https://api.openai.com/v1/chat/completions` (OpenAI endpoint)
- But the `OPENAI_API_KEY` secret contained a FastRouter gateway key (not a valid OpenAI key)
- OpenAI rejected the request, causing the fetch to fail

**The fix:** Ensure `OPENAI_API_KEY` contains a real OpenAI API key starting with `sk-`. The code is correct — the secret value was wrong.
