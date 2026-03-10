// Shared credential data model for Agent ID PoC
// Normalized into fields, activities, dependencies, and failure consequences.

// ── Sections (canonical identifiers used across the model) ──
export const SECTIONS = [
  { id: "Instance", label: "INSTANCE" },
  { id: "Provider", label: "PROVIDER" },
  { id: "Model", label: "MODEL" },
  { id: "Safety", label: "SAFETY" },
  { id: "Deployer", label: "DEPLOYER" },
  { id: "Capabilities", label: "CAPABILITIES" },
  { id: "IR Endpoint", label: "INCIDENT RESPONSE" },
];

function normalizeSectionId(input) {
  if (!input) return null;
  const s = input.toString().toLowerCase().replace(/\s+/g, "");
  if (s === "instance") return "Instance";
  if (s === "provider") return "Provider";
  if (s === "model") return "Model";
  if (s === "safety") return "Safety";
  if (s === "deployer") return "Deployer";
  if (s === "capabilities") return "Capabilities";
  if (s === "irendpoint" || s === "incidentresponse") return "IR Endpoint";
  return null;
}

// ── Fields (individual pieces of data in the credential) ──
// section: canonical section id from SECTIONS
// provided_by: who originates the data
// signed_by: who cryptographically signs it (if anyone)
// entity: which ecosystem actor node this most closely belongs to
export const FIELDS = [
  // INSTANCE (agent instance, self-asserted, unsigned)
  {
    id: "instance.id",
    label: "Session ID",
    section: "Instance",
    provided_by: "agent",
    signed_by: null,
    entity: "agent",
    description: "Unique identifier for this agent session.",
  },
  {
    id: "instance.purpose",
    label: "Declared Purpose",
    section: "Instance",
    provided_by: "agent",
    signed_by: null,
    entity: "agent",
    description: "What this agent run claims it is doing (e.g. appointment_booking).",
  },

  // PROVIDER (provider-signed)
  {
    id: "provider.name",
    label: "Provider Name",
    section: "Provider",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
  {
    id: "provider.contact",
    label: "Security Contact",
    section: "Provider",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
  {
    id: "provider.signature",
    label: "Provider Signature",
    section: "Provider",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },

  // MODEL (provider-signed)
  {
    id: "model.name",
    label: "Model Name",
    section: "Model",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
  {
    id: "model.family",
    label: "Model Family",
    section: "Model",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },

  // SAFETY (independent certifier)
  {
    id: "safety.certification",
    label: "Safety Certification",
    section: "Safety",
    provided_by: "certifier",
    signed_by: "certifier",
    entity: "certifier",
  },
  {
    id: "safety.valid_until",
    label: "Certification Valid Until",
    section: "Safety",
    provided_by: "certifier",
    signed_by: "certifier",
    entity: "certifier",
  },
  {
    id: "safety.tests_passed",
    label: "Tests Passed",
    section: "Safety",
    provided_by: "certifier",
    signed_by: "certifier",
    entity: "certifier",
  },
  {
    id: "safety.certifier_signature",
    label: "Certifier Signature",
    section: "Safety",
    provided_by: "certifier",
    signed_by: "certifier",
    entity: "certifier",
  },

  // DEPLOYER (Singpass-anchored deployer)
  {
    id: "deployer.name",
    label: "Deployer Name",
    section: "Deployer",
    provided_by: "deployer",
    signed_by: "deployer",
    entity: "deployer",
  },
  {
    id: "deployer.singpass_uen",
    label: "Singpass UEN",
    section: "Deployer",
    provided_by: "deployer",
    signed_by: "deployer",
    entity: "deployer",
  },
  {
    id: "deployer.signature",
    label: "Deployer Signature",
    section: "Deployer",
    provided_by: "deployer",
    signed_by: "deployer",
    entity: "deployer",
  },

  // CAPABILITIES (declared by deployer, signed by deployer)
  {
    id: "capabilities.tools",
    label: "Tools",
    section: "Capabilities",
    provided_by: "deployer",
    signed_by: "deployer",
    entity: "deployer",
  },
  {
    id: "capabilities.autonomy",
    label: "Autonomy Level",
    section: "Capabilities",
    provided_by: "deployer",
    signed_by: "deployer",
    entity: "deployer",
  },

  // INCIDENT RESPONSE (provider-signed)
  {
    id: "ir.endpoint",
    label: "Incident Endpoint",
    section: "IR Endpoint",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
  {
    id: "ir.sla",
    label: "Incident SLA",
    section: "IR Endpoint",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
  {
    id: "ir.shutdown_supported",
    label: "Shutdown Supported",
    section: "IR Endpoint",
    provided_by: "provider",
    signed_by: "provider",
    entity: "provider",
  },
];

// ── NIST CSF 2.0 functions ──
export const NIST_FUNCTIONS = [
  { id: "identify", label: "Identify" },
  { id: "protect", label: "Protect" },
  { id: "detect", label: "Detect" },
  { id: "respond", label: "Respond" },
  { id: "recover", label: "Recover" },
];

// ── Activities (sub-steps under each NIST function) ──
export const ACTIVITIES = [
  // Identify
  {
    id: "identify_assets",
    label: "Asset inventory & context",
    nist_function: "identify",
  },
  {
    id: "assess_risk",
    label: "Risk assessment",
    nist_function: "identify",
  },

  // Protect
  {
    id: "trust_decision",
    label: "Trust decision",
    nist_function: "protect",
  },
  {
    id: "access_control",
    label: "Access control",
    nist_function: "protect",
  },

  // Detect
  {
    id: "anomaly_detection",
    label: "Anomaly detection",
    nist_function: "detect",
  },
  {
    id: "session_correlation",
    label: "Session correlation",
    nist_function: "detect",
  },

  // Respond
  {
    id: "contain",
    label: "Contain",
    nist_function: "respond",
  },
  {
    id: "investigate",
    label: "Investigate",
    nist_function: "respond",
  },
  {
    id: "identify_party",
    label: "Identify accountable party",
    nist_function: "respond",
  },
  {
    id: "escalate",
    label: "Escalate",
    nist_function: "respond",
  },

  // Recover
  {
    id: "remediate",
    label: "Remediate",
    nist_function: "recover",
  },
  {
    id: "targeted_notification",
    label: "Targeted notification",
    nist_function: "recover",
  },
  {
    id: "accountability",
    label: "Accountability & lessons",
    nist_function: "recover",
  },
];

// ── Section-level dependencies per activity ──
// Values: "required" | "useful"
const SECTION_DEPENDENCIES_BY_ACTIVITY = {
  // Identify
  identify_assets: {
    Provider: "required",
    Model: "required",
    Deployer: "useful",
    "IR Endpoint": "useful",
  },
  assess_risk: {
    Provider: "useful",
    Model: "required",
    Safety: "required",
    Capabilities: "useful",
  },

  // Protect
  trust_decision: {
    Provider: "required",
    Model: "required",
    Safety: "required",
    Deployer: "required",
    Capabilities: "required",
    "IR Endpoint": "useful",
  },
  access_control: {
    Capabilities: "required",
    Deployer: "useful",
    Provider: "useful",
  },

  // Detect (aligned with existing dependency matrix)
  anomaly_detection: {
    Instance: "required",
    Capabilities: "useful",
  },
  session_correlation: {
    Instance: "required",
  },

  // Respond (aligned with existing dependency matrix semantics)
  contain: {
    Instance: "required",
    Provider: "useful",
    "IR Endpoint": "required",
  },
  investigate: {
    Instance: "useful",
    Provider: "required",
    Model: "required",
    Safety: "required",
    Capabilities: "useful",
  },
  identify_party: {
    Provider: "useful",
    Deployer: "required",
  },
  escalate: {
    Provider: "useful",
    "IR Endpoint": "required",
  },

  // Recover (aligned with existing Resolve row)
  remediate: {
    Instance: "required",
    Provider: "required",
    Model: "required",
    Safety: "required",
    Deployer: "required",
    Capabilities: "useful",
    "IR Endpoint": "required",
  },
  targeted_notification: {
    Provider: "required",
    Model: "required",
    Deployer: "useful",
  },
  accountability: {
    Provider: "required",
    Deployer: "required",
    Safety: "useful",
  },
};

// Build field-level dependency rows by expanding section-level map.
export const DEPENDENCIES = [];

function buildDependencies() {
  Object.entries(SECTION_DEPENDENCIES_BY_ACTIVITY).forEach(
    ([activityId, sectionMap]) => {
      Object.entries(sectionMap).forEach(([sectionId, dependency]) => {
        FIELDS.filter((f) => f.section === sectionId).forEach((field) => {
          DEPENDENCIES.push({
            field_id: field.id,
            section: sectionId,
            activity_id: activityId,
            dependency, // "required" | "useful"
          });
        });
      });
    }
  );
}

buildDependencies();

// ── Failure consequences & market incentives per section ──
export const FAILURE_CONSEQUENCES = [
  {
    section: "INSTANCE",
    activity_id: "anomaly_detection",
    severity: "degraded",
    critical: false,
    market_incentive: "HIGH",
    market_reason: "Providers already generate session IDs for billing and debugging.",
    consequence:
      "Detection delayed — service cannot easily correlate actions within a session.",
  },
  {
    section: "PROVIDER",
    activity_id: "escalate",
    severity: "degraded",
    critical: false,
    market_incentive: "MEDIUM",
    market_reason:
      "Some reputational benefit, but disclosure invites scrutiny and support overhead.",
    consequence:
      "Escalation impossible — no verified security contact to notify during an incident.",
  },
  {
    section: "MODEL",
    activity_id: "investigate",
    severity: "degraded",
    critical: false,
    market_incentive: "LOW-MEDIUM",
    market_reason:
      "Revealing exact model versions exposes competitive information and invites targeted attacks.",
    consequence:
      "Investigation lacks context — difficult to identify which deployments share the vulnerable version.",
  },
  {
    section: "SAFETY",
    activity_id: "investigate",
    severity: "terminates",
    critical: true,
    market_incentive: "LOW",
    market_reason:
      "Independent safety evidence exposes testing gaps and invites regulatory scrutiny.",
    consequence:
      "Investigate phase TERMINATES — provider negligence and deployer misconfiguration become indistinguishable.",
  },
  {
    section: "DEPLOYER",
    activity_id: "identify_party",
    severity: "terminates",
    critical: true,
    market_incentive: "LOW",
    market_reason:
      "Deployers resist binding to verified identity because it creates direct legal exposure.",
    consequence:
      "Identify phase TERMINATES — no legally accountable party is reachable.",
  },
  {
    section: "CAPABILITIES",
    activity_id: "trust_decision",
    severity: "degraded",
    critical: false,
    market_incentive: "MEDIUM-HIGH",
    market_reason:
      "Services need this for least-privilege enforcement, but deployers may omit over-broad scopes.",
    consequence:
      "Scope violations are harder to verify — service cannot compare declared vs actual behavior.",
  },
  {
    section: "INCIDENT RESPONSE",
    activity_id: "contain",
    severity: "terminates",
    critical: true,
    market_incentive: "LOW",
    market_reason:
      "Publishing escalation endpoints and shutdown guarantees implies admitting that things can go wrong.",
    consequence:
      "Contain phase TERMINATES — response degrades to IP blocking affecting all agents from the provider.",
  },
];

export function getSectionFailure(sectionKey) {
  const key = (sectionKey || "").toUpperCase();
  return FAILURE_CONSEQUENCES.find((f) => f.section === key) || null;
}

// ── Signer mapping per section (used by UI badge) ──
const SIGNER_ROLES = {
  provider: { id: "provider", name: "Provider" },
  deployer: { id: "deployer", name: "Deployer" },
  certifier: { id: "certifier", name: "SG AISI" },
};

const SECTION_SIGNER = {
  INSTANCE: null,
  PROVIDER: "provider",
  MODEL: "provider",
  SAFETY: "certifier",
  DEPLOYER: "deployer",
  CAPABILITIES: "deployer",
  "INCIDENT RESPONSE": "provider",
};

export function getSectionSigner(sectionKey) {
  const key = (sectionKey || "").toUpperCase();
  const roleId = SECTION_SIGNER[key];
  if (!roleId) return null;
  return SIGNER_ROLES[roleId] || { id: roleId, name: roleId };
}

// ── Query helpers ──

export function getFieldsByEntity(entityId) {
  if (!entityId) return [];
  return FIELDS.filter((f) => f.entity === entityId);
}

export function getFieldsBySection(sectionId) {
  const canonical = normalizeSectionId(sectionId);
  if (!canonical) return [];
  return FIELDS.filter((f) => f.section === canonical);
}

export function getActivitiesByNistFunction(nistId) {
  return ACTIVITIES.filter((a) => a.nist_function === nistId);
}

export function getDependenciesByActivity(activityId) {
  return DEPENDENCIES.filter((d) => d.activity_id === activityId);
}

// Generate a section × phase matrix summarizing dependencies.
// granularity: "nist" | "activity"
export function generateMatrix(granularity = "nist") {
  const sections = SECTIONS.map((s) => s.id); // canonical section ids

  // Helper to compute a single cell for a given set of activities.
  function cellFor(sectionId, activityIds) {
    const deps = DEPENDENCIES.filter(
      (d) => d.section === sectionId && activityIds.includes(d.activity_id)
    );
    if (deps.some((d) => d.dependency === "required")) return "R";
    if (deps.some((d) => d.dependency === "useful")) return "U";
    return "N";
  }

  if (granularity === "activity") {
    const phases = ACTIVITIES.map((a) => {
      const fn = NIST_FUNCTIONS.find((f) => f.id === a.nist_function);
      return `${fn ? fn.label : ""}: ${a.label}`;
    });
    const data = ACTIVITIES.map((a) =>
      sections.map((secId) => cellFor(secId, [a.id]))
    );
    return { phases, sections, data };
  }

  // Default: NIST-level view
  const phases = NIST_FUNCTIONS.map((f) => f.label);
  const data = NIST_FUNCTIONS.map((f) => {
    const acts = ACTIVITIES.filter((a) => a.nist_function === f.id).map(
      (a) => a.id
    );
    return sections.map((secId) => cellFor(secId, acts));
  });

  return { phases, sections, data };
}

