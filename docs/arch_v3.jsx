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

// ── Entities (governance-facing, Sam's cuts applied) ──
const ENTITIES = [
  {
    id: "developer",
    label: "Developer",
    desc: "Trains the foundation model. Responsible for base safety properties and release decisions.",
    color: C.blue,
    x: 80, y: 420, w: 160, h: 64,
    zone: "supply",
    contribution: "Does not sign the credential directly. The developer\u2019s contribution appears indirectly: the foundation model\u2019s name, version, and family are recorded in the MODEL section, which is signed by the Provider. Safety properties of the base model originate with the developer but are attested downstream by the Provider and Certifier.",
    benefitsActor: [
      { title: "Limited direct benefit", detail: "Developers are the most removed from the agent interaction. Their model may be used by many providers in many products. Traceability creates exposure but is largely managed by providers downstream." },
      { title: "Defensive value", detail: "When a model version is linked to safety certifications, a developer can demonstrate that their model was tested and certified at the time of release. This protects against unfair blame when a deployment-level configuration causes harm." },
    ],
    benefitsEcosystem: [
      { title: "Systemic vulnerability tracking", detail: "If a foundation model has a flaw, the model version field in the credential allows regulators to identify every agent running that version \u2014 across all providers and deployers. Without this, a model-level vulnerability is invisible until each individual deployment fails." },
      { title: "Version-certification linkage", detail: "The credential links model version to the safety certification that covers it. When a model updates silently (v3.2.0 to v3.2.1), the service can detect that the certification may no longer apply \u2014 the exact scenario identified as critical for debugging and attribution." },
    ],
  },
  {
    id: "provider",
    label: "Provider",
    desc: "Builds and maintains the agent product. Signs attestations covering provider identity, model details, and incident response capability.",
    color: C.green,
    x: 80, y: 310, w: 160, h: 64,
    zone: "supply",
    contribution: "Signs (JWS) the PROVIDER, MODEL, and INCIDENT RESPONSE sections. The provider section includes the company name, a verified security contact, and the provider\u2019s cryptographic signature. The model section carries the model name, version, and family. The incident response section provides an escalation endpoint, SLA, and shutdown capability.",
    benefitsActor: [
      { title: "Reputation signal", detail: "Services that check the registry can see the provider\u2019s track record \u2014 incident history, response times, certification status. Providers with strong records are trusted more, and their agents get broader access." },
      { title: "Targeted incident isolation", detail: "When a provider signs their attestation, they can prove which deployments are theirs and which aren\u2019t. During an incident, this allows the provider to isolate the problem to a specific deployment rather than having all their agents treated as suspect." },
    ],
    benefitsEcosystem: [
      { title: "Enables escalation and containment", detail: "The provider\u2019s escalation endpoint and shutdown flag are what allow a service to respond to an incident beyond IP blocking. Without provider identity, the Contain phase degrades to collateral measures that affect all agents from any provider at that IP." },
      { title: "Model version traceability", detail: "When a model vulnerability is discovered, the provider\u2019s attestation links the agent to a specific model version. This allows targeted remediation (notify all deployers running v3.2.1) rather than blanket responses." },
    ],
  },
  {
    id: "deployer",
    label: "Deployer",
    desc: "The organization legally accountable for how this agent is configured and what it does. Identity verified via Singpass.",
    color: C.orange,
    x: 80, y: 200, w: 160, h: 64,
    zone: "supply",
    contribution: "Signs (JWS) the DEPLOYER and CAPABILITIES sections. The deployer section includes the organization\u2019s name, a Singpass-verified UEN (Unique Entity Number) that ties the agent to a Singapore-registered legal entity, and the deployer\u2019s cryptographic signature. The capabilities section declares which tools the agent is authorized to use and its autonomy level.",
    benefitsActor: [
      { title: "Low in isolation", detail: "Deployer identity creates legal exposure \u2014 if the agent causes harm, the deployer is identifiable and accountable. This is precisely why the market incentive for voluntary disclosure is weak." },
      { title: "Conditional access benefit", detail: "In a regime where services require deployer identity for high-value interactions (financial, healthcare), deployers who identify themselves gain access that anonymous deployers cannot. The benefit exists only when services enforce the requirement." },
    ],
    benefitsEcosystem: [
      { title: "Completes the accountability chain", detail: "Without deployer identity, the Identify phase of incident response terminates entirely. A regulator can find the provider and the model, but cannot reach the human or organization who configured and launched the agent. Proportionate enforcement becomes impossible." },
      { title: "Distinguishes deployer error from model defect", detail: "When the deployer is identified, an incident investigation can separate \u201Cthe deployer misconfigured the agent\u201D from \u201Cthe model has a vulnerability.\u201D Without this distinction, providers bear disproportionate blame and deployers escape scrutiny." },
    ],
  },
  {
    id: "agent",
    label: "Agent Instance",
    desc: "A running agent carrying a structured identity credential. The agent is a carrier, not an author \u2014 the credential is assembled from pre-existing attestations.",
    color: C.cyan,
    x: 310, y: 200, w: 190, h: 80,
    zone: "core",
    contribution: "Generates the INSTANCE section: a session ID (UUID) and a declared purpose (e.g., \u201Cappointment_booking\u201D). These fields are self-asserted and unsigned \u2014 the agent creates them at runtime. The agent also carries the assembled credential (all other sections) but does not author those sections.",
    benefitsActor: [
      { title: "Session correlation", detail: "The instance ID allows the agent\u2019s own operators to track and debug its behavior across interactions. This is standard operational infrastructure that providers and deployers already generate for billing and monitoring." },
    ],
    benefitsEcosystem: [
      { title: "Minimum viable identity", detail: "Even without any other credential sections, a session ID lets a service correlate actions within a single interaction. This is the baseline that enables the Detect phase of incident response \u2014 noticing that something anomalous is happening." },
      { title: "The \u201Ccarrier, not author\u201D principle", detail: "The agent instance demonstrates a key design property: the credential is assembled from attestations that pre-exist the interaction. The agent carries what others have signed. It cannot forge or modify signed sections." },
    ],
  },
  {
    id: "agentid",
    label: "Agent ID Credential",
    desc: "Structured, signed identity payload with 7 sections. Three independent signers: Provider, Certifier (SG AISI), Deployer.",
    color: C.pink,
    x: 390, y: 120, w: 180, h: 56,
    zone: "core",
    contribution: "IS the credential. A structured JSON payload with 7 sections (Instance, Provider, Model, Safety, Deployer, Capabilities, Incident Response), independently signed by three actors: the Provider signs Provider + Model + IR Endpoint sections; an independent Certifier (SG AISI) signs the Safety certification; the Deployer signs Deployer + Capabilities. The credential travels with each agent request as structured metadata.",
    benefitsActor: [
      { title: "Access to higher-value interactions", detail: "Services that require identity will deny or restrict agents without credentials. A full credential unlocks access to sensitive operations (financial data, healthcare records) that would otherwise be blocked entirely." },
      { title: "Differentiation from unidentified agents", detail: "In a market where many agents have no identity, carrying a verified credential is a competitive advantage \u2014 it signals engineering discipline and accountability." },
    ],
    benefitsEcosystem: [
      { title: "The composite signing model is the novel contribution", detail: "No existing standard \u2014 OAuth, MCP, OIDC, Google A2A, Microsoft Entra \u2014 carries safety attestations, deployer accountability, and incident response endpoints in a single payload with independent signatures from multiple supply chain actors. OAuth tells you \u201Cthis agent is authorized.\u201D The credential tells you \u201Cthis agent was responsibly built, tested, and deployed by accountable parties.\u201D" },
      { title: "Enables graduated governance", detail: "The 4 identity levels (0\u20133) allow proportionate regulation: low-risk interactions require minimal identity; high-risk interactions require full credentials. This avoids the false choice between \u201Cregulate everything\u201D and \u201Cregulate nothing.\u201D" },
    ],
  },
  {
    id: "service",
    label: "Service",
    desc: "Receives agent requests and makes trust decisions based on the credential. Logs all interactions for audit and incident response.",
    color: C.red,
    x: 590, y: 200, w: 190, h: 80,
    zone: "core",
    contribution: "Does not contribute to the credential \u2014 it consumes it. The Service verifies signatures against registry-held public keys, cross-references claims (provider reputation, model safety reports, incident history), and applies trust decision rules. Maintains an audit log of every interaction: credential received, decision made, action taken, timestamp. These logs are the primary evidence source for incident responders.",
    benefitsActor: [
      { title: "Proportionate risk management", detail: "Instead of binary allow/deny, the service can graduate its response: allow low-risk actions with minimal identity, require full identity for sensitive operations. This means the service doesn\u2019t have to block all agents (losing economic value) or accept all agents (taking on unquantified risk)." },
      { title: "Liability protection", detail: "When something goes wrong, the service can demonstrate it made an informed decision based on the credential evidence available. The audit log proves due diligence." },
    ],
    benefitsEcosystem: [
      { title: "The decision point for the entire system", detail: "Every governance benefit of the credential is realized here \u2014 if the service doesn\u2019t check the credential, none of the upstream attestations matter. The service\u2019s willingness to differentiate based on identity creates the market signal that incentivizes providers and deployers to participate." },
      { title: "Incident response foundation", detail: "The service\u2019s logs \u2014 recording which credential was presented and what decision was made \u2014 are what incident responders use to reconstruct what happened. Without service-side logging, the 5-phase incident response framework has no evidence base." },
    ],
  },
  {
    id: "registry",
    label: "Registry",
    desc: "Stores provider records, safety reports, and incident history. Enables services to cross-reference credential claims.",
    color: C.purple,
    x: 460, y: 40, w: 170, h: 56,
    zone: "core",
    contribution: "Does not appear in the credential itself \u2014 it supplements it. The registry stores provider records (name, contact, registration status, incident history), model safety reports, deployer registration status, and public keys for signature verification. Services query the registry to cross-reference claims made in the credential.",
    benefitsActor: [
      { title: "Verification infrastructure", detail: "The registry is how a service checks whether a provider\u2019s signature is genuine (by looking up their public key), whether a safety certification is current, and whether a provider has a history of incidents. Without it, the service must trust the credential at face value." },
      { title: "Reduces individual due diligence", detail: "Each service doesn\u2019t need to independently verify every provider. The registry centralizes this, lowering the cost of participation for services." },
    ],
    benefitsEcosystem: [
      { title: "Reputation mechanism", detail: "The registry\u2019s incident history for a provider functions as a reputation signal. Providers with clean records get trusted; providers with incident histories get scrutinized. This creates market incentives for good behavior without mandating it." },
      { title: "Governance question: who operates this?", detail: "In production, the registry operator is a consequential governance decision. For the PoC, it is a centralized reference store. In deployment, it could be IMDA, GovTech, a public-private consortium, or a federated model. The architecture is agnostic to this choice." },
    ],
  },
  {
    id: "incident",
    label: "Incident Responder",
    desc: "Uses the credential to detect anomalies, contain threats, investigate root cause, identify accountable parties, and resolve incidents.",
    color: C.textDim,
    x: 830, y: 200, w: 160, h: 64,
    zone: "external",
    contribution: "Does not contribute to or sign the credential. The incident responder is a consumer of the credential and the service\u2019s audit logs. During an incident, they use this evidence across 5 phases: Detect (was something anomalous?), Contain (can we stop it?), Investigate (what went wrong?), Identify (who is accountable?), Resolve (full remediation).",
    benefitsActor: [
      { title: "Evidence availability", detail: "A full credential gives the responder everything needed to act quickly: who built the agent, what model, what safety testing, who deployed it, how to reach them, and whether shutdown is possible. This directly reduces response time and cost." },
      { title: "Clear accountability boundaries", detail: "The credential\u2019s structure separates provider responsibility (model, safety, IR endpoint) from deployer responsibility (configuration, capabilities). This lets the responder assign fault correctly rather than guessing." },
    ],
    benefitsEcosystem: [
      { title: "Phase-termination visibility", detail: "The incident responder\u2019s experience makes the cost of missing credential sections concrete. Without Safety, investigation terminates. Without Deployer, identification terminates. Without IR Endpoint, containment terminates. These are specific phases that fail entirely." },
      { title: "Accesses the service\u2019s audit logs", detail: "The service maintains interaction logs as a subcomponent of its operation. The incident responder accesses these logs to reconstruct the timeline: what credential was presented, what decision was made, what action was taken, and when. This is the observability function \u2014 not a separate system, but a capability of the service that the responder draws on." },
    ],
  },
];

