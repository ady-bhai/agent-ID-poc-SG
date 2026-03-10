# Agent ID Proof of Concept — Comprehensive Project Briefing

**Last Updated: February 18, 2026**
**Purpose: Onboarding document for a new collaborator (human or LLM) to achieve productive contribution immediately.**

---

## 0. How to Use This Document

This briefing summarizes the full state of an ongoing project as of mid-February 2026. It is structured in priority order — start from the top, and each section adds depth. If you're short on time, Sections 1–4 give you enough to be dangerous. Sections 5–8 give you enough to be useful. Sections 9–10 are for stress-testing and pushing the project forward.

**What you should ask for after reading this:**
- The `SG-agent-IDs-working-draft` PDF — the full memo to Singapore AISI that underpins this project. Contains the market incentive analysis, the 10 design questions, the protocol landscape survey, and the full rationale for Direction #1 vs #2.
- The `era_milestones_plan.md` — the detailed 8-week build plan with Q&A for every week.
- The `poc_technical_analysis.md` — the full technical architecture analysis with component-by-component breakdown.
- The `SGagentIDsworkingdraft` meeting notes PDF — raw meeting notes from January–February 2026 capturing stakeholder positions, strategic considerations, and real-time decision-making.
- The PoC proposal document (`Agent IDs Proof of Concept — Singapore AI Safety Hub`, dated Feb 11, 2026) — the formal proposal sent to Singapore AISI requesting strategic decisions on direction, audience, and engagement.

---

## 1. What This Project Is

We are building a **proof of concept (PoC)** for an **AI agent identity system** — infrastructure that allows services (APIs, web platforms, government systems) to know *who* an AI agent is, *how* it was built, *whether* it was safety-tested, and *who* to contact if it misbehaves.

The PoC demonstrates this by showing what happens when an AI agent tries to interact with a service (e.g., booking an appointment, accessing financial data) under different conditions: with no identity, with partial identity, and with a full, cryptographically signed Agent ID. The core argument is visual: when the Agent ID is present, the service can make informed, proportionate trust decisions and has a full audit trail for incident response. When it's absent, the service is blind.

**This is not a product.** It is a *persuasion artifact* — a technically grounded demonstration designed to convince Singapore's government (IMDA specifically) that agent ID infrastructure is feasible, valuable, and worth piloting at scale. The primary deliverable is a visualization dashboard that makes the argument viscerally clear.

**Core differentiator:** OAuth and MCP tell a service whether an agent is *authorized* — they do not tell it whether the agent was *safely built*, *tested*, and *anchored to accountable principals*. This PoC fills that gap: agent identity as a signal of **engineering discipline**, not just permission.

---

## 2. Who Is Involved and What They Care About

### The Building Team
- **Sam Boger** — Project owner. ~3 days/week. Does design/architecture/code review, leads stakeholder engagement, co-presents. Has the governance background. Not deeply in the code day-to-day.
- **Aditya Mehta** — Primary ERA fellow and builder. Has "intro CS during undergrad" background. Will be vibe-coding the implementation. Interested in building an event/demonstration, longer-term interested in AI safety fieldbuilding.
- **2nd ERA Fellow (TBD)** — Potentially contributing to tabletop exercise design, stakeholder materials, or the visualization dashboard. Not yet confirmed.
- **Clement** — Limited bandwidth. Finishing work on SG AISI, transitioning to SASH. Actual research engineer who can advise on hard technical questions. Not a daily contributor.
- **Amin Oueslati** — Strategic input. Has shaped the project direction, engagement strategy, and memo framing. Not building.

