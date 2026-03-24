import {
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";

// ── Palette (unchanged from v4) ──
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

// ══════════════════════════════════════════════════════════════
// NEW IN V5: Field-level data model
// Source of truth: the spreadsheet + IR split decision
// 13 fields, 3 cryptographic signers + 1 self-asserted
// ══════════════════════════════════════════════════════════════

const FIELDS = [
  // ── Developer-signed (3 fields) ──
  {
    id: "developer_id",
    label: "Developer ID",
    signer: "developer",
    signerLabel: "Developer",
    reader: "Service",
    group: "identity",
    groupLabel: "Who is behind this agent?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: false, irShutdown: false },
    scenarioValue: "Anthropic",
    withoutThis: "Can\u2019t trace to model developer",
    withoutThisDetail: "Cannot trace agent to foundation model developer. Systemic vulnerabilities remain invisible across deployments.",
  },
  {
    id: "foundation_model_id",
    label: "Foundation Model ID",
    signer: "developer",
    signerLabel: "Developer",
    reader: "Service",
    group: "identity",
    groupLabel: "Who is behind this agent?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: true, irShutdown: false },
    scenarioValue: "Claude 3.5 Sonnet",
    withoutThis: "Unknown base model version",
    withoutThisDetail: "Cannot identify which foundation model version is running. Safety test results cannot be matched to deployment.",
  },
  {
    id: "foundation_safety_tests",
    label: "Foundation Model safety tests",
    signer: "developer",
    signerLabel: "Developer",
    reader: "Service",
    group: "safety",
    groupLabel: "Is it safe?",
    purposes: { acceptReject: true, accountability: false, riskMgmt: true, irContact: false, irShutdown: false },
    scenarioValue: "Safety eval: pass \u00B7 Red-team: pass",
    withoutThis: "No base model safety evidence",
    withoutThisDetail: "No evidence the foundation model has been safety-tested. Service cannot assess foundational risk.",
  },

  // ── Provider-signed (4 fields) ──
  {
    id: "provider_id",
    label: "Provider ID",
    signer: "provider",
    signerLabel: "Provider",
    reader: "Service",
    group: "identity",
    groupLabel: "Who is behind this agent?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: true, irShutdown: true },
    scenarioValue: "MedBot SG Pte Ltd",
    withoutThis: "Unknown product builder",
    withoutThisDetail: "Cannot identify who built the agent product. Escalation has no target and incident isolation is impossible.",
  },
  {
    id: "agentic_model_id",
    label: "Agentic Model ID",
    signer: "provider",
    signerLabel: "Provider",
    reader: "Service",
    group: "identity",
    groupLabel: "Who is behind this agent?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: true, irShutdown: false },
    scenarioValue: "MedBot Healthcare Assistant v2.1",
    withoutThis: "Can\u2019t distinguish from other agents",
    withoutThisDetail: "Cannot distinguish this product from other agents by the same provider. Targeted response becomes impossible.",
  },
  {
    id: "agentic_safety_tests",
    label: "Agentic Model safety tests",
    signer: "provider",
    signerLabel: "Provider",
    reader: "Service",
    group: "safety",
    groupLabel: "Is it safe?",
    purposes: { acceptReject: true, accountability: false, riskMgmt: true, irContact: false, irShutdown: false },
    scenarioValue: "Healthcare safety: pass \u00B7 PII handling: pass",
    withoutThis: "No domain-specific safety evidence",
    withoutThisDetail: "No evidence the agent product has been tested for healthcare. Service cannot assess application-level safety.",
  },
  {
    id: "escalation_contact",
    label: "Escalation contact + SLA",
    signer: "provider",
    signerLabel: "Provider",
    reader: "Service",
    group: "incident_response",
    groupLabel: "If something goes wrong?",
    purposes: { acceptReject: false, accountability: false, riskMgmt: false, irContact: true, irShutdown: false },
    scenarioValue: "security@medbot.sg \u00B7 4hr SLA",
    withoutThis: "No guaranteed escalation channel",
    withoutThisDetail: "No SLA-backed channel to reach the provider security team. Incident response degrades to best-effort contact.",
  },

  // ── Deployer-signed (5 fields) ──
  {
    id: "deployer_id",
    label: "Deployer ID",
    signer: "deployer",
    signerLabel: "Deployer",
    reader: "Service",
    group: "accountability",
    groupLabel: "Who deployed it?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: true, irShutdown: true },
    scenarioValue: "Raffles Medical Group",
    withoutThis: "Unknown deploying organization",
    withoutThisDetail: "Cannot identify which organization configured and launched this agent. Deployer error becomes indistinguishable from model defect.",
  },
  {
    id: "deployer_accountability",
    label: "Deployer Accountability Identity",
    signer: "deployer",
    signerLabel: "Deployer",
    reader: "Government Regulator",
    selectiveDisclosure: true,
    group: "accountability",
    groupLabel: "Who deployed it?",
    purposes: { acceptReject: true, accountability: true, riskMgmt: false, irContact: true, irShutdown: true },
    scenarioValue: "Verified via Singpass \u00B7 regulator-only",
    withoutThis: "No verified legal identity",
    withoutThisDetail: "Regulator cannot verify the legal identity behind this deployment. Proportionate enforcement becomes impossible.",
  },
  {
    id: "shutdown_endpoint",
    label: "Shutdown endpoint",
    signer: "deployer",
    signerLabel: "Deployer",
    reader: "Service",
    group: "incident_response",
    groupLabel: "If something goes wrong?",
    purposes: { acceptReject: true, accountability: false, riskMgmt: false, irContact: false, irShutdown: true },
    scenarioValue: "api.medbot.sg/.../shutdown",
    withoutThis: "No remote shutdown capability",
    withoutThisDetail: "Cannot remotely stop this agent. Containment degrades to blocking the IP address, affecting all agents on shared infrastructure.",
  },
  {
    id: "deployer_auth",
    label: "Deployer Authentication",
    signer: "deployer",
    signerLabel: "Deployer",
    reader: "Service",
    group: "authorization",
    groupLabel: "What can it do here?",
    purposes: { acceptReject: true, accountability: false, riskMgmt: false, irContact: false, irShutdown: false },
    scenarioValue: "OAuth 2.0 \u00B7 issued by MedBot SG",
    withoutThis: "Deployer authorization unverifiable",
    withoutThisDetail: "Cannot verify this agent is authorized to act on behalf of any deployer. Request origin is unverifiable.",
  },
  {
    id: "deployer_permissions",
    label: "Deployer Delegated Permissions",
    signer: "deployer",
    signerLabel: "Deployer",
    reader: "Service",
    group: "authorization",
    groupLabel: "What can it do here?",
    purposes: { acceptReject: true, accountability: false, riskMgmt: false, irContact: false, irShutdown: false },
    scenarioValue: "read_appointment_slots \u00B7 supervised",
    withoutThis: "Scope unverifiable",
    withoutThisDetail: "Cannot verify declared scope. Service cannot distinguish appointment booking from unauthorized data access.",
  },

  // ── Self-asserted (1 field) ──
  {
    id: "agent_instance_id",
    label: "Agent Instance ID",
    signer: "self",
    signerLabel: "Self-asserted",
    reader: "Service",
    group: "identity",
    groupLabel: "Who is behind this agent?",
    purposes: { acceptReject: false, accountability: true, riskMgmt: true, irContact: true, irShutdown: true },
    scenarioValue: "a1b2c3d4 \u00B7 appointment_booking",
    withoutThis: "Can\u2019t correlate requests in session",
    withoutThisDetail: "Cannot correlate requests within this session. Anomaly detection is disabled and the audit trail is fragmented.",
  },
];

// Quick lookup
const FIELD_BY_ID = Object.fromEntries(FIELDS.map((f) => [f.id, f]));

// ── Actor-to-fields mapping ──
const ACTOR_FIELDS = {
  developer: ["developer_id", "foundation_model_id", "foundation_safety_tests"],
  provider: ["provider_id", "agentic_model_id", "agentic_safety_tests", "escalation_contact"],
  deployer: ["deployer_id", "deployer_accountability", "shutdown_endpoint", "deployer_auth", "deployer_permissions"],
  instance: ["agent_instance_id"],
};

// ── Signer colors (for badges) ──
const SIGNER_COLORS = {
  developer: C.blue,
  provider: C.green,
  deployer: C.orange,
  self: C.cyan,
};

// ══════════════════════════════════════════════════════════════
// NEW IN V5: Presets — 6 field-level configurations
// Each preset sets all 13 field toggles explicitly
// ══════════════════════════════════════════════════════════════

function makeToggles(onFields) {
  const t = {};
  for (const f of FIELDS) {
    t[f.id] = onFields.includes(f.id);
  }
  return t;
}

const ALL_FIELD_IDS = FIELDS.map((f) => f.id);

const PRESETS = [
  {
    id: "no-agent-id",
    label: "No Agent ID",
    description: "Service has no information.",
    fieldToggles: makeToggles([]),
  },
  {
    id: "instance-only",
    label: "Instance only",
    description: "Session trackable, nothing more.",
    fieldToggles: makeToggles(["agent_instance_id"]),
  },
  {
    id: "provider-model",
    label: "Provider + Model",
    description: "Product known, deployer unknown.",
    fieldToggles: makeToggles([
      "agent_instance_id",
      "developer_id", "foundation_model_id", "foundation_safety_tests",
      "provider_id", "agentic_model_id", "agentic_safety_tests",
      "escalation_contact",
    ]),
  },
  {
    id: "full-composite",
    label: "Full composite",
    description: "All required fields present.",
    fieldToggles: makeToggles(ALL_FIELD_IDS),
  },
  {
    id: "full-no-shutdown",
    label: "Full \u2013 no shutdown",
    description: "Complete except shutdown capability.",
    fieldToggles: makeToggles(ALL_FIELD_IDS.filter((id) => id !== "shutdown_endpoint")),
  },
  {
    id: "full-no-accountability",
    label: "Full \u2013 no accountability",
    description: "Complete except deployer accountability.",
    fieldToggles: makeToggles(ALL_FIELD_IDS.filter((id) => id !== "deployer_accountability")),
  },
];

// ══════════════════════════════════════════════════════════════
// NEW IN V5: Policy engine — field-driven
// ══════════════════════════════════════════════════════════════

function computeServiceOutcome(fieldToggles) {
  const ft = fieldToggles;
  const presentCount = Object.values(ft).filter(Boolean).length;

  if (presentCount === 0) {
    return { label: "DENY", reason: "No credential presented", severity: "error" };
  }

  const hasProductIdentity = ft.provider_id || ft.developer_id;
  const hasDeployerIdentity = ft.deployer_id || ft.deployer_auth;
  const hasSafetyEvidence = ft.agentic_safety_tests || ft.foundation_safety_tests;

  if (!hasProductIdentity && !hasDeployerIdentity) {
    return { label: "DENY", reason: "No product or deployer identity", severity: "error" };
  }

  if (hasProductIdentity && !hasDeployerIdentity) {
    return { label: "CHALLENGE", reason: "Product known, deployer unknown", severity: "warn" };
  }

  if (!ft.deployer_accountability) {
    return { label: "CHALLENGE", reason: "Deployer accountability missing", severity: "warn" };
  }

  if (!hasSafetyEvidence) {
    return { label: "ALLOW READ-ONLY", reason: "No safety evidence \u2014 read-only access", severity: "warn" };
  }

  if (!ft.shutdown_endpoint) {
    return { label: "ALLOW WITH CONDITIONS", reason: "No shutdown \u2014 service accepts risk", severity: "info" };
  }

  return { label: "GRANT ACCESS", reason: "All required fields present", severity: "success" };
}

function computePhaseStatus(phaseId, fieldToggles) {
  const ft = fieldToggles;

  if (phaseId === "verify-source") {
    const identityFields = [ft.provider_id, ft.developer_id, ft.agentic_model_id, ft.foundation_model_id, ft.agent_instance_id];
    const present = identityFields.filter(Boolean).length;
    if (present >= 4) return "works";
    if (present >= 1) return "limited";
    return "fails";
  }

  if (phaseId === "scope-permissions") {
    if (ft.deployer_permissions && ft.deployer_auth) return "works";
    if (ft.deployer_permissions || ft.deployer_auth) return "limited";
    return "fails";
  }

  if (phaseId === "contact-operator") {
    if (ft.escalation_contact) return "works";
    if (ft.provider_id || ft.deployer_id) return "limited";
    return "fails";
  }

  if (phaseId === "attribute-responsibility") {
    if (ft.provider_id && ft.deployer_id && ft.deployer_accountability) return "works";
    if (ft.provider_id || ft.deployer_id) return "limited";
    return "fails";
  }

  if (phaseId === "contain-shutdown") {
    if (ft.shutdown_endpoint && ft.agent_instance_id) return "works";
    if (ft.agent_instance_id) return "limited";
    return "fails";
  }

  if (phaseId === "recover-report") {
    const present = Object.values(ft).filter(Boolean).length;
    if (present >= 10) return "works";
    if (present >= 3) return "limited";
    return "fails";
  }

  return "limited";
}

// ── Backward compatibility: derive actor-level toggles from field state ──
function deriveActorToggles(fieldToggles) {
  const ft = fieldToggles;
  return {
    developer: ft.developer_id || ft.foundation_model_id || ft.foundation_safety_tests,
    provider: ft.provider_id || ft.agentic_model_id || ft.agentic_safety_tests || ft.escalation_contact,
    deployer: ft.deployer_id || ft.deployer_accountability || ft.shutdown_endpoint || ft.deployer_auth || ft.deployer_permissions,
    instance: ft.agent_instance_id,
  };
}

// ══════════════════════════════════════════════════════════════
// Entities, Connections, Zones — KEPT FROM V4
// (Content updates deferred to Pass 3)
// ══════════════════════════════════════════════════════════════

const ENTITIES = [
  {
    id: "developer",
    label: "Developer",
    desc: "Trains the foundation model. Signs 3 credential fields.",
    color: C.blue,
    x: 80, y: 420, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Signs Developer ID, Foundation Model ID, and foundation safety test results. Independently verifiable against Anthropic\u2019s key, not the provider\u2019s.",
    benefitsActor: [
      {
        title: "Independent model provenance",
        detail:
          "Because Anthropic signs the model fields directly, the polyclinic can verify the foundation model identity against Anthropic\u2019s public key in the registry. This protects Anthropic against misattribution: if MedBot SG claimed to use a different model version, the signature would fail.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Model-version context for incidents",
        detail:
          "If clinical booking errors recur across hospitals, the polyclinic and regulator can see they all involved the same foundation model version, and verify that claim against the developer\u2019s own signature rather than the provider\u2019s assertion.",
      },
    ],
  },
  {
    id: "provider",
    label: "Provider",
    desc: "Builds the healthcare booking agent product. Signs 4 fields.",
    color: C.green,
    x: 80, y: 310, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Signs Provider ID, Agentic Model ID, agentic safety test results, and escalation contact + SLA. Attests to the product: who built it, what model it runs, whether it was tested, and how to reach the security team.",
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
        title: "SLA-backed escalation channel",
        detail:
          "The provider-signed escalation contact gives the polyclinic a concrete team to call with a committed response time when appointment availability is scraped or misused. Without this field, the service knows the provider\u2019s name but has no guaranteed channel to reach them.",
      },
      {
        title: "Targeted model-level response",
        detail:
          "When a vulnerability is found in a specific agentic model version, the provider-signed fields let services and regulators identify exactly which deployed agents in healthcare are affected and coordinate upgrades, instead of issuing precautionary blanket blocks.",
      },
    ],
  },
  {
    id: "deployer",
    label: "Deployer",
    desc: "Configures and launches the agent. Signs 5 fields.",
    color: C.orange,
    x: 80, y: 200, w: 170, h: 72,
    zone: "supply",
    contribution:
      "Signs Deployer ID, accountability identity, shutdown endpoint, authentication, and permissions. Controls who deployed it, what it can do, and how to stop it. Accountability identity is verified via Singpass but readable only by regulators.",
    benefitsActor: [
      {
        title: "Access requires accountability",
        detail:
          "If polyclinics reserve richer scheduling APIs for identified healthcare organizations, Raffles Medical gains an integration path that anonymous deployers cannot use. Because deployer identity has weak natural disclosure incentives, participation usually depends on demand-side pressure from services or governance requirements.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Selective disclosure balances privacy and accountability",
        detail:
          "The deployer accountability identity is the only field in the credential that is not readable by the service. The service verifies its existence and signature; the actual legal identity is visible only to government regulators. This is the mechanism that balances the service\u2019s need to confirm a deployer is accountable with the deployer\u2019s privacy interest in not exposing their legal identity to every API they interact with.",
      },
      {
        title: "Deployer-controlled shutdown",
        detail:
          "The shutdown endpoint is signed by the deployer, not the provider, because Raffles Medical controls this specific running deployment. The provider builds the shutdown API; the deployer holds the authorization token for this instance. During an incident, the service or regulator can invoke shutdown without depending on the provider to act first.",
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
    desc: "Composite identity payload with independent signers.",
    color: C.pink,
    x: 390, y: 120, w: 180, h: 56,
    zone: "core",
    contribution:
      "Bundles fields from three independent signers (Developer, Provider, Deployer) plus one self-asserted field into one inspectable payload. Each signer\u2019s fields are independently verifiable. One field \u2014 deployer accountability \u2014 is present and signed but readable only by regulators.",
    benefitsActor: [
      {
        title: "Graduated identity for different use cases",
        detail:
          "The same credential format supports different levels of disclosure. An agent with only a session ID gets minimal access. One with provider identity and safety tests can qualify for lower-sensitivity operations. A credential carrying all 13 fields \u2014 including deployer authorization, safety evidence, and shutdown capability \u2014 can qualify for patient scheduling data.",
      },
      {
        title: "One portable object for many services",
        detail:
          "Instead of each polyclinic inventing its own verification process, providers and deployers present one portable credential that different services can read. This lowers the friction that currently makes most services not check identity or safety evidence at all.",
      },
    ],
    benefitsEcosystem: [
      {
        title: "Composite signing is the novel contribution",
        detail:
          "No existing standard \u2014 OAuth, MCP, OIDC, A2A, Entra Agent ID \u2014 carries safety attestations, deployer accountability, and incident response endpoints in a single payload with independent signatures from multiple supply chain actors. OAuth tells you the agent is authorized; this credential tells you it was responsibly built, tested, and deployed by accountable parties.",
      },
      {
        title: "Preserved signer boundaries and binding",
        detail:
          "Each actor signs only the fields they are responsible for. The sections are bound together so a valid provider attestation cannot be reused with a different deployer or session. This prevents mix-and-match attacks where legitimate fragments from different actors are combined into misleading identities.",
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
      "Does not appear as a section in the credential. Stores public keys for Anthropic, MedBot SG, and Raffles Medical, together with provider records and incident history that services can query to verify signatures and cross-reference claims.",
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

const CONNECTIONS = [
  { from: "developer", to: "provider", label: "provides model" },
  { from: "provider", to: "deployer", label: "provides agent product" },
  { from: "deployer", to: "agent", label: "configures + launches" },
  { from: "agent", to: "agentid", label: "attaches credential" },
  { from: "agentid", to: "service", label: "request + Agent ID" },
  { from: "service", to: "registry", label: "verify & lookup" },
  { from: "service", to: "incident", label: "logs + escalation" },
];

const ZONES = [
  { label: "Supply Chain", x: 55, y: 175, w: 210, h: 330, color: C.orangeDim, borderColor: C.orange },
  { label: "Agent Identity Infrastructure", x: 285, y: 20, w: 520, h: 300, color: C.blueGlow, borderColor: C.blue },
  { label: "Response Context", x: 805, y: 175, w: 210, h: 110, color: C.purpleDim, borderColor: C.purple },
];

// ── SVG Helpers (unchanged from v4) ──

function getCenter(e) {
  return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
}

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
      lines.push(words[i].slice(0, maxChars - 1) + "\u2026");
    } else {
      lines.push(current);
      current = words[i];
    }
    if (lines.length === maxLines) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "\u2026";
      return lines;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "\u2026";
  }
  return lines;
}

function Arrow({ x1, y1, x2, y2, color: arrowColor = C.border, opacity = 0.6 }) {
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
      <line x1={x1} y1={y1} x2={ax} y2={ay} stroke={arrowColor} strokeWidth={1.5} />
      <polygon
        points={`${x2},${y2} ${ax + px * 0.6},${ay + py * 0.6} ${ax - px * 0.6},${ay - py * 0.6}`}
        fill={arrowColor}
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
      <text x={w / 2} y={9.5} fontSize={7.5} fill={C.textDim} textAnchor="middle"
        fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace">
        {text}
      </text>
    </g>
  );
}

// ══════════════════════════════════════════════════════════════
// State context — REFACTORED for field-level toggles
// ══════════════════════════════════════════════════════════════

const INITIAL_AGENT_STATE = {
  scenario: "healthcare-booking",
  trustPreset: "full-composite",
  fieldToggles: makeToggles(ALL_FIELD_IDS),
  actorFocus: null,
  credentialFocus: null,
  consequenceFocus: null,
  currentView: "splash",
};

const AgentIdStateContext = createContext(null);

function AgentIdStateProvider({ children }) {
  const [state, setState] = useState(INITIAL_AGENT_STATE);

  const actorToggles = useMemo(
    () => deriveActorToggles(state.fieldToggles),
    [state.fieldToggles],
  );

  const value = useMemo(
    () => ({
      state,
      actorToggles,
      setState,
      setPartialState: (patch) =>
        setState((prev) => ({ ...prev, ...patch })),
    }),
    [state, actorToggles],
  );

  return (
    <AgentIdStateContext.Provider value={value}>
      {children}
    </AgentIdStateContext.Provider>
  );
}

function useAgentIdState() {
  const ctx = useContext(AgentIdStateContext);
  if (!ctx) throw new Error("useAgentIdState must be used within AgentIdStateProvider");
  return ctx;
}

// ══════════════════════════════════════════════════════════════
// TopControlBar — REFACTORED: 6 field presets + actor toggles
// ══════════════════════════════════════════════════════════════

function TopControlBar() {
  const { state, actorToggles, setPartialState } = useAgentIdState();

  const activePreset = PRESETS.find((p) => p.id === state.trustPreset) ?? PRESETS[3];

  const handlePresetClick = useCallback(
    (preset) => {
      setPartialState({
        trustPreset: preset.id,
        fieldToggles: { ...preset.fieldToggles },
      });
    },
    [setPartialState],
  );

  const handleActorToggle = useCallback(
    (actor) => {
      const currentlyOn = actorToggles[actor];
      const updates = {};
      for (const fieldId of ACTOR_FIELDS[actor]) {
        updates[fieldId] = !currentlyOn;
      }
      setPartialState({
        trustPreset: "custom",
        fieldToggles: { ...state.fieldToggles, ...updates },
      });
    },
    [setPartialState, state.fieldToggles, actorToggles],
  );

  const presentCount = Object.values(state.fieldToggles).filter(Boolean).length;

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
            One shared state, three lenses. Use the presets to see how stronger or weaker identity
            changes what the polyclinic service can safely do with appointment data.
          </p>
        </div>
        <div
          style={{
            minWidth: 280,
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
            Identity presets ({presentCount}/13 fields)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {PRESETS.map((p) => {
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
            <span style={{ fontSize: 9, color: C.textDim }}>
              Customize by actor:
            </span>
            {Object.entries(ACTOR_FIELDS).map(([actor]) => (
              <label
                key={actor}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 10,
                  color: SIGNER_COLORS[actor === "instance" ? "self" : actor] || C.textDim,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!actorToggles[actor]}
                  onChange={() => handleActorToggle(actor)}
                  style={{ cursor: "pointer" }}
                />
                <span style={{ textTransform: "capitalize" }}>{actor}</span>
              </label>
            ))}
          </div>
          <div style={{ fontSize: 9, color: C.textDim }}>
            {activePreset.description}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ViewTabs (unchanged from v4) ──

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
        alignItems: "center",
      }}
    >
      <button
        onClick={() => setPartialState({ currentView: "splash" })}
        style={{
          padding: "6px 8px",
          borderRadius: 999,
          border: `1px solid ${C.border}`,
          background: C.panel,
          color: C.textDim,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 12,
          lineHeight: 1,
        }}
        title="Back to overview"
      >
        \u2302
      </button>
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
            <span style={{ fontSize: 10, fontWeight: 600 }}>{v.label}</span>
            <span style={{ fontSize: 9, color: C.textDim }}>{v.subtitle}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── EcosystemView (unchanged from v4 — uses actorFocus only, no toggles) ──

function EcosystemView() {
  const { state, setPartialState } = useAgentIdState();

  const handleClick = useCallback(
    (id) => {
      setPartialState({
        actorFocus: state.actorFocus === id ? null : id,
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
              <rect x={e.x + 12} y={e.y + 30} width={e.w - 24} height={e.h - 38} rx={6} />
            </clipPath>
          ))}
        </defs>

        {ZONES.map((z, i) => (
          <g key={i}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill={z.color}
              stroke={z.borderColor} strokeWidth={1} strokeDasharray="6,4" opacity={0.5} />
            <text x={z.x + 10} y={z.y + 16} fontSize={9} fontWeight={700} fill={z.borderColor}
              fontFamily="inherit" opacity={0.7}>
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
          return <Arrow key={i} x1={sx} y1={sy} x2={ex} y2={ey} color={C.border} opacity={0.5} />;
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
                <rect x={e.x - 3} y={e.y - 3} width={e.w + 6} height={e.h + 6} rx={12} fill="none"
                  stroke={e.color} strokeWidth={2} opacity={0.4}>
                  <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
                </rect>
              )}
              <rect x={e.x} y={e.y} width={e.w} height={e.h} rx={9}
                fill={isSel ? C.cardSelected : C.card}
                stroke={isSel ? e.color : C.border} strokeWidth={isSel ? 1.5 : 1} />
              <text x={e.x + 12} y={e.y + 22} fontSize={11} fontWeight={700} fill={e.color}
                fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace">
                {e.label}
              </text>
              <g clipPath={`url(#clip-${e.id})`}>
                {lines.map((line, idx) => (
                  <text key={idx} x={e.x + 12} y={e.y + 38 + idx * lineHeight} fontSize={bodyFontSize}
                    fill={C.textDim} fontFamily="'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace">
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
          return <EdgeLabel key={`label-${i}`} x={(sx + ex) / 2} y={(sy + ey) / 2} text={c.label} />;
        })}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CredentialView — REBUILT in Pass 2
// 13 fields grouped by 5 service questions, with signer badges,
// scenario data, and field-level presence/absence
// ══════════════════════════════════════════════════════════════

const FIELD_GROUPS = [
  { id: "identity", question: "Who is behind this agent?", fieldIds: ["provider_id", "developer_id", "agentic_model_id", "foundation_model_id", "agent_instance_id"] },
  { id: "accountability", question: "Who deployed it?", fieldIds: ["deployer_id", "deployer_accountability"] },
  { id: "authorization", question: "What can it do here?", fieldIds: ["deployer_auth", "deployer_permissions"] },
  { id: "safety", question: "Is it safe?", fieldIds: ["agentic_safety_tests", "foundation_safety_tests"] },
  { id: "incident_response", question: "If something goes wrong?", fieldIds: ["escalation_contact", "shutdown_endpoint"] },
];

function computeGroupSummary(groupId, ft) {
  if (groupId === "identity") {
    if (ft.provider_id && ft.foundation_model_id) return "MedBot SG on Anthropic\u2019s Claude 3.5 Sonnet";
    if (ft.provider_id) return "MedBot SG \u00B7 model details unknown";
    if (ft.agent_instance_id) return "Session tracked \u00B7 product unknown";
    return "Unknown";
  }
  if (groupId === "accountability") {
    if (ft.deployer_id && ft.deployer_accountability) return "Raffles Medical \u00B7 verified identity";
    if (ft.deployer_id) return "Raffles Medical \u00B7 identity not verified";
    if (ft.deployer_accountability) return "Verified identity exists \u00B7 deployer unnamed";
    return "Unknown deployer";
  }
  if (groupId === "authorization") {
    if (ft.deployer_auth && ft.deployer_permissions) return "Appointment booking only \u00B7 authorized";
    if (ft.deployer_auth || ft.deployer_permissions) return "Partially specified";
    return "Scope and authorization unknown";
  }
  if (groupId === "safety") {
    if (ft.agentic_safety_tests && ft.foundation_safety_tests) return "Healthcare + foundation safety tests passed";
    if (ft.agentic_safety_tests || ft.foundation_safety_tests) return "Partial safety evidence";
    return "No safety evidence";
  }
  if (groupId === "incident_response") {
    if (ft.escalation_contact && ft.shutdown_endpoint) return "Shutdown available \u00B7 4hr escalation SLA";
    if (ft.escalation_contact) return "Escalation contact \u00B7 no shutdown";
    if (ft.shutdown_endpoint) return "Shutdown available \u00B7 no escalation contact";
    return "No incident response capability";
  }
  return "";
}

function SignerBadge({ signer }) {
  const color = SIGNER_COLORS[signer] || C.textDim;
  const label = signer === "self" ? "Self-asserted" : signer.charAt(0).toUpperCase() + signer.slice(1);
  return (
    <span
      style={{
        fontSize: 8,
        fontWeight: 600,
        padding: "1px 6px",
        borderRadius: 999,
        background: color + "18",
        color: color,
        border: `1px solid ${color}30`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function FieldRow({ field, isPresent, isFocused, onClick }) {
  const isSelective = field.selectiveDisclosure;

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        textAlign: "left",
        padding: "5px 10px",
        borderRadius: 6,
        border: `1px solid ${
          isFocused ? C.blue
            : !isPresent ? (C.red + "30")
              : isSelective ? (C.orange + "30")
                : C.border
        }`,
        background: isFocused
          ? C.blueGlow
          : !isPresent
            ? "#0f0a0a"
            : isSelective
              ? C.orangeDim
              : C.panel,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <span
        style={{
          width: 5, height: 5, borderRadius: 3, flexShrink: 0,
          background: isPresent ? C.green : C.red,
        }}
      />
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: isPresent ? C.text : C.textDim,
          flex: "1 1 auto",
        }}
      >
        {field.label}
      </span>
      {isPresent && (
        <span style={{ fontSize: 9, color: isSelective ? C.orange : C.textDim }}>
          {field.scenarioValue}
        </span>
      )}
      {!isPresent && (
        <span style={{ fontSize: 9, color: C.red }}>
          {field.withoutThis}
        </span>
      )}
      <SignerBadge signer={field.signer} />
      {isSelective && (
        <span style={{
          fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 3,
          background: C.red + "20", color: C.red, letterSpacing: 0.3,
        }}>
          REG
        </span>
      )}
    </button>
  );
}

function CredentialView() {
  const { state, setPartialState } = useAgentIdState();
  const ft = state.fieldToggles;
  const [expanded, setExpanded] = useState({});

  const toggleGroup = useCallback((groupId) => {
    setExpanded((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const handleFieldClick = useCallback(
    (fieldId) => {
      setPartialState({
        credentialFocus: state.credentialFocus === fieldId ? null : fieldId,
      });
    },
    [setPartialState, state.credentialFocus],
  );

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ width: 560, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ padding: "0 4px", marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textBright }}>
            Agent ID credential
          </div>
          <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
            Five questions the polyclinic needs answered. Click any group to see individual fields.
          </div>
        </div>

        {FIELD_GROUPS.map((group) => {
          const groupFields = group.fieldIds.map((id) => FIELD_BY_ID[id]);
          const groupPresent = group.fieldIds.filter((id) => ft[id]).length;
          const groupTotal = group.fieldIds.length;
          const isExpanded = !!expanded[group.id];
          const summary = computeGroupSummary(group.id, ft);
          const statusColor = groupPresent === groupTotal ? C.green : groupPresent > 0 ? C.yellow : C.red;

          return (
            <div
              key={group.id}
              style={{
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.card,
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggleGroup(group.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderBottom: isExpanded ? `1px solid ${C.border}` : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: "transparent",
                  border: "none",
                  borderBottom: isExpanded ? `1px solid ${C.border}` : "none",
                }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                    background: statusColor,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textBright }}>
                    {group.question}
                  </div>
                  <div style={{ fontSize: 9, color: statusColor, marginTop: 2 }}>
                    {summary}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: C.textDim, transition: "transform 0.15s", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                  \u25B8
                </span>
              </button>

              {isExpanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: 6 }}>
                  {groupFields.map((field) => (
                    <FieldRow
                      key={field.id}
                      field={field}
                      isPresent={!!ft[field.id]}
                      isFocused={state.credentialFocus === field.id}
                      onClick={() => handleFieldClick(field.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ConsequencesView — REFACTORED: same structure, field-driven logic
// ══════════════════════════════════════════════════════════════

const CONSEQUENCE_PHASES = [
  {
    id: "verify-source",
    label: "Who sent this?",
    generic: "Can the service verify the product and developer behind this agent?",
    scenario: "Can the polyclinic verify this is MedBot SG running on Anthropic\u2019s Claude, deployed by Raffles Medical?",
    depends: ["provider_id", "developer_id", "agentic_model_id", "foundation_model_id", "agent_instance_id"],
    worksWhen: "Product and developer identified",
    limitedWhen: "Partial identity available",
    failsWhen: "No identity information",
  },
  {
    id: "scope-permissions",
    label: "Is it authorized?",
    generic: "Can the service verify the agent\u2019s authorization and declared scope?",
    scenario: "Can the polyclinic confirm this agent is authorized by Raffles Medical and limited to reading appointment slots?",
    depends: ["deployer_auth", "deployer_permissions"],
    worksWhen: "Scope declared and authorization verified",
    limitedWhen: "Partially specified",
    failsWhen: "No authorization or scope",
  },
  {
    id: "contact-operator",
    label: "Can we reach someone?",
    generic: "Can the service reach someone responsible with a committed response time?",
    scenario: "Can the polyclinic reach MedBot SG\u2019s security team within 4 hours?",
    depends: ["escalation_contact", "provider_id", "deployer_id"],
    worksWhen: "Escalation contact with SLA",
    limitedWhen: "Can identify parties but no guaranteed channel",
    failsWhen: "No one to contact",
  },
  {
    id: "attribute-responsibility",
    label: "Who\u2019s at fault?",
    generic: "Can responders determine which actor is responsible and enforce accountability?",
    scenario: "Can regulators separate provider fault from deployer misconfiguration?",
    depends: ["provider_id", "deployer_id", "deployer_accountability"],
    worksWhen: "Provider, deployer, and legal identity available",
    limitedWhen: "Some parties identified",
    failsWhen: "No parties identifiable",
  },
  {
    id: "contain-shutdown",
    label: "Can we stop it?",
    generic: "Can the service remotely stop this specific agent?",
    scenario: "Can the polyclinic invoke the shutdown endpoint for this deployment?",
    depends: ["shutdown_endpoint", "agent_instance_id"],
    worksWhen: "Shutdown endpoint available",
    limitedWhen: "Can block session but no remote shutdown",
    failsWhen: "No containment capability",
  },
  {
    id: "recover-report",
    label: "Can we produce a report?",
    generic: "Can responders reconstruct what happened?",
    scenario: "Can the polyclinic identify which model, provider, and deployer were involved?",
    depends: ["agent_instance_id", "provider_id", "developer_id", "deployer_id", "agentic_safety_tests", "foundation_safety_tests", "deployer_permissions", "agentic_model_id", "foundation_model_id", "escalation_contact"],
    worksWhen: "Rich credential and audit trail",
    limitedWhen: "Partial information available",
    failsWhen: "Only timestamps and IP addresses",
  },
];

const PHASE_BY_ID = Object.fromEntries(CONSEQUENCE_PHASES.map((p) => [p.id, p]));

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
        overflowY: "auto",
      }}
    >
      <div style={{ fontSize: 10, color: C.textDim, maxWidth: 520 }}>
        What can the polyclinic do with the current credential? Click any card for detail.
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {CONSEQUENCE_PHASES.map((p) => {
          const status = computePhaseStatus(p.id, state.fieldToggles);
          const isFocused = state.consequenceFocus === p.id;
          const statusLabel =
            status === "works" ? "WORKS" : status === "limited" ? "LIMITED" : "FAILS";
          const statusColor =
            status === "works" ? C.green : status === "limited" ? C.yellow : C.red;
          const statusExplanation =
            status === "works" ? p.worksWhen : status === "limited" ? p.limitedWhen : p.failsWhen;

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
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textBright }}>
                  {p.label}
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: statusColor,
                  lineHeight: 1.4,
                }}
              >
                {statusExplanation}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// InspectorPanel — EXTENDED in Pass 2 to handle credentialFocus
// ══════════════════════════════════════════════════════════════

const PURPOSE_LABELS = {
  acceptReject: { label: "Accept / reject", color: C.red },
  accountability: { label: "Accountability", color: C.orange },
  riskMgmt: { label: "Risk management", color: C.yellow },
  irContact: { label: "IR: contact party", color: C.purple },
  irShutdown: { label: "IR: emergency shutdown", color: C.pink },
};

function FieldInspector({ field, isPresent }) {
  const signerColor = SIGNER_COLORS[field.signer] || C.textDim;
  const activePurposes = Object.entries(field.purposes)
    .filter(([, v]) => v)
    .map(([k]) => PURPOSE_LABELS[k]);

  return (
    <>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0 16px" }}>
        <SignerBadge signer={field.signer} />
        {field.selectiveDisclosure && (
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "1px 7px", borderRadius: 999,
            background: C.red + "18", color: C.red, border: `1px solid ${C.red}30`,
          }}>
            Regulator-only
          </span>
        )}
        <span style={{
          fontSize: 9, padding: "1px 7px", borderRadius: 999,
          background: C.border, color: C.textDim,
        }}>
          Readable by: {field.reader}
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.blue, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          In this scenario (MedBot SG)
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: 8, background: C.bg,
          border: `1px solid ${C.border}`, fontSize: 10, color: C.text, lineHeight: 1.6,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          {field.selectiveDisclosure ? "\u{1F512} " : ""}{field.scenarioValue}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          Purposes served
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {activePurposes.map((p) => (
            <span key={p.label} style={{
              fontSize: 9, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
              background: p.color + "15", color: p.color, border: `1px solid ${p.color}25`,
            }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.red, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          Without this field
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: isPresent ? C.bg : "#0f0a0a",
          border: `1px solid ${isPresent ? C.border : C.red + "40"}`,
          fontSize: 10, color: isPresent ? C.textDim : C.red, lineHeight: 1.6,
        }}>
          {field.withoutThisDetail || field.withoutThis}
        </div>
      </div>

      {field.selectiveDisclosure && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontSize: 9, fontWeight: 700, color: C.orange, textTransform: "uppercase",
            letterSpacing: 1, marginBottom: 8,
          }}>
            Selective disclosure
          </div>
          <div style={{
            padding: "10px 14px", borderRadius: 8, background: C.orangeDim,
            border: `1px solid ${C.orange}30`, fontSize: 10, color: C.text, lineHeight: 1.6,
          }}>
            The service can verify this field exists and carries a valid deployer signature
            without reading its content. The actual identity (Singpass-verified UEN) is
            readable only by government regulators. This balances the service&apos;s need to
            confirm accountability exists with the deployer&apos;s privacy interest.
          </div>
        </div>
      )}
    </>
  );
}

function PhaseInspector({ phase, fieldToggles }) {
  const status = computePhaseStatus(phase.id, fieldToggles);
  const statusColor = status === "works" ? C.green : status === "limited" ? C.yellow : C.red;

  return (
    <>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.blue, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          What this task requires
        </div>
        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6, marginBottom: 12 }}>
          {phase.generic}
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: statusColor + "10", border: `1px solid ${statusColor}20`,
          fontSize: 10, color: statusColor, lineHeight: 1.6,
        }}>
          {status === "works" ? phase.worksWhen : status === "limited" ? phase.limitedWhen : phase.failsWhen}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          Required fields ({phase.depends.filter((d) => fieldToggles[d]).length}/{phase.depends.length} present)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {phase.depends.map((fieldId) => {
            const field = FIELD_BY_ID[fieldId];
            if (!field) return null;
            const present = !!fieldToggles[fieldId];
            return (
              <div key={fieldId} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "5px 10px", borderRadius: 6,
                background: present ? C.bg : "#0f0a0a",
                border: `1px solid ${present ? C.border : C.red + "30"}`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: 3, flexShrink: 0,
                  background: present ? C.green : C.red,
                }} />
                <span style={{
                  fontSize: 9, color: present ? C.text : C.textDim,
                  flex: 1,
                }}>
                  {field.label}
                </span>
                <span style={{
                  fontSize: 8, color: SIGNER_COLORS[field.signer] || C.textDim,
                }}>
                  {field.signerLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: C.orange, textTransform: "uppercase",
          letterSpacing: 1, marginBottom: 8,
        }}>
          In this scenario
        </div>
        <div style={{
          padding: "10px 14px", borderRadius: 8, background: C.bg,
          border: `1px solid ${C.border}`, fontSize: 10, color: C.text, lineHeight: 1.6,
        }}>
          {phase.scenario}
        </div>
      </div>
    </>
  );
}

function InspectorPanel() {
  const { state, setPartialState } = useAgentIdState();
  const selectedEntity = ENTITIES.find((e) => e.id === state.actorFocus) || null;
  const selectedField = state.credentialFocus ? FIELD_BY_ID[state.credentialFocus] || null : null;
  const selectedPhase = state.consequenceFocus ? PHASE_BY_ID[state.consequenceFocus] || null : null;
  const hasFocus = !!selectedEntity || !!selectedField || !!selectedPhase;

  const handleDismiss = useCallback(() => {
    setPartialState({
      actorFocus: null,
      credentialFocus: null,
      consequenceFocus: null,
    });
  }, [setPartialState]);

  let titleText = "Focused element";
  let titleColor = C.textBright;
  let subtitleText = "";

  if (selectedEntity) {
    titleText = selectedEntity.label;
    titleColor = selectedEntity.color;
    subtitleText = selectedEntity.desc;
  } else if (selectedField) {
    titleText = selectedField.label;
    titleColor = SIGNER_COLORS[selectedField.signer] || C.textBright;
    subtitleText = "Credential field \u2014 " + selectedField.groupLabel;
  } else if (selectedPhase) {
    const phaseStatus = computePhaseStatus(selectedPhase.id, state.fieldToggles);
    titleText = selectedPhase.label;
    titleColor = phaseStatus === "works" ? C.green : phaseStatus === "limited" ? C.yellow : C.red;
    subtitleText = "Response task \u2014 " + (phaseStatus === "works" ? "operational" : phaseStatus === "limited" ? "limited" : "non-functional");
  }

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
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: titleColor }}>
                {titleText}
              </h2>
              {subtitleText && (
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                  {subtitleText}
                </div>
              )}
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: "none", border: "none", color: C.textDim,
                cursor: "pointer", fontSize: 18, fontFamily: "inherit", padding: "0 4px",
              }}
            >
              \u00D7
            </button>
          </div>

          {selectedEntity && (
            <>
              <p style={{ fontSize: 10, color: C.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
                {selectedEntity.desc}
              </p>
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: C.blue, textTransform: "uppercase",
                  letterSpacing: 1, marginBottom: 8,
                }}>
                  Contribution to the Agent ID
                </div>
                <div style={{
                  padding: "10px 14px", borderRadius: 8, background: C.bg,
                  border: `1px solid ${C.border}`, fontSize: 10, color: C.text, lineHeight: 1.6,
                }}>
                  {selectedEntity.contribution}
                </div>
              </div>
              {selectedEntity.benefitsActor && selectedEntity.benefitsActor.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8,
                  }}>
                    Benefits to the Actor
                  </div>
                  <div style={{ borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                    {selectedEntity.benefitsActor.map((b, i) => (
                      <div key={i} style={{
                        padding: "10px 14px",
                        borderBottom: i < selectedEntity.benefitsActor.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>{b.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedEntity.benefitsEcosystem && selectedEntity.benefitsEcosystem.length > 0 && (
                <div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: C.orange, textTransform: "uppercase",
                    letterSpacing: 1, marginBottom: 8,
                  }}>
                    Benefits to the Ecosystem
                  </div>
                  <div style={{ borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                    {selectedEntity.benefitsEcosystem.map((b, i) => (
                      <div key={i} style={{
                        padding: "10px 14px",
                        borderBottom: i < selectedEntity.benefitsEcosystem.length - 1 ? `1px solid ${C.border}` : "none",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.text, marginBottom: 3 }}>{b.title}</div>
                        <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>{b.detail}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {selectedField && (
            <FieldInspector
              field={selectedField}
              isPresent={!!state.fieldToggles[selectedField.id]}
            />
          )}

          {selectedPhase && (
            <PhaseInspector phase={selectedPhase} fieldToggles={state.fieldToggles} />
          )}

          {!selectedEntity && !selectedField && !selectedPhase && (
            <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.6 }}>
              Use the ecosystem, credential, or consequence views to focus on an actor,
              credential field, or response task. Details will appear here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// BottomStrip — REFACTORED: field-driven outcome + reason
// ══════════════════════════════════════════════════════════════

function BottomStrip() {
  const { state, setPartialState } = useAgentIdState();
  const outcome = computeServiceOutcome(state.fieldToggles);

  const color =
    outcome.severity === "success"
      ? C.green
      : outcome.severity === "info"
        ? C.cyan
        : outcome.severity === "warn"
          ? C.yellow
          : C.red;

  const nextLabel =
    state.currentView === "ecosystem"
      ? "Inspect in credential \u2192"
      : state.currentView === "credential"
        ? "See what fails in consequences \u2192"
        : "Reveal missing assurances \u2192";

  const handleNext = useCallback(() => {
    if (state.currentView === "ecosystem") {
      setPartialState({ currentView: "credential" });
    } else if (state.currentView === "credential") {
      setPartialState({ currentView: "consequences" });
    } else {
      setPartialState({ currentView: "credential" });
    }
  }, [setPartialState, state.currentView]);

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
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontWeight: 600, color: color }}>
          Service outcome: {outcome.label}
        </div>
        <div style={{ color: C.textDim, maxWidth: 500 }}>
          {outcome.reason}
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

// ── Splash screen (NEW in Pass 3) ──

function SplashView() {
  const { setPartialState } = useAgentIdState();

  const cards = [
    {
      view: "ecosystem",
      title: "Explore the ecosystem",
      desc: "Who\u2019s involved.",
    },
    {
      view: "credential",
      title: "Examine the credential",
      desc: "What the service sees.",
    },
    {
      view: "consequences",
      title: "See what changes",
      desc: "What breaks when fields are missing.",
    },
  ];

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        fontFamily: "'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 560, marginBottom: 40 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.blue,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Agent ID Proof of Concept
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            margin: "0 0 12px",
            color: C.textBright,
            letterSpacing: "-0.5px",
          }}
        >
          What AI Agent IDs are, how they work, and why they matter
        </h1>
        <p
          style={{
            fontSize: 11,
            color: C.textDim,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          A healthcare booking agent requests patient appointment data from a polyclinic.
          Before sharing, the polyclinic needs answers that no single party can provide.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          maxWidth: 640,
          width: "100%",
        }}
      >
        {cards.map((c, i) => (
          <button
            key={c.view}
            onClick={() => setPartialState({ currentView: c.view })}
            style={{
              textAlign: "left",
              padding: "16px 18px",
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.card,
              cursor: "pointer",
              fontFamily: "inherit",
              color: C.text,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: C.blue }}>
              {i + 1}.
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textBright }}>
              {c.title}
            </div>
            <div style={{ fontSize: 9, color: C.textDim, lineHeight: 1.6 }}>
              {c.desc}
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 32, fontSize: 9, color: C.textDim }}>
        For more information on Agent IDs, visit the working draft [link TBD]
      </div>
    </div>
  );
}

// ── Main shell — splash-aware ──

export default function ArchV5() {
  return (
    <AgentIdStateProvider>
      <AppShell />
    </AgentIdStateProvider>
  );
}

function AppShell() {
  const { state } = useAgentIdState();

  if (state.currentView === "splash") {
    return <SplashView />;
  }

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
