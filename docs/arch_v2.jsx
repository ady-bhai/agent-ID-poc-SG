import { useState, useCallback } from "react";

// ── Palette ──
const C = {
  bg: "#06090f",
  panel: "#0d1117",
  card: "#151b27",
  cardHover: "#1a2235",
  cardSelected: "#1c2842",
  border: "#21293b",
  borderFocus: "#3d7cf5",
  text: "#d1d9e6",
  textDim: "#5e6e87",
  textBright: "#f0f4f8",
  blue: "#3d7cf5",
  blueGlow: "rgba(61,124,245,0.10)",
  cyan: "#22b8cf",
  cyanDim: "rgba(34,184,207,0.10)",
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.10)",
  yellow: "#fbbf24",
  yellowDim: "rgba(251,191,36,0.10)",
  orange: "#f97316",
  orangeDim: "rgba(249,115,22,0.10)",
  red: "#ef4444",
  redDim: "rgba(239,68,68,0.10)",
  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.10)",
  pink: "#f472b6",
  pinkDim: "rgba(244,114,182,0.10)",
};

// ── Data ──

const ENTITIES = [
  // Supply chain (left side)
  {
    id: "developer",
    label: "Developer",
    desc: "Builds the foundation model",
    color: C.blue,
    x: 80, y: 520, w: 150, h: 64,
    zone: "supply",
    build: "mock",
    buildNote: "Not a software component. Represented by pre-configured data in the registry (model records, training details).",
    week: null,
    techDetails: [],
  },
  {
    id: "provider",
    label: "Provider",
    desc: "Packages model into agent product",
    color: C.green,
    x: 80, y: 410, w: 150, h: 64,
    zone: "supply",
    build: "mock",
    buildNote: "Not a software component. Represented by provider records in the registry + JWS-signed provider attestations in the Agent ID.",
    week: null,
    techDetails: [],
  },
  {
    id: "deployer",
    label: "Deployer",
    desc: "Configures & deploys agent for end use",
    color: C.orange,
    x: 80, y: 300, w: 150, h: 64,
    zone: "supply",
    build: "mock",
    buildNote: "Not a software component. Represented by deployer identity fields in Agent ID (including mocked Singpass anchor). JWS-signed deployer attestation.",
    week: null,
    techDetails: [],
  },

  // Core system (center)
  {
    id: "agent",
    label: "AI Agent Instance",
    desc: "MCP Client — sends requests with Agent ID",
    color: C.cyan,
    x: 290, y: 300, w: 180, h: 80,
    zone: "core",
    build: "build",
    buildNote: "TypeScript/Node.js using MCP SDK. Scripted (NOT an LLM). Configurable identity level (0–3). Makes deterministic tool calls.",
    week: 2,
    techDetails: [
      "MCP TypeScript SDK (client mode)",
      "Config file controls identity level",
      "Calls: book_appointment, check_availability",
      "Attaches Agent ID via X-Agent-ID HTTP header",
    ],
    landscape: [
      { name: "Google A2A Agent Card", verdict: "reference", note: "Alternative self-description format. Not used, but our capability declarations are comparable." },
      { name: "MCP-I (Vouched)", verdict: "reference", note: "Would add DID-based identity. Too heavy for PoC. Treat as reference." },
    ],
  },
  {
    id: "agentid",
    label: "Agent ID",
    desc: "The payload — structured, signed identity claims",
    color: C.pink,
    x: 370, y: 230, w: 150, h: 50,
    zone: "core",
    build: "build",
    buildNote: "THE novel contribution. Layered JSON schema with JWS-signed attestations. 7 sections: instance, provider, model, safety, deployer, capabilities, incident_response.",
    week: 1,
    techDetails: [
      "JSON schema v0.1 (Week 1 deliverable)",
      "JWS signing via jose library (RS256/ES256)",
      "Pre-generated keypairs per fictional actor",
      "Base64-encoded for HTTP header transport",
    ],
    landscape: [
      { name: "W3C Verifiable Credentials", verdict: "investigate", note: "VCs are the standard format for exactly this kind of claim. JWT-VC variant might be near-zero extra effort over raw JWS. NEEDS VERIFICATION." },
      { name: "SPIFFE/SPIRE SVIDs", verdict: "reference", note: "Production workload identity. Good 'future state' reference for CSA." },
    ],
    stressTests: [
      "Is JWS the right format, or should we use JWT-VC (VC-shaped, JWS-signed)?",
      "Full Level 3 payload + JWS sigs + base64 — does it exceed HTTP header limits (8-16KB)?",
      "Do our schema fields align with or diverge from MCP-I / Entra / A2A schemas?",
      "Has NIST or OWASP proposed required fields for agent identity?",
    ],
  },

  {
    id: "service",
    label: "Service",
    desc: "MCP Server — receives requests, makes trust decisions",
    color: C.red,
    x: 590, y: 300, w: 180, h: 80,
    zone: "core",
    build: "build",
    buildNote: "TypeScript MCP Server. Exposes tools (book_appointment, check_availability). Extracts Agent ID from headers. Passes to trust engine. Returns ALLOW/CHALLENGE/ESCALATE/DENY.",
    week: 2,
    techDetails: [
      "MCP TypeScript SDK (server mode)",
      "HTTP/SSE transport",
      "Extracts X-Agent-ID header, parses JSON",
      "Delegates to trust decision engine",
      "Emits events to dashboard via WebSocket/SSE",
    ],
    landscape: [
      { name: "Zero Trust Architecture (NIST)", verdict: "align", note: "The trust engine IS a zero-trust decision point. Aligning language with NIST ZTA strengthens CSA credibility." },
      { name: "A2UI Gatekeeper Pattern", verdict: "narrative", note: "Same principle: the receiver is the authority, not the sender. Useful for demo narration." },
    ],
  },
  {
    id: "trustengine",
    label: "Trust Decision Engine",
    desc: "Scores identity, matches risk thresholds",
    color: C.yellow,
    x: 590, y: 410, w: 180, h: 64,
    zone: "core",
    build: "build",
    buildNote: "~200 lines TypeScript. Calculates identity score (0–10) from present/verified fields. Matches against risk thresholds. Outputs decision + rationale.",
    week: 3,
    techDetails: [
      "Identity completeness score (0–10)",
      "Risk-threshold matching (LOW/MED/HIGH/CRIT)",
      "Registry cross-check (reputation, incidents)",
      "Output: ALLOW | CHALLENGE | ESCALATE | DENY + rationale",
    ],
    landscape: [
      { name: "ABAC (Attribute-Based Access Control)", verdict: "investigate", note: "Real systems use policy rules, not numeric scores. Score aggregation loses info about WHICH attributes are missing." },
    ],
    stressTests: [
      "Is numeric scoring defensible, or should we use policy-based rules?",
      "Do real API gateways or zero-trust systems use scoring models?",
    ],
  },
  {
    id: "registry",
    label: "Registry",
    desc: "Stores provider, safety, and incident data",
    color: C.purple,
    x: 440, y: 100, w: 170, h: 64,
    zone: "core",
    build: "build",
    buildNote: "Simple REST API (Express.js) backed by JSON file. Pre-populated with 3 fictional providers: TrustAI (reputable), QuickBot (partial), Unknown (none). ~1 day to build.",
    week: 3,
    techDetails: [
      "Express.js REST API",
      "JSON file or SQLite backing store",
      "Endpoints: GET /providers/:id, GET /models/:id/safety",
      "Pre-populated with 3 fictional archetypes",
    ],
    landscape: [
      { name: "NANDA Lean Index", verdict: "reference", note: "Federated discovery layer. Singapore wants to BE the central registry — federation is a 'future state' option." },
      { name: "AGNTCY DHT (IPFS)", verdict: "wrong-fit", note: "Decentralized, anti-takedown. Singapore wants enforcement ability. Wrong model." },
      { name: "MCP-I KnowThat.ai", verdict: "different", note: "Community reputation scoring ≠ curated safety attestations. Different purpose." },
      { name: "Google A2A Well-Known", verdict: "reference", note: "Self-published, no central registry. Works for big brands, fails for unknowns. Our registry fills that gap." },
    ],
  },
  {
    id: "logging",
    label: "Logging",
    desc: "Records interactions for audit & incident response",
    color: C.purple,
    x: 590, y: 520, w: 180, h: 56,
    zone: "core",
    build: "build",
    buildNote: "In-memory or file-append store. Logs full Agent ID, decision rationale, action taken, timestamp. Key demo element: contrast log richness between Level 0 and Level 3.",
    week: 3,
    techDetails: [
      "Append-only JSON log file",
      "Records: agent_id, decision, rationale, timestamp",
      "Feeds the Log/Outcome panel in visualization",
    ],
  },

  // External actors (right side)
  {
    id: "incident",
    label: "Incident Responders",
    desc: "External — uses Agent ID for escalation",
    color: C.textDim,
    x: 830, y: 300, w: 150, h: 64,
    zone: "external",
    build: "simulate",
    buildNote: "Not a software component. Simulated in the demo's 'incident response scenario' — the dashboard shows WHAT an incident responder would have access to at each identity level.",
    week: 6,
    techDetails: [],
  },

  // Visualization (top)
  {
    id: "viz",
    label: "Visualization Dashboard",
    desc: "THE primary deliverable — what IMDA sees",
    color: C.blue,
    x: 250, y: 30, w: 320, h: 56,
    zone: "viz",
    build: "build",
    buildNote: "React + Tailwind. 3 panels: Agent Request (left), Service Decision (center), Log/Outcome (right). Identity slider (0–3). Real-time updates via WebSocket. THIS IS THE PRODUCT.",
    week: 4,
    techDetails: [
      "React + Tailwind CSS",
      "WebSocket/SSE for real-time event streaming",
      "3-panel layout: Agent / Decision / Logs",
      "Identity level slider with instant re-run",
      "Incident response walkthrough (Week 6)",
      "Tabletop exercise mode (stretch, Week 6)",
    ],
  },
];