### The Stakeholder Audiences (in priority order)
- **Audience A (PRIMARY): IMDA / SG AISI officials.** They launched the Model AI Governance Framework for Agentic AI at Davos on January 22, 2026. They want to see that their governance principles can be *operationalized* through concrete infrastructure. They are looking for case studies for their "living document." They are in a "learning process stage." They want to understand problem statements, see whether existing solutions are sufficient, and identify where government intervention is needed.
- **Audience B: International AISI network / safety community.** UK AISI is doing complementary work on agent IDs from a narrower angle (open web agents, least scrupulous actors). This PoC needs to show Singapore's approach is differentiated — more ambitious, enabling high-value use cases, not just defending against low-trust ones. The framing: "The UK is building a moat. Singapore is building a bridge."
- **Audience C: Enterprises in Singapore.** Banks, healthcare providers, government services. They need to see that compliance wouldn't be unreasonably burdensome — and ideally, that agent IDs unlock use cases they currently can't pursue.

### External Stakeholders Being Engaged
- **CSA (Cyber Security Agency of Singapore)** — Has expressed interest in co-developing the PoC. Offered to connect with industry (Google, Cloudflare). Released their own agentic AI security addendum in October 2025. Care about prompt injection mitigation, harmful output filtering, incident response. Use as a **validator and connector**, not a co-builder.
- **AIUC (AI Underwriting Collective)** — Insurance angle. The economic argument: better-identified agents are cheaper to insure, creating a market incentive for disclosure without government mandates. Approach with **cautious opportunism** — don't make them a dependency, but if interested, add an insurance pricing indicator to the dashboard.
- **GovTech Singapore** — CTO does PoCs regularly, showing industry the way. Potential partner for a real pilot (post-PoC).
- **IAPS/SASH** — Oscar's team doing complementary work from a cybersecurity angle (cyber kill chains, credential design, KYC regulation). Some overlap in Section 7 of their report (Agentic AI Identifiers/Registries). More cybersecurity-focused; less governance-focused.

### What Singapore's Government Cares About (from meeting notes)
- They are "pretty open to just try to have markets solve the issues at first and then step in if needed."
- For security-focused stuff, they are more interested in stepping in directly.
- The team's job is "to point out the 20% of cases where they really need to step in, so that they're willing to do so."
- There is a **window of opportunity for policy change that may close.**
- IMDA wants to understand problem statements clearly before picking solutions.
- They liked the 10 design questions in the working draft.
- They are interested in: authentication/authorization as key issues, compatibility/distinguishability between humans and agents, and whether existing solutions are "good enough."

---

## 3. The Core Problem and Why It Matters

### The Market Failure
Services receiving requests from AI agents need to know whether those agents are safe to interact with. But the information that would help services make the best trust decisions is the information providers are **least incentivized to share**:

| Information Type | Market Incentive to Disclose | Governance Value |
|---|---|---|
| Instance ID (unique session identifier) | HIGH — providers need this for their own operations | LOW — tells you nothing about safety |
| Authentication credentials (OAuth tokens) | HIGH — required for access control | MEDIUM — proves permission, not trustworthiness |
| Tool/capability declarations | MEDIUM-HIGH — services need this for least-privilege | MEDIUM — helps bound risk |
| Provider ID + contact | MEDIUM — some reputational benefit, but also scrutiny | HIGH — enables accountability |
| Model ID + safety attestations | LOW — exposes competitive information, invites scrutiny | VERY HIGH — the core of informed trust decisions |
| Deployer identity + human accountability anchor | LOW — deployers resist binding to regulated identity | VERY HIGH — the accountability chain |
| Incident response endpoints + shutdown capabilities | LOW — implies risk, suggests things could go wrong | CRITICAL — the difference between manageable incidents and crises |

**The PoC's central argument: the information with the highest governance value has the lowest market incentive for disclosure. Government intervention (standards, mandates, or market mechanisms like insurance) is needed for the bottom half of this table.**

### Two Directions (Direction #1 Chosen)
- **Direction #1 (CHOSEN): Security Posture.** "What does the ID say on its face?" What safety tests has this agent passed? Who built it? Who deployed it? How do I contact someone if it misbehaves? This is the supply chain transparency layer.
- **Direction #2 (FUTURE): Sensitive Information.** "What's in the locked compartment that only authorized parties can open?" Cryptographic access control for sensitive fields (deployer identity, model training details) visible only to regulators/auditors. Heavier technical lift, less visually demonstrable, natural extension of Direction #1.

