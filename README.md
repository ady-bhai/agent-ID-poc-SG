# Agent IDs Singapore — Proof of Concept

**AI agent identity system PoC for Singapore IMDA / SG AISI**

---

## Quick Start

- **New collaborator?** Start with [`00-PROJECT-BRIEFING.md`](./00-PROJECT-BRIEFING.md) — the full onboarding document.
- **Building?** Week 1 focus: Agent ID schema v0.1, architecture decisions, dev setup.

## Project Structure (Planned)

```
AGENT IDs SINGAPORE/
├── 00-PROJECT-BRIEFING.md    # Full project briefing (start here)
├── README.md                 # This file
├── docs/                     # Stakeholder materials, specs, policy briefs
├── schema/                   # Agent ID schema v0.1, JSON schemas
├── agent/                    # MCP client (scripted agent instance)
├── service/                  # MCP server + trust decision engine
├── registry/                 # Express.js REST API + JSON backend
├── dashboard/                # React + Tailwind visualization (primary deliverable)
└── logs/                     # Append-only log store output
```

## Key Documents (Ingested)

- **Source PDFs** — See [`docs/00-SOURCE-DOCUMENTS-INDEX.md`](./docs/00-SOURCE-DOCUMENTS-INDEX.md) for paths. Includes: Aditya Singapore Masterdoc (5, 6), SG-agent-IDs-working-draft (19, 20, 21), OpenID 2510.25819v1.
- **Synthesis + LLM analysis evaluation** — [`docs/01-SYNTHESIS-AND-LLM-ANALYSIS-EVALUATION.md`](./docs/01-SYNTHESIS-AND-LLM-ANALYSIS-EVALUATION.md) — Cross-references source docs, validates LLM recommendations, adoption table.

## Timeline

8-week build plan. Target: demo-ready by Week 7, delivery Week 8.
