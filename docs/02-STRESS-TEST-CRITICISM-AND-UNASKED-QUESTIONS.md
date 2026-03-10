# Stress Test, Criticism, and Unasked Questions

**Created: February 18, 2026**  
**Purpose: Cynical, realistic pressure-test of the PoC. Not tearing down for its own sake — asking the questions that will improve the project by answering them.**

---

## How to Use This Document

Each section poses questions that have not been adequately addressed in the briefing or synthesis. The goal is not to invalidate the project but to surface assumptions, blind spots, and failure modes *before* they bite. For each question: **what would change if we had a good answer?**

---

## 1. Threat Model: Who Is the Adversary?

**What we've assumed:** Services need to know whether agents are "safe to interact with." Providers under-disclose. Government should step in.

**What we haven't asked:** *Who exactly are we defending against?*

- **Negligent provider** — built a shoddy agent, didn't test for prompt injection, ships it anyway. Incentive: avoid scrutiny. Our schema helps: safety attestations would expose them.
- **Malicious provider** — deliberately builds a harmful agent. Incentive: evade detection. Our schema *doesn't* help: they can lie in the Agent ID. JWS proves the *provider* signed it, not that the claims are true.
- **Compromised deployment** — agent was fine when built, but someone hijacked it. Our schema partially helps: deployer binding gives a contact. But if the deployer's infra is owned, the attacker may control the Agent ID too.
- **Spoofed identity** — attacker forges an Agent ID to look like TrustAI. JWS helps *if* the service has the right public keys and checks signatures. Do we have a key distribution story?

**Why it matters:** The trust engine's rules should map to *which* adversary we're mitigating. Right now the rules are generic. If the primary threat is *negligence*, our design works. If it's *malice*, we're building a system that honest actors will adopt and malicious ones will bypass — and we haven't said that out loud.

**Action:** Write down the threat model explicitly. "We are optimizing for X; we are NOT claiming to defend against Y." Put it in the spec. It will sharpen the demo narrative and pre-empt "but what about a malicious actor?" questions.

---

## 2. The "20% Case" — Have We Actually Identified It?

**What we've assumed:** "Point out the 20% of cases where they really need to step in." The market incentive table implies: model + safety + deployer + incident response = the 20%.

**What we haven't asked:** *Is that actually 20%? Or is it 5%? Or 80%?*

The number is rhetorical. But the *content* matters. Which specific scenarios, industries, or actions require government intervention? The briefing names: appointment booking, financial data access, healthcare records. Are those the right ones? Who decided?

- **Appointment booking** — Low-medium risk. A polyclinic might accept Level 2 today. Is this really in the "government must step in" bucket, or is it the "market might solve this" bucket?
- **Financial data** — High risk. KYC, accountability, incident response. This feels like the 20%.
- **Healthcare** — High risk, privacy. Also feels like the 20%.

**Why it matters:** If the primary demo scenario (appointment booking) is actually in the "market could solve" zone, we're making a weaker argument. IMDA might think: "Polyclinics could just require basic provenance. Why do we need a standard?" We need at least one scenario that is *unambiguously* in the intervention zone.

**Action:** For each scenario, write one sentence: "Government intervention is needed here because [specific market failure]." If you can't do it for Scenario A, consider leading with Scenario B or C in the demo.

---

## 3. The Scripted Agent — Credibility Risk

**What we've assumed:** Scripted agent is fine. "PoC is about identity infrastructure, not agent intelligence. Deterministic = controllable demo."

**What we haven't asked:** *Will stakeholders dismiss it as "obviously not real"?*

A savvy technical audience member might think: "This isn't an AI agent. It's a script. How do I know your trust engine would work when a real LLM is making unpredictable tool calls?" The demo is, by design, immune to the very failure mode we're supposedly addressing — prompt injection, harmful output, tool misuse. A real agent could be prompt-injected into exfiltrating data; our scripted agent cannot.