These share infrastructure. Direction #1 is the "public face," Direction #2 is the "locked compartment." Build #1 first; #2 is the case for a follow-on pilot.

---

## 4. What We're Building (Architecture Overview)

### System Components

```
┌─────────────────────────────────────────────────────┐
│           VISUALIZATION DASHBOARD (React)            │
│  3 panels: Agent Request | Service Decision | Logs   │
│  Identity slider (0-3) | Incident response mode      │
└──────────┬────────────────────────────┬──────────────┘
           │                            │
           ▼                            ▼
┌────────────────┐    ┌──────────┐    ┌──────────────────┐
│  DEPLOYER      │    │ AGENT ID │    │    SERVICE        │
│  (mocked)      │    │ (payload)│    │  (MCP Server)     │
├────────────────┤    └─────┬────┘    ├──────────────────┤
│  PROVIDER      │          │         │ Trust Decision    │
│  (mocked)      │    ┌─────▼────┐    │ Engine            │
├────────────────┤    │  AGENT   │───▶│                  │
│  DEVELOPER     │    │ INSTANCE │    │ ALLOW/CHALLENGE/  │
│  (mocked)      │    │(MCP Cli) │◀───│ ESCALATE/DENY    │
└────────────────┘    └──────────┘    └───────┬──────────┘
                                              │
      Supply chain entities are               ├──▶ REGISTRY
      NOT software components.                │    (JSON/SQLite REST API)
      They exist as DATA in the               │
      registry and as FIELDS in               └──▶ LOG STORE
      the Agent ID payload.                        (append-only file)
```

### What Gets Built vs Mocked vs Simulated

| Component | Status | What It Is |
|---|---|---|
| **Agent ID Schema** | BUILD (Week 1) | THE novel contribution. Layered JSON with 7 sections. JWS-signed attestations. |
| **Agent Instance** | BUILD (Week 2) | MCP client (TypeScript). Scripted, NOT an LLM. Configurable identity level 0–3. |
| **Service** | BUILD (Week 2) | MCP server (TypeScript). Receives requests, extracts Agent ID, delegates to trust engine. |
| **Trust Decision Engine** | BUILD (Week 3) | ~200 lines TypeScript. **Rule-based** decision tree (NOT numeric scoring). Explicit rules: `if (!agentId) → deny_high_risk`, etc. Maps to PEP/PDP pattern. |
| **Registry** | BUILD (Week 3) | Express.js REST API + JSON file. 3 fictional providers: TrustAI, QuickBot, Unknown. |
| **Log Store** | BUILD (Week 3) | Append-only JSON file. Contrasts log richness between identity levels. |
| **Visualization Dashboard** | BUILD (Week 4) | React + Tailwind. THE primary deliverable. What IMDA sees. |
| **Developer / Provider / Deployer** | MOCK | Not software components. Exist as data in registry and fields in Agent ID. |
| **Incident Responders** | SIMULATE (Week 6) | Dashboard shows what responders WOULD have access to at each identity level. |
| **Singpass Integration** | MOCK | Simulated Singpass-verified deployer identity. No actual Singpass API calls. |

### The Agent ID Schema (v0.1)
```json
{
  "agent_id": {
    "version": "0.1.0",
    "instance": { "id": "uuid-v4", "created_at": "...", "session_purpose": "appointment_booking" },
    "provider": { "name": "...", "provider_id": "...", "contact": "...", "attestation": "<JWS>" },
    "model": { "name": "...", "model_family": "...", "model_id": "...", "version": "..." },
    "safety": {
      "prompt_injection_resilience": { "tested_against": "OWASP-LLM-Top10-2026", "resilience_level": "medium", "fail_open": false },
      "tool_use_constraints": { "max_write_scope": "declared_tools_only", "external_http_disabled": true },
      "data_exfiltration_controls": { "pii_masking_enabled": true, "training_data_access": "none" },
      "auditability": { "full_request_logging": true, "user_binding_enforced": true },
      "last_tested": "...", "test_report_url": "...",
      "certification": { "issuer": "SG_AISI", "level": "standard", "valid_until": "..." }
    },
    "deployer": { "type": "organization", "name": "...", "deployer_id": "...",
                  "identity_anchor": "singpass:UEN:200312345A", "attestation": "<JWS>" },
    "capabilities": { "tools_declared": [...], "autonomy_level": "supervised",
                      "human_oversight": "approval_required_for_writes" },
    "incident_response": { "escalation_endpoint": "...", "sla_response_time": "4h",
                           "shutdown_supported": true }
  }
}
```

