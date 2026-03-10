# Synthesis: Source Documents + LLM Analysis Evaluation

**Created: February 18, 2026**  
**Purpose: Ingest source docs, evaluate the LLM analysis for accuracy and substantive value.**

---

## Source Document Mapping

| Briefing Reference | Actual File(s) | Content |
|---|---|---|
| `poc_technical_analysis` | Aditya Singapore Masterdoc (6) | Technical architecture: 4 components, Can/Can't Use table, identity levels, service decision tree, **Hardest Part = safety field** |
| `era_milestones_plan` / divergence analysis | Aditya Singapore Masterdoc (5) | Direction #1 vs #2 rationale, divergences (spec vs demo, service-provider perspective, tabletop timing), Architecture Q1–Q3 |
| `SG-agent-IDs-working-draft` | SG-agent-IDs-working-draft (19, 20, 21) | (19) = meeting notes; (20, 21) = formal PoC proposal Feb 11, 2026 |
| OpenID / external landscape | 2510.25819v1.pdf | OpenID Foundation "Identity Management for Agentic AI" (Oct 2025) |

---

## 1. What You're Actually Building — LLM Analysis Evaluation

### Claim
> "A reference implementation of a Security-Posture Identity Layer that sits orthogonally to OAuth/OIDC and adjacent to MCP."

### Verification Against Source Docs

**Masterdoc (6) — Can/Can't Use table:**
- OAuth 2.1/OIDC: **Use existing**
- MCP: **Use actual MCP SDK**
- Agent ID payload (security posture): **Define schema, carry as extension within MCP or custom headers**

**OpenID 2510.25819v1 — Layered architecture:**
- Section 2.4–2.6: Authentication (OIDC), Authorization (OAuth), MCP as interaction layer
- Section 2.10: PEP/PDP separation — Policy Enforcement Point intercepts, Policy Decision Point decides
- Section 2.8: "Agent identity must be enriched with metadata about its underlying model, version, and capabilities to enable risk-based access control" — **this is exactly the gap**

**Working draft (19) — Jan 22 IMDA feedback:**
- "Authentication and Authorisation would be the key issues"
- "OIDC can't differentiate between agent or human"
- "Underlying governance principle is that this should be traced back to a human"

**Verdict: ACCURATE AND VALUABLE.** The layered framing is correct. OAuth/OIDC solve auth/authz. MCP solves interaction semantics. The PoC fills the **Trust Evaluation / Security Posture** layer — "was this agent responsibly built?" — which none of the existing standards cover. The LLM's "intellectual move" articulation is sharp.

---

## 2. JWS vs Verifiable Credentials — LLM Analysis Evaluation

### Claim
> Use JWS-signed JSON for PoC. VCs solve selective disclosure, cross-domain portability — that's Direction #2. Security posture = signed assertions. Document: "This payload could be wrapped in JWT-VC format for interoperability."

### Verification

**OpenID 2510.25819v1:**
- Section 3.6 (AP2): "signed using Verifiable Credentials (VCs) that bind the Mandates to a user's identity" — VCs used for **delegation/identity binding**
- Section 3.5 (Privacy vs Accountability): "Selective disclosure mechanisms... zero-knowledge proofs and anonymous credentials"

**Working draft (19) — MCP-I:** "Uses DIDs and Verifiable Credentials for agent-user delegation"

**Direction #1 vs #2 (Proposal):**
- #1 = security posture, what's on the ID's face
- #2 = sensitive information, cryptographic access control, tiered access