**Counter-argument:** The PoC is about the *identity layer*, not the agent's behavior. The question is: when a (real) agent shows up with an ID, can the service make a trust decision? The scripted agent is a *stand-in* for "an agent that might do anything." The ID is the same regardless.

**Why it matters:** We need a crisp one-liner for when someone says "but this isn't a real agent." Something like: "The agent is a stand-in. The ID is what we're demonstrating. In production, the same ID would travel with a real LLM — the trust decision would be identical." If we can't say that confidently, we have a narrative gap.

**Action:** Add to demo script: anticipated objection + response. Rehearse it.

---

## 4. JWS Verification — Where Do the Keys Come From?

**What we've assumed:** JWS-signed attestations. Pre-generated demo keypairs. Service verifies signatures.

**What we haven't asked:** *How does the service get the public key to verify?*

- Option A: It's in the Agent ID payload. But then anyone can put any key there — no verification.
- Option B: The registry holds public keys for known providers. Service looks up `provider_id` → public key. We're building that. Good.
- Option C: Keys are in a well-known URL (e.g. `https://trustai.example.com/.well-known/agent-id-keys.json`). Service fetches. Adds latency, another failure point.

For the PoC, Option B (registry) is fine. But: **is the registry in scope?** The briefing says "Registry: BUILD. Express.js REST API + JSON file. 3 fictional providers." So we have a registry. Does it include public keys? The schema shows `provider.attestation: "<JWS>"` — who signs it? The provider. So the service needs the provider's public key. Registry must map `provider_id` → public key.

**Why it matters:** If we don't specify this, we'll discover it in Week 3 when building the trust engine. "Verify attestation signatures" — verify against what? Better to nail it in Week 1.

**Action:** Add to schema/architecture: registry stores `provider_id` → `public_key` (or JWKS URL). Trust engine fetches key from registry before verifying. Document in spec.

---

## 5. The Safety Field — Who Issues These Claims?

**What we've assumed:** Structured safety claims: `prompt_injection_resilience`, `tool_use_constraints`, etc. The trust engine uses them.

**What we haven't asked:** *Who attests to these? And why would anyone believe them?*

- **Self-attestation:** The provider signs a payload saying "we passed prompt injection tests." The service trusts... the provider's word? That's circular for malicious providers. For negligent ones, it's at least a *claim* they're on the hook for — reputational risk.
- **Third-party certification:** `certification: { issuer: "SG_AISI", level: "standard" }`. Who is SG_AISI in our demo? A fictional certifier. In reality, who would run this? IMDA? A private lab? We haven't said.
- **OWASP-LLM-Top10-2026:** We reference this in the schema. Does it exist? OWASP has LLM Top 10 for 2024. Is there a 2026 version? If not, we're inventing standards — which is fine for a PoC, but we should own it. "We use a fictional standard for demo purposes; in production, this would map to OWASP / NIST / etc."

**Why it matters:** The trust engine's rules assume these fields are *meaningful*. If they're self-attested with no verification, a skeptic could say "so the agent can claim anything." The answer might be: "For the PoC, yes — we're showing the *structure*. In production, certification bodies would verify. The schema supports that." We need to be explicit.

**Action:** In schema doc, add "Attestation model: For PoC, self-attested. For production, third-party certification would verify. Schema is agnostic." And verify or replace `OWASP-LLM-Top10-2026` with something real or explicitly fictional.

---

## 6. Real-Time Dashboard — Is It Technically Feasible?

**What we've assumed:** "Dashboard shows live interactions." "Stream decisions in real-time." Three panels, identity slider, instant feedback.

**What we haven't asked:** *How does the dashboard get the data?*

- **Polling:** Dashboard polls the service or log store every N seconds. Simple. Not truly "real-time." Might feel laggy.
- **WebSockets / SSE:** Service pushes events to the dashboard when a request arrives and a decision is made. Real-time. Requires: service → dashboard connection. Is the dashboard a separate React app? Does it connect to the service's API? We need an event stream.
- **Shared state:** Agent, service, dashboard all run in one process? Unlikely with MCP client/server.
- **Log tailing:** Dashboard reads the append-only log file. Poll for new lines. Hacky but works. Latency depends on log flush frequency.

