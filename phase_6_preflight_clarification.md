# PHASE 6 PRE-FLIGHT CLARIFICATION

## 1. NASA API KEY / NEXT_PUBLIC AUDIT

**A. Is NEXT_PUBLIC_NASA_API_KEY actually referenced anywhere?**
Yes.

**B. Which exact file(s) consume it?**
`frontend/components/dashboard/services/api/nasaApi.js`

**C. Is the request made:**
Directly from the browser → NASA. The `nasaApi.js` fetches data directly from `https://power.larc.nasa.gov/api/...` using the browser's `fetch`.

**D. Is the NASA API key actually sensitive?**
No. The NASA POWER API provides open science data. The key is simply a rate-limiting token for high-volume public usage, not a billed infrastructure secret.

**E. If it is sensitive, does the current architecture accidentally expose it?**
N/A (Not sensitive).

**F. If it is not sensitive, explain why it is safe to expose.**
The key grants no administrative access, incurs no billing charges, and accesses purely public meteorological data. It is intended by NASA to be used in client-side applications.

**Recommendation:**
**OPTION A: Keep NEXT_PUBLIC_NASA_API_KEY**
*Reasoning: It functions exactly as intended for open-data rate-limiting. Moving it behind the backend would introduce unnecessary proxy overhead for open data.*

---

## 2. CLOUD RUN NETWORKING REALITY CHECK

### Frontend
- **Public?** Yes.
- **Authentication required?** No.
- **How does browser discover Bridge URL?** `process.env.NEXT_PUBLIC_BRIDGE_API_URL` injected at build time.
- **Build-time or runtime URL?** Build-time.
- **CORS requirements?** The Bridge must explicitly allow the Frontend's deployed origin.

### Bridge
- **Public?** Yes.
- **Authentication required?** No (unauthenticated REST).
- **How does it discover internal engines?** Environment variables (`WATER_ENGINE_URL`, `HEAT_ENGINE_URL`, etc.).

### Water, Heat, Continuity, Agents
- **Public?** No (Intended).
- **Internal ingress?** Yes (Required to prevent public access).
- **IAM authentication?** No. The Bridge makes plain HTTP POST requests without generating or attaching GCP IAM identity tokens.
- **Invoked by Bridge using what mechanism?** Plain unauthenticated `httpx.post()`.

---

## 3. CLOUD RUN AUTHENTICATION MODEL

Given that the current codebase makes plain HTTP requests without attaching IAM tokens, the intended production architecture must be:

**OPTION C: Public Bridge + private internal services + unauthenticated internal ingress**

For each internal service (Water, Heat, Continuity, Agents):
- **Caller:** Bridge
- **Target:** Engine Service
- **Authentication:** None
- **Authorization:** None
- **Ingress:** Internal
- **URL source:** Environment variable (`*_ENGINE_URL`)

---

## 4. DO NOT ASSUME VPC

A VPC **IS ACTUALLY REQUIRED** if we strictly deploy the existing code.

**Reasoning:**
- The Bridge is public.
- The internal engines (Water, Heat, etc.) must use "Internal Ingress" because they lack authentication.
- In Google Cloud Run, a public service cannot route traffic to an "Internal Ingress" service over the standard internet gateway. Traffic to "Internal Ingress" services *must* originate from a VPC network.
- Therefore, to route traffic from Bridge to the engines without modifying the Bridge code to attach IAM tokens, the Bridge must be equipped with a **Serverless VPC Access connector** (or Direct VPC Egress).

*External dependencies (Supabase, NASA, Planetary Computer) all require normal public internet egress, which works fine alongside VPC egress.*

---

## 5. CLOUD RUN PORT MODEL

| Service | Current Port | Uses $PORT? | Cloud Run Safe? | Required Change |
|---|---:|---|---|---|
| Frontend | 3000 | Yes (via Next.js) | Yes | None |
| Bridge | 8000 | No | No | Change CMD or use `gcloud run deploy --port 8000` |
| Water | 8001 | No | No | Change CMD or use `gcloud run deploy --port 8001` |
| Heat | 8002 | No | No | Change CMD or use `gcloud run deploy --port 8002` |
| Continuity | 8003 | No | No | Change CMD or use `gcloud run deploy --port 8003` |
| Agents | 8004 | No | No | Change CMD or use `gcloud run deploy --port 8004` |

*Note: The Python backend Dockerfiles hardcode specific ports in their `CMD` arrays (e.g., `--port 8000`). Cloud Run injects the `$PORT` environment variable (default 8080).*

---

## 6. FRONTEND ENVIRONMENT MODEL

`NEXT_PUBLIC_BRIDGE_API_URL` is consumed at **build time**.
- **Is it embedded during `next build`?** Yes. Next.js statically replaces `process.env.NEXT_PUBLIC_*` occurrences during `npm run build`.
- **Can it be changed after the image is built?** No.
- **Does deployment require rebuilding the frontend for each environment?** Yes. Staging and Production require separate Docker builds.
- **Is there currently a runtime configuration mechanism?** No.

---

## 7. SUPABASE PRODUCTION MODEL

- **Which services access Supabase?** Bridge and Agents.
- **Which key each service uses?** `SUPABASE_KEY` environment variable.
- **Whether service-role access is required?** No. The `backend/schema.sql` defines Row Level Security (RLS) policies as `FOR SELECT USING (true)` and `FOR INSERT WITH CHECK (true)`, meaning the anonymous key has full read/write access to these tables.
- **Whether browser access is required?** No. Frontend code contains no active Supabase queries.
- **Whether RLS is still meaningful for browser-facing tables?** No, RLS is effectively bypassed/open.
- **Whether database migrations are versioned?** No, they are flat dumps (`schema.sql`, `schema_snapshots.sql`).
- **Whether production schema can be reproduced?** Yes, by manually executing the SQL scripts.

---

## 8. FINAL PHASE 6 DEPENDENCY LIST

### MUST FIX BEFORE PHASE 6
- **Architecture/VPC Decision:** Decide whether to provision a VPC to support unauthenticated "Internal Ingress", or modify the Bridge codebase to attach IAM identity tokens to allow secure "Public Ingress" for internal engines.
- **Port Binding:** Update Dockerfiles to `CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT` (or plan to strictly override via deployment flags).

### MUST CONFIGURE DURING PHASE 6
- GCP Project, Billing, and IAM.
- Artifact Registry provisioning.
- Secret Manager provisioning for `SUPABASE_KEY` and `GOOGLE_API_KEY`.
- Supabase production instance creation and manual SQL schema execution.

### OPTIONAL HARDENING
- Secure Supabase RLS (currently allows all inserts/selects).
- Refactor Frontend to use a runtime configuration endpoint to avoid rebuilding the image per environment.

### HUMAN DECISIONS REQUIRED
- **VPC vs IAM Auth:** Will we pay the cost/complexity of a VPC, or modify the Bridge Python code?
- GCP Region selection.
- Domain name allocation and Cloud Run domain mapping.

---

## 9. FINAL VERDICT

🟡 **READY FOR PHASE 6 PLANNING, BUT NOT IMPLEMENTATION**

Phase 6 implementation is blocked from immediately executing `gcloud run deploy` commands due to a fundamental networking contradiction in the current codebase: The internal engines require "Internal Ingress" to remain private, but the Bridge lacks the VPC egress infrastructure required to reach "Internal Ingress" Cloud Run services. Furthermore, the Dockerfiles do not natively consume the Cloud Run `$PORT` variable. 

These infrastructure vs. codebase discrepancies must be definitively planned and resolved (either via Terraform VPC provisioning or minor code updates) before deployment execution begins.