// ── Connections ──
const CONNECTIONS = [
  { from: "developer", to: "provider", label: "trains model" },
  { from: "provider", to: "deployer", label: "provides product" },
  { from: "deployer", to: "agent", label: "deploys + configures" },
  { from: "agent", to: "agentid", label: "" },
  { from: "agentid", to: "service", label: "credential + request" },
  { from: "service", to: "registry", label: "verify claims" },
  { from: "service", to: "incident", label: "escalate + logs" },
];

// ── Zone backgrounds ──
const ZONES = [
  { label: "Supply Chain", x: 55, y: 175, w: 210, h: 330, color: C.orangeDim, borderColor: C.orange },
  { label: "Agent Identity Infrastructure", x: 285, y: 20, w: 520, h: 300, color: C.blueGlow, borderColor: C.blue },
  { label: "Response", x: 805, y: 175, w: 210, h: 110, color: C.purpleDim, borderColor: C.purple },
];

// ── Helpers ──
function getCenter(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
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
        x1={x1} y1={y1} x2={ax} y2={ay}
        stroke={color} strokeWidth={1.5}
        strokeDasharray={dashed ? "5,4" : "none"}
      />
      <polygon
        points={`${x2},${y2} ${ax + px * 0.6},${ay + py * 0.6} ${ax - px * 0.6},${ay - py * 0.6}`}
        fill={color}
      />
    </g>
  );
}

