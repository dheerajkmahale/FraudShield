import { Link } from 'react-router-dom';

const toolkit = [
  {
    title: 'Velocity Detection',
    description:
      'Flags repeated payments from the same account in a tight window, surfacing bursts that may indicate rapid movement or laundering activity.',
  },
  {
    title: 'Rapid Movement',
    description:
      'Tracks whether funds are sent to multiple distinct accounts in a short period, a common signal of fast dispersal across counterparties.',
  },
  {
    title: 'Repeated Transfer Detection',
    description:
      'Looks for the same recipient receiving multiple transfers within a 24-hour period, which is a classic structuring or layering pattern.',
  },
  {
    title: 'Location Anomaly',
    description:
      'Compares a transaction location against the sender account’s recent history and alerts when a new location appears unexpectedly.',
  },
  {
    title: 'Prior Fraud History',
    description:
      'Checks whether the sender or receiver is linked to prior confirmed-fraud activity, raising the risk score when a known bad pattern recurs.',
  },
  {
    title: 'Structuring / Round-Value Alerts',
    description:
      'Catches large round-number transfers and high-value patterns often used to avoid thresholds or hide suspicious activity in plain sight.',
  },
];

const steps = [
  'Transaction submitted and normalized for review.',
  'FraudShield evaluates casing criteria across amount, timing, destination, location, and prior history.',
  'Suspicious activity is scored and routed for investigation, escalation, or audit tracking.',
  'Every decision is recorded to the case trail so analysts can review the exact risk reasons later.',
];

export default function LandingPage() {
  return (
    <div className="landing-page-shell">
      <header className="landing-topbar">
        <div className="landing-brand" aria-label="FraudShield home">
          <span className="brand-mark">◈</span>
          <span>FraudShield</span>
        </div>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <div className="landing-actions">
          <Link to="/login" className="btn btn-primary landing-cta">
            Access Engine
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-copy">
            <div className="landing-status-row font-mono">
              <span className="status-pill">SYSTEM · OPERATIONAL</span>
              <span className="version-pill">v.1.8</span>
            </div>

            <h1>
              FraudShield
              <span>Financial Fraud Detection Engine</span>
            </h1>

            <p className="landing-lead">
              FraudShield analyzes transaction velocity, destination churn, location anomalies,
              and account history to detect suspicious activity before high-risk transfers escalate.
            </p>

            <div className="landing-actions hero-actions">
              <Link to="/login" className="btn btn-primary">
                Start Analysis
              </Link>
              <a href="#features" className="btn btn-outline">
                Learn More
              </a>
            </div>
          </div>

          <div className="landing-terminal" aria-label="FraudShield terminal mockup">
            <div className="terminal-header font-mono">
              <span className="terminal-dot dot-green" />
              <span className="terminal-dot dot-cyan" />
              <span className="terminal-dot dot-amber" />
              <span className="terminal-title">risk.engine</span>
            </div>

            <div className="terminal-body font-mono">
              <div className="terminal-line">&gt; INIT risk_policy_v3</div>
              <div className="terminal-line">&gt; VELOCITY_CHECK: 3 tx / 10 min</div>
              <div className="terminal-line">&gt; LOCATION_DIFF: new region detected</div>
              <div className="terminal-line">&gt; PRIOR_FRAUD_MATCH: 2 linked events</div>
              <div className="terminal-line accent">&gt; ALERT SCORE: 86 / 100</div>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="section-header">
            <span className="eyebrow font-mono">FORENSIC TOOLKIT</span>
            <h2>Rules that surface risk early.</h2>
          </div>

          <div className="feature-grid">
            {toolkit.map((item) => (
              <article key={item.title} className="feature-card">
                <div className="feature-tag font-mono">RULE</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="landing-section process-section">
          <div className="section-header">
            <span className="eyebrow font-mono">HOW IT WORKS</span>
            <h2>From transaction to review.</h2>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <div key={step} className="process-step">
                <span className="process-index font-mono">0{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="brand-mark">◈</span>
          <span>FraudShield</span>
        </div>
        <p>Financial fraud detection for critical investigations.</p>
      </footer>
    </div>
  );
}