### The 4 Identity Levels (the Demo's Core Mechanic)
- **Level 0:** No Agent ID. Service is blind. Can only ALLOW everything (risky) or DENY everything (losing economic benefit).
- **Level 1:** Instance ID only. Like a user-agent string. Service knows it's a specific agent but nothing about its provenance.
- **Level 2:** Instance + Provider + Model. Basic provenance. Service knows who built it, but not whether it's safe.
- **Level 3:** Full Agent ID with safety attestations, deployer binding, incident response endpoints. Service can make informed, proportionate trust decisions.

### Key Technical Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Language/framework | TypeScript/Node.js (full stack) | MCP SDK available in TS; good for web frontend; accessible for vibe-coding |
| Agent-service protocol | MCP (Model Context Protocol) | De facto standard for agent-tool interaction. Building ON TOP of MCP, not competing with it. |
| Agent ID transport | MCP metadata / request body (primary); `X-Agent-ID` header (fallback) | Prefer body/metadata to avoid header size fragility. Any HTTP service can inspect. Honest about being an extension. |
| Attestation signing | JWS via `jose` library (RS256/ES256) | Mature, well-documented. Pre-generated demo keypairs. |
| Registry backend | Express.js REST API + JSON file | Intentionally minimal. ~1 day to build. |
| Agent intelligence | Scripted (NOT an LLM) | PoC is about identity infrastructure, not agent intelligence. Deterministic = controllable demo. |
| Visualization | React + Tailwind CSS | Component-based, good for 3-panel layout, well-supported for LLM-assisted development. |
| External framing | "Security Posture Layer attached to MCP" | Not "we extend MCP." Demonstrates how a trust layer can be attached to MCP interactions. Avoids protocol-forking optics. |

### Layered Architecture (What We're Building)

| Layer | Solved By | PoC Role |
|---|---|---|
| Authentication (who is the caller?) | OIDC | Use existing |
| Authorization (what can they do?) | OAuth 2.1 | Use existing |
| Interaction semantics | MCP | Use existing |
| **Security posture (should I trust this agent?)** | **Not standardized** | **This is our layer** |

---

## 5. The Demo Narrative (What IMDA Sees)

The demo is structured as a 5-act presentation (~16 minutes total):

1. **"The problem today" (2 min):** Agent makes request with NO identity. Service is blind. Must either allow everything or deny everything. Neither is acceptable.
2. **"What basic identity provides" (3 min):** Add instance ID + auth. Service knows it's talking to a specific agent. Can allow basic actions. But for risky actions — still can't assess safety.
3. **"What full identity enables" (3 min):** Add complete Agent ID. Service makes informed, proportionate trust decisions. Allows appropriate actions, challenges inappropriate ones. Full audit trail. Show the logging difference.
4. **"When things go wrong" (3 min):** Trigger incident. Show how service uses Agent ID to respond — escalation, deployer identification, shutdown. Then show same incident with NO identity: no recourse.
5. **"Your turn" (5 min):** Tabletop exercise. 2–3 decision scenarios. Audience discusses.

### Three Scenarios (Escalating Risk)
- **Scenario A (Low-Medium Risk):** Appointment booking at a polyclinic. Fully implemented.
- **Scenario B (High Risk):** Financial data access. "What would be different" variation using same infrastructure with different trust thresholds.
- **Scenario C (High Risk, Sensitive):** Healthcare record lookup. Security AND privacy dimensions. Full assurance required.