const WORKFLOW_STEPS = [
  { id: 1, label: "Operator selects scenario + identity level", from: "viz", to: "agent", desc: "Dashboard sends configuration to the agent instance: which scenario to run, which identity level (0–3) to present." },
  { id: 2, label: "Agent constructs Agent ID payload", from: "agent", to: "agentid", desc: "Based on identity level, the agent builds a JSON payload with the appropriate fields filled (Level 0 = empty, Level 3 = everything). JWS-signs provider and deployer attestations." },
  { id: 3, label: "Agent sends MCP request + Agent ID", from: "agentid", to: "service", desc: "MCP tool call (e.g., book_appointment) sent over HTTP/SSE. Agent ID attached as base64-encoded X-Agent-ID header." },
  { id: 4, label: "Service extracts and parses Agent ID", from: "service", to: "trustengine", desc: "MCP server receives request, extracts the X-Agent-ID header, base64-decodes, parses JSON, validates JWS signatures." },
  { id: 5, label: "Trust engine queries registry", from: "trustengine", to: "registry", desc: "Looks up provider record, checks safety attestation status, queries incident history. Registry returns supplementary data." },
  { id: 6, label: "Trust engine makes decision", from: "trustengine", to: "service", desc: "Calculates identity score, matches against risk threshold for the requested action, outputs ALLOW / CHALLENGE / ESCALATE / DENY with rationale." },
  { id: 7, label: "Service responds + logs everything", from: "service", to: "logging", desc: "Returns MCP response to agent. Logs: full Agent ID, decision, rationale, action, timestamp. Emits event to dashboard." },
  { id: 8, label: "Dashboard displays in real-time", from: "service", to: "viz", desc: "All three panels update: Agent Request View shows what was sent, Service Decision View shows the scoring process, Log View shows what was recorded." },
];

