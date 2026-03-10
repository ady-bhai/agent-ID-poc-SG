import { useState } from "react";

// ── Design tokens ──
const T = {
  bg: "#0c0f14",
  surface: "#13161d",
  card: "#181c25",
  cardAlt: "#1d2230",
  border: "#252a36",
  borderLight: "#2f3545",
  text: "#e2e0dc",
  textMid: "#9a978f",
  textDim: "#5c5952",
  accent: "#c8a26e",
  verified: "#3ec97a",
  unverified: "#e5a63e",
  missing: "#e5463e",
  missingBg: "#2a1518",
  verifiedBg: "#122218",
  unverifiedBg: "#2a2212",
  provider: "#5b9fd6",
  deployer: "#d6985b",
  model: "#9b7fd6",
  safety: "#5bd6a8",
  incident: "#d65b7f",
  certifier: "#5bd6a8",
  white: "#f5f3ef",
  black: "#06080b",
};

// ── Scenarios ──
const SCENARIOS = [
  {
    id: "scope_violation",
    label: "Scenario A: Scope Violation",
    subtitle: "Agent accesses financial data — only authorized for calendar",
    incident: "An agent deployed by Acme Enterprises accessed patient financial records through a healthcare service API. The service's anomaly detection flagged the access as outside the agent's declared scope.",
    icon: "\u26A0",
  },
  {
    id: "model_failure",
    label: "Scenario B: Model Vulnerability",
    subtitle: "Prompt injection bypasses safety filters — harmful data leaked",
    incident: "An agent operating on a government portal was exploited via prompt injection, causing it to exfiltrate user NRIC numbers to an external endpoint. The service detected the outbound data transfer.",
    icon: "\uD83D\uDD13",
  },
];

// ── Verification States (ordered: worst → best for presentation flow) ──
const STATES = [
  { id: "none", label: "No Agent ID", sub: "Agent is a black box", emoji: "\uD83D\uDEAB", color: T.missing },
  { id: "no_safety", label: "No Safety Cert", sub: "Identity present, safety unverified", emoji: "\uD83D\uDD36", color: T.unverified },
  { id: "no_deployer", label: "No Deployer Info", sub: "Provider verified, deployer unknown", emoji: "\u26A0\uFE0F", color: T.unverified },
  { id: "full", label: "Full Agent ID", sub: "All claims verified", emoji: "\u2705", color: T.verified },
];

// ── Signer mapping: which actor signs which credential section ──
const SIGNERS = {
  "INSTANCE": null,
  "PROVIDER": { name: "Provider", color: T.provider },
  "MODEL": { name: "Provider", color: T.provider },
  "SAFETY": { name: "SG AISI", color: T.certifier },
  "DEPLOYER": { name: "Deployer", color: T.deployer },
  "CAPABILITIES": { name: "Deployer", color: T.deployer },
  "INCIDENT RESPONSE": { name: "Provider", color: T.provider },
};

// ── Market failure annotations for missing sections ──
const MARKET_FAILURE = {
  "INSTANCE": {
    incentive: "HIGH",
    reason: "Providers generate these for billing and debugging",
    consequence: "Detection delayed — service cannot correlate actions within a session",
  },
  "PROVIDER": {
    incentive: "MEDIUM",
    reason: "Some reputational benefit, but disclosure invites scrutiny",
    consequence: "Escalation impossible — no security contact to notify",
  },
  "MODEL": {
    incentive: "LOW-MEDIUM",
    reason: "Exposes competitive information and invites targeted attacks",
    consequence: "Investigation lacks context — cannot identify affected model version",
  },
  "SAFETY": {
    incentive: "LOW",
    reason: "Providers resist — exposes testing gaps, invites regulatory scrutiny",
    consequence: "Investigate phase TERMINATES — provider negligence and deployer misconfiguration become indistinguishable",
    critical: true,
  },
  "DEPLOYER": {
    incentive: "LOW",
    reason: "Deployers resist binding to verified identity — creates legal exposure",
    consequence: "Identify phase TERMINATES — no legally accountable party is reachable",
    critical: true,
  },
  "CAPABILITIES": {
    incentive: "MEDIUM-HIGH",
    reason: "Services need this for least-privilege enforcement",
    consequence: "Scope violations harder to verify — service cannot compare declared vs actual behavior",
  },
  "INCIDENT RESPONSE": {
    incentive: "LOW",
    reason: "Implies risk — suggests things could go wrong",
    consequence: "Contain phase TERMINATES — response degrades to IP blocking affecting all agents from provider",
    critical: true,
  },
};

// ── Phase-section dependency matrix ──
// R = Required, U = Useful, N = Not needed
const DEPENDENCY_MATRIX = {
  phases: ["Detect", "Contain", "Investigate", "Identify", "Resolve"],
  sections: ["Instance", "Provider", "Model", "Safety", "Deployer", "Capabilities", "IR Endpoint"],
  data: [
    // Detect
    ["R", "N", "N", "N", "N", "U", "N"],
    // Contain
    ["R", "U", "N", "N", "N", "N", "R"],
    // Investigate
    ["U", "R", "R", "R", "N", "U", "N"],
    // Identify
    ["N", "U", "N", "N", "R", "N", "N"],
    // Resolve
    ["R", "R", "R", "R", "R", "U", "R"],
  ],
};