---

## 6. The Governance and Strategic Context

### IMDA's Model AI Governance Framework for Agentic AI (Jan 22, 2026)

The MGF has 4 governance dimensions. The PoC maps to all of them:

| MGF Dimension | Agent ID Component | PoC Demonstration |
|---|---|---|
| Assessing and bounding risks upfront | Capability declarations, tool access lists | Service checks declared capabilities against allowed scope |
| Making humans meaningfully accountable | Deployer ID, Singpass identity anchor, delegation chain | Service traces agent → deployer → verified human |
| Implementing technical controls | Safety attestations, certification claims, incident response | Trust decisions based on attested safety testing; can invoke shutdown |
| Enabling end-user responsibility | Transparency fields (who built, what model, what purpose) | All identity information is inspectable and loggable |

The MGF is a "living document" soliciting case studies. The PoC should be positioned as a **candidate case study** — not just a demo, but a contribution to Singapore's governance framework.

### Positioning Relative to Other Initiatives
- **vs UK AISI:** UK focuses on defensive scenarios (open web, least scrupulous actors). Singapore focuses on **enabling scenarios** (high-trust domains, enterprise use). "UK builds a moat, Singapore builds a bridge."
- **vs MCP-I (Vouched):** Complementary, not competing. MCP-I = authentication and delegation ("who authorized this agent?"). This PoC = security posture ("how was this agent built? is it safe?"). Different layers of the same stack.
- **vs Microsoft Entra Agent ID:** Proprietary, Azure-ecosystem-locked. The working draft identified this limitation. Singapore needs something open and interoperable.
- **vs Google A2A:** Simpler — agents self-publish at well-known URLs. Good for capability advertising, but doesn't carry security posture or accountability information.

### The Insurance Angle (AIUC)
If AIUC is interested: certified agents with documented safety testing are cheaper to insure → market incentive for disclosure that doesn't require government mandates. Could add an "insurance pricing" indicator to dashboard. But AIUC is a nice-to-have, not a dependency.

---

## 7. Timeline and Deliverables

### 8-Week Build Plan

| Week | Technical Focus | Research/Engagement Focus | Key Deliverable |
|---|---|---|---|
| 1 | Agent ID schema v0.1, architecture decisions, dev setup | Stakeholder mapping, MGF alignment review | Schema sign-off |
| 2 | MCP client/server scaffolding, Agent ID travels with requests | Demo scenario narratives, AIUC call | Working MCP communication |
| 3 | Trust decision engine, registry, logging | Tabletop exercise design, scenario finalization | 3 identity levels → 3 different outcomes |
| 4 | Visualization dashboard (3 panels, slider, real-time) | Demo narrative v1 reviewed | Dashboard shows live interactions |
| 5 | End-to-end integration, 2–3 complete scenarios | Specification document draft, mid-point review | Full pipeline works |
| 6–7 | Polish, incident response scenario, interactive elements, bug fixes | Policy brief, demo script, tabletop materials, dry runs | Demo-ready system |
| 8 | Final testing | Stakeholder presentation | Delivery + handoff |

### Written Deliverables (by Week 7)
1. **Technical Specification (5–10 pages):** Schema, trust model, architecture. For technical stakeholders.
2. **Demo Script (2–3 pages):** Literal act-by-act narrative with cues. For the presenter.
3. **Policy Brief (2–3 pages):** "What agent IDs enable and what they require." Maps to MGF. For IMDA officials.
4. **Tabletop Exercise Guide (3–5 pages):** Scenarios, decision points, discussion prompts. For workshop participants.

### Success Criteria
- **Minimum:** IMDA says "this makes the MGF concrete — we understand what agent IDs should look like and why the market won't produce them alone." Team invited to continue.
- **Target:** IMDA says "we want to pilot this." Conversation shifts to "how at scale?" GovTech/CSA become co-developers.
- **Stretch:** PoC becomes a referenced case study in the next MGF version. Spec shared with other AISIs. Insurance angle materializes.