**Why it matters:** "Real-time" is a demo promise. If the slider moves and nothing happens for 2 seconds, the magic is gone. We need to decide the mechanism in Week 2, not discover it in Week 4.

**Action:** Add to architecture: "Dashboard receives events via [polling | SSE | WebSocket] from [service | log store]." Spike it in Week 2. If SSE from service is easy, do that. If not, polling with 500ms interval might be acceptable — test it.

---

## 7. Demo Day Failure Modes — Pre-Mortem

**What we've assumed:** Demo works. We present. IMDA reacts.

**What we haven't asked:** *What could go wrong on the day?*

| Failure | Likelihood | Impact | Mitigation |
|---------|------------|--------|------------|
| WiFi / network drops | Medium | High | Run everything local. Agent, service, registry, dashboard on localhost. No external deps. |
| MCP connection fails | Medium | Critical | Have a "fallback mode": pre-recorded video of the demo. If live fails, switch to video. |
| Dashboard doesn't update | Medium | High | Test the event pipeline exhaustively. Have a "manual refresh" button. |
| Someone asks "can we try with our own agent?" | High | Medium | Answer: "Not yet — this is a reference implementation. A pilot would enable that." Don't overpromise. |
| Someone asks "what about prompt injection?" | High | Low | Answer: "The agent is a stand-in. The ID would travel with a real agent. The trust engine's job is to evaluate the ID, not the agent's runtime behavior." |
| IMDA says "we want Direction #2" | Low | High | We've built Direction #1. Answer: "Direction #2 builds on this. The schema is extensible. Here's how we'd add encrypted fields." Have a 1-pager ready. |
| Audience is mostly technical, wants spec depth | Medium | Medium | Have the technical spec ready. Pivot from visualization to schema walkthrough. |
| Audience is mostly policy, glaze over at schema | Medium | Medium | Lead with visualization. Keep schema in appendix. |

**Why it matters:** Pre-mortems reduce surprise. The "fallback video" is a 2-hour investment that could save the demo.

**Action:** Create a "Demo Day Runbook" in Week 6: setup checklist, failure playbook, Q&A cheat sheet.

---

## 8. The Market — Are We Sure It Won't Solve This?

**What we've assumed:** "The information with the highest governance value has the lowest market incentive for disclosure. Government intervention is needed."

**What we haven't asked:** *What if the market is already solving it?*

- **Microsoft Entra Agent ID** — Exists. Proprietary, Azure-locked. But Microsoft is huge. If enterprises adopt it, does that count as "market solving"?
- **Google A2A** — Agent Cards. Capability advertising. Doesn't have safety posture today. But Google could add it. They have the incentive (enterprise trust) and the platform.
- **Insurance (AIUC)** — If insurers start requiring safety attestations for coverage, that's a *market* mechanism. No government mandate. We're building something that could be *adopted* by that market — but the market might get there first.

**Counter-argument:** Entra is ecosystem-locked. A2A doesn't have safety posture. Insurance is nascent. The *interoperable, open* solution doesn't exist. Singapore wants something that works across providers, not just Microsoft or Google. So there's still a gap.

**Why it matters:** IMDA might say "why can't industry do this?" We need a crisp answer. "Industry is building proprietary solutions. Singapore needs an *open* standard so that DBS, SingHealth, and GovTech can all accept the same Agent IDs regardless of provider. That interoperability won't emerge from market competition alone."

**Action:** Add to policy brief: "Why government: interoperability, not invention." The market may invent; government enables cross-ecosystem adoption.

---

## 9. Minimum Viable Persuasion — Are We Overbuilding?

**What we've assumed:** 8 weeks. Agent, service, registry, trust engine, log store, dashboard, 3 scenarios, tabletop exercise, incident response, policy brief, demo script, spec.

**What we haven't asked:** *What's the smallest demo that would make IMDA say "we want to pilot this"?*

