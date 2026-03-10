# Agent IDs Singapore — Proof of Concept

**Visual, Interactive POC of Agent IDs**

---

## Quick Start

- **New collaborator?** Start with [`00-PROJECT-BRIEFING.md`](./00-PROJECT-BRIEFING.md) — the full onboarding document.
- **Building?** Week 1 focus: Agent ID schema v0.1, architecture decisions, dev setup.

## Run the PoC locally

To run the interactive demo on your machine:

```bash
git clone https://github.com/ady-bhai/agent-ID-poc-SG.git
cd agent-ID-poc-SG
npm install
npm run dev -- --port 5180
```

Then open one of these URLs in your browser:

- `http://localhost:5180/#view1-ecosystem` — **View 1 · Ecosystem** (`arch_v4`): healthcare booking scenario, who contributes what to the Agent ID.
- `http://localhost:5180/#incident` — **View 3 · Incident Explorer** (`incident_v5`): incident response narratives across identity levels.
- `http://localhost:5180/#arch` — **View 2 · Reference Architecture** (`arch_v3`): higher-level system diagram.

## Deployment (GitHub Pages)

The repo is configured to deploy to GitHub Pages at:

- `https://ady-bhai.github.io/agent-ID-poc-SG/`

The Vite `base` path is set so the built app works from that URL (`/agent-ID-poc-SG/`). A GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds the site and publishes the `dist/` folder on every push to `main`. After Pages is enabled in the repo settings, you can share links like:

- `https://ady-bhai.github.io/agent-ID-poc-SG/#view1-ecosystem`
- `https://ady-bhai.github.io/agent-ID-poc-SG/#incident`
- `https://ady-bhai.github.io/agent-ID-poc-SG/#arch`

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