---

## 8. The Landscape — What Exists and How It Relates

This section summarizes the external technology landscape as assessed so far. **Important caveat: several of these assessments need independent verification via web search (see Section 9).**

### Protocols and Standards

**MCP (Model Context Protocol):**
- The plan claims: November 2025 spec introduced OAuth 2.1, CIMD, XAA, machine-to-machine (SEP-1046). 97M monthly SDK downloads, 10K+ active servers.
- Our relationship: We build ON TOP of MCP. The Agent ID is an extension (custom HTTP headers), not a protocol change. This positions us as "what MCP needs for governance" rather than a competitor.
- **Verification needed:** Actual current MCP spec features and SDK capabilities. Whether MCP's HTTP/SSE transport supports custom headers as assumed.

**MCP-I (Vouched):**
- Uses DIDs (Decentralized Identifiers) and Verifiable Credentials for agent-user delegation.
- KnowThat.ai as a public agent reputation registry.
- Our relationship: Complementary. MCP-I = delegation/authentication layer. Our PoC = security posture layer. We treat MCP-I as a reference, not a dependency.
- **Verification needed:** Actual MCP-I schema fields to compare with ours.

**Google A2A (Agent2Agent):**
- Agents self-publish capabilities at `/.well-known/agent.json` ("Agent Cards").
- Trust bootstrapped from TLS/domain ownership.
- Our relationship: A2A handles capability advertising. Our Agent ID extends this with security posture and accountability fields that A2A doesn't carry. A2A works for big-brand agents; fails for unknowns (where our registry fills the gap).

**W3C Verifiable Credentials (VCs):**
- The ecosystem-standard format for signed, verifiable claims ("issuer X attests subject Y has property Z").
- JWT-VC variant is a lighter-weight VC encoded as a JWT (and thus JWS-signed underneath).
- **Critical open question:** Our plan uses raw JWS-signed JSON. Should we use JWT-VC format instead? It may be near-zero extra effort but much more future-compatible with the broader VC ecosystem. **This needs investigation.**

### Registry Approaches

**NANDA (Networked Agents and Decentralized AI):**
- Separates discovery from trust via a "dual-hop" model: query a lean index → get a signed pointer → fetch the full credential from a URL.
- Useful pattern for scaling (avoids header size limits by not carrying full payload in-request).
- **Our assessment:** Singapore wants to BE the central registry operator. NANDA's federation model is philosophically misaligned for near-term deployment but useful as a "future state" reference.

**AGNTCY Agent Directory Service:**
- Fully decentralized via IPFS Kademlia DHT. Content-addressed (hash of data = address). Sigstore-signed for tamper evidence.
- Solves Zooko's Triangle by anchoring human-readable names to immutable OCI digests ("trust the liquid, not the label").
- **Our assessment:** Wrong fit for Singapore's governance model (they WANT enforcement/takedown ability, which DHTs resist). But the "trust the liquid" metaphor is valuable for demo narration — it's exactly what our JWS-signed attestations do.

**SPIFFE/SPIRE:**
- Production workload identity system for microservices. Auto-rotates credentials, uses SVIDs (SPIFFE Verifiable Identity Documents). Real zero-trust infrastructure.
- **Our assessment:** Not for the PoC build, but relevant as "what production deployment looks like" for CSA conversations.

### The "Three Rooms" Framework
From the A2UI specification — agents operate in three interaction modes:
1. **Agent-to-Agent** (backroom coordination)
2. **Agent-to-Tool** (MCP — the room our PoC operates in)
3. **Agent-to-UI** (the agent proposes UI elements, the client sanitizes and renders them)

Our PoC is squarely in Room 2. The A2UI "gatekeeper pattern" (receiver is the authority, not the sender) is a useful rhetorical parallel for our trust engine — the service decides, not the agent.

---

## 9. Open Questions and Stress Tests

### Things That Need Verification Before Building

