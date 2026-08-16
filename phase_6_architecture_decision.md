# CLIMALENZ — PHASE 6 ARCHITECTURE DECISION GATE

## 1. Executive Verdict

**Phase 6 is ready for implementation, pending alignment on the decisions below.**
The architecture requires a Cloud Run VPC connector to safely network the public Bridge to the private internal microservices without modifying application code. The Supabase policies are currently intentionally open for anonymous reads/writes, which is unacceptable for production and must be locked down to service-role keys for backend access. 

---

## 2. DECISION 1 — CLOUD RUN SERVICE-TO-SERVICE NETWORKING

### Option Comparison

**OPTION A — PRIVATE INTERNAL INGRESS + VPC**
- **Architecture**: Public Bridge → VPC Serverless Access Connector → Private Internal Cloud Run engines.
- **Code Changes**: None. Uses existing `httpx.post()`.
- **Infra Changes**: Requires provisioning a Serverless VPC Access connector (or Direct VPC Egress).
- **Security**: Network-level boundary. Engines drop any traffic not originating from the VPC.
- **Maintainability**: High. Code stays simple.
- **Cost**: Low to Moderate (VPC connector has a baseline cost, Direct VPC egress is cheaper if available).

**OPTION B — AUTHENTICATED SERVICE-TO-SERVICE IAM**
- **Architecture**: Public Bridge → IAM Authenticated Request → Publicly Routable (but IAM protected) Cloud Run engines.
- **Code Changes**: Significant. Bridge `httpx` clients must be rewritten to use Google Auth libraries (`google-auth`) to fetch and inject OIDC identity tokens into headers for every request.
- **Infra Changes**: Requires precise IAM bindings allowing the Bridge Service Account to invoke the Engine Service Accounts. No VPC needed.
- **Security**: Application-level boundary. Identity-based trust.
- **Maintainability**: Lower. The code becomes highly coupled to Google Cloud IAM semantics, breaking local reproducibility without mock tokens.

### Recommendation
**OPTION A — PRIVATE INTERNAL INGRESS + VPC (Direct VPC Egress)**

**Why?**
The core mandate is `PRESERVE > VERIFY > IMPROVE`. Option B breaks the architectural invariant that the backend is environment-agnostic by tightly coupling the Python code to Google Cloud IAM token generation. Option A preserves the exact current `httpx` code, ensuring local development remains identical to production. Google Cloud Run now supports "Direct VPC Egress", which removes the need for a costly standalone connector, making Option A both the simplest code path and highly secure.

---

## 3. DECISION 2 — SUPABASE SECURITY MODEL

### Current Audit
- **Tables**: `agent_traces`, `agent_chat_memory`, `assessment_snapshots`.
- **Current Policies**: `FOR SELECT USING (true)` and `FOR INSERT WITH CHECK (true)`.
- **Browser Access**: None. The frontend does not currently query Supabase.
- **Backend Access**: Only Bridge and Agents use `SUPABASE_KEY`.

### Recommendation
**OPTION B — Keep database access backend-only but tighten RLS and use service-role credentials exclusively server-side.**

**Why?**
There is **no** realistic requirement for anonymous INSERTs from the public internet. The frontend never talks to Supabase. Leaving `INSERT WITH CHECK (true)` on the public Anon key exposes the database to arbitrary data injection, which would poison the Last Known Good (LKG) cache.
The smallest safe change is:
1. Revoke the open RLS policies (delete them or set them to `false`).
2. Provide the backend Bridge and Agent services with the Supabase `service_role` key (via the `SUPABASE_KEY` environment variable). The `service_role` key naturally bypasses RLS, preserving Phase 3 persistence and LKG behavior perfectly without needing complex granular row policies.

---

## 4. DECISION 3 — CLOUD RUN PORTS

### Recommendation
**OPTION B — Keep fixed internal ports and override them using: `gcloud run deploy --port ...`**

**Why?**
Modifying the Dockerfile `CMD` to `CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT` breaks local `docker run` ergonomics unless you always explicitly pass `-e PORT=8000`. By keeping the Dockerfile as `--port 8000`, the container runs perfectly out-of-the-box locally. When deploying to Cloud Run, we simply inform the platform of our chosen port (`gcloud run deploy bridge-engine --port 8000`), and Cloud Run will correctly route traffic to it. This preserves the local developer experience.

---

## 5. DECISION 4 — FRONTEND BUILD-TIME URL

### Recommendation
**OPTION A — Keep build-time configuration.**

**Why?**
Introducing runtime configuration requires building a Next.js custom server or an API route proxy just to serve environment variables to the browser at runtime, adding significant architectural complexity. Since we are targeting a single staging/production pipeline initially, rebuilding the lightweight frontend Docker image per environment is standard Next.js practice and the smallest safe architecture.

---

## 6. FINAL DECISION MATRIX

| Decision | Option | Recommendation | Why | Code Change | Infra Change | Risk |
|---|---|---|---|---|---|---|
| 1. Cloud Run Networking | Option A | VPC (Direct Egress) | Preserves environment-agnostic Python code. | None | Add Direct VPC Egress | Low |
| 2. Supabase Security | Option B | `service_role` Key | Frontend has no DB access. Drops injection risk. | None (Config only) | Drop open RLS policies | Low |
| 3. Cloud Run Ports | Option B | `gcloud ... --port 80xx` | Preserves `docker run` local ergonomics. | None | Deployment flag | None |
| 4. Frontend Config | Option A | Build-time `.env` | Standard Next.js behavior. Simplest architecture. | None | CI/CD build matrix | Low |

---

## 7. PHASE 6 IMPLEMENTATION SEQUENCE

**PHASE 6.0**
GCP Project & IAM Provisioning (Service Accounts)
        ↓
**PHASE 6.1**
Artifact Registry Provisioning
        ↓
**PHASE 6.2**
Secrets Manager (Supabase Service Role, Gemini, NASA)
        ↓
**PHASE 6.3**
Supabase Security (Drop open RLS policies)
        ↓
**PHASE 6.4**
VPC Network / Subnet Provisioning
        ↓
**PHASE 6.5**
Deploy Internal Engines (Water, Heat, Continuity, Agents) with Internal Ingress
        ↓
**PHASE 6.6**
Deploy Bridge (Public, Direct VPC Egress, targeting Internal Engines)
        ↓
**PHASE 6.7**
Deploy Frontend (Public, targeting Bridge)
        ↓
**PHASE 6.8**
E2E Staging Verification

---

## 8. REQUIRED HUMAN DECISIONS / EXTERNAL DEPENDENCIES

1. **GCP Project Allocation**: Need a billed Google Cloud Project.
2. **Supabase Instance**: Need a production Supabase URL and `service_role` key.
3. **Gemini API Key**: Need a production Google GenAI key.
4. **NASA/Planetary Keys**: Need standard rate-limiting keys.
5. **Region**: Recommend `us-central1` or `asia-south1` depending on Planetary Computer latency.

---

## 9. ROLLBACK STRATEGY

Since the deployment strategy relies on purely additive Cloud Run revisions and no destructive schema changes (just dropping insecure RLS), a rollback simply consists of redirecting Cloud Run traffic to `0%` on the new revision and `100%` on the previous revision. No database restorations are necessary.
