# Party Mode: Build Roadmap & Technical Recommendations

**Created: February 19, 2026**  
**Context: Multi-agent discussion (Winston, Mary, Barry) on where to begin building the Agent ID PoC for Singapore IMDA.**

**Default norm:** Document outcomes from party mode / multi-agent discussions here for future reference.

---

## Summary

Ady asked: "I have 0 knowledge of where to even begin building. Help me figure out how we're going to tackle this." Focus: technical choices that make something that WORKS. Incentives/design/stakeholder perception secondary for now.

**Documents reviewed:** `00-PROJECT-BRIEFING.md`, `docs/arch_v2.jsx`, `docs/01-SYNTHESIS-AND-LLM-ANALYSIS-EVALUATION.md`, `docs/02-STRESS-TEST-CRITICISM-AND-UNASKED-QUESTIONS.md`, `docs/00-SOURCE-DOCUMENTS-INDEX.md`.

---

## 1. Winston (Architect) — Where to Begin

### Week 1 Order of Operations

1. **Dev setup** — TypeScript + Node + React monorepo. Keep `docs/arch_v2.jsx` as living architecture map.
2. **Schema v0.1** — JSON schema with 7 sections from briefing. Use **structured safety fields** from synthesis doc (`prompt_injection_resilience`, `tool_use_constraints`, `data_exfiltration_controls`, `auditability`), NOT `safety_tests_passed` — the trust engine needs actionable predicates.
3. **Registry key storage** — Must include `provider_id` → `public_key` (or JWKS URL). Without this, JWS verification cannot work. Stress-test doc #4 is correct: nail this in Week 1.
4. **Three stress-test verifications before Week 2:**
   - MCP SDK: Does the TypeScript MCP client actually support custom headers/metadata on HTTP/SSE?
   - Payload size: Construct a full Level 3 payload, JWS-sign it, base64 it — measure bytes. Stay under ~8KB.
   - Transport: Prefer MCP metadata/request body over `X-Agent-ID` header. Synthesis doc is correct — body avoids fragility.

### Trust Engine Decision

The briefing and `arch_v2.jsx` mention "identity score 0–10." **Use rule-based logic instead:**
- `if (!agentId) → deny_high_risk`
- `if (!safety.prompt_injection_resilience?.tested_against) → challenge_for_healthcare`
- PEP/PDP pattern, ABAC-style. No numeric scoring.

### Build Order

Schema → Registry (with keys) → MCP client (Agent ID payload) → MCP server (parses, calls trust engine) → Trust engine (rule-based) → Dashboard. The visualization IS the product; backend logic feeds it. Spike the event pipeline (SSE from service → dashboard) in Week 2, not Week 4.

---

## 2. Mary (Analyst) — Landscape & Gaps

### What the Briefing Got Right

The "allowed vs responsibly built" framing is sharp. OAuth = permission; Agent ID = engineering discipline. Use it for IMDA.

### Landscape Positions (from synthesis)

- **JWS vs Verifiable Credentials:** JWS for PoC. Document JWT-VC as future work for ecosystem alignment. Do not block on VC.
- **Numeric scoring vs rule-based:** Masterdoc already had a decision tree; briefing introduced scoring. Revert to rules — aligns with enterprise practice.
- **MCP framing:** Say "attach" not "extend" — "Security Posture Identity Layer attached to MCP interactions."

### Threat Model (One Sentence)

> "We optimize for *negligent* providers who under-disclose; we do NOT claim to defend against *malicious* actors who lie."

Pre-empts "what about bad actors?" questions. Put in spec.

### The 20% Case

Appointment booking alone may read as "market could solve." Financial or healthcare access makes the intervention case obvious. Either add one high-risk scenario early, or frame appointment booking as gateway to higher-risk flows. Stress-test doc #2 is correct.

---

## 3. Barry (Quick Flow Solo Dev) — Concrete Sprint

### Week 1 Sprint (Concrete)

```
Week 1 Sprint
├── Day 1–2: Repo setup + schema JSON file
│   └── schema/agent-id-v0.1.json — 7 sections, TypeScript types from it
├── Day 3: Registry stub
│   └── 3 fictional providers + public keys, Express route GET /providers/:id
├── Day 4: MCP spike
│   └── Minimal client + server, confirm headers/metadata work
└── Day 5: Trust engine skeleton
    └── 5–10 rules, returns ALLOW|DENY|CHALLENGE — no scoring
```

### Tech Stack

TypeScript end-to-end. MCP SDK, `jose` for JWS, React + Tailwind. Don't overthink.

### What NOT to Build

No Verifiable Credentials refactor. No real Singpass. No production deployment. Build to the demo narrative.

### Vibe-Coding Strategy

1. Get schema file + types in place.  
2. Minimal MCP client that sends a fake Agent ID.  
3. Minimal MCP server that parses it and returns ALLOW/DENY.  
4. When that loop works, add trust engine rules, then dashboard. The briefing's Week 1–3 order is right; you need a short feedback loop.

### Escalation Path

Clarify with Sam: "For MCP/JWS/crypto questions we can't resolve, who do we call?" Stress-test doc #13.

---

## 4. Week 1 Checklist (Consolidated)

| Priority | Action |
|----------|--------|
| 1 | Create `schema/agent-id-v0.1.json` (7 sections, structured safety fields) |
| 2 | Add `provider_id` → `public_key` to registry architecture |
| 3 | Spike MCP SDK: confirm custom headers/metadata for Agent ID |
| 4 | Trust engine = rule tree (no numeric score) |
| 5 | Decide event mechanism for dashboard (SSE vs polling) — spike in Week 2 |
| 6 | Write threat model in one sentence ("negligence, not malice") |

---

## 5. Cross-References

- **Schema structure:** `00-PROJECT-BRIEFING.md` Section 4 (Agent ID Schema v0.1)
- **Structured safety fields:** `01-SYNTHESIS-AND-LLM-ANALYSIS-EVALUATION.md` Section 6, Revised Architecture Notes
- **Stress-test questions:** `02-STRESS-TEST-CRITICISM-AND-UNASKED-QUESTIONS.md`
- **Architecture map:** `docs/arch_v2.jsx` (interactive)

---

## Default Norm: Document Party Mode Outcomes

When concluding a party mode or multi-agent discussion that produces actionable recommendations, add a summary document to `docs/` with:
- Date and context
- Agent perspectives (who said what)
- Consolidated checklist or recommendations
- Cross-references to source docs

Format: `docs/0X-{TOPIC}-{DESCRIPTIVE-NAME}.md`
