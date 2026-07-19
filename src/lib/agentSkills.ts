/**
 * Intelligence · Agent — skill catalog and plugin release data.
 * Content cataloged 2026-07-18 by diffing every packaged version of the
 * healthliant-ventures-os plugin in the Agent archive. Flow definitions
 * mirror each skill's SKILL.md workflow (v0.8.0).
 */

export const PLUGIN_LATEST = {
  name: "Healthliant Ventures OS",
  version: "0.8.0",
  file: "healthliant-ventures-os-0.8.0.plugin",
  storagePath: "healthliant-ventures-os-0.8.0.plugin",
  sizeLabel: "76 KB",
  releasedLabel: "Jul 18, 2026",
};

export interface Release {
  version: string;
  date: string;
  tag?: string;
  changes: { area: string; text: string }[];
}

export const RELEASES: Release[] = [
  {
    version: "0.8.0", date: "Jul 18, 2026", tag: "Latest",
    changes: [
      { area: "BAA Review", text: "Mandatory secondary holistic review detects coordinated multi-clause redline patterns (e.g. notice-and-cure dilution spread across breach, termination, and audit clauses) and generates package pushback recommendations." },
      { area: "Expense Report", text: "Foreign-currency handling upgraded — card-statement posted USD preferred; auto-converted market rates and voucher estimates flagged red-italic for reviewer confirmation. Multi-page receipt trimming rules added (e.g. Uber page 1 only)." },
      { area: "Financial Pro-Forma", text: "Optional Training Mode adds Training Notes columns explaining every model line for junior analysts, without touching calculations." },
    ],
  },
  {
    version: "0.6.3", date: "Apr 21, 2026",
    changes: [
      { area: "BAA Review", text: "Tanner standard positions codified — one-way BA-only indemnification (§17); when a cap must be accepted, lesser of 3× aggregate contract value or $3M, with mandatory uncapped carve-outs." },
    ],
  },
  {
    version: "0.6.2", date: "Apr 17, 2026",
    changes: [
      { area: "Financial Pro-Forma", text: "Expanded from three to four deal archetypes with the new SAFE-Credits structure (license-volume-tiered credits, anti-dilution warrants, SAFE cap); tiered exit-multiple flex from a single baseline input; mandatory Governance tab capturing methodology, sourcing, and senior-partner pushbacks." },
    ],
  },
  {
    version: "0.6.1", date: "Apr 16, 2026",
    changes: [
      { area: "IPA Review", text: "Automated word-level paragraph classification (bundled Python script) now mandatory for Blue/Yellow/Red change color-coding; entity-swap detection prevents mechanical name substitutions from being flagged as substantive changes." },
    ],
  },
  {
    version: "0.6.0", date: "Mar 18, 2026", tag: "New skill",
    changes: [
      { area: "MSA Comparison", text: "New skill — vendor Master Services Agreement deviation analysis with risk classification and negotiation-ready output." },
      { area: "Packaging", text: "Bundled reference documents and scripts removed from IPA Review and Legal Tracker." },
    ],
  },
  {
    version: "0.5.0", date: "Mar 8, 2026", tag: "New skill",
    changes: [
      { area: "Legal Tracker", text: "New skill — Fox Rothschild and Tisinger Vance invoice parsing into the multi-tab legal expense workbook with attorney rate tables and an exceptions tab." },
    ],
  },
  {
    version: "0.4.0", date: "Feb 28, 2026", tag: "New skills",
    changes: [
      { area: "Expense Report", text: "New skill — receipt-folder to standard Excel template automation." },
      { area: "Financial Pro-Forma", text: "New skill — term-sheet-driven Excel deal models with comparable-company research and contrarian senior-partner pressure testing." },
    ],
  },
  {
    version: "0.2.1", date: "Feb 17, 2026", tag: "First release",
    changes: [
      { area: "IPA Review · BAA Review", text: "Initial cataloged release with two skills — IPA Review (three-version pre-signature comparison) and BAA Review (standard-position redlining) — each with a matching slash command." },
    ],
  },
];

export type FlowNode =
  | { kind: "step"; title: string; sub?: string }
  | { kind: "decision"; title: string; sub?: string; branches: { label: string; sub?: string }[] }
  | { kind: "gate"; title: string; sub?: string; loopNote?: string }
  | { kind: "optional"; title: string; sub?: string }
  | { kind: "deliver"; title: string; sub?: string };