const BUILD_PHASES = [
  { week: 1, label: "Foundation", color: C.blue, items: ["Agent ID Schema v0.1", "Architecture decisions documented", "Dev environment setup", "Pre-generate demo keypairs"] },
  { week: 2, label: "Scaffolding", color: C.cyan, items: ["MCP client (agent) ↔ server (service)", "Agent ID payload travels with requests", "Basic parsing works end-to-end"] },
  { week: 3, label: "Core Logic", color: C.green, items: ["Trust decision engine (~200 LOC)", "Registry (REST API + JSON data)", "Logging store", "3 identity levels → 3 different outcomes"] },
  { week: 4, label: "Visualization", color: C.yellow, items: ["React dashboard — 3 panels", "Identity level slider", "Real-time event streaming", "Decision rationale display"] },
  { week: 5, label: "Integration", color: C.orange, items: ["End-to-end: select → request → decide → display", "2–3 complete scenarios", "< 2 sec per interaction", "Mid-point review with Sam"] },
  { week: "6–7", label: "Polish", color: C.pink, items: ["Incident response scenario", "'What's missing' drill-downs", "Bug fixes + hardening", "Tabletop exercise mode (stretch)", "Demo script + dry runs"] },
  { week: 8, label: "Delivery", color: C.red, items: ["Stakeholder presentation", "Spec doc + policy brief + demo script", "Packaged for handoff (README, docker-compose)"] },
];