Hypothesis: A single scenario (appointment booking), two identity levels (0 and 3), and a side-by-side log comparison might be enough. The contrast is the argument. Do we need Level 1 and 2? Do we need financial and healthcare scenarios? Or are we overbuilding to feel thorough?

**Counter-argument:** Level 1 and 2 show the *gradient* — it's not binary. That strengthens the narrative. And multiple scenarios show breadth. But each scenario is scope.

**Why it matters:** If we're at risk of not finishing, we need to know what's cuttable. The visualization is not cuttable. The incident response scenario might be. The tabletop might be. Define "MVP demo" vs "stretch" explicitly.

**Action:** In Week 1, define: "Must-have for demo day: X. Nice-to-have: Y. Cut if behind schedule: Z." Revisit in Week 5.

---

## 10. Schema Sign-Off — Sign-Off From Whom?

**What we've assumed:** "Week 1: Schema sign-off." Key deliverable.

**What we haven't asked:** *Who signs off? And what happens if they don't?*

- **Sam** — Project owner. Can sign off. But is that sufficient? He's not the end stakeholder.
- **IMDA** — Ideal. But have we asked them to review the schema? The proposal went out Feb 11. Have they responded? If not, "sign-off" might mean "Sam and Aditya agree."
- **Clement** — Technical reviewer. Could sign off on feasibility. Not on policy alignment.

**Why it matters:** "Schema sign-off" implies a gate. If the gate is informal (team consensus), say that. If we're waiting on IMDA, that's a dependency — and they might not respond in Week 1.

**Action:** Define "sign-off" explicitly. "Schema v0.1 is signed off when: [Sam approves] OR [IMDA provides feedback we've incorporated] OR [Week 1 ends and we proceed with team consensus]." Don't let an undefined gate block progress.

---

## 11. The Registry — What If It's Wrong?

**What we've assumed:** Registry holds provider data, safety reports, reputation. Service queries it. JSON file backend.

**What we haven't asked:** *What if the registry is compromised? What if a provider lies to the registry?*

- **Registry compromise:** Attacker modifies the JSON file. Now "TrustAI" points to malicious data. The service trusts the registry. We have no integrity check on the registry itself. For a PoC, we're probably okay — it's local, we control it. For production, registry would need its own attestation (signed by registry operator).
- **Provider lies:** Provider registers with false safety claims. Registry is the source of truth for "what did the provider claim?" — not "what is true." The registry is a *lookup*, not a *verifier*. We haven't confused these, but we should be clear.

**Why it matters:** In the demo, we might say "the service checks the registry." A skeptic: "So you're trusting the registry. Who runs it? What if they're wrong?" Answer: "For the PoC, we run it. In production, Singapore might operate a registry — like ACRA for companies. Trust would be in the operator." Have that answer ready.

**Action:** In spec, add "Registry trust model: For PoC, local and trusted. For production, registry operator would be a trusted third party (e.g. government)."

---

## 12. The Tabletop — What Are the Actual Decision Points?

**What we've assumed:** "Tabletop exercise. 2–3 decision scenarios. Audience discusses." "Pause at decision points and ask: You're the service operator. What do you do?"

**What we haven't asked:** *What are the specific decision points? What makes them non-obvious?*

A good tabletop has *genuine* tradeoffs. If the answer is obvious ("of course we deny"), there's no discussion. We need scenarios where reasonable people could disagree.

- **Scenario:** Agent has Level 2 ID (provider + model, no safety attestation). Wants to book an appointment. Low-risk action. Do you allow? Some might say yes — it's just booking. Others might say no — we don't know if it's been tested for prompt injection. *That's* a discussion.
- **Scenario:** Agent has Level 3 ID, full attestation. Wants to access financial data. Attestation says `external_http_disabled: true`. Do you allow? What if the request is for a read-only balance check vs. a transfer? Different risk.

**Why it matters:** The tabletop is "Your turn" — the participatory moment. If the scenarios are shallow, it falls flat. We need to design decision points that surface *genuine* policy tension.