// Which sections are present per identity state
const STATE_SECTIONS = {
  full: ["Instance", "Provider", "Model", "Safety", "Deployer", "Capabilities", "IR Endpoint"],
  no_deployer: ["Instance", "Provider", "Model", "Safety", "Capabilities", "IR Endpoint"],
  no_safety: ["Instance", "Provider", "Model", "Deployer", "Capabilities", "IR Endpoint"],
  none: [],
};

// ── ID Card Field Definitions ──
function getCardFields(stateId) {
  const V = "verified";
  const U = "unverified";
  const M = "missing";

  const base = {
    full: [
      { section: "INSTANCE", fields: [
        { label: "ID", value: "a1b2c3d4-e5f6-7890", status: V },
        { label: "Purpose", value: "appointment_booking", status: V },
      ]},
      { section: "PROVIDER", color: T.provider, fields: [
        { label: "Name", value: "TrustAI Corp", status: V },
        { label: "Contact", value: "security@trustai.com", status: V },
        { label: "Signature", value: "JWS RS256 \u2014 VALID", status: V },
      ]},
      { section: "MODEL", color: T.model, fields: [
        { label: "Name", value: "SafeChat v3.2.1", status: V },
        { label: "Family", value: "transformer-llm", status: V },
      ]},
      { section: "SAFETY", color: T.safety, fields: [
        { label: "Certification", value: "SG AISI Standard", status: V },
        { label: "Valid Until", value: "July 2026", status: V },
        { label: "Tests Passed", value: "prompt_injection, harmful_output", status: V },
        { label: "Certifier Sig", value: "SG AISI key \u2014 VALID", status: V },
      ]},
      { section: "DEPLOYER", color: T.deployer, fields: [
        { label: "Name", value: "Acme Enterprises", status: V },
        { label: "Singpass", value: "UEN 200312345A \u2713", status: V },
        { label: "Signature", value: "JWS ES256 \u2014 VALID", status: V },
      ]},
      { section: "CAPABILITIES", fields: [
        { label: "Tools", value: "calendar_read, calendar_write", status: V },
        { label: "Autonomy", value: "supervised", status: V },
      ]},
      { section: "INCIDENT RESPONSE", color: T.incident, fields: [
        { label: "Endpoint", value: "trustai.com/incidents", status: V },
        { label: "SLA", value: "4 hours", status: V },
        { label: "Shutdown", value: "SUPPORTED", status: V },
      ]},
    ],
    no_deployer: [
      { section: "INSTANCE", fields: [
        { label: "ID", value: "a1b2c3d4-e5f6-7890", status: V },
        { label: "Purpose", value: "appointment_booking", status: V },
      ]},
      { section: "PROVIDER", color: T.provider, fields: [
        { label: "Name", value: "TrustAI Corp", status: V },
        { label: "Contact", value: "security@trustai.com", status: V },
        { label: "Signature", value: "JWS RS256 \u2014 VALID", status: V },
      ]},
      { section: "MODEL", color: T.model, fields: [
        { label: "Name", value: "SafeChat v3.2.1", status: V },
        { label: "Family", value: "transformer-llm", status: V },
      ]},
      { section: "SAFETY", color: T.safety, fields: [
        { label: "Certification", value: "SG AISI Standard", status: V },
        { label: "Valid Until", value: "July 2026", status: V },
        { label: "Tests Passed", value: "prompt_injection, harmful_output", status: V },
        { label: "Certifier Sig", value: "SG AISI key \u2014 VALID", status: V },
      ]},
      { section: "DEPLOYER", color: T.deployer, fields: [
        { label: "Name", value: "\u2014", status: M },
        { label: "Singpass", value: "NOT PROVIDED", status: M },
        { label: "Signature", value: "NONE", status: M },
      ]},
      { section: "CAPABILITIES", fields: [
        { label: "Tools", value: "calendar_read, calendar_write", status: U },
        { label: "Autonomy", value: "unknown", status: U },
      ]},
      { section: "INCIDENT RESPONSE", color: T.incident, fields: [
        { label: "Endpoint", value: "trustai.com/incidents", status: V },
        { label: "SLA", value: "4 hours", status: V },
        { label: "Shutdown", value: "SUPPORTED", status: V },
      ]},
    ],
    no_safety: [
      { section: "INSTANCE", fields: [
        { label: "ID", value: "a1b2c3d4-e5f6-7890", status: V },
        { label: "Purpose", value: "appointment_booking", status: V },
      ]},
      { section: "PROVIDER", color: T.provider, fields: [
        { label: "Name", value: "TrustAI Corp", status: V },
        { label: "Contact", value: "security@trustai.com", status: V },
        { label: "Signature", value: "JWS RS256 \u2014 VALID", status: V },
      ]},
      { section: "MODEL", color: T.model, fields: [
        { label: "Name", value: "SafeChat v3.2.1", status: V },
        { label: "Family", value: "transformer-llm", status: V },
      ]},
      { section: "SAFETY", color: T.safety, fields: [
        { label: "Certification", value: "NONE", status: M },
        { label: "Valid Until", value: "\u2014", status: M },
        { label: "Tests Passed", value: "UNKNOWN", status: M },
        { label: "Certifier Sig", value: "NONE", status: M },
      ]},
      { section: "DEPLOYER", color: T.deployer, fields: [
        { label: "Name", value: "Acme Enterprises", status: V },
        { label: "Singpass", value: "UEN 200312345A \u2713", status: V },
        { label: "Signature", value: "JWS ES256 \u2014 VALID", status: V },
      ]},
      { section: "CAPABILITIES", fields: [
        { label: "Tools", value: "calendar_read, calendar_write", status: V },
        { label: "Autonomy", value: "supervised", status: V },
      ]},
      { section: "INCIDENT RESPONSE", color: T.incident, fields: [
        { label: "Endpoint", value: "trustai.com/incidents", status: V },
        { label: "SLA", value: "4 hours", status: V },
        { label: "Shutdown", value: "SUPPORTED", status: V },
      ]},
    ],
    none: [
      { section: "INSTANCE", fields: [
        { label: "ID", value: "UNKNOWN", status: M },
        { label: "Purpose", value: "UNKNOWN", status: M },
      ]},
      { section: "PROVIDER", color: T.provider, fields: [
        { label: "Name", value: "UNKNOWN", status: M },
        { label: "Contact", value: "NONE", status: M },
        { label: "Signature", value: "NONE", status: M },
      ]},
      { section: "MODEL", color: T.model, fields: [
        { label: "Name", value: "UNKNOWN", status: M },
        { label: "Family", value: "UNKNOWN", status: M },
      ]},
      { section: "SAFETY", color: T.safety, fields: [
        { label: "Certification", value: "UNKNOWN", status: M },
        { label: "Valid Until", value: "\u2014", status: M },
        { label: "Tests Passed", value: "UNKNOWN", status: M },
        { label: "Certifier Sig", value: "NONE", status: M },
      ]},
      { section: "DEPLOYER", color: T.deployer, fields: [
        { label: "Name", value: "UNKNOWN", status: M },
        { label: "Singpass", value: "NONE", status: M },
        { label: "Signature", value: "NONE", status: M },
      ]},
      { section: "CAPABILITIES", fields: [
        { label: "Tools", value: "UNKNOWN", status: M },
        { label: "Autonomy", value: "UNKNOWN", status: M },
      ]},
      { section: "INCIDENT RESPONSE", color: T.incident, fields: [
        { label: "Endpoint", value: "NONE", status: M },
        { label: "SLA", value: "NONE", status: M },
        { label: "Shutdown", value: "UNKNOWN", status: M },
      ]},
    ],
  };
  return base[stateId] || base.none;
}

