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
  textDim: "#7b8aa5",
  textBright: "#f0f4f8",
  blue: "#3d7cf5",
  blueGlow: "rgba(61,124,245,0.10)",
  cyan: "#22b8cf",
  green: "#34d399",
  greenDim: "rgba(52,211,153,0.10)",
  yellow: "#fbbf24",
  orange: "#f97316",
  orangeDim: "rgba(249,115,22,0.10)",
  red: "#ef4444",
  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.10)",
  pink: "#f472b6",
};

// ── Entities for View 1: Ecosystem (healthcare booking scenario) ──
const ENTITIES = [
  {
    id: "developer",
    label: "Developer",
    desc: "Trains the foundation model.",
    color: C.blue,
    x: 80, y: 420, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Does not sign the credential directly. The developer\u2019s work appears indirectly in the MODEL section, where the provider records the model name and family (e.g., \"Claude Opus vX.Y\" from Anthropic).",
    benefitsActor: [
      {
        title: "Clear model provenance",
        detail:
          "Linking bookings to a specific model version lets the developer see where their model is used and whether issues arise in sensitive domains like healthcare.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Model-version context for incidents",
        detail:
          "If clinical booking errors recur across hospitals, the polyclinic and regulator can see they all involved the same model version, instead of guessing whether it was a deployment issue.",
      },
    ],
  },
  {
    id: "provider",
    label: "Provider",
    desc: "Builds the healthcare booking agent product.",
    color: C.green,
    x: 80, y: 310, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Signs the PROVIDER, MODEL, and INCIDENT RESPONSE sections. For this scenario, MedBot SG attests to four claims: who they are (a stable provider identifier in the registry), how to reach their security team, whether this agent session can be shut down remotely, and which model/version is running. The first three are the provider\u2019s own contributions; the model fields originate with the developer but become verifiable when MedBot SG signs them.",
    benefitsActor: [
      {
        title: "Access to sensitive APIs",
        detail:
          "Polyclinic systems can require signed provider identity and refuse anonymous or unverifiable agents. By attesting to who they are and how to reach them, MedBot SG becomes eligible for integrations with appointment and patient-facing endpoints that would otherwise be closed.",
      },
      {
        title: "Scoped mitigations when things go wrong",
        detail:
          "If a booking incident occurs, the provider signature lets the polyclinic target mitigations to MedBot SG\u2019s product specifically instead of blocking all traffic from shared infrastructure, which would affect other providers\u2019 agents and their customers.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Reachable provider, not just an IP address",
        detail:
          "Provider identity plus a security contact and incident endpoint give the polyclinic a concrete team to call when appointment availability is scraped or misused. Without these fields, the only response is blocking an IP address, which may also disrupt unrelated services running on the same infrastructure.",
      },
      {
        title: "Targeted model-level response",
        detail:
          "When a vulnerability is found in a specific model version, the provider-signed MODEL fields let services and regulators identify exactly which deployed agents in healthcare are affected and coordinate upgrades (for example, notifying all deployers running v3.2.1) instead of issuing precautionary blanket blocks.",
      },
    ],
  },
  {
    id: "deployer",
    label: "Deployer",
    desc: "Configures and launches the agent.",
    color: C.orange,
    x: 80, y: 200, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Signs the DEPLOYER and CAPABILITIES sections. Raffles Medical signs a claim that this MedBot SG deployment is acting on its behalf. That claim carries a verified organizational anchor (such as a government-issued entity number), so the service can distinguish a known healthcare institution from an anonymous caller. It also carries the deployment\u2019s declared capability scope: this agent may read appointment availability and book slots, but not access clinical histories or billing records. This claim is tied to the provider\u2019s signed record, so it cannot be reused with a different product.",
    benefitsActor: [
      {
        title: "Access requires accountability",
        detail:
          "If polyclinics reserve richer scheduling APIs for identified healthcare organizations, Raffles Medical gains an integration path that anonymous deployers cannot use. Because deployer identity has weak natural disclosure incentives, participation usually depends on demand-side pressure from services or governance requirements.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Not all deployments are equal",
        detail:
          "Without deployer identity, every MedBot SG deployment looks the same to the polyclinic: it knows which product is calling, but not which organization configured it. The service cannot grant access proportionately or isolate a misbehaving deployment without affecting others.",
      },
      {
        title: "Scope prevents bad defaults",
        detail:
          "Without declared scope, the service is pushed toward two bad options: grant broader API access than necessary, or deny useful agents entirely because it cannot distinguish appointment booking from broader unjustified access.",
      },
    ],
  },
  {
    id: "agent",
    label: "Agent Instance",
    desc: "A single booking session making this request.",
    color: C.cyan,
    x: 305, y: 200, w: 210, h: 88,
    zone: "core",
    contribution:
      "Creates the INSTANCE section at runtime: a session ID and a declared purpose (for example, \"appointment_booking\"). The session ID lets the polyclinic tie multiple API calls to one booking attempt \u2014 check_availability, then book_slot, then confirm_booking \u2014 so it can spot when a fourth request for billing_records does not fit the pattern. The declared purpose gives the service a quick cross-check: does what the agent claims to be doing match what the deployer authorized? Both fields are unsigned; the agent has no trusted key. They are useful for tracking and logging, not sufficient grounds for sharing patient data. The agent instance carries signed credentials from the provider and deployer but cannot forge or alter them.",
    benefitsActor: [
      {
        title: "Standardised operational traceability",
        detail:
          "Providers and deployers already generate session IDs for debugging and billing. The Agent ID standardises this so that a polyclinic can isolate one misbehaving booking session without shutting down the whole product.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Detection floor for requests",
        detail:
          "Without a session ID, all traffic from MedBot SG looks the same to the polyclinic. It can block everything or allow everything, but it cannot distinguish one suspicious booking attempt from another. The session ID is the detection floor \u2014 not enough to trust an agent with sensitive data, but the minimum needed to correlate requests, spot anomalies, and build an audit trail that the provider and deployer identity sections can later make actionable.",
      },
    ],
  },
  {
    id: "agentid",
    label: "Agent ID Credential",
    desc: "Envelope carrying all identity claims.",
    color: C.pink,
    x: 390, y: 120, w: 180, h: 56,
    zone: "core",
    contribution:
      "Groups seven sections \u2014 Instance, Provider, Model, Safety, Deployer, Capabilities, Incident Response \u2014 into one composite payload. Keeps separate signatures from MedBot SG, SG AISI (for Safety), and Raffles Medical on their respective parts.",
    benefitsActor: [
      {
        title: "Single integration point",
        detail:
          "Instead of negotiating bespoke contracts and formats with each clinic, the agent product can present the same structured credential to many healthcare services.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "One object to inspect before sharing data",
        detail:
          "The polyclinic can look at a single credential to understand who built and deployed this agent, what model it runs on, and how to reach them, before deciding whether to disclose appointment availability.",
      },
    ],
  },
  {
    id: "service",
    label: "Service",
    desc: "Polyclinic API deciding whether to share slots.",
    color: C.red,
    x: 600, y: 200, w: 210, h: 88,
    zone: "core",
    contribution:
      "Does not contribute data to the credential. It verifies signatures against registry-held keys, checks the credential against its access policy for appointment data, and logs each decision together with the credential for audit.",
    benefitsActor: [
      {
        title: "Finer-grained access control",
        detail:
          "The polyclinic can approve bookings only when the agent comes from trusted providers and deployers with appropriate capabilities, instead of treating all HTTP clients the same.",
      },
      {
        title: "Defensible decisions",
        detail:
          "If a patient or regulator questions why a booking request was allowed, the service can point to the credential fields it relied on at the time.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Where policy becomes practice",
        detail:
          "Every governance rule about when agents may see healthcare appointment data is enforced here, using the evidence in the credential rather than opaque internal heuristics.",
      },
    ],
  },
  {
    id: "registry",
    label: "Registry",
    desc: "Reference store for keys and records.",
    color: C.purple,
    x: 460, y: 40, w: 170, h: 56,
    zone: "core",
    contribution:
      "Does not appear as a section in the credential. Stores public keys for MedBot SG, SG AISI, and Raffles Medical, together with provider records, certification status, and incident history that services can query.",
    benefitsActor: [
      {
        title: "Centralised verification",
        detail:
          "MedBot SG and Raffles Medical only need to register once; many clinic APIs can reuse the same records and keys instead of onboarding each provider independently.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Consistent trust checks across services",
        detail:
          "Every polyclinic or hospital API can verify signatures and check safety records in the same place, so weak links don\u2019t appear simply because one service skipped due diligence.",
      },
    ],
  },
  {
    id: "incident",
    label: "Incident Responder",
    desc: "Investigates booking incidents and follow-up.",
    color: C.textDim,
    x: 830, y: 200, w: 180, h: 72,
    zone: "external",
    contribution:
      "Does not sign or alter the credential. Consumes the same Agent ID and service logs to understand which product and which deployer were involved when something goes wrong with appointment data.",
    benefitsActor: [
      {
        title: "Faster root-cause analysis",
        detail:
          "Having all relevant actors and their claims in one credential lets responders quickly see whether an issue looks like a model problem, a provider bug, or a deployer misconfiguration.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Feedback loop into policy",
        detail:
          "Findings from incidents can be turned into requirements on which fields must be present for future sensitive-data access, tightening the Agent ID over time where it matters most.",
      },
    ],
  },
];

// ── Connections ──
const CONNECTIONS = [
  { from: "developer", to: "provider", label: "provides model" },
  { from: "provider", to: "deployer", label: "provides agent product" },
  { from: "deployer", to: "agent", label: "configures + launches" },
  { from: "agent", to: "agentid", label: "attaches credential" },
  { from: "agentid", to: "service", label: "request + Agent ID" },
  { from: "service", to: "registry", label: "verify & lookup" },
  { from: "service", to: "incident", label: "logs + escalation" },
];

// ── Zone backgrounds ──
const ZONES = [
  { label: "Supply Chain", x: 55, y: 175, w: 210, h: 330, color: C.orangeDim, borderColor: C.orange },
  { label: "Agent Identity Infrastructure", x: 285, y: 20, w: 520, h: 300, color: C.blueGlow, borderColor: C.blue },
  { label: "Response Context", x: 805, y: 175, w: 210, h: 110, color: C.purpleDim, borderColor: C.purple },
];

// ── Helpers ──
function getCenter(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

// Wrap description text based on actual box width/height so it fits cleanly.
function wrapLinesToBox(text, boxWidth, fontSize = 8, paddingX = 24, maxLines = 3) {
  if (!text) return [];

  const avgCharWidth = fontSize * 0.62;
  const maxChars = Math.max(10, Math.floor((boxWidth - paddingX) / avgCharWidth));

  const words = text.split(/\s+/);
  const lines = [];
  let current = "";

  for (let i = 0; i < words.length; i++) {
    const candidate = current ? `${current} ${words[i]}` : words[i];

    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (!current) {
      lines.push(words[i].slice(0, maxChars - 1) + "…");
    } else {
      lines.push(current);
      current = words[i];
    }

    if (lines.length === maxLines) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "…";
      return lines;
    }
  }

  if (current) lines.push(current);

  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "…";
  }

  return lines;
}