**Action:** In Week 3 (tabletop design), for each scenario write: "Decision point: X. Option A: [rationale]. Option B: [rationale]. Tension: [why it's hard]." Test with a colleague. If they say "obviously A," the scenario needs work.

---

## 13. Clement's Transition — Who Answers the Hard Questions?

**What we've assumed:** "Clement advises on hard technical questions." "Actual research engineer."

**What we haven't asked:** *Clement is transitioning out. Who picks up when we hit a wall?*

Sam does architecture review but isn't "deeply in the code." Aditya is the builder. Clement has limited bandwidth. If we hit an MCP SDK issue, a JWS edge case, or a "how do we do X in TypeScript" problem, who unblocks?

**Options:** (a) Clement remains available for critical questions — define "critical." (b) Find another technical advisor — who? (c) Rely on documentation, web search, and LLM assistance. (d) Simplify the design so we don't hit hard questions.

**Why it matters:** The plan assumes we won't get stuck. We might. Having a defined escalation path reduces anxiety and avoids silent blocking.

**Action:** Clarify with Sam: "For MCP/JWS/crypto questions we can't resolve, who do we call?" If the answer is "figure it out," that's fine — but own it. Don't assume Clement will be there.

---

## 14. What Are We NOT Saying?

**What we've assumed:** The briefing is comprehensive. We've been thorough.

**What we haven't asked:** *What's conspicuously absent?*

Scanning the docs:

- **Liability:** If an agent with a Level 3 ID causes harm, who's liable? The provider? The deployer? The service that allowed it? We haven't touched this. It might be out of scope — but it's a natural question.
- **Revocation:** If a provider is de-listed or an agent is found to be unsafe, how does that propagate? We have incident response (contact, shutdown) but not "this agent ID is now invalid."
- **Expiry:** Certifications have `valid_until`. Do we check it? What if it's expired? Trust engine rule?
- **International interoperability:** Singapore's registry. What about agents from the US, EU? We're building for Singapore. That's fine. But we haven't said "this is Singapore-specific for now."
- **Cost of compliance:** What would it cost a provider to get a Level 3 ID? Testing, certification, registry registration. We're not building that — but the policy brief might need to address "what would adoption cost?"

**Why it matters:** Gaps become questions. If we've thought about them, we have answers. If not, we look unprepared.

**Action:** Add a "Known limitations and out-of-scope" section to the spec. One line each: liability, revocation, expiry, international, cost. "Addressed in future work" or "Explicitly out of scope for PoC."

---

## Summary: Questions That Deserve Answers

| # | Question | If Answered, We... |
|---|----------|-------------------|
| 1 | Who is the adversary? | Sharpen threat model, pre-empt "what about malicious actors?" |
| 2 | Is appointment booking really in the "20%"? | Ensure demo scenario is in intervention zone |
| 3 | How do we respond to "this isn't a real agent"? | Have a rehearsed one-liner |
| 4 | Where do JWS verification keys come from? | Nail registry key storage in Week 1 |
| 5 | Who issues safety claims? Self vs third-party? | Clarify attestation model in schema |
| 6 | How does dashboard get real-time data? | Spike in Week 2, avoid Week 4 surprise |
| 7 | What's the demo day failure playbook? | Create runbook in Week 6 |
| 8 | Why can't the market solve this? | Add "interoperability" to policy brief |
| 9 | What's the MVP demo vs stretch? | Define cut line for schedule slip |
| 10 | Who signs off on schema? | Avoid undefined gate |
| 11 | What if registry is wrong? | Have trust model answer ready |
| 12 | What are the tabletop decision points? | Design non-obvious scenarios in Week 3 |
| 13 | Who answers hard technical questions? | Clarify escalation path |
| 14 | What are we not saying? | Add limitations section to spec |

---

## Tone Check

This document is cynical in the sense that it assumes things can go wrong and that we've missed things. It is *not* cynical in the sense of "this project is doomed." The questions are tractable. Answering them will make the project more robust, the demo more credible, and the narrative more defensible. The goal is to stress-test *before* the stress finds us.