**Verdict: ACCURATE.** The LLM correctly separates: JWS = signed assertions (Direction #1); VC = selective disclosure, portable credentials (Direction #2). The recommendation to build with JWS and document JWT-VC as future work is pragmatic and aligned with the 8-week constraint.

---

## 3. Numeric Trust Scoring vs Rule-Based — LLM Analysis Evaluation

### Claim
> Do NOT use numeric score. Use explicit rule-based logic: `if (!agentId) → deny_high_risk`, etc. Enterprise systems use PEP/PDP, ABAC, policy rules.

### Verification

**Masterdoc (6) — Service decision tree:**
The existing plan already uses a **decision tree**, not a numeric score:
- IF no Agent ID → Deny or Challenge
- IF instance ID only → Allow low-risk, Deny high-risk
- IF provider + model but no safety attestation → Allow low, Flag medium, Deny high
- IF full Agent ID → Verify, check registry, allow within scope, require human for highest-risk
- IF attestation fails → Deny and log spoofing

**OpenID 2510.25819v1 — Section 2.10:**
- "PEP is the component that intercepts... PDP is the dedicated service that makes the authorization decision"
- "RBAC, Attribute-Based Access Control (ABAC), or more fine-grained methodologies"
- Section 3.4: "Risk-Based Dynamic Authorization" — policy assesses risk, triggers CIBA for anomalous requests

**Briefing 00-PROJECT-BRIEFING:** "~200 lines TypeScript. Identity score → risk threshold matching" — **this is where the numeric scoring crept in.**

**Verdict: LLM IS CORRECT TO PUSH BACK.** The Masterdoc (6) decision tree is already rule-based. The briefing's "identity score" language is a regression. The LLM's proposed rules map cleanly to the existing tree and align with OpenID's PEP/PDP + ABAC framing. **Adopt the rule-based formulation; drop numeric scoring.**

---

## 4. HTTP Header Size Limits — LLM Analysis Evaluation

### Claim
> Level 3 payload ~4–6KB. Nginx/Apache 8KB, Node 8–16KB. You're fine. Best practice: send Agent ID in request body (MCP metadata) not giant header.

### Verification

**Masterdoc (6):** Agent ID "carry it as an extension within MCP requests or as custom headers"

**Verdict: REASONABLE.** The math is plausible. The recommendation to prefer MCP metadata/body over `X-Agent-ID` header is a good defensive choice — avoids fragility, aligns with "extension within MCP" from Masterdoc. **Worth implementing body/metadata transport as primary path.**

---

## 5. MCP Positioning — LLM Analysis Evaluation

### Claim
> Don't say "We extend MCP." Say "We demonstrate how a Security Posture Identity Layer can be attached to MCP interactions." Avoids AAIF politics, protocol forking appearance.

### Verification

**Masterdoc (6):** "This PoC is an extension built on top of MCP, not as an alternative to it. The Agent ID travels as structured metadata alongside normal MCP requests. This positions the project as here's what MCP needs to become to support governance instead of introducing a competing protocol."

**Working draft (19) — Jan 14:** "Reinforces proposal to extend MCP... Still room to independently extend MCP"

**Verdict: NUANCED.** The Masterdoc already says "extension" and "what MCP needs" — not "we're changing MCP." The LLM's refinement is about **framing in external communications**: "attached to" vs "extend" is a subtle but useful distinction for stakeholder conversations. **Adopt for external messaging; internal architecture unchanged.**

---

## 6. The Safety Field — LLM Analysis Evaluation

### Claim
> Replace vague test names with structured risk controls: `prompt_injection_resilience`, `tool_use_constraints`, `data_exfiltration_controls`, `auditability`. Make safety fields produce visible consequences: `external_http_disabled == false → deny in healthcare`, etc.

### Verification

**Masterdoc (6) — Hardest Part:**
> "What exactly goes in the 'safety' field? ... we need a realistic but fictional 'safety test report' that shows what a service actually learns from the attestation that **changes its behavior**. This requires domain knowledge about what safety testing actually looks like for AI agents — **not just 'did it pass a red team,' but specifically what information about prompt injection resistance, harmful output filtering, tool use boundaries, etc. would change a service's trust calculus.**"

**Working draft (19) — Agent ID purpose:**
> "Has the provider taken measures to reduce prompt injection? Did they test for that? Agent ID could provide proof that provider tested for prompt injection. Doesn't guarantee it will never happen."

**Verdict: HIGHLY VALUABLE.** The LLM's proposed safety schema directly addresses the "Hardest Part" from Masterdoc (6). The current schema (`safety_tests_passed: ["prompt_injection_v2", "harmful_output_v1"]`) is indeed too abstract — it doesn't give the trust engine actionable predicates. The LLM's structured claims (`resilience_level`, `fail_open`, `external_http_disabled`, `user_binding_enforced`) are **decision-relevant** and map to the service's decision tree. **Strong recommendation: adopt this structure for the safety field in schema v0.1.**

---

## 7. What This PoC Does Well — LLM Analysis Evaluation

### Claim
> The fields with lowest private incentive alignment unlock safe high-trust domains. Aligns with "when must government step in?" from meeting notes.

### Verification

**Working draft (19) — Feb 6:**
> "AM: From Clement it sounds like SG gov is pretty open to just try to have markets solve the issues at first and then step in if needed. For more security-focused stuff they are more interested in stepping in. It seems like we want to **point out the 20% of cases where they really need to step in**, so that they're willing to do so."

**Proposal (20/21):** Market incentive table — Instance ID (high incentive, low governance value) vs Model + Safety, Deployer (low incentive, very high governance value).

**Verdict: ACCURATE.** This is the core policy argument. The PoC operationalizes the 20% case.

---

## 8. Where to Be Ruthless — LLM Analysis Evaluation

### Claim
> Cut: Real Singpass, real DID, real insurance pricing, full OBO flows, real-world deployment. Keep: MCP interaction, JWS verification, real policy engine, registry lookup, visualization contrast.

### Verification

**Masterdoc (6) — Can/Can't Use:**
- Singpass: **Mock** — "Simulate a Singpass-verified deployer identity. Don't integrate with real Singpass"
- Registry: **Stub** — "Could reference MCP-I's KnowThat.ai conceptually but build our own minimal version"

**Briefing — What NOT to do:** "Don't build Direction #2. Don't integrate a real LLM agent. Don't build production deployment pipeline. Don't make AIUC a dependency."

**Verdict: ALIGNED.** The LLM's cut list matches the briefing and Masterdoc. No conflict.

---

## 9. The Deeper Insight — LLM Analysis Evaluation

### Claim
> Agent identity today is largely about authentication and delegated authority. Your PoC is about something more foundational: **Agent identity as a signal of engineering discipline.** "Was this agent responsibly built?" — not "Is this agent allowed?" That's not standardized anywhere.

### Verification

**OpenID 2510.25819v1 — Section 2.8:**
> "A traditional workload's identity confirms **what it is**, but in the context of agents, **its behaviour is also important**. Agent identity must be enriched with metadata about its underlying model, version, and capabilities to enable risk-based access control."

**Working draft (19) — Direction #1:**
> "What safety tests has it undergone? ... Agent ID could provide proof that provider tested for prompt injection... Agent ID communicates some aspect **how the agent was** [built/deployed]."

**Verdict: ACCURATE AND ARTICULATE.** The OpenID paper hints at "behavior" and "metadata" but doesn't fully separate "authorization" from "engineering discipline." The LLM's framing — "allowed" vs "responsibly built" — is a crisp differentiator. **Use this in demo narrative and policy brief.**

---

## 10. The One-Sentence Answer — LLM Analysis Evaluation

### Claim
> If IMDA asks "Why can't OAuth + MCP + existing IAM solve this?" — Answer: "Because OAuth and MCP tell me whether an agent is authorized — they do not tell me whether it was safely built, tested, and anchored to accountable principals."

### Verification

**OpenID 2510.25819v1:** OAuth = authorization (what can they do). OIDC = authentication (who is the caller). MCP = interaction semantics. None address "how was this agent built? what safety testing? who's accountable?"

**Working draft (19) — Jan 22 IMDA:** "OIDC can't differentiate between agent or human" — but that's a different (compatibility) problem. The authorization vs security-posture distinction is the deeper one.

**Verdict: EXCELLENT.** This is the elevator pitch. **Memorize and use.**

---

## Summary: What to Adopt from the LLM Analysis

| Recommendation | Adopt? | Notes |
|---|---|---|
| Layered framing (Security Posture Layer orthogonally to OAuth/MCP) | ✅ Yes | Use in spec, policy brief, demo narrative |
| JWS for PoC, document JWT-VC as future work | ✅ Yes | Already aligned with Direction #1 |
| Rule-based trust engine, NOT numeric scoring | ✅ Yes | Aligns with Masterdoc (6) decision tree; fix briefing language |
| Prefer body/metadata over giant header for Agent ID transport | ✅ Yes | Defensive, cleaner |
| "Attached to MCP" framing for external comms | ✅ Yes | Strategic precision |
| Structured safety field (resilience, constraints, controls) | ✅ Yes | Addresses Hardest Part from Masterdoc (6) |
| "Engineering discipline" / "responsibly built" framing | ✅ Yes | Differentiator for demo and policy |
| One-sentence IMDA answer | ✅ Yes | Core messaging |
| Cut list (Singpass, DID, etc.) | ✅ Yes | Already in plan |

---

## Revised Architecture Notes (Post-Synthesis)

1. **Trust Engine:** Implement as explicit rule tree, not numeric score. Rules should reference structured safety claims.
2. **Safety Schema:** Replace `safety_tests_passed: [...]` with structured blocks: `prompt_injection_resilience`, `tool_use_constraints`, `data_exfiltration_controls`, `auditability`. Each with decision-relevant booleans/levels.
3. **Agent ID Transport:** Primary = MCP metadata or request body. Fallback = `X-Agent-ID` header. Document header size as non-issue but prefer body.
4. **External Messaging:** "Security Posture Identity Layer attached to MCP interactions" — not "we extend MCP."
5. **Demo Narrative:** Lead with "allowed vs responsibly built" — OAuth tells you permission; Agent ID tells you engineering discipline.