These are specific technical assumptions in the plan that have NOT been independently validated against external sources. Ordered by impact:

1. **MCP Spec Verification.** The plan makes detailed claims about the November 2025 MCP spec (OAuth 2.1, CIMD, XAA, SEP-1046). These need to be verified against the actual spec. The MCP TypeScript SDK's support for HTTP/SSE transport with custom headers also needs confirmation.
   - *Search:* "MCP specification 2025 latest", MCP GitHub repository, "MCP TypeScript SDK HTTP SSE transport"

2. **JWS vs Verifiable Credentials.** The plan chose raw JWS-signed JSON. The broader ecosystem (MCP-I, NANDA, the VC world) uses W3C Verifiable Credentials. The JWT-VC variant might be nearly as easy to implement but significantly more future-compatible.
   - *Search:* "verifiable credentials vs JWT for agent attestation", "W3C verifiable credentials MCP", "jose library verifiable credentials", "JWT-VC format specification"

3. **HTTP Header Size Limits.** Full Level 3 Agent ID + multiple JWS signatures + base64 encoding could exceed common header limits (Apache 8KB, Nginx 8KB, Node.js 16KB). This needs quantification.
   - *Search:* "HTTP header size limit practical", "MCP HTTP SSE transport custom headers"
   - *Action:* Actually construct a full Level 3 payload, JWS-sign it, base64-encode it, and measure the byte count.

4. **IMDA MGF Verification.** The plan claims specific alignment with the MGF's 4 governance dimensions. The actual published MGF document needs to be read to verify these claims.
   - *Search:* "IMDA Model AI Governance Framework Agentic AI January 2026"

5. **Schema Comparison.** Our Agent ID schema fields need to be compared against MCP-I, Microsoft Entra Agent ID, Google A2A Agent Cards, and any NIST/OWASP guidance on agent identity.
   - *Search:* "MCP-I agent identity schema fields", "Microsoft Entra Agent ID schema", "Google A2A agent card specification", "OWASP agent identity", "NIST agent identity"

6. **Trust Engine Design.** The plan uses a numeric scoring model (0–10). Real enterprise systems typically use Attribute-Based Access Control (ABAC) with policy rules. Is scoring defensible for the PoC?
   - *Search:* "zero trust scoring vs policy based access control", "API gateway trust scoring model", "ABAC agent identity"

7. **CSA Addendum Verification.** The plan references a CSA agentic AI security addendum from October 2025. This should be verified.
   - *Search:* "CSA Singapore agentic AI security addendum 2025"

8. **Prior Art.** Has anyone else built something similar?
   - *Search:* "agent identity proof of concept", "agent credential prototype"

### Strategic Open Questions (Not Technical)

- **IMDA hasn't yet confirmed which direction** (Direction #1 vs #2). The PoC proposal asks for this decision. We're proceeding with Direction #1 as recommended.
- **IMDA hasn't confirmed target audience** (decision-makers vs technical). This affects how much visualization vs specification depth to prioritize.
- **Second ERA fellow** is not yet confirmed. Plan assumes Aditya as sole builder; second fellow is additive.
- **Relationship with MCP community** is unclear. Building as an MCP extension positions well, but we haven't engaged with the AAIF/MCP community about this.

---

## 10. Risks and What To Watch For

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Over-engineering backend, under-investing in visualization | HIGH | HIGH | Weekly check: "Is the demo narrative getting better?" The visualization IS the product. |
| Schema design paralysis | MEDIUM | HIGH | Time-boxed to Week 1. Ship v0.1, iterate. |
| HTTP header size limit hit | MEDIUM | MEDIUM | Test full Level 3 payload size early. Fallback: body-based transport. |
| MCP SDK doesn't work as assumed | MEDIUM | HIGH | Verify MCP spec and SDK capabilities before Week 2. |
| JWS format is fine technically but ecosystem-incompatible | MEDIUM | LOW for PoC, HIGH for follow-on | Investigate JWT-VC format. If easy, switch. If not, document as future work. |
| IMDA feedback changes scope | LOW | HIGH | Build modular components. Keep visualization separate from logic. |
| Demo doesn't tell a compelling story | MEDIUM | CRITICAL | Write demo script in Week 2, BEFORE most code. Build to the script. |
| Aditya's limited technical background blocks progress | MEDIUM | MEDIUM | Lean into vibe-coding. Sam reviews architecture. Clement advises on hard questions. |
| AIUC/CSA engagement consumes too much time | MEDIUM | MEDIUM | Cap at 2 meetings in weeks 1–3, then reassess. |
| The "window of opportunity" for Singapore policy closes | LOW | CRITICAL | Move fast. The 8-week timeline exists for this reason. |

