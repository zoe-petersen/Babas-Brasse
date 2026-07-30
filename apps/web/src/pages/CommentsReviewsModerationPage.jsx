import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { buildCommentsReviewsModerationRouteModel } from "./commentsReviewsModerationRouteModel.js";

function friendlyStatus(status) {
  if (status === "approved") return "Published";
  if (status === "rejected") return "Denied";
  return "Needs review";
}

export function CommentsReviewsModerationPage({ fixtures = launchFixtures }) {
  const location = useLocation();
  const initialStatus = new URLSearchParams(location.search).get("status");
  const [comments, setComments] = useState(null);
  const [requestState, setRequestState] = useState("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    ["pending", "approved", "rejected"].includes(initialStatus) ? initialStatus : "all"
  );
  const [articleFilter, setArticleFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/comments", {
      credentials: "include",
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load comments");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setComments(Array.isArray(payload.items) ? payload.items : []);
        setRequestState("ready");
      })
      .catch(() => {
        if (active) setRequestState("error");
      });
    return () => { active = false; };
  }, []);

  const liveFixtures = useMemo(() => ({
    ...fixtures,
    comments: (comments || []).map((comment) => ({
      ...comment,
      articleId: fixtures.articles.find((article) => article.slug === comment.articleSlug)?.id
        || comment.articleId
        || comment.articleSlug
    }))
  }), [comments, fixtures]);
  const model = buildCommentsReviewsModerationRouteModel(liveFixtures);
  const { hero, sections } = model;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredItems = sections.workspace.items.filter((item) => {
    const matchesSearch = !normalizedSearch || [item.author, item.articleTitle, item.category, item.body]
      .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesArticle = articleFilter === "all" || item.articleSlug === articleFilter;
    const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesArticle && matchesCategory;
  });

  async function updateStatus(item, status) {
    setRequestState("saving");
    setStatusMessage("");
    try {
      const response = await fetch(`/api/admin/comments/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Unable to update comment");
      const updated = await response.json();
      setComments((items) => items.map((comment) => comment.id === updated.id ? updated : comment));
      setRequestState("ready");
      setStatusMessage(
        status === "approved"
          ? "Comment published to the article."
          : status === "rejected" ? "Comment denied and kept off the website." : "Comment returned to review."
      );
    } catch {
      setRequestState("error");
      setStatusMessage("The moderation decision could not be saved. Try again.");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setArticleFilter("all");
    setCategoryFilter("all");
  }

  return (
    <section
      className="figma-admin-page figma-comments-reviews-moderation-page admin-minimal-page"
      data-page="comments-reviews-moderation"
      data-route={model.route.path}
      data-auth-required={model.auth.role}
      data-workspace="stitch-dashboard-workspace"
    >
      <header className="admin-page-heading" data-section="moderation-intro">
        <div><h1>{hero.title}</h1><p>{hero.dek}</p></div>
      </header>

      <section className="figma-admin-section admin-summary-strip" data-section="moderation-stats" data-stitch-panel="stitch-moderation-summary" data-pending-count={model.nav.pendingCount}>
        <h2 className="sr-only">{sections.stats.heading}</h2>
        {sections.stats.items.map((metric) => <article key={metric.key} className="metric figma-admin-metric" data-metric={metric.key}><p>{metric.label}</p><strong>{metric.value}</strong></article>)}
      </section>

      <section className="figma-admin-toolbar admin-filter-toolbar admin-filter-bar" data-section="moderation-filters" data-stitch-panel="stitch-moderation-toolbar">
        <h2 className="sr-only">Filter comments</h2>
        <label className="admin-search-field"><span>Search comments</span><input name={sections.queues.search.name} type="search" placeholder={sections.queues.search.placeholder} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label>
        <label><span>Review status</span><select name="moderation-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All comments</option><option value="pending">Needs review</option><option value="approved">Published</option><option value="rejected">Denied</option></select></label>
        <label><span>Article</span><select name="moderation-article" value={articleFilter} onChange={(event) => setArticleFilter(event.target.value)}><option value="all">Every article</option>{fixtures.articles.filter((article) => article.status === "published").map((article) => <option key={article.id} value={article.slug}>{article.title}</option>)}</select></label>
        <label><span>Magazine section</span><select name="moderation-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Every section</option>{fixtures.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
        <button type="button" className="admin-secondary-action" onClick={clearFilters}>Reset</button>
      </section>

      <p className="public-form-status admin-request-status" data-form-status={requestState} aria-live="polite">
        {requestState === "loading" ? "Loading comments..." : requestState === "saving" ? "Saving decision..." : requestState === "error" ? statusMessage || "Comments could not be loaded. Try again." : statusMessage}
      </p>

      <section className="figma-admin-table-panel admin-data-panel" data-section="moderation-workspace" data-stitch-panel="stitch-moderation-table">
        <div className="admin-panel-heading">
          <div><h2>{sections.workspace.heading}</h2><p>{filteredItems.length} comment{filteredItems.length === 1 ? "" : "s"} shown</p></div>
        </div>
        {requestState === "ready" && filteredItems.length === 0 ? <p className="admin-empty-state">No comments match these filters.</p> : null}
        <div className="admin-table-scroll">
          <div className="moderation-table admin-data-table" role="table" aria-label="Comments moderation queue">
            <div role="row" className="table-header">{sections.workspace.columns.map((column) => <span key={column} role="columnheader">{column}</span>)}</div>
            {filteredItems.map((item) => (
              <div key={item.id} role="row" className="moderation-row" data-item-id={item.id} data-status={item.status}>
                <span role="cell" data-label="Category">{item.category}</span>
                <span role="cell" data-label="Name"><strong>{item.author}</strong><small>{item.date}</small></span>
                <span role="cell" data-label="Article"><strong>{item.articleTitle}</strong><a href={item.articleHref} target="_blank" rel="noreferrer">View article <ExternalLink aria-hidden="true" /></a></span>
                <span role="cell" data-label="Status"><span className="admin-status-pill" data-status={item.status}>{friendlyStatus(item.status)}</span></span>
                <span role="cell" data-label="Comment" className="moderation-comment">{item.body}</span>
                <span role="cell" data-label="Actions" className="row-actions moderation-row-actions">
                  {item.status !== "approved" ? <button type="button" className="admin-table-icon-action" aria-label={`Publish comment by ${item.author}`} title="Publish comment" disabled={requestState === "saving"} onClick={() => updateStatus(item, "approved")}><Check aria-hidden="true" /><span className="sr-only">Publish</span></button> : null}
                  {item.status !== "rejected" ? <button type="button" className="danger-button admin-table-icon-action" aria-label={`Deny comment by ${item.author}`} title="Deny comment" disabled={requestState === "saving"} onClick={() => updateStatus(item, "rejected")}><X aria-hidden="true" /><span className="sr-only">Deny</span></button> : null}
                  {item.status !== "pending" ? <button type="button" className="admin-secondary-action admin-table-icon-action" aria-label={`Return comment by ${item.author} to review`} title="Review again" disabled={requestState === "saving"} onClick={() => updateStatus(item, "pending")}><RotateCcw aria-hidden="true" /><span className="sr-only">Review again</span></button> : null}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </section>
  );
}