// ── Helpers ──

function getCenter(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

function BuildBadge({ type }) {
  const map = {
    build: { label: "BUILD", bg: C.greenDim, color: C.green, border: "rgba(52,211,153,0.3)" },
    mock: { label: "MOCK", bg: C.yellowDim, color: C.yellow, border: "rgba(251,191,36,0.3)" },
    simulate: { label: "SIMULATE", bg: C.orangeDim, color: C.orange, border: "rgba(249,115,22,0.3)" },
  };
  const s = map[type] || map.mock;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 1.2,
      padding: "2px 7px", borderRadius: 4,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function VerdictBadge({ verdict }) {
  const map = {
    align: { label: "ALIGN WITH", color: C.green },
    investigate: { label: "INVESTIGATE", color: C.yellow },
    reference: { label: "REFERENCE ONLY", color: C.blue },
    "wrong-fit": { label: "WRONG FIT", color: C.red },
    different: { label: "DIFFERENT PURPOSE", color: C.orange },
    narrative: { label: "NARRATIVE USE", color: C.cyan },
  };
  const s = map[verdict] || map.reference;
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
      padding: "1px 5px", borderRadius: 3,
      color: s.color, border: `1px solid ${s.color}40`,
    }}>
      {s.label}
    </span>
  );
}

// ── Arrow drawing ──

function Arrow({ x1, y1, x2, y2, color = C.border, dashed = false, animated = false, opacity = 0.6 }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const ax = x2 - ux * 8;
  const ay = y2 - uy * 8;
  const headSize = 6;
  const px = -uy * headSize;
  const py = ux * headSize;

  return (
    <g opacity={opacity}>
      <line
        x1={x1} y1={y1} x2={ax} y2={ay}
        stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? "5,4" : "none"}
      >
        {animated && (
          <animate attributeName="stroke-dashoffset" from="18" to="0" dur="1s" repeatCount="indefinite" />
        )}
      </line>
      <polygon
        points={`${x2},${y2} ${ax + px * 0.6},${ay + py * 0.6} ${ax - px * 0.6},${ay - py * 0.6}`}
        fill={color}
      />
    </g>
  );
}

// ── Main Component ──

