import { Link } from "react-router-dom";

const LandingPage = () => {
  const highlights = [
    {
      value: "1:1",
      label: "Direct skill exchange",
      text: "Find someone who wants what you already know and start a focused conversation.",
    },
    {
      value: "24/7",
      label: "Always ready to browse",
      text: "Discover matches, save time with filters, and keep your learning queue moving.",
    },
    {
      value: "100%",
      label: "Profile driven",
      text: "Use skills offered, skills wanted, ratings, and match scores to spot the best people fast.",
    },
  ];

  const steps = [
    {
      title: "Build your profile",
      text: "Share what you offer, what you want to learn, and a short bio people can trust.",
    },
    {
      title: "Discover the right people",
      text: "Browse recommended matches and the full community side by side.",
    },
    {
      title: "Start exchanging skills",
      text: "Connect, chat, and turn a simple match into a real learning partnership.",
    },
  ];

  const featureCards = [
    {
      title: "Smart matching",
      text: "Match people by shared interests, rating strength, and skill overlap instead of random browsing.",
    },
    {
      title: "Fast discovery",
      text: "Use search, filters, and sorting to quickly narrow the right people for your goals.",
    },
    {
      title: "Direct chat",
      text: "Move from profile discovery to one-to-one conversation without leaving the app.",
    },
    {
      title: "Profile control",
      text: "Keep your bio, offered skills, and learning goals updated as you grow.",
    },
  ];

  return (
    <section className="landing container">
      <section className="hero-shell">
        <div className="hero-card hero-copy-panel">
          <p className="eyebrow">Welcome to SkillSwap</p>
          <h1>
            Exchange skills with people who actually want to learn from you.
          </h1>
          <p className="hero-copy">
            SkillSwap helps classmates, creators, and curious learners find the
            right people, compare strengths, and build real one-to-one learning
            exchanges in one clean dashboard.
          </p>

          <div className="button-row hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login
            </Link>
          </div>

          <div className="hero-points">
            <span>Built for direct skill exchange</span>
            <span>Profile-driven discovery</span>
            <span>Fast chat and connection flow</span>
          </div>
        </div>

        <aside className="hero-card hero-aside">
          <p className="eyebrow">Why it works</p>
          <div className="highlight-list">
            {highlights.map((item) => (
              <article key={item.label} className="highlight-item">
                <strong>{item.value}</strong>
                <div>
                  <h3>{item.label}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="content-section">
        <div className="section-head">
          <p className="eyebrow">What you can do</p>
          <h2>A complete workflow from discovery to conversation.</h2>
          <p className="section-copy">
            Every screen is designed to reduce friction, so users spend more
            time matching and less time searching.
          </p>
        </div>

        <div className="feature-grid feature-grid-strong">
          {featureCards.map((feature) => (
            <article key={feature.title} className="card feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <div className="section-head">
          <p className="eyebrow">How it flows</p>
          <h2>Three steps to start swapping skills.</h2>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="card step-card">
              <span className="step-index">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-card">
        <div>
          <p className="eyebrow">Ready to begin?</p>
          <h2>Set up your profile and find your first skill match today.</h2>
          <p className="section-copy">
            Once your skills are in place, the dashboard can recommend people
            that fit your goals and help you start a conversation immediately.
          </p>
        </div>
        <div className="button-row cta-actions">
          <Link to="/signup" className="btn btn-primary">
            Create account
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </section>
    </section>
  );
};

export default LandingPage;