export interface AgentSkill {
  slug: string;
  name: string;
  tagline: string;
  command: string;
  output: string;
  summary: string[];
  facts: { label: string; value: string }[];
  flow: FlowNode[];
}

export const AGENT_SKILLS: AgentSkill[] = [
  {
    slug: "baa-review",
    name: "BAA Review",
    tagline: "Redline analysis of Business Associate Agreements against Tanner standard positions, with severity classification and cross-clause pattern detection.",
    command: "/baa-review",
    output: ".docx review document",
    summary: [
      "Analyzes Business Associate Agreements and HIPAA addenda with redlines, identifying every deviation from the organization's codified standard positions — including one-way BA-only indemnification and the lesser-of 3× contract value / $3M liability cap with mandatory uncapped carve-outs.",
      "Beyond clause-by-clause review, a mandatory second pass looks across clauses for coordinated redline patterns — such as notice-and-cure dilution spread over breach, termination, and audit provisions — and converts them into package pushback recommendations, producing a professional Word document ready for executive sign-off.",
    ],
    facts: [
      { label: "Primary input", value: "Redlined BAA / HIPAA addendum" },
      { label: "Deliverable", value: "Word review document with redline suggestions" },
      { label: "Standards source", value: "Tanner Standard BAA + playbook positions" },
      { label: "Quality gate", value: "Holistic cross-clause second pass" },
    ],
    flow: [
      { kind: "step", title: "Extract document text", sub: "counterparty redline vs. Tanner Standard BAA" },
      { kind: "step", title: "Catalog every redline", sub: "each insertion, deletion, and modification logged" },
      { kind: "step", title: "Analyze against playbook & HIPAA standards", sub: "codified Tanner positions: indemnity, caps, carve-outs" },
      { kind: "decision", title: "Classify deviation severity", branches: [
        { label: "Critical", sub: "blocks signature" },
        { label: "Material", sub: "needs pushback" },
        { label: "Minor", sub: "acceptable with note" },
      ] },
      { kind: "gate", title: "Holistic cross-clause review", sub: "second pass detects coordinated multi-clause patterns", loopNote: "patterns become package pushback recommendations" },
      { kind: "step", title: "Generate the review document", sub: "redline suggestions, rationale, and severity per clause" },
      { kind: "deliver", title: "Word review delivered", sub: "executive sign-off ready" },
    ],
  },
  {
    slug: "expense-report",
    name: "Expense Report",
    tagline: "Monthly expense workbooks from receipt files, with FX handling, categorization, and a receipts register matching the standard template.",
    command: "/expense-report",
    output: ".xlsx workbook (Expenses + Receipts tabs)",
    summary: [
      "Builds monthly expense reports from a folder of receipt files (PDFs, JPGs, PNGs), extracting merchant, date, and amount from each receipt, categorizing every expense, and laying the results into the organization's standard Excel template with an Expenses tab and an image-embedded Receipts tab.",
      "Foreign-currency charges follow a strict precedence: the card statement's posted USD is preferred; auto-converted market rates and voucher estimates are entered in red italic so the reviewer knows exactly which figures still need statement confirmation. Multi-page receipts are trimmed to their informative page before embedding.",
    ],
    facts: [
      { label: "Primary input", value: "Folder of receipt files (PDF / JPG / PNG)" },
      { label: "Deliverable", value: "Standard-template Excel workbook" },
      { label: "FX precedence", value: "Statement USD → market rate → voucher estimate" },
      { label: "Quality gate", value: "Totals & formatting verification pass" },
    ],
    flow: [
      { kind: "step", title: "Load template & prior examples", sub: "column layout learned from existing reports" },
      { kind: "step", title: "Extract receipt data", sub: "merchant, date, amount from every file; multi-page receipts trimmed" },
      { kind: "step", title: "Categorize expenses", sub: "standard expense categories applied" },
      { kind: "decision", title: "Resolve currency", branches: [
        { label: "USD receipt", sub: "entered as-is" },
        { label: "Statement USD", sub: "preferred for FX" },
        { label: "Converted / estimate", sub: "red italic — confirm later" },
      ] },
      { kind: "step", title: "Build Expenses tab", sub: "line items, categories, monthly totals" },
      { kind: "step", title: "Build Receipts tab", sub: "receipt images embedded in order" },
      { kind: "gate", title: "Verify totals & formatting", sub: "sums re-checked against extracted amounts" },
      { kind: "deliver", title: "Expense report delivered", sub: "reimbursement-ready workbook" },
    ],
  },
  {
    slug: "financial-pro-forma",
    name: "Financial Pro-Forma",
    tagline: "Adjustable Excel deal models from term sheets and IPAs — classified, comped, pressure-tested, and governed.",
    command: "/financial-pro-forma",
    output: ".xlsx model + Governance tab",
    summary: [
      "Builds adjustable Excel financial models for Healthliant Ventures portfolio investments by extracting deal terms directly from term sheets and IPAs. Each deal is classified into one of four archetypes — credits-based (EVC with Tier 1/2/3 revenue sharing), warrants-based (milestone equity), hybrid cash + equity, or SAFE-Credits (license-volume-tiered credits with anti-dilution warrants and a SAFE cap).",
      "The skill researches comparable revenue multiples and M&A exits to ground the valuation, then produces a model with a tiered exit-multiple flex — one baseline input, formulaic year-over-year. Before anything is presented, a contrarian senior-partner sub-agent pressure-tests the assumptions, and every model ships with a mandatory Governance tab capturing methodology, sourcing, and the pushbacks raised. An optional Training Mode annotates each model line for junior analysts.",
    ],
    facts: [
      { label: "Primary input", value: "Term sheet or executed IPA" },
      { label: "Deliverable", value: "Excel model + Governance tab" },
      { label: "Deal archetypes", value: "4 (Credits / Warrants / Hybrid / SAFE-Credits)" },
      { label: "Quality gate", value: "Contrarian senior-partner review" },
    ],
    flow: [
      { kind: "step", title: "Extract deal terms", sub: "term sheet / IPA parsing" },
      { kind: "decision", title: "Classify archetype", sub: "economics structure detection", branches: [
        { label: "Credits-based (EVC)", sub: "Tier 1/2/3 revenue share" },
        { label: "Warrants-based", sub: "milestone equity" },
        { label: "Hybrid cash + equity", sub: "operating cash + exit upside" },
        { label: "SAFE-Credits", sub: "license tiers + anti-dilution + cap" },
      ] },
      { kind: "step", title: "Research comparables", sub: "revenue multiples · M&A exits" },
      { kind: "step", title: "Build the model", sub: "projections · tiered exit-multiple flex · scenarios" },
      { kind: "gate", title: "Senior-partner pressure test", sub: "contrarian sub-agent challenges every assumption and return threshold", loopNote: "assumptions revised until they hold" },
      { kind: "step", title: "Governance tab", sub: "methodology · sourcing · pushbacks logged" },
      { kind: "optional", title: "Training Mode (optional)", sub: "Training Notes columns for junior analysts — calculations untouched" },
      { kind: "deliver", title: "Excel model delivered", sub: "adjustable · auditable · exec-ready" },
    ],
  },
  {
    slug: "ipa-review",
    name: "IPA Review",
    tagline: "Pre-signature three-version comparison (template / draft / final) with automated word-level change classification for executive sign-off.",
    command: "/ipa-review",
    output: ".docx companion review",
    summary: [
      "Runs the final pre-signature review of Innovation Participation Agreements by comparing three versions of the document — the standard template, the negotiated draft, and the final execution copy — and identifying every deviation between them.",
      "Change color-coding is produced by a mandatory automated word-level comparison script rather than manual judgment: entity-swap detection separates mechanical name substitutions from substantive edits, so unchanged language is never misclassified. The result is a professional Word companion review that classifies each deviation by severity for executive sign-off.",
    ],
    facts: [
      { label: "Primary input", value: "Template + draft + final IPA versions" },
      { label: "Deliverable", value: "Word companion review document" },
      { label: "Classification", value: "Automated word-level (Blue / Yellow / Red)" },
      { label: "Quality gate", value: "Entity-swap detection (no false positives)" },
    ],
    flow: [
      { kind: "step", title: "Extract all three documents", sub: "template · negotiated draft · final execution copy" },
      { kind: "gate", title: "Automated word-level classification", sub: "bundled Python script compares every paragraph; entity swaps (name substitutions) filtered out", loopNote: "mechanical substitutions never flagged as substantive" },
      { kind: "decision", title: "Classify each paragraph", branches: [
        { label: "Blue — unchanged", sub: "matches template" },
        { label: "Yellow — negotiated", sub: "changed in draft" },
        { label: "Red — late change", sub: "changed after draft" },
      ] },
      { kind: "step", title: "Classify deviation severity", sub: "business impact of every substantive change" },
      { kind: "step", title: "Generate companion review", sub: "full contract text color-coded with findings" },
      { kind: "deliver", title: "Pre-signature review delivered", sub: "executive sign-off ready" },
    ],
  },
  {
    slug: "legal-tracker",
    name: "Legal Tracker",
    tagline: "Law-firm invoice parsing (Fox Rothschild, Tisinger Vance) into a multi-tab expense workbook attributed by company and matter type.",
    command: "/legal-tracker",
    output: ".xlsx workbook (4 tabs)",
    summary: [
      "Builds or updates the Healthliant Ventures legal expense tracker from law-firm invoice PDFs. Fox Rothschild invoices and the Tisinger Vance history bill are parsed line by line, each entry attributed to a portfolio company, categorized as Contract or Regulatory work, and costed using the attorney rate tables.",
      "The output is a multi-sheet Excel workbook — Raw Data, By Attorney, By Company, and Exceptions — where anything that cannot be confidently attributed lands on the Exceptions tab for human review instead of being silently guessed.",
    ],
    facts: [
      { label: "Primary input", value: "FR invoice PDFs · TV history bill" },
      { label: "Deliverable", value: "4-tab Excel tracker" },
      { label: "Modes", value: "Build from scratch · update existing" },
      { label: "Quality gate", value: "Exceptions tab (no silent guesses)" },
    ],
    flow: [
      { kind: "decision", title: "Select operating mode", branches: [
        { label: "Build from scratch", sub: "new tracker workbook" },
        { label: "Update existing", sub: "append new months" },
      ] },
      { kind: "step", title: "Inventory the inputs", sub: "invoices matched to months and firms" },
      { kind: "step", title: "Parse Fox Rothschild invoices", sub: "line items with attorney, hours, matter" },
      { kind: "step", title: "Parse Tisinger Vance history bill", sub: "entries costed via attorney rate tables" },
      { kind: "step", title: "Attribute companies & categorize", sub: "portfolio company + Contract vs. Regulatory" },
      { kind: "gate", title: "Exceptions routing", sub: "unattributable line items surfaced, never guessed", loopNote: "reviewer resolves exceptions; tracker stays trustworthy" },
      { kind: "step", title: "Build the four sheets", sub: "Raw Data · By Attorney · By Company · Exceptions" },
      { kind: "deliver", title: "Legal tracker delivered", sub: "firm-by-firm, company-by-company visibility" },
    ],
  },
  {
    slug: "msa-comparison",
    name: "MSA Comparison",
    tagline: "Side-by-side vendor MSA deviation analysis with risk severity classification and a negotiation-ready review document.",
    command: "/msa-comparison",
    output: ".docx comparison review",
    summary: [
      "Compares an incoming vendor Master Services Agreement against a previously executed or proposed version, identifying every material difference — terms, pricing, liability, data provisions — clause by clause.",
      "Each deviation is classified by risk severity and then prioritized for negotiation, producing a professional Word document that gives the negotiating team a ready-made agenda: what to push back on first, what to trade, and what to accept.",
    ],
    facts: [
      { label: "Primary input", value: "Two MSA versions (original + proposed)" },
      { label: "Deliverable", value: "Word comparison review" },
      { label: "Coverage", value: "Terms, pricing, liability, data provisions" },
      { label: "Output ordering", value: "Prioritized negotiation agenda" },
    ],
    flow: [
      { kind: "step", title: "Extract both documents", sub: "original / executed vs. incoming proposal" },
      { kind: "step", title: "Compare clause by clause", sub: "every material difference identified" },
      { kind: "decision", title: "Classify deviation risk", branches: [
        { label: "High", sub: "unacceptable exposure" },
        { label: "Medium", sub: "negotiate" },
        { label: "Low", sub: "accept with note" },
      ] },
      { kind: "step", title: "Prioritize for negotiation", sub: "push back · trade · accept" },
      { kind: "step", title: "Generate the review document", sub: "side-by-side findings with rationale" },
      { kind: "deliver", title: "Negotiation-ready review delivered", sub: "contract team agenda in hand" },
    ],
  },
];

export const skillBySlug = new Map(AGENT_SKILLS.map(s => [s.slug, s]));
