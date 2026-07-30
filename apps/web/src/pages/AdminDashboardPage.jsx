import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { FigmaAdminMetricGrid, FigmaAdminSection } from "../components/FigmaAdminSurface.jsx";
import { buildAdminDashboardRouteModel } from "./adminDashboardRouteModel.js";

export function AdminDashboardPage({ fixtures = launchFixtures }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [requestState, setRequestState] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setRequestState("loading");

    Promise.all([
      fetch("/api/admin/editorial", { credentials: "include", headers: { Accept: "application/json" } }),
      fetch("/api/admin/comments", { credentials: "include", headers: { Accept: "application/json" } }),
      fetch("/api/admin/contact-submissions", { credentials: "include", headers: { Accept: "application/json" } })
    ])
      .then(async (responses) => {
        if (responses.some((response) => !response.ok)) throw new Error("Unable to load dashboard");
        return Promise.all(responses.map((response) => response.json()));
      })
      .then(([editorial, comments, contactSubmissions]) => {
        if (!active) return;
        setDashboardData({
          ...editorial,
          comments: Array.isArray(comments.items) ? comments.items : [],
          contactSubmissions: Array.isArray(contactSubmissions.items) ? contactSubmissions.items : []
        });
        setRequestState("ready");
      })
      .catch(() => {
        if (active) setRequestState("error");
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const liveFixtures = useMemo(
    () => ({ ...fixtures, ...(dashboardData || {}) }),
    [fixtures, dashboardData]
  );
  const model = buildAdminDashboardRouteModel(liveFixtures);
  const { hero, sections } = model;

  return (
    <section className="figma-admin-page figma-admin-dashboard-page" data-workspace="stitch-dashboard-workspace" data-page="admin-dashboard" data-design-reference="admin-dashboard-v4" data-route={model.route.path} data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile} data-auth-required={model.auth.role}>
      <header className="admin-compact-intro" data-section="admin-dashboard-intro">
        <div>
          <h1>{hero.title}</h1>
          <p>{hero.dek}</p>
        </div>
        <p className="admin-workspace-status" data-state={requestState}>
          <span aria-hidden="true" />
          {requestState === "loading" ? "Refreshing" : requestState === "error" ? "Needs refresh" : "Workspace online"}
        </p>
      </header>

      {requestState === "error" ? (
        <div className="admin-inline-alert" role="alert">
          <p>Live dashboard totals could not be refreshed.</p>
          <button className="admin-secondary-action" type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <RefreshCw size={17} aria-hidden="true" /> Try again
          </button>
        </div>
      ) : null}

      <FigmaAdminSection className="stitch-dashboard-metrics" data-section="dashboard-stats">
        <FigmaAdminMetricGrid heading={sections.stats.heading} items={sections.stats.items} />
      </FigmaAdminSection>

      <section className="figma-admin-action-grid admin-quick-actions" data-stitch-panel="stitch-quick-actions" data-section="quick-actions">
        <div className="stitch-panel-heading">
          <div><p className="eyebrow">Start here</p><h2>{sections.quickActions.heading}</h2></div>
        </div>
        <div className="admin-quick-actions__grid">
          {sections.quickActions.items.map((action) => (
            <Link key={action.href} className="quick-action-card" to={action.href}>
              <div><h3>{action.label}</h3><p>{action.body}</p></div>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="figma-admin-table-panel admin-recent-activity" data-stitch-panel="stitch-activity-panel" data-section="recent-activity">
          <div className="stitch-panel-heading">
            <div><p className="eyebrow">Needs attention</p><h2>{sections.recentActivity.heading}</h2></div>
            <Clock3 size={24} aria-hidden="true" />
          </div>
          {sections.recentActivity.items.length > 0 ? <div className="activity-table" role="table" aria-label="Recent admin activity">
            <div role="row" className="table-header">
              {sections.recentActivity.columns.map((column) => <span key={column} data-column={column} role="columnheader">{column}</span>)}
            </div>
            {sections.recentActivity.items.map((item) => (
              <div key={item.status + "-" + item.item} role="row" className="activity-row" data-status={item.status}>
                <span role="cell">{item.actor}</span>
                <span role="cell">{item.item}</span>
                <span role="cell"><i aria-hidden="true" />{item.status}</span>
                <span role="cell">{item.timestamp}</span>
                <Link role="cell" to={item.href} aria-label={item.nextAction + ": " + item.item}><ArrowUpRight aria-hidden="true" /></Link>
              </div>
            ))}
          </div> : <p className="admin-empty-state">Nothing needs attention right now.</p>}
      </section>
    </section>
  );
}
