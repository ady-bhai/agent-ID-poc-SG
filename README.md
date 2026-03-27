# Agent IDs Singapore — Proof of Concept

An interactive demo that makes the case for composite AI agent identity by showing what a service gains — and loses — when different parts of the credential are present or missing.

Built at [SASH](https://aisafety.sg) (Singapore AI Safety Hub) as part of an [ERA Cambridge](https://www.eracambridge.org/) research fellowship, in collaboration with Singapore's IMDA (Infocomm Media Development Authority).

**[→ Try the live demo](https://ady-bhai.github.io/agent-ID-poc-SG/)**

<img width="717" height="404" alt="Screenshot 2026-03-27 at 10 57 29 AM" src="https://github.com/user-attachments/assets/6bae38d4-1d6c-4008-973a-24125f77d570" />


---

## Why this exists

When an AI agent requests access to sensitive information — say, patient appointment data from a polyclinic — the receiving service currently has no standardized way to verify who built the agent, whether it's been safety-tested, or who's accountable if something goes wrong.

Without this information, services face a binary choice: block all agents, or accept unknown risk.

Existing protocols (OAuth 2.0, OpenID Connect, MCP) each answer parts of this question, but no single standard carries safety attestations, deployer accountability, and incident response endpoints in one credential. And the credential fields most useful for governance — model provenance, safety testing, accountability contacts — have the weakest market incentives for voluntary disclosure.

<img width="587" height="334" alt="Screenshot 2026-03-27 at 10 58 34 AM" src="https://github.com/user-attachments/assets/915433b8-bd07-41af-9d74-8e990fa59b9c" />

This PoC operationalizes the [composite agent identity credential](https://aisafety.sg) proposed in SASH's working draft, grounded in a healthcare booking scenario aligned with Singapore's [Model AI Governance Framework for Agentic AI](https://www.imda.gov.sg/) (Jan 2026).

---

## What you'll see

The demo is organized around three views. They're designed to be explored in order:

### View 1 · Ecosystem — *Who contributes what*

Click on any actor in the supply chain — Developer, Provider, Deployer, Agent Instance — to see what they contribute to the credential, what incentive they have to participate, and what the ecosystem needs from them.

**[→ Open Ecosystem view](https://ady-bhai.github.io/agent-ID-poc-SG/#view1-ecosystem)**

### View 2 · Credential — *What the agent carries*

The composite credential, reframed as question-answer pairs. Instead of `provider_signature: [hash]`, the view asks: *Who built this agent?* → Verified: MedBot SG. Each section is independently signed by the actor who originated it — Provider, Deployer, or an independent certifier.

**[→ Open Credential view](https://ady-bhai.github.io/agent-ID-poc-SG/#arch)**

### View 3 · Consequences — *What fails without it*

Toggle identity presets — Full Agent ID, No Deployer Info, No Safety Certification, No Verifiable Agent ID — and watch specific incident response phases pass or fail. The key insight: missing credential sections don't cause gradual degradation. They cause specific phases to terminate entirely.

**[→ Open Consequences view](https://ady-bhai.github.io/agent-ID-poc-SG/#incident)**

---

## The scenario

A healthcare booking agent, built by **MedBot SG** (provider) on **Anthropic's Claude** (developer), deployed by **Raffles Medical** (deployer), requests patient appointment availability from a **polyclinic's API** (service).

Each verification question must be answered by a different supply-chain actor. No single entity can provide the full picture — requiring a composite identity credential.

---

## Run locally

```bash
git clone https://github.com/ady-bhai/agent-ID-poc-SG.git
cd agent-ID-poc-SG
npm install
npm run dev -- --port 5180
```

Then open:
- `http://localhost:5180/#view1-ecosystem` — Ecosystem
- `http://localhost:5180/#arch` — Credential
- `http://localhost:5180/#incident` — Consequences

## Deployment

The repo deploys to GitHub Pages at:
**https://ady-bhai.github.io/agent-ID-poc-SG/**

A GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and publishes the `dist/` folder on every push to `main`.

---

## Project context

This PoC was built during an 8-week ERA Cambridge research fellowship (Feb–Mar 2026). It draws on:

- **SASH working draft** on agent identity for Singapore (Sam Boger & Amin Oueslati)
- **Alan Chan's** foundational work on IDs for AI systems and infrastructure for AI agents (GovAI)
- **Singapore's MGF** for Agentic AI (IMDA, Jan 2026)

The demo was presented to Singapore AISI stakeholders in March 2026 and is being used to inform ongoing discussions about agent identity infrastructure.

### What this is

A visual, interactive proof of concept. It demonstrates *why* composite agent identity matters by making the consequences of missing identity sections legible. It is not a production implementation, a protocol specification, or a cryptographic library.

### What this is not

- Not a finished product — it's a proof that the design space is tractable
- Not a substitute for the written research — it operationalizes it
- Does not solve adoption, domain prioritization, or the political economy of standards-setting

---

## For collaborators

- **New to the project?** Start with [`00-PROJECT-BRIEFING.md`](./00-PROJECT-BRIEFING.md) for the full onboarding doc.
- **Want to contribute?** The three views are modular JSX components. The content in each actor's panel is defined in the component files (`arch_v4.jsx`, `incident_v5.jsx`, `arch_v3.jsx`).
- **Questions?** Reach out to [aditya.mehta@berkeley.edu](mailto:aditya.mehta@berkeley.edu)

---

*Mentee: Aditya Mehta · Mentor: Sam Boger · SASH × ERA Cambridge, 2026*