// ── Incident Response Timeline per scenario+state ──
function getTimeline(scenarioId, stateId) {
  const timelines = {
    scope_violation: {
      full: [
        { step: 1, actor: "Service", action: "Detects scope violation", detail: "Agent declared calendar_read/write but requested financial_records. Mismatch is immediate \u2014 the capability declaration in the Agent ID doesn\u2019t include this tool.", status: "resolved", field: "CAPABILITIES" },
        { step: 2, actor: "Service", action: "Contacts provider escalation endpoint", detail: "Sends incident report to trustai.com/incidents with full Agent ID attached. Provider receives the report within their 4-hour SLA.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "Investigates using Agent ID", detail: "TrustAI examines the Agent ID: model v3.2.1 is current, safety cert is valid, prompt injection tests passed. The model itself isn\u2019t the problem.", status: "resolved", field: "MODEL" },
        { step: 4, actor: "Provider", action: "Identifies deployer misconfiguration", detail: "Deployer attestation shows Acme Enterprises (Singpass-verified UEN 200312345A) configured the agent. Acme\u2019s declared capabilities don\u2019t match the actual access request \u2014 deployer either misconfigured or acted in bad faith.", status: "resolved", field: "DEPLOYER" },
        { step: 5, actor: "Provider", action: "Clears their model, isolates the deployment", detail: "TrustAI confirms: this is a deployer-side issue, not a model defect. They suspend only Acme\u2019s deployment of this agent, not all SafeChat deployments. Other customers are unaffected.", status: "resolved", field: "SAFETY" },
        { step: 6, actor: "Regulator", action: "Holds deployer accountable", detail: "IMDA can trace accountability to Acme Enterprises via their Singpass-verified identity. Proportionate enforcement: the responsible party is identified, action is targeted.", status: "resolved", field: "DEPLOYER" },
      ],
      no_deployer: [
        { step: 1, actor: "Service", action: "Detects scope violation", detail: "Capability declaration shows mismatch. Same detection as full ID \u2014 capabilities section is still present.", status: "resolved", field: "CAPABILITIES" },
        { step: 2, actor: "Service", action: "Contacts provider escalation endpoint", detail: "Provider endpoint still available. Incident report sent.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "Investigates using Agent ID", detail: "TrustAI can confirm model v3.2.1 and safety cert are fine. They know it\u2019s not a model issue.", status: "resolved", field: "MODEL" },
        { step: 4, actor: "Provider", action: "Cannot identify deployer", detail: "No deployer attestation, no Singpass anchor. TrustAI knows SOMEONE deployed their model improperly, but cannot determine who. They have no way to contact the deployer directly.", status: "blocked", field: "DEPLOYER" },
        { step: 5, actor: "Provider", action: "Forced to broader response", detail: "Without knowing which deployer, TrustAI must choose: shut down all deployments that could match this pattern (disproportionate) or do nothing about the deployer (insufficient). Neither is good.", status: "degraded", field: "DEPLOYER" },
        { step: 6, actor: "Regulator", action: "Cannot trace accountability", detail: "No verified deployer identity. IMDA knows the provider (TrustAI) and clears them, but cannot reach the human or organization who actually caused the problem. Accountability gap.", status: "blocked", field: "DEPLOYER" },
      ],
      no_safety: [
        { step: 1, actor: "Service", action: "Detects scope violation", detail: "Capability declaration shows mismatch. Detection still works \u2014 capabilities are present.", status: "resolved", field: "CAPABILITIES" },
        { step: 2, actor: "Service", action: "Contacts provider escalation endpoint", detail: "Provider endpoint available. Incident report sent.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "Cannot confirm model safety", detail: "No safety certification. TrustAI may have tested the model internally, but there\u2019s no independently verifiable proof. Was the model tested for this kind of scope violation? Unknown to the service and regulator.", status: "degraded", field: "SAFETY" },
        { step: 4, actor: "Provider", action: "Identifies deployer", detail: "Deployer is Acme Enterprises (Singpass-verified). The deployer misconfigured \u2014 but without safety cert, provider can\u2019t definitively prove the model isn\u2019t partly responsible.", status: "degraded", field: "DEPLOYER" },
        { step: 5, actor: "Provider", action: "Ambiguous responsibility", detail: "Was this purely deployer misconfiguration, or does the model have a flaw that allowed the scope violation? Without safety certification, the boundary between model defect and deployer error is blurred.", status: "degraded", field: "SAFETY" },
        { step: 6, actor: "Regulator", action: "Partial accountability", detail: "Deployer identified but root cause is ambiguous. IMDA can act on the deployer but may also need to investigate the provider. More time, more cost, less certainty.", status: "degraded", field: "SAFETY" },
      ],
      none: [
        { step: 1, actor: "Service", action: "Detects anomalous access", detail: "Financial records accessed by an unknown agent. No capability declaration to compare against \u2014 the service can only see that the access pattern is unusual, not that it violated a declared scope.", status: "degraded", field: null },
        { step: 2, actor: "Service", action: "No escalation endpoint available", detail: "No incident response information. The service can only log the IP address and block it. There is no provider to contact.", status: "blocked", field: null },
        { step: 3, actor: "Provider", action: "Provider is unaware", detail: "TrustAI doesn\u2019t know their model was involved. They receive no notification. If the incident makes the news, they may not even realize it\u2019s their product.", status: "blocked", field: null },
        { step: 4, actor: "Provider", action: "No forensics possible", detail: "Even if TrustAI learns of the incident, they can\u2019t determine: which model version was running, who deployed it, what configuration was used, or whether this is a model flaw or deployer error.", status: "blocked", field: null },
        { step: 5, actor: "Provider", action: "Defensive blanket response", detail: "If suspicion falls on TrustAI, their only option is a blanket statement: \u2018we don\u2019t believe our model is responsible.\u2019 They can\u2019t prove it. Reputation damage regardless of fault.", status: "blocked", field: null },
        { step: 6, actor: "Regulator", action: "No accountability pathway", detail: "IMDA has an IP address. No provider. No deployer. No model. No human to hold accountable. The incident is logged but unresolved. The agent can re-appear from a different IP.", status: "blocked", field: null },
      ],
    },
    model_failure: {
      full: [
        { step: 1, actor: "Service", action: "Detects data exfiltration", detail: "Outbound transfer of NRIC numbers detected. Agent ID shows this agent is SafeChat v3.2.1 from TrustAI, deployed by Acme.", status: "resolved", field: "MODEL" },
        { step: 2, actor: "Service", action: "Invokes shutdown + contacts provider", detail: "Agent ID includes shutdown_supported: true. Service terminates the agent session immediately. Sends incident report to TrustAI\u2019s escalation endpoint.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "Identifies the model version", detail: "The Agent ID specifies model v3.2.1. TrustAI checks their safety records: prompt injection tests were passed, but this specific attack vector (NRIC exfiltration via context manipulation) wasn\u2019t covered in the test suite.", status: "resolved", field: "SAFETY" },
        { step: 4, actor: "Provider", action: "Accepts responsibility, patches model", detail: "TrustAI acknowledges: this is a model vulnerability in v3.2.1. They develop a patch (v3.2.2) and can notify ALL deployers running v3.2.1 specifically \u2014 targeted remediation.", status: "resolved", field: "MODEL" },
        { step: 5, actor: "Provider", action: "Clears the deployer", detail: "Deployer attestation shows Acme Enterprises operated the agent within declared capabilities. This wasn\u2019t deployer misconfiguration \u2014 it was a model-level vulnerability. Acme is a victim, not a cause.", status: "resolved", field: "DEPLOYER" },
        { step: 6, actor: "Regulator", action: "Targeted regulatory response", detail: "IMDA has the full picture: which model, which version, which vulnerability, which deployers are affected. They can mandate that all v3.2.1 deployments upgrade, and update safety testing requirements to cover this attack vector.", status: "resolved", field: "SAFETY" },
      ],
      no_deployer: [
        { step: 1, actor: "Service", action: "Detects data exfiltration", detail: "NRIC transfer detected. Agent ID shows SafeChat v3.2.1 from TrustAI. Deployer unknown.", status: "resolved", field: "MODEL" },
        { step: 2, actor: "Service", action: "Invokes shutdown + contacts provider", detail: "Shutdown supported. Session terminated. TrustAI notified.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "Identifies model vulnerability", detail: "Same as full ID \u2014 v3.2.1 has the vulnerability. TrustAI can patch.", status: "resolved", field: "SAFETY" },
        { step: 4, actor: "Provider", action: "Cannot notify specific deployer", detail: "TrustAI can patch the model and notify all known deployers, but they can\u2019t confirm who THIS specific deployer was. Was it a legitimate customer? A bad actor using a stolen API key?", status: "degraded", field: "DEPLOYER" },
        { step: 5, actor: "Provider", action: "Broader notification required", detail: "Without deployer identification, TrustAI must notify ALL deployers of v3.2.1, not just the affected one. More operational overhead, more alarm.", status: "degraded", field: "DEPLOYER" },
        { step: 6, actor: "Regulator", action: "Model-level action possible, deployer action blocked", detail: "IMDA can mandate the v3.2.1 upgrade but cannot determine if the deployer bears any additional responsibility (e.g., running the agent in an unauthorized context).", status: "degraded", field: "DEPLOYER" },
      ],
      no_safety: [
        { step: 1, actor: "Service", action: "Detects data exfiltration", detail: "NRIC transfer detected. Agent ID shows SafeChat v3.2.1 from TrustAI, deployed by Acme.", status: "resolved", field: "MODEL" },
        { step: 2, actor: "Service", action: "Invokes shutdown + contacts provider", detail: "Shutdown supported. Session terminated. TrustAI notified.", status: "resolved", field: "INCIDENT RESPONSE" },
        { step: 3, actor: "Provider", action: "No safety evidence to evaluate", detail: "Was this model tested for prompt injection? Without a safety certification, nobody knows. TrustAI may claim they tested internally, but there\u2019s no verifiable proof the test suite would have caught this.", status: "blocked", field: "SAFETY" },
        { step: 4, actor: "Provider", action: "Cannot determine if this was a known gap", detail: "Without certified test results, it\u2019s impossible to distinguish between \u2018vulnerability not covered by tests\u2019 (expected limitation) and \u2018model was never tested at all\u2019 (negligence).", status: "blocked", field: "SAFETY" },
        { step: 5, actor: "Provider", action: "Deployer identified but fault unclear", detail: "Acme is identified, but the key question \u2014 should Acme have known this model was risky? \u2014 can\u2019t be answered without safety evidence. Did TrustAI tell Acme about known limitations?", status: "degraded", field: "DEPLOYER" },
        { step: 6, actor: "Regulator", action: "Regulatory gap exposed", detail: "IMDA can identify the actors but cannot assess whether adequate safety testing was performed. This is exactly the market failure the certification system was designed to prevent.", status: "degraded", field: "SAFETY" },
      ],
      none: [
        { step: 1, actor: "Service", action: "Detects data exfiltration", detail: "NRIC numbers leaving the system. Source: an agent at an IP address. That\u2019s all that\u2019s known.", status: "degraded", field: null },
        { step: 2, actor: "Service", action: "Blocks IP address", detail: "No shutdown mechanism. No escalation endpoint. The service can only block the IP. The agent may reconnect from another address.", status: "blocked", field: null },
        { step: 3, actor: "Provider", action: "Provider is unaware", detail: "TrustAI doesn\u2019t know their model was involved in an NRIC data breach. The vulnerability persists in all deployments of this model version.", status: "blocked", field: null },
        { step: 4, actor: "Provider", action: "No version identification possible", detail: "Even if the breach is traced to TrustAI eventually, which model version? Which deployment? Was it even TrustAI\u2019s model, or an impersonator? No way to tell.", status: "blocked", field: null },
        { step: 5, actor: "Provider", action: "All deployments remain vulnerable", detail: "The prompt injection vulnerability exists in v3.2.1 but nobody knows that. Other deployments of the same version continue operating with the same vulnerability. More breaches are likely.", status: "blocked", field: null },
        { step: 6, actor: "Regulator", action: "Systemic risk unaddressed", detail: "IMDA has a data breach with no attribution, no remediation pathway, and no way to prevent recurrence. The vulnerability is still live in the wild. The next breach is a matter of time.", status: "blocked", field: null },
      ],
    },
  };
  return timelines[scenarioId]?.[stateId] || [];
}

function getOutcome(scenarioId, stateId) {
  const outcomes = {
    scope_violation: {
      full: { summary: "Targeted resolution \u2014 right party held accountable", time: "< 4 hours", severity: "contained", detail: "Deployer identified and sanctioned. Provider cleared. Other deployments unaffected. Proportionate enforcement achieved." },
      no_deployer: { summary: "Provider cleared but deployer escapes accountability", time: "4\u201324 hours", severity: "partially contained", detail: "The technical cause is identified but the responsible human/organization cannot be reached. Broader-than-necessary disruption." },
      no_safety: { summary: "Ambiguous responsibility \u2014 investigation needed", time: "Days to weeks", severity: "unresolved", detail: "Both provider and deployer are identified, but without safety evidence, fault cannot be cleanly attributed. Extended investigation required." },
      none: { summary: "No resolution possible", time: "Unknown", severity: "uncontained", detail: "An unknown agent from an unknown provider deployed by an unknown entity accessed sensitive data. Block the IP. Hope it doesn\u2019t happen again." },
    },
    model_failure: {
      full: { summary: "Vulnerability patched, targeted notification sent", time: "< 4 hours to contain, < 48 hours to patch", severity: "contained", detail: "Model version identified, vulnerability confirmed, patch deployed, affected deployers notified, deployer cleared." },
      no_deployer: { summary: "Model patched but deployer notification is broadcast", time: "< 4 hours to contain, < 48 hours to patch", severity: "mostly contained", detail: "Vulnerability found and patched. But all deployers are notified rather than just the affected one \u2014 operational noise." },
      no_safety: { summary: "Model identified but negligence question unanswered", time: "Days to weeks", severity: "partially contained", detail: "Vulnerability can be patched, but was it foreseeable? Without safety evidence, regulatory response is harder to calibrate." },
      none: { summary: "Vulnerability persists across all deployments", time: "Unknown \u2014 may never be resolved", severity: "systemic", detail: "The same model vulnerability exists in every deployment. No one knows. More breaches will follow." },
    },
  };
  return outcomes[scenarioId]?.[stateId] || { summary: "Unknown", time: "\u2014", severity: "unknown", detail: "" };
}

// ── Status styling ──
function statusStyle(s) {
  if (s === "verified") return { color: T.verified, bg: T.verifiedBg, label: "VERIFIED", icon: "\u2713" };
  if (s === "unverified") return { color: T.unverified, bg: T.unverifiedBg, label: "UNVERIFIED", icon: "?" };
  return { color: T.missing, bg: T.missingBg, label: "MISSING", icon: "\u2717" };
}

function stepStatusStyle(s) {
  if (s === "resolved") return { color: T.verified, bg: T.verifiedBg, border: `${T.verified}30`, label: "RESOLVED" };
  if (s === "degraded") return { color: T.unverified, bg: T.unverifiedBg, border: `${T.unverified}30`, label: "DEGRADED" };
  return { color: T.missing, bg: T.missingBg, border: `${T.missing}30`, label: "BLOCKED" };
}

// ── Components ──

function SignerBadge({ signer }) {
  if (!signer) return (
    <span style={{
      fontSize: 7, fontWeight: 700, letterSpacing: 0.6,
      padding: "1px 5px", borderRadius: 3,
      color: T.textDim, border: `1px solid ${T.border}`,
      opacity: 0.6,
    }}>
      SELF-ASSERTED
    </span>
  );
  return (
    <span style={{
      fontSize: 7, fontWeight: 700, letterSpacing: 0.6,
      padding: "1px 5px", borderRadius: 3,
      color: signer.color, border: `1px solid ${signer.color}40`,
      background: `${signer.color}10`,
    }}>
      {signer.name} \u2713
    </span>
  );
}

function MarketFailureAnnotation({ section }) {
  const mf = MARKET_FAILURE[section];
  if (!mf) return null;
  return (
    <div style={{
      margin: "2px 18px 6px",
      padding: "6px 10px",
      background: mf.critical ? `${T.missing}08` : `${T.unverified}06`,
      border: `1px solid ${mf.critical ? T.missing : T.unverified}18`,
      borderRadius: 6,
      borderLeft: `3px solid ${mf.critical ? T.missing : T.unverified}50`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span style={{
          fontSize: 7, fontWeight: 800, letterSpacing: 1,
          color: mf.critical ? T.missing : T.unverified,
          textTransform: "uppercase",
        }}>
          Market incentive: {mf.incentive}
        </span>
      </div>
      <div style={{ fontSize: 9, color: T.textMid, lineHeight: 1.45, marginBottom: 2 }}>
        {mf.reason}
      </div>
      <div style={{
        fontSize: 9, color: mf.critical ? T.missing : T.unverified,
        lineHeight: 1.45, fontWeight: 600,
      }}>
        {mf.consequence}
      </div>
    </div>
  );
}

function IDCard({ fields, stateId }) {
  const allMissing = stateId === "none";
  return (
    <div style={{
      background: allMissing
        ? `linear-gradient(135deg, ${T.missingBg}, #1a0a0c)`
        : `linear-gradient(135deg, ${T.card}, ${T.cardAlt})`,
      border: `1px solid ${allMissing ? T.missing + "30" : T.border}`,
      borderRadius: 14,
      padding: "0",
      overflow: "hidden",
      transition: "all 0.4s ease",
    }}>
      <div style={{
        padding: "14px 18px 10px",
        borderBottom: `1px solid ${allMissing ? T.missing + "20" : T.borderLight}`,
        display: "flex", alignItems: "center", gap: 10,
        background: allMissing ? `${T.missing}08` : `${T.accent}06`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: allMissing ? T.missingBg : `${T.accent}15`,
          border: `1.5px solid ${allMissing ? T.missing + "40" : T.accent + "30"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}>
          {allMissing ? "?" : "\uD83E\uDD16"}
        </div>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase",
            color: allMissing ? T.missing : T.accent,
          }}>
            Agent Identity Credential
          </div>
          <div style={{ fontSize: 9, color: T.textDim, marginTop: 1 }}>
            {allMissing ? "NO CREDENTIAL PRESENTED" : "Security Posture \u2014 7 sections, 3 independent signers"}
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 0" }}>
        {fields.map((section, i) => {
          const signer = SIGNERS[section.section];
          const hasMissing = section.fields.some(f => f.status === "missing");
          const allFieldsMissing = section.fields.every(f => f.status === "missing");

          return (
            <div key={i}>
              <div style={{
                padding: "6px 18px",
                borderBottom: (!hasMissing || !allFieldsMissing) && i < fields.length - 1
                  ? `1px solid ${T.border}50` : "none",
              }}>
                <div style={{
                  fontSize: 8, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
                  color: section.color || T.textDim,
                  marginBottom: 4, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 3, height: 10, borderRadius: 2,
                    background: section.color || T.textDim,
                    opacity: allFieldsMissing ? 0.3 : 0.6,
                  }} />
                  {section.section}
                  <SignerBadge signer={signer} />
                </div>
                {section.fields.map((f, j) => {
                  const st = statusStyle(f.status);
                  return (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "3px 0", fontSize: 10,
                    }}>
                      <span style={{
                        width: 14, height: 14, borderRadius: 3,
                        background: st.bg,
                        border: `1px solid ${st.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 8, fontWeight: 800, color: st.color,
                        flexShrink: 0,
                      }}>
                        {st.icon}
                      </span>
                      <span style={{ color: T.textDim, minWidth: 65, flexShrink: 0 }}>{f.label}</span>
                      <span style={{
                        color: f.status === "missing" ? T.missing : T.text,
                        fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
                        fontSize: 9.5,
                        opacity: f.status === "missing" ? 0.5 : 1,
                      }}>
                        {f.value}
                      </span>
                    </div>
                  );
                })}
              </div>
              {hasMissing && <MarketFailureAnnotation section={section.section} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ steps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {steps.map((step, i) => {
        const st = stepStatusStyle(step.status);
        return (
          <div key={i} style={{
            display: "flex", gap: 12,
            padding: "12px 14px",
            background: st.bg,
            border: `1px solid ${st.border}`,
            borderRadius: 10,
            transition: "all 0.3s ease",
          }}>
            <div style={{ minWidth: 52, textAlign: "center", flexShrink: 0 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: `${st.color}18`,
                border: `1.5px solid ${st.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: st.color,
                margin: "0 auto 4px",
              }}>
                {step.step}
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, color: st.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {step.actor}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{step.action}</span>
                {step.field && (
                  <span style={{
                    fontSize: 7.5, fontWeight: 700, letterSpacing: 0.8,
                    padding: "1px 5px", borderRadius: 3,
                    background: `${st.color}12`, color: st.color,
                    border: `1px solid ${st.color}25`,
                  }}>
                    {step.field}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.textMid, lineHeight: 1.55 }}>
                {step.detail}
              </div>
            </div>
            <div style={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: 1,
              color: st.color, alignSelf: "flex-start",
              padding: "2px 6px", borderRadius: 3,
              border: `1px solid ${st.color}30`,
              flexShrink: 0,
            }}>
              {st.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OutcomeBar({ outcome }) {
  const sev = {
    contained: { color: T.verified, bg: T.verifiedBg, label: "CONTAINED" },
    "partially contained": { color: T.unverified, bg: T.unverifiedBg, label: "PARTIALLY CONTAINED" },
    "mostly contained": { color: T.unverified, bg: T.unverifiedBg, label: "MOSTLY CONTAINED" },
    unresolved: { color: T.unverified, bg: T.unverifiedBg, label: "UNRESOLVED" },
    uncontained: { color: T.missing, bg: T.missingBg, label: "UNCONTAINED" },
    systemic: { color: T.missing, bg: T.missingBg, label: "SYSTEMIC RISK" },
  }[outcome.severity] || { color: T.textDim, bg: T.card, label: "\u2014" };

  return (
    <div style={{
      padding: "16px 20px",
      background: sev.bg,
      border: `1px solid ${sev.color}25`,
      borderRadius: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{
          fontSize: 8, fontWeight: 800, letterSpacing: 1.2,
          padding: "3px 8px", borderRadius: 4,
          background: `${sev.color}18`, color: sev.color,
          border: `1px solid ${sev.color}30`,
        }}>
          {sev.label}
        </span>
        <span style={{ fontSize: 10, color: T.textDim }}>
          Resolution time: <strong style={{ color: T.text }}>{outcome.time}</strong>
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>
        {outcome.summary}
      </div>
      <div style={{ fontSize: 10, color: T.textMid, lineHeight: 1.6 }}>
        {outcome.detail}
      </div>
    </div>
  );
}

function DependencyMatrix({ currentState }) {
  const { phases, sections, data } = DEPENDENCY_MATRIX;
  const present = STATE_SECTIONS[currentState] || [];

  function cellColor(value, sectionName) {
    const isPresent = present.includes(sectionName);
    if (value === "N") return { bg: "transparent", color: T.textDim, border: T.border, label: "" };
    if (value === "R" && !isPresent) return { bg: T.missingBg, color: T.missing, border: `${T.missing}40`, label: "REQ" };
    if (value === "R" && isPresent) return { bg: T.verifiedBg, color: T.verified, border: `${T.verified}40`, label: "REQ" };
    if (value === "U" && !isPresent) return { bg: T.unverifiedBg, color: T.unverified, border: `${T.unverified}30`, label: "USE" };
    if (value === "U" && isPresent) return { bg: `${T.verified}08`, color: `${T.verified}90`, border: `${T.verified}25`, label: "USE" };
    return { bg: "transparent", color: T.textDim, border: T.border, label: "" };
  }

  const criticalMissing = [];
  data.forEach((row, ri) => {
    row.forEach((val, ci) => {
      if (val === "R" && !present.includes(sections[ci])) {
        const key = `${phases[ri]}-${sections[ci]}`;
        if (!criticalMissing.find(c => c.phase === phases[ri]))
          criticalMissing.push({ phase: phases[ri], section: sections[ci] });
      }
    });
  });

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      padding: "14px 16px",
      overflow: "auto",
    }}>
      <div style={{
        fontSize: 8, fontWeight: 700, color: T.textDim,
        letterSpacing: 1, textTransform: "uppercase", marginBottom: 10,
      }}>
        Incident Response Dependency Matrix
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ padding: "4px 8px", fontSize: 8, color: T.textDim, textAlign: "left", fontWeight: 700, letterSpacing: 0.5 }}>
                Phase
              </th>
              {sections.map(s => (
                <th key={s} style={{
                  padding: "4px 4px", fontSize: 7, color: present.includes(s) ? T.text : T.textDim,
                  textAlign: "center", fontWeight: 700, letterSpacing: 0.3,
                  borderBottom: `1px solid ${T.border}`,
                  opacity: present.includes(s) ? 1 : 0.5,
                }}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map((phase, ri) => (
              <tr key={phase}>
                <td style={{
                  padding: "5px 8px", fontSize: 9, fontWeight: 600, color: T.text,
                  borderBottom: `1px solid ${T.border}50`,
                  whiteSpace: "nowrap",
                }}>
                  {phase}
                </td>
                {sections.map((sec, ci) => {
                  const cell = cellColor(data[ri][ci], sec);
                  return (
                    <td key={sec} style={{
                      padding: "3px 2px", textAlign: "center",
                      borderBottom: `1px solid ${T.border}50`,
                    }}>
                      {data[ri][ci] !== "N" && (
                        <span style={{
                          display: "inline-block",
                          fontSize: 7, fontWeight: 800, letterSpacing: 0.5,
                          padding: "2px 5px", borderRadius: 3,
                          background: cell.bg,
                          color: cell.color,
                          border: `1px solid ${cell.border}`,
                        }}>
                          {cell.label}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {criticalMissing.length > 0 && (
        <div style={{
          marginTop: 10, padding: "8px 10px",
          background: T.missingBg, borderRadius: 6,
          border: `1px solid ${T.missing}20`,
        }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: T.missing, letterSpacing: 0.8, marginBottom: 3 }}>
            PHASE TERMINATIONS IN CURRENT STATE
          </div>
          <div style={{ fontSize: 9, color: T.textMid, lineHeight: 1.5 }}>
            {criticalMissing.map((c, i) => (
              <span key={i}>
                <strong style={{ color: T.missing }}>{c.phase}</strong>
                {" requires "}
                <strong style={{ color: T.text }}>{c.section}</strong>
                {i < criticalMissing.length - 1 ? " \u00B7 " : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──

export default function IncidentV5() {
  const [scenario, setScenario] = useState("scope_violation");
  const [state, setState] = useState("none");

  const sc = SCENARIOS.find(s => s.id === scenario);
  const cardFields = getCardFields(state);
  const timeline = getTimeline(scenario, state);
  const outcome = getOutcome(scenario, state);

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'Geist', 'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <div style={{
        padding: "16px 24px", borderBottom: `1px solid ${T.border}`,
        background: T.surface,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Agent ID PoC \u2014 Incident Response Explorer
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: T.white, letterSpacing: "-0.3px" }}>
              What Happens When an Agent Causes Harm?
            </h1>
            <p style={{ fontSize: 10, color: T.textDim, margin: "4px 0 0", maxWidth: 600 }}>
              The credential an agent carries determines what incident response is possible.
              Toggle between identity states to see which response phases succeed, degrade, or terminate entirely.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase" }}>Scenario</div>
            <div style={{ display: "flex", gap: 4 }}>
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => setScenario(s.id)} style={{
                  padding: "6px 12px", borderRadius: 7,
                  border: `1.5px solid ${scenario === s.id ? T.accent : T.border}`,
                  background: scenario === s.id ? `${T.accent}12` : "transparent",
                  color: scenario === s.id ? T.accent : T.textDim,
                  cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600,
                  transition: "all 0.15s",
                }}>
                  <span style={{ marginRight: 4 }}>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 12, padding: "10px 14px",
          background: `${T.incident}08`, border: `1px solid ${T.incident}20`, borderRadius: 8,
        }}>
          <div style={{ fontSize: 8, fontWeight: 800, color: T.incident, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>
            Incident Report
          </div>
          <div style={{ fontSize: 11, color: T.text, lineHeight: 1.6 }}>{sc.incident}</div>
        </div>
      </div>

      <div style={{
        padding: "10px 24px",
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginRight: 8 }}>
          Agent ID State
        </div>
        {STATES.map(s => (
          <button key={s.id} onClick={() => setState(s.id)} style={{
            padding: "7px 14px", borderRadius: 7,
            border: `2px solid ${state === s.id ? s.color : T.border}`,
            background: state === s.id ? `${s.color}10` : "transparent",
            cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            transition: "all 0.2s",
            boxShadow: state === s.id ? `0 0 0 1px ${s.color}15` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 12 }}>{s.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: state === s.id ? s.color : T.textMid }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 8, color: T.textDim, marginTop: 1, marginLeft: 17 }}>{s.sub}</div>
          </button>
        ))}
      </div>

      <div style={{
        display: "flex", gap: 20, padding: "20px 24px",
        alignItems: "flex-start",
      }}>
        <div style={{ width: 340, flexShrink: 0 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            Evidence Available to Responders
          </div>
          <IDCard fields={cardFields} stateId={state} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            Incident Response Timeline
          </div>
          <Timeline steps={timeline} />

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Outcome
            </div>
            <OutcomeBar outcome={outcome} />
          </div>

          <div style={{ marginTop: 14 }}>
            <DependencyMatrix currentState={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