function Arrow({ x1, y1, x2, y2, color = C.border, dashed = false, opacity = 0.6 }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
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
        x1={x1}
        y1={y1}
        x2={ax}
        y2={ay}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "5,4" : "none"}
      />
      <polygon
        points={`${x2},${y2} ${ax + px * 0.6},${ay + py * 0.6} ${ax - px * 0.6},${ay - py * 0.6}`}
        fill={color}
      />
    </g>
  );
}

function EdgeLabel({ x, y, text }) {
  if (!text) return null;
  const w = text.length * 5.4 + 12;
  return (
    <g transform={`translate(${x - w / 2}, ${y - 11})`} opacity={0.9}>
      <rect width={w} height={14} rx={7} fill={C.bg} stroke={C.border} />
      <text
        x={w / 2}
        y={9.5}
        fontSize={7.5}
        fill={C.textDim}
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace"
      >
        {text}
      </text>
    </g>
  );
}

// ── Main Component ──
export default function ArchV4() {
  const [selected, setSelected] = useState(null);

  const sel = ENTITIES.find((e) => e.id === selected);

  const handleClick = useCallback((id) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.blue,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Agent ID PoC \u2014 Ecosystem View
          </div>
          <h1
            style={{
              fontSize: 17,
              fontWeight: 700,
              margin: 0,
              color: C.textBright,
              letterSpacing: "-0.3px",
            }}
          >
            Healthcare Booking Scenario
          </h1>
          <p
            style={{
              fontSize: 10,
              color: C.textDim,
              margin: "4px 0 0",
              maxWidth: 540,
            }}
          >
            A MedBot SG booking agent, deployed by Raffles Medical, is asking a polyclinic API for appointment
            availability. This view shows who the actors are and what information each one contributes to the Agent ID
            so the polyclinic can decide whether to share sensitive scheduling data. Click any component to see its
            role.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
          <svg viewBox="0 0 1050 530" style={{ width: "100%", height: "100%", minHeight: 480 }}>
            <defs>
              {ENTITIES.map((e) => (
                <clipPath key={`clip-${e.id}`} id={`clip-${e.id}`}>
                  <rect
                    x={e.x + 12}
                    y={e.y + 30}
                    width={e.w - 24}
                    height={e.h - 38}
                    rx={6}
                  />
                </clipPath>
              ))}
            </defs>

            {ZONES.map((z, i) => (
              <g key={i}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx={12}
                  fill={z.color}
                  stroke={z.borderColor}
                  strokeWidth={1}
                  strokeDasharray="6,4"
                  opacity={0.5}
                />
                <text
                  x={z.x + 10}
                  y={z.y + 16}
                  fontSize={9}
                  fontWeight={700}
                  fill={z.borderColor}
                  fontFamily="inherit"
                  opacity={0.7}
                >
                  {z.label}
                </text>
              </g>
            ))}

            {CONNECTIONS.map((c, i) => {
              const from = ENTITIES.find((e) => e.id === c.from);
              const to = ENTITIES.find((e) => e.id === c.to);
              if (!from || !to) return null;
              const f = getCenter(from);
              const t = getCenter(to);
              const dx = t.x - f.x;
              const dy = t.y - f.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) return null;
              const ux = dx / len;
              const uy = dy / len;
              const sx = f.x + ux * (from.w / 2 + 4);
              const sy = f.y + uy * (from.h / 2 + 4);
              const ex = t.x - ux * (to.w / 2 + 4);
              const ey = t.y - uy * (to.h / 2 + 4);

              return (
                <Arrow key={i} x1={sx} y1={sy} x2={ex} y2={ey} color={C.border} opacity={0.5} />
              );
            })}

            {ENTITIES.map((e) => {
              const isSel = selected === e.id;
              const bodyFontSize = 8;
              const lineHeight = 10;
              const maxLines = Math.max(1, Math.floor((e.h - 40) / lineHeight));
              const lines = wrapLinesToBox(e.desc, e.w, bodyFontSize, 24, maxLines);

              return (
                <g key={e.id} onClick={() => handleClick(e.id)} style={{ cursor: "pointer" }}>
                  {isSel && (
                    <rect
                      x={e.x - 3}
                      y={e.y - 3}
                      width={e.w + 6}
                      height={e.h + 6}
                      rx={12}
                      fill="none"
                      stroke={e.color}
                      strokeWidth={2}
                      opacity={0.4}
                    >
                      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <rect
                    x={e.x}
                    y={e.y}
                    width={e.w}
                    height={e.h}
                    rx={9}
                    fill={isSel ? C.cardSelected : C.card}
                    stroke={isSel ? e.color : C.border}
                    strokeWidth={isSel ? 1.5 : 1}
                  />
                  <text
                    x={e.x + 12}
                    y={e.y + 22}
                    fontSize={11}
                    fontWeight={700}
                    fill={e.color}
                    fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace"
                  >
                    {e.label}
                  </text>
                  <g clipPath={`url(#clip-${e.id})`}>
                    {lines.map((line, idx) => (
                      <text
                        key={idx}
                        x={e.x + 12}
                        y={e.y + 38 + idx * lineHeight}
                        fontSize={bodyFontSize}
                        fill={C.textDim}
                        fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace"
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                </g>
              );
            })}

            {/* Draw edge labels on top of nodes so they are never obscured */}
            {CONNECTIONS.map((c, i) => {
              const from = ENTITIES.find((e) => e.id === c.from);
              const to = ENTITIES.find((e) => e.id === c.to);
              if (!from || !to || !c.label) return null;
              const f = getCenter(from);
              const t = getCenter(to);
              const dx = t.x - f.x;
              const dy = t.y - f.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) return null;
              const ux = dx / len;
              const uy = dy / len;
              const sx = f.x + ux * (from.w / 2 + 4);
              const sy = f.y + uy * (from.h / 2 + 4);
              const ex = t.x - ux * (to.w / 2 + 4);
              const ey = t.y - uy * (to.h / 2 + 4);

              return (
                <EdgeLabel
                  key={`label-${i}`}
                  x={(sx + ex) / 2}
                  y={(sy + ey) / 2}
                  text={c.label}
                />
              );
            })}
          </svg>
        </div>

        <div
          style={{
            width: selected ? 360 : 0,
            overflow: "hidden",
            transition: "width 0.25s ease",
            borderLeft: selected ? `1px solid ${C.border}` : "none",
            background: C.panel,
            flexShrink: 0,
          }}
        >
          {sel && (
            <div style={{ width: 360, padding: 20, overflowY: "auto", height: "100%" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: sel.color }}>{sel.label}</h2>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.textDim,
                    cursor: "pointer",
                    fontSize: 18,
                    fontFamily: "inherit",
                    padding: "0 4px",
                  }}
                >
                  \u00d7
                </button>
              </div>
              <p
                style={{
                  fontSize: 10,
                  color: C.textDim,
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                {sel.desc}
              </p>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: C.blue,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Contribution to the Agent ID
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    fontSize: 10,
                    color: C.text,
                    lineHeight: 1.6,
                  }}
                >
                  {sel.contribution}
                </div>
              </div>

              {sel.benefitsActor && sel.benefitsActor.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.green,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    Benefits to the Actor
                  </div>
                  <div
                    style={{
                      borderRadius: 8,
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {sel.benefitsActor.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderBottom: i < sel.benefitsActor.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.text,
                            marginBottom: 3,
                          }}
                        >
                          {b.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.textDim,
                            lineHeight: 1.6,
                          }}
                        >
                          {b.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sel.benefitsEcosystem && sel.benefitsEcosystem.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: C.orange,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 8,
                    }}
                  >
                    Benefits to the Ecosystem
                  </div>
                  <div
                    style={{
                      borderRadius: 8,
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      overflow: "hidden",
                    }}
                  >
                    {sel.benefitsEcosystem.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderBottom: i < sel.benefitsEcosystem.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.text,
                            marginBottom: 3,
                          }}
                        >
                          {b.title}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: C.textDim,
                            lineHeight: 1.6,
                          }}
                        >
                          {b.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