---

## 11. Vocabulary and Acronyms

- **IMDA** — Infocomm Media Development Authority (Singapore). The government body overseeing AI governance.
- **SG AISI** — Singapore AI Safety Institute. Within IMDA. Our primary government counterpart.
- **SASH** — Singapore AI Safety Hub. The organization leading this project.
- **TFS** — The Future Society. Partner organization.
- **ERA** — Existential Risk Alliance. Aditya's fellowship program.
- **MGF** — Model AI Governance Framework. IMDA's governance framework for agentic AI.
- **CSA** — Cyber Security Agency of Singapore.
- **GovTech** — Government Technology Agency of Singapore.
- **AIUC** — AI Underwriting Collective. Insurance industry body.
- **MCP** — Model Context Protocol. Agent-tool interaction standard.
- **MCP-I** — MCP-Identity. Vouched's identity extension for MCP.
- **A2A** — Agent-to-Agent protocol (Google).
- **A2UI** — Agent-to-UI protocol.
- **NANDA** — Networked Agents and Decentralized AI.
- **AGNTCY** — Agent directory service using DHT-based discovery.
- **JWS** — JSON Web Signature. Cryptographic signing standard.
- **JWT** — JSON Web Token. Signed token format.
- **VC** — Verifiable Credential. W3C standard for signed claims.
- **DID** — Decentralized Identifier. W3C standard for self-sovereign identity.
- **DHT** — Distributed Hash Table.
- **ABAC** — Attribute-Based Access Control.
- **SPIFFE/SPIRE** — Production workload identity framework.
- **Singpass** — Singapore's national digital identity system (95%+ citizen coverage).
- **UEN** — Unique Entity Number. Singapore's business registration identifier.
- **NRIC** — National Registration Identity Card number (Singapore).
- **ACRA** — Accounting and Corporate Regulatory Authority of Singapore.
- **KYC** — Know Your Customer.

---

## 12. What To Do Next (If You're the LLM)

If you've been given this briefing to become a productive collaborator, here's what would be most valuable:

1. **Read the full source documents** listed in Section 0. This briefing is a summary; the originals contain nuance and detail that matters.

2. **Run the stress-test searches** in Section 9. The technical plan is plausible but unverified. Validating (or invalidating) the key assumptions would be the highest-value immediate contribution.

3. **If asked to help BUILD:** Start from the Week 1 deliverables (Agent ID schema v0.1, architecture decisions). The schema is the forcing function for every other design choice. Review it against whatever you find in the stress-test searches.

4. **If asked to help with STAKEHOLDER MATERIALS:** The demo script, policy brief, and tabletop exercise are the highest-leverage written outputs. They should be tight, narrative-driven, and explicitly mapped to the IMDA MGF's 4 governance dimensions.

5. **If asked to help with STRATEGY:** The key tensions are: feasibility vs value demonstration, technical depth vs stakeholder accessibility, Singapore's centralized governance model vs the decentralized direction of much of the identity ecosystem, and the 8-week constraint vs the temptation to over-engineer.

6. **What NOT to do:** Don't build Direction #2. Don't integrate a real LLM agent. Don't build a production deployment pipeline. Don't try to implement NANDA, AGNTCY, or DHT infrastructure. Don't make AIUC a dependency. Don't spend more than 2 meetings on any external engagement in weeks 1–3.
