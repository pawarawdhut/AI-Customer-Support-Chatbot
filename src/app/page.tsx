import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Globe2,
  LockKeyhole,
  MessageCircle,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Conversations that convert",
    description:
      "Give every visitor a helpful, always-on support experience that feels like part of your product.",
  },
  {
    icon: Sparkles,
    title: "Answers grounded in your business",
    description:
      "Add your own support notes and FAQs so your assistant has useful context, not just generic answers.",
  },
  {
    icon: Globe2,
    title: "One line to get started",
    description:
      "Copy an embed snippet, add your site, and bring your support assistant to your website.",
  },
  {
    icon: LockKeyhole,
    title: "Built for multiple workspaces",
    description:
      "Keep each team's sites, settings, and conversations separate with tenant-scoped data.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <Link aria-label="Orbit home" className="brand" href="/">
          <span className="brand-mark"><Bot size={19} /></span>
          <span>orbit<span className="brand-light">.support</span></span>
        </Link>
        <nav aria-label="Main navigation" className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="nav-actions">
          <Link className="button button-quiet" href="/dashboard">Log in</Link>
          <Link className="button button-dark" href="/dashboard">
            Get started <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> YOUR SUPPORT, ON AUTOPILOT</div>
          <h1>Support that<br />feels like <span className="serif-accent">you.</span></h1>
          <p className="hero-description">
            Meet the AI support assistant that knows your business, welcomes
            every visitor, and is ready whenever they are.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark button-large" href="/dashboard">
              Build your assistant <ArrowRight size={16} />
            </Link>
            <a className="text-link" href="#how-it-works">See how it works <span>↓</span></a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>J</span><span>M</span><span>A</span><span>+</span>
            </div>
            <span>Made for teams who care about every customer</span>
          </div>
        </div>

        <div className="preview-wrap" aria-label="Preview of the chat assistant">
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
          <div className="preview-card">
            <div className="preview-topline">
              <span className="preview-label"><span className="status-dot" /> LIVE PREVIEW</span>
              <span className="preview-menu">•••</span>
            </div>
            <div className="chat-window">
              <div className="chat-heading">
                <div className="chat-avatar"><Sparkles size={16} /></div>
                <div><strong>Hey, we&apos;re Orbit</strong><small>Ask us anything <span className="tiny-dot" /></small></div>
                <span className="chat-close">−</span>
              </div>
              <div className="chat-body">
                <div className="message-time">TODAY, 10:42 AM</div>
                <div className="chat-bubble bot-bubble">Hi there! 👋 I&apos;m here to help you find your way around.</div>
                <div className="chat-bubble user-bubble">Can I add this to my website?</div>
                <div className="chat-bubble bot-bubble">Absolutely! Just copy one small script tag and you&apos;re all set ✨</div>
                <div className="quick-reply"><Code2 size={12} /> Show me how</div>
              </div>
              <div className="chat-input"><span>Write a message...</span><span className="send-button">↑</span></div>
            </div>
            <div className="preview-caption"><span className="caption-star">✳</span> A little help goes a long way.</div>
          </div>
          <div className="floating-note note-top"><span className="note-icon"><Sparkles size={13} /></span> Helpful, around the clock</div>
          <div className="floating-note note-bottom"><span className="tiny-dot" /> Your assistant is online</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Product highlights">
        <span>MADE FOR THE WAY YOU WORK</span>
        <div><Check size={14} /> No-code install</div>
        <div><Check size={14} /> Your own knowledge</div>
        <div><Check size={14} /> Multi-site ready</div>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading">
          <div className="eyebrow">A BETTER WAY TO SAY HELLO</div>
          <h2>Small widget.<br /><span className="serif-accent">Big difference.</span></h2>
          <p>Everything you need to make support more personal, without making it more complicated.</p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon"><Icon size={18} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="feature-number">0{index + 1}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="install-section" id="how-it-works">
        <div>
          <div className="eyebrow">A FEW CLICKS, THEN HELLO</div>
          <h2>From setup to<br /><span className="serif-accent">say hello.</span></h2>
          <p>Bring your assistant to life in a few simple steps.</p>
          <Link className="button button-dark button-large" href="/dashboard">
            Create your first site <ArrowRight size={16} />
          </Link>
        </div>
        <div className="steps-list">
          <div className="step"><span>01</span><div><h3>Tell us about your site</h3><p>Choose a name, add your website, and make it yours.</p></div></div>
          <div className="step"><span>02</span><div><h3>Give your assistant context</h3><p>Add FAQs, policies, and the details your customers ask about.</p></div></div>
          <div className="step"><span>03</span><div><h3>Copy, paste, and say hello</h3><p>Add your embed snippet and welcome your first conversation.</p></div></div>
        </div>
      </section>

      <footer className="footer">
        <Link aria-label="Orbit home" className="brand" href="/">
          <span className="brand-mark"><Bot size={16} /></span> orbit<span className="brand-light">.support</span>
        </Link>
        <span>Thoughtful support, one conversation at a time.</span>
        <Link href="/dashboard">Open your dashboard <ArrowRight size={13} /></Link>
      </footer>
    </main>
  );
}
