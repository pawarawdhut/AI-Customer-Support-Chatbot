"use client";

import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Globe2,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type Site = {
  siteId: string;
  name: string;
  domain: string;
  assistantName: string;
  greeting: string;
  primaryColor: string;
  knowledgeBase: string;
};

type SiteForm = Omit<Site, "siteId">;

const emptyForm: SiteForm = {
  name: "",
  domain: "",
  assistantName: "Orbit",
  greeting: "Hi there! How can I help you today?",
  primaryColor: "#6046e8",
  knowledgeBase: "",
};

function siteToForm(site: Site): SiteForm {
  return {
    name: site.name,
    domain: site.domain,
    assistantName: site.assistantName,
    greeting: site.greeting,
    primaryColor: site.primaryColor,
    knowledgeBase: site.knowledgeBase,
  };
}

async function responseError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return payload?.error ?? "Something went wrong. Please try again.";
}

export function DashboardClient({ displayName }: { displayName: string }) {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const appOrigin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () =>
      (process.env.NEXT_PUBLIC_APP_URL ?? "https://YOUR-ORBIT-APP").replace(
        /\/+$/,
        "",
      ),
  );

  const selectedSite = useMemo(
    () => sites.find((site) => site.siteId === selectedId),
    [sites, selectedId],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/sites", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return (await response.json()) as { sites: Site[] };
      })
      .then(({ sites: loadedSites }) => {
        if (!active) return;
        setSites(loadedSites);
        setSelectedId(loadedSites[0]?.siteId ?? "");
        setForm(loadedSites[0] ? siteToForm(loadedSites[0]) : emptyForm);
        if (loadedSites.length === 0) setShowForm(true);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Could not load sites.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function updateForm(field: keyof SiteForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  async function saveSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        selectedSite ? `/api/sites/${selectedSite.siteId}` : "/api/sites",
        {
          method: selectedSite ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) throw new Error(await responseError(response));
      const payload = (await response.json()) as { site: Site };
      setSites((current) =>
        selectedSite
          ? current.map((site) =>
              site.siteId === payload.site.siteId ? payload.site : site,
            )
          : [payload.site, ...current],
      );
      setSelectedId(payload.site.siteId);
      setForm(siteToForm(payload.site));
      setShowForm(false);
      setNotice("Your site settings are saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save your site.");
    } finally {
      setSaving(false);
    }
  }

  async function copyEmbedCode() {
    if (!selectedSite) return;
    const snippet = `<script async src="${window.location.origin}/widget.js" data-site-id="${selectedSite.siteId}"></script>`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. Copy the embed snippet manually.");
    }
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link aria-label="Orbit home" className="brand sidebar-brand" href="/">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>orbit<span className="brand-light">.support</span></span>
        </Link>
        <div className="workspace-picker">
          <span className="workspace-avatar">{displayName[0]?.toUpperCase() ?? "W"}</span>
          <span className="workspace-copy"><strong>{displayName}</strong><small>Workspace</small></span>
          <ChevronDown size={14} />
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <div className="sidebar-nav-item active"><Globe2 size={16} /> Websites</div>
        <div className="sidebar-nav-item"><MessageCircle size={16} /> Conversations <span className="coming-soon">SOON</span></div>
        <div className="sidebar-nav-item"><Settings2 size={16} /> Settings <span className="coming-soon">SOON</span></div>
        <div className="sidebar-bottom">
          <div className="sidebar-help"><span className="help-mark">?</span><div><strong>Need a hand?</strong><small>Your assistant starts here.</small></div></div>
          <a className="logout-link" href="/logout"><LogOut size={15} /> Sign out</a>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><strong>Websites</strong></div>
            <h1>Your websites</h1>
            <p>Set up an assistant for every corner of your internet.</p>
          </div>
          <button
            className="button button-dark"
            onClick={() => {
              setSelectedId("");
              setForm(emptyForm);
              setShowForm(true);
              setNotice("");
              setError("");
            }}
            type="button"
          >
            <Plus size={16} /> Add a website
          </button>
        </header>

        {error && <div className="notice notice-error" role="alert"><X size={15} />{error}</div>}
        {notice && <div className="notice notice-success" role="status"><Check size={15} />{notice}</div>}

        {loading ? (
          <div className="dashboard-loading"><LoaderCircle className="spin" size={22} /> Loading your websites...</div>
        ) : showForm ? (
          <section className="dashboard-content">
            <div className="panel-heading">
              <div><div className="eyebrow">YOUR ASSISTANT</div><h2>{selectedSite ? "Website settings" : "A new hello starts here"}</h2><p>Give your assistant a little context and personality.</p></div>
              <button className="icon-button" onClick={() => setShowForm(false)} type="button" aria-label="Close settings"><X size={17} /></button>
            </div>
            <form className="settings-form" onSubmit={saveSite}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Website name</span>
                  <input required maxLength={60} value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="My lovely website" />
                </label>
                <label className="form-field">
                  <span>Website domain</span>
                  <input required maxLength={253} value={form.domain} onChange={(event) => updateForm("domain", event.target.value)} placeholder="example.com" />
                  <small>Use a domain only, without a page path.</small>
                </label>
                <label className="form-field">
                  <span>Assistant name</span>
                  <input required maxLength={40} value={form.assistantName} onChange={(event) => updateForm("assistantName", event.target.value)} placeholder="Orbit" />
                </label>
                <label className="form-field">
                  <span>Brand color</span>
                  <div className="color-input"><input aria-label="Brand color" type="color" value={form.primaryColor} onChange={(event) => updateForm("primaryColor", event.target.value)} /><input aria-label="Brand color hex value" maxLength={7} pattern="#[0-9a-fA-F]{6}" required value={form.primaryColor} onChange={(event) => updateForm("primaryColor", event.target.value)} /></div>
                </label>
              </div>
              <label className="form-field">
                <span>Welcome message</span>
                <input required maxLength={240} value={form.greeting} onChange={(event) => updateForm("greeting", event.target.value)} placeholder="How can I help you today?" />
              </label>
              <label className="form-field">
                <span>Business knowledge</span>
                <textarea maxLength={12000} rows={7} value={form.knowledgeBase} onChange={(event) => updateForm("knowledgeBase", event.target.value)} placeholder={"Add your FAQs, policies, and useful details here.\n\nExample: We ship orders within 2 business days. Our support team is available Monday to Friday."} />
                <small>Only add information you want your assistant to share with your customers.</small>
              </label>
              <div className="form-actions">
                <span>{form.knowledgeBase.length.toLocaleString()} / 12,000 characters</span>
                <button className="button button-dark" disabled={saving} type="submit">
                  {saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}
                  {saving ? "Saving..." : selectedSite ? "Save changes" : "Create website"}
                </button>
              </div>
            </form>

            {selectedSite && (
              <div className="embed-panel">
                <div className="embed-title"><div className="feature-icon"><Code2 size={17} /></div><div><h3>Bring your assistant to your site</h3><p>Paste this snippet just before the closing <code>&lt;/body&gt;</code> tag.</p></div></div>
                <div className="code-snippet"><code>&lt;script async src=&quot;{appOrigin}/widget.js&quot; data-site-id=&quot;{selectedSite.siteId}&quot;&gt;&lt;/script&gt;</code><button className="copy-button" onClick={() => void copyEmbedCode()} type="button" aria-label="Copy embed snippet">{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
                <div className="embed-footnote"><ArrowDownToLine size={14} /> Your domain must match the one saved above for the widget to respond.</div>
              </div>
            )}
          </section>
        ) : sites.length === 0 ? (
          <section className="empty-state">
            <div className="empty-icon"><Globe2 size={24} /></div>
            <div className="eyebrow">NOTHING HERE JUST YET</div>
            <h2>Your first website is a few clicks away.</h2>
            <p>Add your site, teach your assistant what to know, then copy your install snippet.</p>
            <button className="button button-dark" onClick={() => setShowForm(true)} type="button">Add your first website <ArrowRight size={15} /></button>
          </section>
        ) : (
          <section className="dashboard-content">
            <div className="website-toolbar">
              <label className="website-select-label">
                <span>WEBSITE</span>
                <select value={selectedId} onChange={(event) => {
                  const site = sites.find((item) => item.siteId === event.target.value);
                  setSelectedId(event.target.value);
                  if (site) setForm(siteToForm(site));
                }}>
                  {sites.map((site) => <option key={site.siteId} value={site.siteId}>{site.name} · {site.domain}</option>)}
                </select>
              </label>
              {selectedSite && <span className="live-badge"><span className="tiny-dot" /> Assistant ready</span>}
            </div>

            {selectedSite && (
              <>
                <div className="site-overview">
                  <div className="overview-copy"><div className="eyebrow">YOUR SUPPORT SPACE</div><h2>{selectedSite.name}</h2><p><Globe2 size={14} /> {selectedSite.domain}</p></div>
                  <div className="overview-actions">
                    <button className="button button-outline" onClick={() => setShowForm(true)} type="button"><Settings2 size={15} /> Edit settings</button>
                    <button className="button button-dark" onClick={() => void copyEmbedCode()} type="button">{copied ? <Check size={15} /> : <Code2 size={15} />}{copied ? "Copied!" : "Get embed code"}</button>
                  </div>
                </div>
                <div className="dashboard-stats">
                  <article><span className="stat-icon"><MessageCircle size={17} /></span><small>CONVERSATIONS</small><strong>Ready for your first</strong><p>Conversation insights are coming soon.</p></article>
                  <article><span className="stat-icon"><Sparkles size={17} /></span><small>ASSISTANT</small><strong>{selectedSite.assistantName}</strong><p>{selectedSite.knowledgeBase ? "Business knowledge added" : "Add business knowledge to get started"}</p></article>
                  <article><span className="stat-icon"><Code2 size={17} /></span><small>INSTALLATION</small><strong>One small snippet</strong><p>Install the widget on your website.</p><button className="inline-link" onClick={() => void copyEmbedCode()} type="button">{copied ? "Copied!" : "Copy install code"} <ArrowRight size={13} /></button></article>
                </div>
                <div className="getting-started"><div className="getting-icon"><Check size={16} /></div><div><strong>Your workspace is ready for its first conversation.</strong><p>Add your support notes and install the widget to welcome your visitors.</p></div><button className="icon-button" onClick={() => setShowForm(true)} type="button" aria-label="Open website settings"><ArrowRight size={16} /></button></div>
              </>
            )}
          </section>
        )}
        <footer className="dashboard-footer"><Link href="/"><ArrowLeft size={13} /> Back to orbit.support</Link><span>Made for more thoughtful support.</span></footer>
      </main>
    </div>
  );
}
