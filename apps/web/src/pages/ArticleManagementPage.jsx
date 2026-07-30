import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, FilePlus2, Pencil, Send, Trash2, Upload, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { buildArticleManagementRouteModel } from "./articleManagementRouteModel.js";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value) {
  if (!value || value === "Not published") return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function emptyArticle(fixtures) {
  return {
    title: "",
    slug: "",
    dek: "",
    categoryId: fixtures.categories[0]?.id || "",
    authorProfileId: fixtures.profiles[0]?.id || "",
    featuredImageId: fixtures.mediaItems[0]?.id || "",
    altText: "",
    body: "",
    seoTitle: "",
    seoDescription: "",
    ogTitle: "",
    ogDescription: ""
  };
}

function articleValues(article, fixtures) {
  if (!article) return emptyArticle(fixtures);
  return {
    title: article.title || "",
    slug: article.slug || "",
    dek: article.dek || "",
    categoryId: article.categoryId || fixtures.categories[0]?.id || "",
    authorProfileId: article.authorProfileId || fixtures.profiles[0]?.id || "",
    featuredImageId: article.featuredImage?.id || fixtures.mediaItems[0]?.id || "",
    altText: article.featuredImage?.altText || "",
    body: article.bodyBlocks?.join("\n\n") || "",
    seoTitle: article.seo?.title || "",
    seoDescription: article.seo?.description || "",
    ogTitle: article.seo?.ogTitle || "",
    ogDescription: article.seo?.ogDescription || ""
  };
}

function MediaPreview({ source, type, alt }) {
  if (!source) return null;
  return (
    <div className="article-media-preview">
      {type === "video"
        ? <video src={source} controls preload="metadata">Your browser does not support video playback.</video>
        : <img src={source} alt={alt || "Article media preview"} />}
    </div>
  );
}

export function ArticleManagementPage({ fixtures = launchFixtures }) {
  const location = useLocation();
  const handledQuickAction = useRef("");
  const [editorial, setEditorial] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => emptyArticle(fixtures));
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [slugIsAutomatic, setSlugIsAutomatic] = useState(true);
  const [requestState, setRequestState] = useState("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [seoFilter, setSeoFilter] = useState("all");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/editorial", {
      credentials: "include",
      headers: { Accept: "application/json" }
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load editorial content");
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setEditorial(payload);
        setRequestState("ready");
      })
      .catch(() => {
        if (active) setRequestState("error");
      });
    return () => { active = false; };
  }, []);

  const liveFixtures = useMemo(
    () => editorial ? { ...fixtures, ...editorial } : fixtures,
    [editorial, fixtures]
  );
  const model = buildArticleManagementRouteModel(liveFixtures);
  const { hero, sections } = model;
  const selectedArticle = liveFixtures.articles.find((article) => article.id === selectedId) || null;
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredRows = sections.articleTable.items.filter((row) => {
    const matchesSearch = !normalizedSearch || [row.title, row.slug, row.author]
      .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || row.categoryId === categoryFilter;
    const matchesSeo = seoFilter === "all" || (seoFilter === "ready" ? row.seoReady : !row.seoReady);
    return matchesSearch && matchesStatus && matchesCategory && matchesSeo;
  });

  const selectedMedia = liveFixtures.mediaItems.find((item) => item.id === draft.featuredImageId)
    || selectedArticle?.featuredImage
    || null;
  const previewSource = uploadPreview || selectedMedia?.url || "";
  const previewType = uploadedFile?.type.startsWith("video/") ? "video" : selectedMedia?.type || "image";
  const mediaOptions = selectedArticle?.featuredImage
    && !liveFixtures.mediaItems.some((item) => item.id === selectedArticle.featuredImage.id)
    ? [selectedArticle.featuredImage, ...liveFixtures.mediaItems]
    : liveFixtures.mediaItems;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wantsNewArticle = params.get("new") === "1";
    const editReference = params.get("edit");
    if (handledQuickAction.current === location.search) return;

    if (wantsNewArticle) {
      handledQuickAction.current = location.search;
      setSelectedId(null);
      setDraft(emptyArticle(liveFixtures));
      setUploadedFile(null);
      setSlugIsAutomatic(true);
      setEditorOpen(true);
      return;
    }

    if (editReference) {
      const article = liveFixtures.articles.find(
        (item) => item.id === editReference || item.slug === editReference
      );
      if (!article) return;
      handledQuickAction.current = location.search;
      setSelectedId(article.id);
      setDraft(articleValues(article, liveFixtures));
      setUploadedFile(null);
      setSlugIsAutomatic(false);
      setEditorOpen(true);
    }
  }, [location.search, liveFixtures]);

  useEffect(() => {
    if (!editorOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setEditorOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editorOpen]);

  useEffect(() => () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
  }, [uploadPreview]);

  function mergeArticle(updated) {
    setEditorial((current) => ({
      ...current,
      articles: current.articles.some((item) => item.id === updated.id)
        ? current.articles.map((item) => item.id === updated.id ? updated : item)
        : [updated, ...current.articles]
    }));
  }

  function openEditor(article = null) {
    setSelectedId(article?.id || null);
    setDraft(articleValues(article, liveFixtures));
    setUploadedFile(null);
    setUploadPreview("");
    setSlugIsAutomatic(!article);
    setStatusMessage("");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setUploadedFile(null);
    setUploadPreview("");
  }

  function updateDraft(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function updateTitle(value) {
    setDraft((current) => ({
      ...current,
      title: value,
      slug: slugIsAutomatic ? slugify(value) : current.slug
    }));
  }

  function autoFillSeo() {
    const seoTitle = `${draft.title.trim()} | Babas & Brasse`.slice(0, 180);
    const seoDescription = draft.dek.trim().slice(0, 320);
    setDraft((current) => ({
      ...current,
      seoTitle,
      seoDescription,
      ogTitle: current.title.trim().slice(0, 180),
      ogDescription: seoDescription
    }));
  }

  function chooseUpload(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setUploadedFile(null);
      setUploadPreview("");
      return;
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      event.target.value = "";
      setStatusMessage("Choose an image or video file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      event.target.value = "";
      setStatusMessage("Media files must be 12 MB or smaller.");
      return;
    }
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
    setStatusMessage("");
  }

  async function uploadMedia(file) {
    const response = await fetch("/api/admin/uploads", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
        "X-Media-Title": encodeURIComponent(draft.title || file.name),
        "X-Alt-Text": encodeURIComponent(draft.altText || draft.title)
      },
      body: file
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "The media file could not be uploaded.");
    }
    return response.json();
  }

  async function saveArticle(event) {
    event.preventDefault();
    const action = event.nativeEvent.submitter?.dataset.action || "save";
    setRequestState("saving");
    setStatusMessage("");
    try {
      const uploadedMedia = uploadedFile ? await uploadMedia(uploadedFile) : null;
      const status = action === "publish"
        ? "published"
        : selectedArticle?.status === "published" ? "published" : "draft";
      const payload = {
        ...draft,
        id: selectedArticle?.id || draft.slug,
        slug: slugify(draft.slug),
        status,
        seoTitle: draft.seoTitle.trim() || `${draft.title.trim()} | Babas & Brasse`,
        seoDescription: draft.seoDescription.trim() || draft.dek.trim(),
        ogTitle: draft.ogTitle.trim() || draft.title.trim(),
        ogDescription: draft.ogDescription.trim() || draft.dek.trim()
      };
      if (uploadedMedia) {
        payload.featuredImage = {
          ...uploadedMedia,
          altText: draft.altText.trim() || draft.title.trim()
        };
        payload.featuredImageId = uploadedMedia.id;
      }
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Unable to save article");
      }
      const saved = await response.json();
      mergeArticle(saved);
      setRequestState("ready");
      setStatusMessage(saved.status === "published" ? "Article saved and published." : "Draft saved.");
      closeEditor();
    } catch (error) {
      setRequestState("error");
      setStatusMessage(error.message);
    }
  }

  async function updateStatus(article, status) {
    setRequestState("saving");
    setStatusMessage("");
    try {
      const response = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Unable to update article");
      mergeArticle(await response.json());
      setRequestState("ready");
      setStatusMessage(status === "published" ? "Article published." : "Article unpublished and kept as a draft.");
    } catch {
      setRequestState("error");
      setStatusMessage("The article status could not be updated.");
    }
  }

  async function deleteArticle(article) {
    if (!window.confirm(`Delete "${article.title}" permanently? This cannot be undone.`)) return;
    setRequestState("saving");
    setStatusMessage("");
    try {
      const response = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Unable to delete article");
      setEditorial((current) => ({
        ...current,
        articles: current.articles.filter((item) => item.id !== article.id)
      }));
      if (selectedId === article.id) closeEditor();
      setRequestState("ready");
      setStatusMessage("Article permanently deleted.");
    } catch {
      setRequestState("error");
      setStatusMessage("The article could not be deleted.");
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSeoFilter("all");
  }

  return (
    <section
      className="figma-admin-page figma-article-management-page admin-minimal-page"
      data-page="article-management"
      data-design-reference="admin-editor-v4"
      data-route={model.route.path}
      data-generated={model.generatedFrom}
      data-prototype-file={model.route.prototypeFile}
      data-auth-required={model.auth.role}
      data-workspace="stitch-dashboard-workspace"
    >
      <header className="admin-page-heading" data-section="article-management-intro">
        <div><h1>{hero.title}</h1><p>{hero.dek}</p></div>
        <button type="button" className="admin-primary-action" onClick={() => openEditor()}>
          <FilePlus2 aria-hidden="true" />
          New article
        </button>
      </header>

      <section className="figma-admin-toolbar admin-filter-toolbar admin-filter-bar" data-section="article-toolbar" data-stitch-panel="stitch-article-toolbar">
        <h2 className="sr-only">{sections.toolbar.heading}</h2>
        <label className="admin-search-field">
          <span>{sections.toolbar.search.label}</span>
          <input name={sections.toolbar.search.name} type="search" placeholder={sections.toolbar.search.placeholder} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
        </label>
        <label><span>Publishing status</span><select name="article-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All articles</option><option value="draft">Drafts only</option><option value="published">Published only</option></select></label>
        <label><span>Magazine section</span><select name="article-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All sections</option>{liveFixtures.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
        <label><span>SEO status</span><select name="article-seo-readiness" value={seoFilter} onChange={(event) => setSeoFilter(event.target.value)}><option value="all">Any SEO status</option><option value="ready">SEO ready</option><option value="needs-work">Needs SEO</option></select></label>
        <button type="button" className="admin-secondary-action" onClick={clearFilters}>Reset</button>
        <div className="article-metrics admin-inline-metrics" aria-label="Article publishing metrics">
          {sections.toolbar.metrics.map((metric) => <article key={metric.key} className="metric figma-admin-metric" data-metric={metric.key} data-value={metric.value}><p>{metric.label}</p><strong>{metric.value}</strong></article>)}
        </div>
      </section>

      <p className="public-form-status admin-request-status" data-form-status={requestState} aria-live="polite">
        {requestState === "loading" ? "Loading editorial content..." : requestState === "saving" ? "Saving changes..." : statusMessage}
      </p>

      <section className="figma-admin-table-panel admin-data-panel" data-section="article-table" data-stitch-panel="stitch-article-table">
        <div className="admin-panel-heading">
          <div><h2>{sections.articleTable.heading}</h2><p>{filteredRows.length} article{filteredRows.length === 1 ? "" : "s"}</p></div>
        </div>
        {requestState === "ready" && filteredRows.length === 0 ? <p className="admin-empty-state">No articles match these filters.</p> : null}
        <div className="admin-table-scroll">
          <div className="article-table admin-data-table" role="table" aria-label="Article management table">
            <div role="row" className="table-header">{sections.articleTable.columns.map((column) => <span key={column} role="columnheader">{column}</span>)}</div>
            {filteredRows.map((row) => {
              const article = liveFixtures.articles.find((item) => item.id === row.id);
              return (
                <div key={row.id} role="row" className="article-row" data-article-id={row.id} data-status={row.status}>
                  <span role="cell" data-label="Article"><strong>{row.title}</strong></span>
                  <span role="cell" data-label="Status"><span className="admin-status-pill" data-status={row.status}>{row.status}</span></span>
                  <span role="cell" data-label="Category">{row.category}</span>
                  <span role="cell" data-label="Author">{row.author}</span>
                  <span role="cell" data-label="Date">{formatDate(row.date)}</span>
                  <span role="cell" className="row-actions" data-label="Actions">
                    <button type="button" className="admin-secondary-action admin-table-icon-action" aria-label={`Edit ${row.title}`} title="Edit article" onClick={() => openEditor(article)}><Pencil aria-hidden="true" /><span className="sr-only">Edit</span></button>
                    <a className="admin-secondary-action admin-table-icon-action" href={row.previewHref} target="_blank" rel="noreferrer" aria-label={`View ${row.title}`} title="View article"><Eye aria-hidden="true" /><span className="sr-only">View</span></a>
                    <button type="button" className="admin-secondary-action admin-table-icon-action" aria-label={`${row.status === "published" ? "Unpublish" : "Publish"} ${row.title}`} title={row.status === "published" ? "Unpublish article" : "Publish article"} disabled={requestState === "saving"} onClick={() => updateStatus(article, row.status === "published" ? "draft" : "published")}>{row.status === "published" ? <EyeOff aria-hidden="true" /> : <Send aria-hidden="true" />}<span className="sr-only">{row.status === "published" ? "Unpublish" : "Publish"}</span></button>
                    <button type="button" className="danger-button admin-table-icon-action" aria-label={`Delete ${row.title}`} title="Delete article" disabled={requestState === "saving"} onClick={() => deleteArticle(article)}><Trash2 aria-hidden="true" /><span className="sr-only">Delete</span></button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="figma-admin-table-panel admin-data-panel admin-seo-panel" data-section="article-seo" data-stitch-panel="stitch-article-seo">
        <div className="admin-panel-heading">
          <div><h2>{sections.seo.heading}</h2><p>{sections.seo.body}</p></div>
        </div>
        <div className="admin-table-scroll">
          <div className="seo-table admin-data-table" role="table" aria-label="Article SEO overview">
            <div role="row" className="table-header">{sections.seo.columns.map((column) => <span key={column} role="columnheader">{column}</span>)}</div>
            {sections.seo.items.map((row) => {
              const article = liveFixtures.articles.find((item) => item.id === row.id);
              return (
                <div key={row.id} role="row" className="seo-row">
                  <span role="cell" data-label="Article"><strong>{row.title}</strong></span>
                  <span role="cell" data-label="SEO title">{row.seoTitle || "Auto-fill available"}</span>
                  <span role="cell" data-label="Description">{row.seoDescription || "Auto-fill available"}</span>
                  <span role="cell" data-label="Status"><span className="admin-status-pill" data-status={row.seoReady ? "ready" : "needs-work"}>{row.seoReady ? "Ready" : "Needs attention"}</span></span>
                  <span role="cell" data-label="Action"><button type="button" className="admin-secondary-action admin-table-icon-action" aria-label={`Edit SEO for ${row.title}`} title="Edit SEO" onClick={() => openEditor(article)}><Pencil aria-hidden="true" /><span className="sr-only">Edit SEO</span></button></span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {editorOpen ? (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
          <section className="admin-editor-modal" role="dialog" aria-modal="true" aria-labelledby="article-editor-title">
            <header className="admin-modal-header">
              <div><p className="eyebrow">{selectedArticle ? "Edit article" : "New article"}</p><h2 id="article-editor-title">{selectedArticle?.title || sections.editor.heading}</h2></div>
              <button type="button" className="admin-icon-button" onClick={closeEditor} aria-label="Close article editor"><X aria-hidden="true" /></button>
            </header>
            <form key={selectedArticle?.id || "new-article"} className="admin-article-form" onSubmit={saveArticle}>
              <fieldset>
                <legend>Article details</legend>
                <label className="admin-field-wide"><span>Title</span><input name="title" required value={draft.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Article title" /></label>
                <label><span>URL slug</span><input name="slug" required pattern="[a-z0-9-]+" value={draft.slug} onChange={(event) => { setSlugIsAutomatic(false); updateDraft("slug", slugify(event.target.value)); }} placeholder="article-url" /></label>
                <label><span>Magazine section</span><select name="categoryId" required value={draft.categoryId} onChange={(event) => updateDraft("categoryId", event.target.value)}>{liveFixtures.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
                <label><span>Author</span><select name="authorProfileId" required value={draft.authorProfileId} onChange={(event) => updateDraft("authorProfileId", event.target.value)}>{liveFixtures.profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
                <label className="admin-field-wide"><span>Description</span><textarea name="dek" required rows="3" value={draft.dek} onChange={(event) => updateDraft("dek", event.target.value)} placeholder="A short, clear introduction shown on article cards." /></label>
                <label className="admin-field-wide"><span>Article content</span><textarea name="body" required rows="14" value={draft.body} onChange={(event) => updateDraft("body", event.target.value)} placeholder="Write the full article here. Separate paragraphs with a blank line." /></label>
              </fieldset>

              <fieldset>
                <legend>Image or video</legend>
                <label><span>Choose existing media</span><select name="featuredImageId" required={!uploadedFile} value={draft.featuredImageId} onChange={(event) => updateDraft("featuredImageId", event.target.value)}>{mediaOptions.map((media) => <option key={media.id} value={media.id}>{media.title}</option>)}</select></label>
                <label className="admin-upload-field"><span>Upload a new image or video</span><input name="mediaFile" type="file" accept="image/*,video/mp4,video/webm" onChange={chooseUpload} /><small><Upload aria-hidden="true" /> JPG, PNG, WebP, GIF, MP4 or WebM. Maximum 12 MB.</small></label>
                <label className="admin-field-wide"><span>Accessible description</span><input name="altText" required value={draft.altText} onChange={(event) => updateDraft("altText", event.target.value)} placeholder="Describe what is shown in the media." /></label>
                <MediaPreview source={previewSource} type={previewType} alt={draft.altText} />
              </fieldset>

              <fieldset className="admin-seo-fields">
                <div className="admin-fieldset-heading"><legend>Search and sharing</legend><button type="button" onClick={autoFillSeo}>Auto-fill from article</button></div>
                <label><span>SEO title</span><input id="article-seo-title" name="seoTitle" value={draft.seoTitle} onChange={(event) => updateDraft("seoTitle", event.target.value)} placeholder="Automatically uses the article title" /></label>
                <label className="admin-field-wide"><span>SEO description</span><textarea name="seoDescription" rows="3" value={draft.seoDescription} onChange={(event) => updateDraft("seoDescription", event.target.value)} placeholder="Automatically uses the article description" /></label>
                <label><span>Social title</span><input name="ogTitle" value={draft.ogTitle} onChange={(event) => updateDraft("ogTitle", event.target.value)} placeholder="Optional" /></label>
                <label><span>Social description</span><textarea name="ogDescription" rows="3" value={draft.ogDescription} onChange={(event) => updateDraft("ogDescription", event.target.value)} placeholder="Optional" /></label>
              </fieldset>

              <footer className="admin-modal-actions">
                <button type="button" className="admin-secondary-action" onClick={closeEditor}>Cancel</button>
                <button type="submit" data-action="save" disabled={requestState === "saving"}>{selectedArticle?.status === "published" ? "Save changes" : "Save draft"}</button>
                <button type="submit" data-action="publish" disabled={requestState === "saving"}>Save and publish</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