// ── Main Component ──
export default function ArchV3() {
  const [selected, setSelected] = useState(null);

  const sel = ENTITIES.find(e => e.id === selected);

  const handleClick = useCallback((id) => {
    setSelected(prev => prev === id ? null : id);
  }, []);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: C.blue, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
            Agent ID PoC \u2014 Reference Architecture
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: C.textBright, letterSpacing: "-0.3px" }}>
            AI Agent Identity Ecosystem
          </h1>
          <p style={{ fontSize: 10, color: C.textDim, margin: "4px 0 0", maxWidth: 520 }}>
            Who are the actors, what do they contribute to the credential, and what governance capability does each enable? Click any component for details.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, position: "relative", overflow: "auto" }}>
          <svg viewBox="0 0 1050 530" style={{ width: "100%", height: "100%", minHeight: 480 }}>
            {ZONES.map((z, i) => (
              <g key={i}>
                <rect x={z.x} y={z.y} width={z.w} height={z.h}
                  rx={12} fill={z.color} stroke={z.borderColor} strokeWidth={1} strokeDasharray="6,4" opacity={0.5} />
                <text x={z.x + 10} y={z.y + 16} fontSize={9} fontWeight={700} fill={z.borderColor} fontFamily="inherit" opacity={0.7}>
                  {z.label}
                </text>
              </g>
            ))}

            {CONNECTIONS.map((c, i) => {
              const from = ENTITIES.find(e => e.id === c.from);
              const to = ENTITIES.find(e => e.id === c.to);
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
                <g key={i}>
                  <Arrow x1={sx} y1={sy} x2={ex} y2={ey} color={C.border} opacity={0.5} />
                  {c.label && (
                    <text x={(sx + ex) / 2 + 8} y={(sy + ey) / 2 - 6}
                      fontSize={8} fill={C.textDim} fontFamily="inherit" opacity={0.7}>
                      {c.label}
                    </text>
                  )}
                </g>
              );
            })}

            {ENTITIES.map(e => {
              const isSel = selected === e.id;
              return (
                <g key={e.id} onClick={() => handleClick(e.id)} style={{ cursor: "pointer" }}>
                  {isSel && (
                    <rect x={e.x - 3} y={e.y - 3} width={e.w + 6} height={e.h + 6}
                      rx={12} fill="none" stroke={e.color} strokeWidth={2} opacity={0.4}>
                      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <rect x={e.x} y={e.y} width={e.w} height={e.h}
                    rx={9} fill={isSel ? C.cardSelected : C.card}
                    stroke={isSel ? e.color : C.border} strokeWidth={isSel ? 1.5 : 1} />
                  <text x={e.x + 12} y={e.y + 22} fontSize={11} fontWeight={700} fill={e.color} fontFamily="inherit">
                    {e.label}
                  </text>
                  <text x={e.x + 12} y={e.y + 36} fontSize={7.5} fill={C.textDim} fontFamily="inherit">
                    {e.desc.length > 50 ? e.desc.slice(0, 50) + "\u2026" : e.desc}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={{
          width: selected ? 360 : 0,
          overflow: "hidden",
          transition: "width 0.25s ease",
          borderLeft: selected ? `1px solid ${C.border}` : "none",
          background: C.panel,
          flexShrink: 0,
        }}>
          {sel && (
            <div style={{ width: 360, padding: 20, overflowY: "auto", height: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: sel.color }}>{sel.label}</h2>
                <button onClick={() => setSelected(null)}
                  style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 18, fontFamily: "inherit", padding: "0 4px" }}>
                  \u00D7
                </button>
              </div>
              <p style={{ fontSize: 10, color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>{sel.desc}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: C.blue, textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8,
                }}>
                  Contribution to the Agent ID
                </div>
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: C.bg, border: `1px solid ${C.border}`,
                  fontSize: 10, color: C.text, lineHeight: 1.6,
                }}>
                  {sel.contribution}
                </div>
              </div>

              {sel.benefitsActor && sel.benefitsActor.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8,
                  }}>
                    Benefits to the Actor
                  </div>
                  <div style={{
                    borderRadius: 8, background: C.bg,
                    border: `1px solid ${C.border}`, overflow: "hidden",
                  }}>
                    {sel.benefitsActor.map((b, i) => (
                      <div key={i} style={{
                        padding: "10px 14px",
                        borderBottom: i < sel.benefitsActor.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>
                          {b.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sel.benefitsEcosystem && sel.benefitsEcosystem.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: C.orange, textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8,
                  }}>
                    Benefits to the Ecosystem
                  </div>
                  <div style={{
                    borderRadius: 8, background: C.bg,
                    border: `1px solid ${C.border}`, overflow: "hidden",
                  }}>
                    {sel.benefitsEcosystem.map((b, i) => (
                      <div key={i} style={{
                        padding: "10px 14px",
                        borderBottom: i < sel.benefitsEcosystem.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                          {b.title}
                        </div>
                        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>
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
