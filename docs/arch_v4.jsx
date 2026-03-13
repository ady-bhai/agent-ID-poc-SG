import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";

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
      "Bundles the claims this request depends on into one object the polyclinic can inspect before sharing data. Provider claims, deployer claims, and any independent safety certification each retain the signer responsible for that claim, so the polyclinic can verify each one against the party that made it rather than trusting one actor\u2019s word for everything. The sections are also bound together, so a valid provider attestation cannot be reused with a different deployer or session.",
    benefitsActor: [
      {
        title: "Graduated identity for different use cases",
        detail:
          "The same credential format supports different levels of disclosure. An agent with only a session ID gets minimal access. One with provider identity and declared capabilities can qualify for lower-sensitivity access and basic scope checks. A credential carrying provider identity, deployer binding, declared capabilities, and safety assurance can qualify for patient scheduling data.",
      },
      {
        title: "One portable object for many services",
        detail:
          "Instead of each polyclinic inventing its own verification process, providers and deployers present one portable credential that different services can read. This lowers the friction that currently makes most services not check identity or safety evidence at all.",
      }
    ],
    benefitsEcosystem: [
      {
        title: "Consistent trust decisions across the system",
        detail:
          "Without a composite credential, sensitive-data decisions fragment into ad hoc arrangements: every polyclinic asks for different evidence, every provider answers differently, and trust decisions become inconsistent across the healthcare system.",
      },
      {
        title: "Preserved signer boundaries and binding",
        detail:
          "Without preserved signer boundaries, services cannot distinguish independently verified claims from self-reported ones. Without binding, legitimate fragments from different actors can be combined into misleading identities. The working draft treats interoperability, layered architecture, and non-reusability of ID parts as central design requirements; this credential is what those requirements look like in practice.",
      }
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

// ── Shared Agent ID state (single causal model, three lenses) ──

const INITIAL_AGENT_STATE = {
  scenario: "healthcare-booking",
  trustPreset: "provider-verifiable",
  actorToggles: {
    provider: true,
    deployer: true,
    instance: true,
  },
  actorFocus: null,
  credentialFocus: null,
  consequenceFocus: null,
  incidentState: "full",
  currentView: "ecosystem",
};

const AgentIdStateContext = createContext(null);

function AgentIdStateProvider({ children }) {
  const [state, setState] = useState(INITIAL_AGENT_STATE);

  const value = useMemo(
    () => ({
      state,
      setState,
      setPartialState: (patch) =>
        setState((prev) => ({
          ...prev,
          ...patch,
        })),
    }),
    [state],
  );

  return (
    <AgentIdStateContext.Provider value={value}>
      {children}
    </AgentIdStateContext.Provider>
  );
}

function useAgentIdState() {
  const ctx = useContext(AgentIdStateContext);
  if (!ctx) {
    throw new Error("useAgentIdState must be used within AgentIdStateProvider");
  }
  return ctx;
}

// ── Top control bar: scenario + trust presets + customize toggles ──

function TopControlBar() {
  const { state, setPartialState } = useAgentIdState();

  const presets = [
    {
      id: "no-identity",
      label: "No identity",
      description: "Service cannot verify agent or operator.",
      toggles: { provider: false, deployer: false, instance: true },
    },
    {
      id: "session-traceable",
      label: "Session traceable",
      description: "Service can correlate sessions, not source.",
      toggles: { provider: false, deployer: false, instance: true },
    },
    {
      id: "provider-verifiable",
      label: "Provider verifiable",
      description: "Service can verify provider identity.",
      toggles: { provider: true, deployer: false, instance: true },
    },
    {
      id: "full-chain-verifiable",
      label: "Full chain verifiable",
      description: "Service can verify provider + deployer + instance.",
      toggles: { provider: true, deployer: true, instance: true },
    },
  ];

  const activePreset =
    presets.find((p) => p.id === state.trustPreset) ?? presets[2];

  const handlePresetClick = useCallback(
    (preset) => {
      setPartialState({
        trustPreset: preset.id,
        actorToggles: preset.toggles,
      });
    },
    [setPartialState],
  );

  const handleToggleChange = useCallback(
    (key) => {
      setPartialState({
        trustPreset: "custom",
        actorToggles: {
          ...state.actorToggles,
          [key]: !state.actorToggles[key],
        },
      });
    },
    [setPartialState, state.actorToggles],
  );

  return (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
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
            Agent ID PoC — Interactive Views
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
            One shared state, three lenses. Use the controls to see how stronger or weaker identity changes
            what the polyclinic service can safely do with appointment data.
          </p>
        </div>
        <div
          style={{
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: C.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Identity strength presets
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {presets.map((p) => {
              const isActive = state.trustPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePresetClick(p)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${isActive ? C.blue : C.border}`,
                    background: isActive ? C.blueGlow : C.panel,
                    color: C.text,
                    fontSize: 10,
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: C.textDim,
              }}
            >
              Customize actors:
            </span>
            {["instance", "provider", "deployer"].map((key) => (
              <label
                key={key}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: C.textDim,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!state.actorToggles[key]}
                  onChange={() => handleToggleChange(key)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ textTransform: "capitalize" }}>{key}</span>
              </label>
            ))}
          </div>
          <div
            style={{
              fontSize: 9,
              color: C.textDim,
            }}
          >
            {activePreset.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View tabs / stepper ──

function ViewTabs() {
  const {
    state: { currentView },
    setPartialState,
  } = useAgentIdState();

  const views = [
    { id: "ecosystem", label: "1. Ecosystem", subtitle: "Who contributes what" },
    { id: "credential", label: "2. Credential", subtitle: "What the service can inspect" },
    { id: "consequences", label: "3. Consequences", subtitle: "What the service can still do" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 20px 6px",
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
      }}
    >
      {views.map((v) => {
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => setPartialState({ currentView: v.id })}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${isActive ? C.blue : C.border}`,
              background: isActive ? C.blueGlow : C.panel,
              color: C.text,
              cursor: "pointer",
              fontFamily: "inherit",
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {v.label}
            </span>
            <span
              style={{
                fontSize: 9,
                color: C.textDim,
              }}
            >
              {v.subtitle}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Ecosystem lens (map only; inspector is shared) ──

function EcosystemView() {
  const { state, setPartialState } = useAgentIdState();

  const handleClick = useCallback(
    (id) => {
      setPartialState({
        actorFocus: state.actorFocus === id ? null : id,
        // keep credential/consequence focus unchanged for now
      });
    },
    [setPartialState, state.actorFocus],
  );

  return (
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
          const isSel = state.actorFocus === e.id;
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
  );
}

// ── Credential lens (placeholder structure for now) ──

const CREDENTIAL_SECTIONS = [
  { id: "provider-identity", label: "Provider identity" },
  { id: "model", label: "Model" },
  { id: "incident-response", label: "Incident response" },
  { id: "deployer-identity", label: "Deployer identity" },
  { id: "capabilities", label: "Capabilities & scope" },
  { id: "safety-assurance", label: "Safety assurance" },
  { id: "instance", label: "Instance session" },
];

function CredentialView() {
  const { state, setPartialState } = useAgentIdState();

  const handleSectionClick = useCallback(
    (id) => {
      setPartialState({
        credentialFocus: state.credentialFocus === id ? null : id,
      });
    },
    [setPartialState, state.credentialFocus],
  );

  const actorToggles = state.actorToggles || {};

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        gap: 16,
        padding: 16,
      }}
    >
      <div
        style={{
          width: 220,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.textDim,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Who has signed this?
        </div>
        {["provider", "deployer", "instance"].map((key) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              color: C.textDim,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!actorToggles[key]}
              onChange={() =>
                setPartialState({
                  trustPreset: "custom",
                  actorToggles: {
                    ...actorToggles,
                    [key]: !actorToggles[key],
                  },
                })
              }
              style={{ cursor: "pointer" }}
            />
            <span style={{ textTransform: "capitalize" }}>{key}</span>
          </label>
        ))}
        <p
          style={{
            fontSize: 10,
            color: C.textDim,
            marginTop: 4,
          }}
        >
          Uncheck an actor to see which sections disappear from the credential, then
          notice how the service&apos;s options change.
        </p>
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 420,
            borderRadius: 12,
            background: C.card,
            border: `1px solid ${C.border}`,
            padding: 16,
            display: "grid",
            gridTemplateColumns: "1fr",
            rowGap: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.textBright,
              marginBottom: 4,
            }}
          >
            Agent ID credential
          </div>
          {CREDENTIAL_SECTIONS.map((s) => {
            const isFocused = state.credentialFocus === s.id;
            // very simple mapping just for visual dimming
            const isPresent =
              (s.id === "provider-identity" ||
                s.id === "model" ||
                s.id === "incident-response") ?
                actorToggles.provider :
              (s.id === "deployer-identity" || s.id === "capabilities") ?
                actorToggles.deployer :
              s.id === "instance" ?
                actorToggles.instance :
                actorToggles.provider && actorToggles.deployer;

            return (
              <button
                key={s.id}
                onClick={() => handleSectionClick(s.id)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: `1px solid ${
                    isFocused ? C.blue : isPresent ? C.border : "#202533"
                  }`,
                  background: isFocused
                    ? C.blueGlow
                    : isPresent
                    ? C.panel
                    : "#05070c",
                  opacity: isPresent ? 1 : 0.45,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: C.textBright,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.textDim,
                    marginBottom: 2,
                  }}
                >
                  In any deployment: short generic description of what this
                  section lets the service know.
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.textDim,
                    opacity: 0.85,
                  }}
                >
                  Example – MedBot SG: scenario-specific line tying this section
                  to the booking agent.
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Consequences lens (response/task cards) ──

const CONSEQUENCE_PHASES = [
  { id: "verify-source", label: "Verify source" },
  { id: "scope-permissions", label: "Scope permissions" },
  { id: "contact-operator", label: "Contact operator" },
  { id: "attribute-responsibility", label: "Attribute responsibility" },
  { id: "contain-shutdown", label: "Contain / shut down" },
  { id: "recover-report", label: "Recover / report" },
];

function computePhaseStatus(phaseId, state) {
  const { actorToggles } = state;
  const hasProvider = !!actorToggles.provider;
  const hasDeployer = !!actorToggles.deployer;
  const hasInstance = !!actorToggles.instance;

  if (phaseId === "verify-source") {
    if (hasProvider) return "works";
    if (hasInstance) return "degrades";
    return "fails";
  }

  if (phaseId === "attribute-responsibility") {
    if (hasProvider && hasDeployer) return "works";
    if (hasProvider || hasDeployer) return "degrades";
    return "fails";
  }

  if (phaseId === "scope-permissions") {
    if (hasDeployer) return "works";
    return "degrades";
  }

  if (phaseId === "contact-operator") {
    if (hasProvider) return "works";
    return "fails";
  }

  if (phaseId === "contain-shutdown") {
    if (hasProvider && hasInstance) return "works";
    if (hasProvider || hasInstance) return "degrades";
    return "fails";
  }

  if (phaseId === "recover-report") {
    if (hasProvider || hasDeployer || hasInstance) return "works";
    return "degrades";
  }

  return "degrades";
}

function ConsequencesView() {
  const { state, setPartialState } = useAgentIdState();

  const handleCardClick = useCallback(
    (id) => {
      setPartialState({
        consequenceFocus: state.consequenceFocus === id ? null : id,
      });
    },
    [setPartialState, state.consequenceFocus],
  );

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        flexDirection: "column",
        padding: 16,
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: C.textDim,
          maxWidth: 620,
        }}
      >
        This lens shows what the polyclinic can still do when different parts of
        the Agent ID are present or missing. Each card is a response task; its
        status reflects the current identity configuration.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 10,
        }}
      >
        {CONSEQUENCE_PHASES.map((p) => {
          const status = computePhaseStatus(p.id, state);
          const isFocused = state.consequenceFocus === p.id;
          const statusLabel =
            status === "works" ? "WORKS" : status === "degrades" ? "DEGRADES" : "FAILS";
          const statusColor =
            status === "works" ? C.green : status === "degrades" ? C.yellow : C.red;

          return (
            <button
              key={p.id}
              onClick={() => handleCardClick(p.id)}
              style={{
                borderRadius: 10,
                border: `1px solid ${isFocused ? C.blue : C.border}`,
                background: isFocused ? C.blueGlow : C.card,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: C.textBright,
                  }}
                >
                  {p.label}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.textDim,
                  marginBottom: 2,
                }}
              >
                In any deployment: short explanation of what this task means for
                a service.
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.textDim,
                  opacity: 0.85,
                }}
              >
                In this scenario: how the booking API would perform this task
                given the current credential and actor configuration.
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Shared inspector ──

function InspectorPanel() {
  const { state, setPartialState } = useAgentIdState();
  const selectedEntity = ENTITIES.find((e) => e.id === state.actorFocus) || null;

  const hasFocus = !!selectedEntity || !!state.credentialFocus || !!state.consequenceFocus;

  const handleDismiss = useCallback(() => {
    setPartialState({
      actorFocus: null,
      credentialFocus: null,
      consequenceFocus: null,
    });
  }, [setPartialState]);

  return (
    <div
      style={{
        width: hasFocus ? 360 : 0,
        overflow: "hidden",
        transition: "width 0.25s ease",
        borderLeft: hasFocus ? `1px solid ${C.border}` : "none",
        background: C.panel,
        flexShrink: 0,
      }}
    >
      {hasFocus && (
        <div style={{ width: 360, padding: 20, overflowY: "auto", height: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 4,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  color: selectedEntity ? selectedEntity.color : C.textBright,
                }}
              >
                {selectedEntity ? selectedEntity.label : "Focused element"}
              </h2>
              <div
                style={{
                  fontSize: 9,
                  color: C.textDim,
                  marginTop: 2,
                }}
              >
                Explanation of what this contributes, in any deployment and in
                this scenario.
              </div>
            </div>
            <button
              onClick={handleDismiss}
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
              ×
            </button>
          </div>

          {selectedEntity && (
            <>
              <p
                style={{
                  fontSize: 10,
                  color: C.textDim,
                  margin: "0 0 16px",
                  lineHeight: 1.6,
                }}
              >
                {selectedEntity.desc}
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
                  {selectedEntity.contribution}
                </div>
              </div>

              {selectedEntity.benefitsActor && selectedEntity.benefitsActor.length > 0 && (
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
                    {selectedEntity.benefitsActor.map((b, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "10px 14px",
                          borderBottom:
                            i < selectedEntity.benefitsActor.length - 1
                              ? `1px solid ${C.border}`
                              : "none",
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

              {selectedEntity.benefitsEcosystem &&
                selectedEntity.benefitsEcosystem.length > 0 && (
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
                      {selectedEntity.benefitsEcosystem.map((b, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 14px",
                            borderBottom:
                              i < selectedEntity.benefitsEcosystem.length - 1
                                ? `1px solid ${C.border}`
                                : "none",
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
            </>
          )}

          {!selectedEntity && (
            <div
              style={{
                fontSize: 10,
                color: C.textDim,
                lineHeight: 1.6,
              }}
            >
              Use the ecosystem, credential, or consequence views to focus on an
              actor, credential section, or response task. Their contribution
              and scenario-specific role will appear here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bottom strip: current service decision summary ──

function computeServiceOutcome(state) {
  const { actorToggles } = state;
  const hasProvider = !!actorToggles.provider;
  const hasDeployer = !!actorToggles.deployer;
  const hasInstance = !!actorToggles.instance;

  if (hasProvider && hasDeployer && hasInstance) {
    return { label: "ALLOW WITH CONDITIONS", severity: "info" };
  }

  if (hasProvider && (hasDeployer || hasInstance)) {
    return { label: "CHALLENGE / TIGHTEN SCOPE", severity: "warn" };
  }

  if (hasProvider || hasDeployer || hasInstance) {
    return { label: "LIMITED ACCESS ONLY", severity: "warn" };
  }

  return { label: "DENY / MANUAL REVIEW", severity: "error" };
}

function BottomStrip() {
  const { state, setPartialState } = useAgentIdState();
  const outcome = computeServiceOutcome(state);

  const color =
    outcome.severity === "info"
      ? C.green
      : outcome.severity === "warn"
      ? C.yellow
      : C.red;

  const nextLabel =
    state.currentView === "ecosystem"
      ? "Inspect in credential →"
      : state.currentView === "credential"
      ? "See what fails in consequences →"
      : "Reveal missing assurances →";

  const handleNext = useCallback(() => {
    if (state.currentView === "ecosystem") {
      setPartialState({ currentView: "credential" });
    } else if (state.currentView === "credential") {
      setPartialState({ currentView: "consequences" });
    } else {
      setPartialState({ currentView: "credential" });
    }
  }, [setPartialState, state.currentView]);

  const missing = [];
  if (!state.actorToggles.provider) missing.push("provider");
  if (!state.actorToggles.deployer) missing.push("deployer");
  if (!state.actorToggles.instance) missing.push("instance");

  return (
    <div
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: "8px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 10,
        background: C.panel,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: color,
          }}
        >
          Service outcome: {outcome.label}
        </div>
        <div
          style={{
            color: C.textDim,
          }}
        >
          Missing: {missing.length ? missing.join(", ") : "none — full chain visible"}
        </div>
      </div>
      <button
        onClick={handleNext}
        style={{
          borderRadius: 999,
          border: `1px solid ${C.blue}`,
          background: C.blueGlow,
          color: C.textBright,
          padding: "6px 14px",
          fontSize: 10,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ── Main shell: apply shared state + pick lens ──

export default function ArchV4() {
  return (
    <AgentIdStateProvider>
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
        <TopControlBar />
        <ViewTabs />
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <LensSwitcher />
          </div>
          <InspectorPanel />
        </div>
        <BottomStrip />
      </div>
    </AgentIdStateProvider>
  );
}

function LensSwitcher() {
  const {
    state: { currentView },
  } = useAgentIdState();

  if (currentView === "credential") return <CredentialView />;
  if (currentView === "consequences") return <ConsequencesView />;
  return <EcosystemView />;
}