export default function ArchMap() {
  const [view, setView] = useState("arch"); // arch | workflow | build
  const [selected, setSelected] = useState(null);
  const [workflowStep, setWorkflowStep] = useState(null);
  const [showLandscape, setShowLandscape] = useState(false);

  const sel = ENTITIES.find(e => e.id === selected);

  const handleClick = useCallback((id) => {
    setSelected(prev => prev === id ? null : id);
    setWorkflowStep(null);
  }, []);

  const handleStepClick = useCallback((step) => {
    setWorkflowStep(prev => prev === step ? null : step);
    setSelected(null);
  }, []);

  // Connection definitions
  const conns = [
    { from: "developer", to: "provider", label: "trains model" },
    { from: "provider", to: "deployer", label: "packages" },
    { from: "deployer", to: "agent", label: "deploys" },
    { from: "agent", to: "agentid", label: "" },
    { from: "agentid", to: "service", label: "Request + Agent ID" },
    { from: "service", to: "trustengine", label: "" },
    { from: "trustengine", to: "registry", label: "verify" },
    { from: "service", to: "logging", label: "log" },
    { from: "service", to: "incident", label: "escalate" },
    { from: "viz", to: "agent", label: "", dashed: true },
    { from: "viz", to: "service", label: "", dashed: true },
  ];

  // Zone backgrounds
  const zones = [
    { label: "Supply Chain (Mocked)", x: 55, y: 275, w: 200, h: 330, color: C.orangeDim, borderColor: C.orange },
    { label: "Direction #1: Security Posture (Built)", x: 265, y: 80, w: 530, h: 520, color: C.blueGlow, borderColor: C.blue },
    { label: "External (Simulated)", x: 805, y: 275, w: 200, h: 110, color: C.purpleDim, borderColor: C.purple },
  ];

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: C.textBright, letterSpacing: "-0.3px" }}>
            Agent ID PoC — Architecture & Build Map
          </h1>
          <p style={{ fontSize: 10, color: C.textDim, margin: "4px 0 0", maxWidth: 500 }}>
            Click components for details. Toggle views to see architecture, workflow sequence, or build timeline.
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, background: C.panel, borderRadius: 7, padding: 2 }}>
            {[
              { id: "arch", label: "Architecture" },
              { id: "workflow", label: "Workflow" },
              { id: "build", label: "Build Plan" },
            ].map(v => (
              <button key={v.id} onClick={() => { setView(v.id); setSelected(null); setWorkflowStep(null); }}
                style={{
                  padding: "5px 12px", fontSize: 10, fontWeight: 600, borderRadius: 5,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: view === v.id ? C.blue : "transparent",
                  color: view === v.id ? "#fff" : C.textDim,
                  transition: "all 0.15s",
                }}>
                {v.label}
              </button>
            ))}
          </div>
          {view === "arch" && (
            <button onClick={() => setShowLandscape(p => !p)}
              style={{
                padding: "5px 10px", fontSize: 9, fontWeight: 600, borderRadius: 5,
                border: `1px solid ${showLandscape ? C.blue : C.border}`,
                cursor: "pointer", fontFamily: "inherit",
                background: showLandscape ? C.blueGlow : "transparent",
                color: showLandscape ? C.blue : C.textDim,
              }}>
              {showLandscape ? "▣ Landscape ON" : "▢ Landscape"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ── Main Canvas ── */}
        <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
          {view === "build" ? (
            /* ── BUILD PLAN VIEW ── */
            <div style={{ padding: 24, maxWidth: 900 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {BUILD_PHASES.map((phase, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 16, alignItems: "flex-start",
                    padding: "16px 20px",
                    background: C.card,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    position: "relative",
                  }}>
                    <div style={{
                      minWidth: 56, textAlign: "center",
                      padding: "6px 0",
                    }}>
                      <div style={{ fontSize: 9, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Week</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: phase.color }}>{phase.week}</div>
                    </div>
                    <div style={{ borderLeft: `2px solid ${phase.color}30`, paddingLeft: 16, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: phase.color, marginBottom: 8 }}>{phase.label}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {phase.items.map((item, j) => (
                          <span key={j} style={{
                            fontSize: 10, color: C.text,
                            padding: "4px 10px", borderRadius: 5,
                            background: `${phase.color}10`,
                            border: `1px solid ${phase.color}25`,
                          }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Components built this week */}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 160 }}>
                      {ENTITIES.filter(e => String(e.week) === String(phase.week)).map(e => (
                        <span key={e.id} style={{
                          fontSize: 8, fontWeight: 700, padding: "2px 6px",
                          borderRadius: 3, background: `${e.color}18`, color: e.color,
                          border: `1px solid ${e.color}30`,
                        }}>
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── ARCHITECTURE / WORKFLOW VIEW (SVG Canvas) ── */
            <svg viewBox="0 0 1050 630" style={{ width: "100%", height: "100%", minHeight: 580 }}>
              {/* Zone backgrounds */}
              {zones.map((z, i) => (
                <g key={i}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h}
                    rx={12} fill={z.color} stroke={z.borderColor} strokeWidth={1} strokeDasharray="6,4" opacity={0.5} />
                  <text x={z.x + 10} y={z.y + 16} fontSize={9} fontWeight={700} fill={z.borderColor} fontFamily="inherit" opacity={0.7}>
                    {z.label}
                  </text>
                </g>
              ))}

              {/* Connections */}
              {conns.map((c, i) => {
                const from = ENTITIES.find(e => e.id === c.from);
                const to = ENTITIES.find(e => e.id === c.to);
                if (!from || !to) return null;
                const f = getCenter(from);
                const t = getCenter(to);
                // Adjust endpoints to box edges
                const dx = t.x - f.x;
                const dy = t.y - f.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const ux = dx / len;
                const uy = dy / len;
                const sx = f.x + ux * (from.w / 2 + 4);
                const sy = f.y + uy * (from.h / 2 + 4);
                const ex = t.x - ux * (to.w / 2 + 4);
                const ey = t.y - uy * (to.h / 2 + 4);

                const isHighlighted = view === "workflow" && workflowStep !== null && (
                  WORKFLOW_STEPS[workflowStep]?.from === c.from && WORKFLOW_STEPS[workflowStep]?.to === c.to
                );

                return (
                  <g key={i}>
                    <Arrow x1={sx} y1={sy} x2={ex} y2={ey}
                      color={isHighlighted ? C.yellow : (c.dashed ? C.textDim : C.border)}
                      dashed={c.dashed}
                      opacity={isHighlighted ? 1 : (view === "workflow" && workflowStep !== null ? 0.15 : 0.5)}
                    />
                    {c.label && (
                      <text x={(sx + ex) / 2 + 8} y={(sy + ey) / 2 - 6}
                        fontSize={8} fill={isHighlighted ? C.yellow : C.textDim}
                        fontFamily="inherit" opacity={isHighlighted ? 1 : 0.7}>
                        {c.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Entity boxes */}
              {ENTITIES.map(e => {
                const isSel = selected === e.id;
                const isInWorkflow = view === "workflow" && workflowStep !== null && (
                  WORKFLOW_STEPS[workflowStep]?.from === e.id || WORKFLOW_STEPS[workflowStep]?.to === e.id
                );
                const dimmed = view === "workflow" && workflowStep !== null && !isInWorkflow;

                return (
                  <g key={e.id} onClick={() => handleClick(e.id)} style={{ cursor: "pointer" }}
                    opacity={dimmed ? 0.2 : 1}>
                    {/* Glow */}
                    {(isSel || isInWorkflow) && (
                      <rect x={e.x - 3} y={e.y - 3} width={e.w + 6} height={e.h + 6}
                        rx={12} fill="none" stroke={isInWorkflow ? C.yellow : e.color} strokeWidth={2} opacity={0.4}>
                        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                      </rect>
                    )}
                    <rect x={e.x} y={e.y} width={e.w} height={e.h}
                      rx={9} fill={isSel ? C.cardSelected : C.card}
                      stroke={isSel ? e.color : C.border} strokeWidth={isSel ? 1.5 : 1} />
                    <text x={e.x + 12} y={e.y + 20} fontSize={11} fontWeight={700} fill={e.color} fontFamily="inherit">
                      {e.label}
                    </text>
                    <text x={e.x + 12} y={e.y + 34} fontSize={8} fill={C.textDim} fontFamily="inherit">
                      {e.desc.length > 38 ? e.desc.slice(0, 38) + "…" : e.desc}
                    </text>
                    {/* Build badge */}
                    {e.build && (
                      <g>
                        <rect x={e.x + e.w - 48} y={e.y + 6} width={40} height={14} rx={3}
                          fill={e.build === "build" ? C.greenDim : e.build === "mock" ? C.yellowDim : C.orangeDim}
                          stroke={e.build === "build" ? `${C.green}40` : e.build === "mock" ? `${C.yellow}40` : `${C.orange}40`}
                          strokeWidth={1} />
                        <text x={e.x + e.w - 28} y={e.y + 16} fontSize={7} fontWeight={800}
                          fill={e.build === "build" ? C.green : e.build === "mock" ? C.yellow : C.orange}
                          fontFamily="inherit" textAnchor="middle">
                          {e.build.toUpperCase()}
                        </text>
                      </g>
                    )}
                    {/* Week badge */}
                    {e.week && (
                      <g>
                        <text x={e.x + 12} y={e.y + e.h - 8} fontSize={8} fill={C.textDim} fontFamily="inherit">
                          Wk {e.week}
                        </text>
                      </g>
                    )}
                    {/* Landscape indicator dots */}
                    {showLandscape && e.landscape && e.landscape.length > 0 && (
                      <g>
                        {e.landscape.map((l, li) => (
                          <circle key={li} cx={e.x + e.w - 12 - li * 10} cy={e.y + e.h - 10} r={3.5}
                            fill={l.verdict === "investigate" ? C.yellow : l.verdict === "align" ? C.green : l.verdict === "wrong-fit" ? C.red : C.blue}
                            stroke={C.bg} strokeWidth={1} />
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Direction #2 circle hint */}
              <ellipse cx={200} cy={420} rx={170} ry={200}
                fill="none" stroke={C.red} strokeWidth={1} strokeDasharray="8,6" opacity={0.2} />
              <text x={105} y={605} fontSize={9} fill={C.red} fontFamily="inherit" opacity={0.35}>
                Direction #2 scope (NOT this PoC)
              </text>

            </svg>
          )}

          {/* ── Workflow step selector (overlay) ── */}
          {view === "workflow" && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: `linear-gradient(transparent, ${C.bg} 20%)`,
              padding: "40px 20px 16px",
            }}>
              <div style={{
                display: "flex", gap: 4, overflowX: "auto",
                padding: "4px 0",
              }}>
                {WORKFLOW_STEPS.map((step, i) => {
                  const active = workflowStep === i;
                  return (
                    <button key={i} onClick={() => handleStepClick(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "8px 14px", borderRadius: 8,
                        border: `1px solid ${active ? C.yellow : C.border}`,
                        background: active ? C.yellowDim : C.card,
                        color: active ? C.yellow : C.textDim,
                        cursor: "pointer", fontFamily: "inherit",
                        fontSize: 10, fontWeight: active ? 700 : 500,
                        whiteSpace: "nowrap", flexShrink: 0,
                        transition: "all 0.15s",
                      }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? C.yellow : C.border,
                        color: active ? C.bg : C.textDim,
                        fontSize: 10, fontWeight: 800, flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      {step.label}
                    </button>
                  );
                })}
              </div>
              {workflowStep !== null && (
                <div style={{
                  marginTop: 8, padding: "10px 16px",
                  background: C.card, borderRadius: 8,
                  border: `1px solid ${C.yellow}30`,
                  fontSize: 11, color: C.text, lineHeight: 1.6,
                }}>
                  {WORKFLOW_STEPS[workflowStep].desc}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Detail Panel ── */}
        <div style={{
          width: selected ? 340 : 0,
          overflow: "hidden",
          transition: "width 0.25s ease",
          borderLeft: selected ? `1px solid ${C.border}` : "none",
          background: C.panel,
          flexShrink: 0,
        }}>
          {sel && (
            <div style={{ width: 340, padding: 20, overflowY: "auto", height: "100%" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: sel.color }}>{sel.label}</h2>
                <button onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, fontFamily: "inherit", padding: "0 4px" }}>
                  ×
                </button>
              </div>
              <p style={{ fontSize: 10, color: C.textDim, margin: "0 0 12px", lineHeight: 1.5 }}>{sel.desc}</p>

              {/* Build status */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                padding: "8px 12px", borderRadius: 7,
                background: sel.build === "build" ? C.greenDim : sel.build === "mock" ? C.yellowDim : C.orangeDim,
                border: `1px solid ${sel.build === "build" ? C.green : sel.build === "mock" ? C.yellow : C.orange}30`,
              }}>
                <BuildBadge type={sel.build} />
                <span style={{ fontSize: 10, color: C.text, lineHeight: 1.5 }}>{sel.buildNote}</span>
              </div>

              {/* Week */}
              {sel.week && (
                <div style={{ fontSize: 10, color: C.textDim, marginBottom: 16 }}>
                  <span style={{ fontWeight: 700, color: C.text }}>Build week:</span> Week {sel.week}
                </div>
              )}

              {/* Tech details */}
              {sel.techDetails && sel.techDetails.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Implementation
                  </div>
                  <div style={{ background: C.bg, borderRadius: 7, padding: 10, border: `1px solid ${C.border}` }}>
                    {sel.techDetails.map((t, i) => (
                      <div key={i} style={{
                        fontSize: 10, color: C.text, padding: "4px 0",
                        borderBottom: i < sel.techDetails.length - 1 ? `1px solid ${C.border}` : "none",
                        display: "flex", gap: 8,
                      }}>
                        <span style={{ color: sel.color, flexShrink: 0 }}>▸</span>{t}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stress tests */}
              {sel.stressTests && sel.stressTests.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.yellow, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    ⚡ Needs Verification
                  </div>
                  {sel.stressTests.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 10, color: C.text, padding: "8px 10px", marginBottom: 4,
                      background: C.yellowDim, borderRadius: 6,
                      border: `1px solid ${C.yellow}25`,
                      lineHeight: 1.5,
                    }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Landscape */}
              {sel.landscape && sel.landscape.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    Landscape Technologies
                  </div>
                  {sel.landscape.map((l, i) => (
                    <div key={i} style={{
                      padding: "8px 10px", marginBottom: 4,
                      background: C.bg, borderRadius: 6,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{l.name}</span>
                        <VerdictBadge verdict={l.verdict} />
                      </div>
                      <p style={{ fontSize: 10, color: C.textDim, margin: 0, lineHeight: 1.5 }}>{l.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
