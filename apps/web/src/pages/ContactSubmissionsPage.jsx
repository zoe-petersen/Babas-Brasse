import { useEffect, useMemo, useState } from "react";
import { Check, Mail, RotateCcw, Search, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { FigmaAdminMetricGrid, FigmaAdminSection } from "../components/FigmaAdminSurface.jsx";
import { buildContactSubmissionsRouteModel } from "./contactSubmissionsRouteModel.js";

const STATUS_OPTIONS = [
  { value: "all", label: "All requests" },
  { value: "new", label: "New" },
  { value: "read", label: "In progress" },
  { value: "archived", label: "Completed" }
];

export function ContactSubmissionsPage({ fixtures = launchFixtures }) {
  const location = useLocation();
  const initialStatus = new URLSearchParams(location.search).get("status");
  const [submissions, setSubmissions] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [requestState, setRequestState] = useState("loading");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    STATUS_OPTIONS.some((option) => option.value === initialStatus) ? initialStatus : "all"
  );

  useEffect(() => {
    let active = true;
    fetch("/api/admin/contact-submissions", {
      credentials: "include",
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load submissions");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setSubmissions(Array.isArray(payload.items) ? payload.items : []);
        setRequestState("ready");
      })
      .catch(() => {
        if (active) setRequestState("error");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedId(null);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedId]);

  const liveFixtures = useMemo(
    () => ({ ...fixtures, contactSubmissions: submissions || [] }),
    [fixtures, submissions]
  );
  const model = buildContactSubmissionsRouteModel(liveFixtures);
  const { hero, sections } = model;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredItems = sections.inbox.items.filter((item) => {
    const matchesSearch = !normalizedSearch
      || [item.sender, item.email, item.subject, item.message]
        .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const selected = sections.inbox.items.find((item) => item.id === selectedId) || null;

  async function updateStatus(status) {
    if (!selected) return;
    setRequestState("saving");
    try {
      const response = await fetch(`/api/admin/contact-submissions/${encodeURIComponent(selected.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Unable to update submission");
      const updated = await response.json();
      setSubmissions((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSelectedId(null);
      setRequestState("ready");
    } catch {
      setRequestState("error");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
  }

  return (
    <section
      className="figma-admin-page admin-minimal-page figma-contact-submissions-page"
      data-page="contact-submissions"
      data-route={model.route.path}
      data-auth-required={model.auth.role}
      data-workspace="stitch-dashboard-workspace"
    >
      <header className="admin-compact-intro" data-section="submissions-intro">
        <div>
          <h1>{hero.title}</h1>
          <p>{hero.dek}</p>
        </div>
        <p className="admin-workspace-status">
          <span aria-hidden="true" />
          {model.nav.newCount} new
        </p>
      </header>

      <FigmaAdminSection className="admin-inline-metrics" data-section="submissions-stats">
        <FigmaAdminMetricGrid heading={sections.stats.heading} items={sections.stats.items} />
      </FigmaAdminSection>

      <section className="admin-filter-bar" aria-label="Submission filters" data-stitch-panel="stitch-submissions-toolbar">
        <label className="admin-search-field">
          <span className="sr-only">Search contact requests</span>
          <Search size={18} aria-hidden="true" />
          <input
            name="submission-search"
            type="search"
            placeholder="Search by name, email, request type or message"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Status</span>
          <select
            name="submission-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button className="admin-secondary-action" type="button" onClick={clearFilters}>
          Clear filters
        </button>
      </section>

      <p className="public-form-status" data-form-status={requestState} aria-live="polite">
        {requestState === "loading"
          ? "Loading contact requests…"
          : requestState === "saving"
            ? "Saving progress…"
            : requestState === "error"
              ? "The requests could not be loaded or updated. Please try again."
              : `${filteredItems.length} request${filteredItems.length === 1 ? "" : "s"} shown.`}
      </p>

      <section className="admin-data-panel admin-submissions-panel" data-section="submissions-inbox" data-stitch-panel="stitch-submissions-table">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Inbox</p>
            <h2>{sections.inbox.heading}</h2>
          </div>
          <span>{filteredItems.length} shown</span>
        </div>

        {requestState === "ready" && filteredItems.length === 0
          ? <p className="admin-empty-state">No contact requests match these filters.</p>
          : null}

        <div className="admin-table-scroll">
          <div className="admin-data-table submissions-table" role="table" aria-label="Contact requests">
            <div role="row" className="table-header">
              {sections.inbox.columns.map((column) => (
                <span key={column} role="columnheader">{column}</span>
              ))}
            </div>
            {filteredItems.map((row) => (
              <div
                key={row.id}
                role="row"
                className="submission-row"
                data-submission-id={row.id}
                data-status={row.status}
              >
                <span role="cell" data-label="Name">
                  <strong>{row.sender}</strong>
                  <a href={`mailto:${row.email}`}>{row.email}</a>
                </span>
                <span role="cell" data-label="Request type">{row.subject}</span>
                <span className="admin-message-preview" role="cell" data-label="Message">{row.message}</span>
                <span role="cell" data-label="Status">
                  <span className="admin-status-pill" data-status={row.status}>{row.statusLabel}</span>
                </span>
                <span role="cell" data-label="Received">{row.receivedDate}</span>
                <span className="admin-row-actions" role="cell" data-label="Actions">
                  <button className="admin-secondary-action admin-table-icon-action" type="button" aria-label={`Review submission from ${row.name}`} title="Review submission" onClick={() => setSelectedId(row.id)}>
                    <Search aria-hidden="true" />
                    <span className="sr-only">Review</span>
                  </button>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {selected ? (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedId(null);
        }}>
          <article
            className="admin-editor-modal admin-submission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-dialog-title"
            data-selected-submission-id={selected.id}
          >
            <header className="admin-modal-header">
              <div>
                <p className="eyebrow">Contact request</p>
                <h2 id="submission-dialog-title">{selected.subject}</h2>
              </div>
              <button className="admin-icon-button" type="button" onClick={() => setSelectedId(null)} aria-label="Close request">
                <X aria-hidden="true" />
              </button>
            </header>

            <div className="admin-submission-detail">
              <dl>
                <div><dt>From</dt><dd>{selected.sender}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div>
                <div><dt>Received</dt><dd>{selected.receivedDate}</dd></div>
                <div><dt>Progress</dt><dd><span className="admin-status-pill" data-status={selected.status}>{selected.statusLabel}</span></dd></div>
              </dl>
              <div className="admin-submission-message">
                <h3>Message</h3>
                <p>{selected.message}</p>
              </div>
            </div>

            <footer className="admin-modal-actions">
              <a className="admin-secondary-action" href={selected.replyHref}>
                <Mail size={17} aria-hidden="true" /> Reply by email
              </a>
              {selected.status !== "new" ? (
                <button type="button" className="admin-secondary-action" disabled={requestState === "saving"} onClick={() => updateStatus("new")}>
                  <RotateCcw size={17} aria-hidden="true" /> Mark as new
                </button>
              ) : null}
              {selected.status !== "read" ? (
                <button type="button" className="admin-secondary-action" disabled={requestState === "saving"} onClick={() => updateStatus("read")}>
                  Start work
                </button>
              ) : null}
              {selected.status !== "archived" ? (
                <button type="button" className="admin-primary-action" disabled={requestState === "saving"} onClick={() => updateStatus("archived")}>
                  <Check size={17} aria-hidden="true" /> Mark complete
                </button>
              ) : null}
            </footer>
          </article>
        </div>
      ) : null}
    </section>
  );
}
