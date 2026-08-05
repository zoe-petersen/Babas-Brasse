import { useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Link2, MessageCircle, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { submitPublicForm } from "../forms/publicFormClient.js";
import { buildArticleDetailRouteModel } from "./articleDetailRouteModel.js";

function formatArticleDate(value) {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function initials(value) {
  return String(value || "Babas & Brasse").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

const commentMessages = {
  idle: "",
  validation: "Add your name, email, and comment before submitting.",
  submitting: "Submitting your comment...",
  success: "Your comment was submitted for moderation.",
  error: "We couldn't submit your comment. Your text is still here, so you can try again."
};

export function ArticleDetailPage({ fixtures = launchFixtures, slug = "send-a-text-before-you-knock" }) {
  const model = buildArticleDetailRouteModel(fixtures, slug);
  const [commentStatus, setCommentStatus] = useState("idle");
  const [shareStatus, setShareStatus] = useState("idle");

  if (model.state === "not-found") {
    return (
      <section className="figma-public-page figma-article-detail article-not-found" data-page="article-detail" data-generated={model.generatedFrom} data-state="not-found" data-slug={model.slug}>
        <p>Magazine archive</p>
        <h1>Article unavailable</h1>
        <span>This article is not published or does not exist.</span>
        <Link to={model.backHref}><ArrowLeft size={18} aria-hidden="true" /> Back to Visceral Mag</Link>
      </section>
    );
  }

  const { article } = model;

  async function handleCommentSubmit(event) {
    event.preventDefault();
    const commentForm = event.currentTarget;
    const payload = Object.fromEntries(new FormData(commentForm).entries());
    const name = payload.name?.trim();
    const email = payload.email?.trim();
    const body = payload.body?.trim();

    if (!name || !email || !body) {
      setCommentStatus("validation");
      return;
    }

    setCommentStatus("submitting");
    try {
      await submitPublicForm("comment", {
        articleId: article.id,
        articleSlug: article.slug,
        name,
        body
      });
      commentForm.reset();
      setCommentStatus("success");
    } catch {
      setCommentStatus("error");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  }

  return (
    <article className="figma-article-detail article-reader-page" data-page="article-detail" data-design-reference="article-detail-v4" data-generated={model.generatedFrom} data-slug={article.slug} data-prototype-file={model.route.prototypeFile}>
      <nav className="article-reader-breadcrumb" aria-label="Article breadcrumb">
        <Link to="/visceral-mag"><ArrowLeft size={17} aria-hidden="true" /> Visceral Mag</Link>
        <span aria-hidden="true">/</span>
        <Link to={article.category.href}>{article.category.label}</Link>
      </nav>

      <header data-section="article-hero" className="figma-article-hero article-reader-hero">
        <div className="article-reader-hero__copy">
          <h1>{article.title}</h1>
          <p>{article.dek}</p>
        </div>
        <div className="article-reader-hero__footer">
          <div className="article-reader-byline">
            <Link to={article.author.href}>
              {article.author.image?.url
                ? <img src={article.author.image.url} alt="" />
                : <span aria-hidden="true">{initials(article.author.name)}</span>}
              <span><small>Written by</small><strong>{article.author.name}</strong></span>
            </Link>
          </div>
          <section data-section="article-meta" className="figma-article-meta article-reader-meta" aria-label="Article details">
            <Link data-category={article.category.slug} to={article.category.href}><Tag size={15} aria-hidden="true" /> {article.category.label}</Link>
            <time dateTime={article.publishedAt}><CalendarDays size={15} aria-hidden="true" /> {formatArticleDate(article.publishedAt)}</time>
            <span><Clock3 size={15} aria-hidden="true" /> {article.readingMinutes} min read</span>
            <a href="#article-comments"><MessageCircle size={15} aria-hidden="true" /> {model.comments.length} {model.comments.length === 1 ? "comment" : "comments"}</a>
          </section>
        </div>
      </header>

      {article.featuredImage ? (
        <figure className="article-hero-image article-reader-media">
          {article.featuredImage.type === "video"
            ? <video src={article.featuredImage.url} controls preload="metadata">Your browser does not support video playback.</video>
            : <img src={article.featuredImage.url} alt={article.featuredImage.altText || article.title} />}
          {article.featuredImage.credit ? <figcaption>{article.featuredImage.type === "video" ? "Video" : "Image"}: {article.featuredImage.credit}</figcaption> : null}
        </figure>
      ) : null}

      <div className="article-reading-layout">
        <section data-section="article-body" className="figma-article-body article-reader-body">
          {article.bodyBlocks.map((block, index) => <p key={`${index}-${block.slice(0, 24)}`} className={index === 0 ? "article-standfirst" : undefined}>{block}</p>)}
        </section>

        <aside className="article-reading-rail" aria-label="Article tools">
          <p>Reading</p>
          <span>{String(article.bodyBlocks.length).padStart(2, "0")} passages</span>
          <button type="button" onClick={handleCopyLink} data-share-status={shareStatus}>
            <Link2 size={17} aria-hidden="true" />
            {shareStatus === "copied" ? "Link copied" : shareStatus === "error" ? "Copy failed" : "Copy link"}
          </button>
          <a href="#article-comments"><MessageCircle size={17} aria-hidden="true" /> Discuss</a>
        </aside>
      </div>

      <footer data-section="article-author" className="article-author-credit article-reader-author">
        <div className="article-reader-author__identity">
          {article.author.image?.url
            ? <img src={article.author.image.url} alt="" />
            : <span className="article-reader-author__monogram" aria-hidden="true">{initials(article.author.name)}</span>}
          <div>
            <p>About the author</p>
            <h2>{article.author.name}</h2>
            {article.author.role ? <span>{article.author.role}</span> : null}
          </div>
        </div>
        <div className="article-reader-author__copy">
          {article.author.shortBio ? <p>{article.author.shortBio}</p> : <p>Explore more writing and creative work from this contributor.</p>}
          <Link to={article.author.href}>View contributor profile <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </footer>

      {model.relatedArticles.length > 0 ? (
        <section data-section="related-articles" className="figma-content-section article-related-section">
          <header className="article-section-heading">
            <div><h2>Keep reading</h2><p>More stories from across the magazine.</p></div>
            <Link to="/visceral-mag">All articles <ArrowRight size={18} aria-hidden="true" /></Link>
          </header>
          <div className="figma-related-grid article-related-grid">
            {model.relatedArticles.map((related, index) => (
              <article key={related.id} className="related-card article-related-card" data-related={related.slug}>
                {related.featuredImage ? (
                  <Link className="article-related-card__media" to={related.href} aria-label={`Read ${related.title}`}>
                    <img src={related.featuredImage.url} alt={related.featuredImage.altText || related.title} loading="lazy" />
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  </Link>
                ) : null}
                <div>
                  <p>{related.category.label}</p>
                  <h3><Link to={related.href}>{related.title}</Link></h3>
                  <span>{related.author.name} · {formatArticleDate(related.publishedAt)}</span>
                  <Link to={related.href}>Read story <ArrowRight size={17} aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="article-comments" data-section="comments" className="figma-conversation-section reader-section reader-section--comments article-comments-section" aria-labelledby="article-comments-heading">
        <header className="article-comments-heading">
          <div>
            <p>Reader conversation</p>
            <h2 id="article-comments-heading">Comments</h2>
          </div>
          <span>{String(model.comments.length).padStart(2, "0")} approved</span>
        </header>
        <div className="article-comments-layout">
          <div className="article-comments-list">
            {model.comments.map((comment) => (
              <article key={comment.id} className="comment" data-comment={comment.id}>
                <header><h3>{comment.name}</h3>{comment.createdAt ? <time dateTime={comment.createdAt}>{formatArticleDate(comment.createdAt)}</time> : <span>Reader comment</span>}</header>
                <p>{comment.body}</p>
              </article>
            ))}
            {model.comments.length === 0 ? (
              <div className="reader-empty-state">
                <MessageCircle size={26} aria-hidden="true" />
                <h3>Start the conversation</h3>
                <p>No approved comments yet. Share the first thoughtful response.</p>
              </div>
            ) : null}
          </div>

          <form className="public-comment-form reader-response-form" data-form-status={commentStatus} onSubmit={handleCommentSubmit} noValidate>
            <div className="article-comment-form__heading">
              <h3>Join the conversation</h3>
              <p>Responses are reviewed before appearing publicly.</p>
            </div>
            <p className="public-form-status" data-form-status={commentStatus} aria-live="polite">
              {commentMessages[commentStatus]}
            </p>
            <div className="article-comment-form__fields">
              <label htmlFor="comment-name">Name<input id="comment-name" name="name" type="text" autoComplete="name" required /></label>
              <label htmlFor="comment-email">Email<input id="comment-email" name="email" type="email" autoComplete="email" aria-describedby="comment-email-note" required /></label>
            </div>
            <p id="comment-email-note">Your email will never be displayed publicly.</p>
            <label htmlFor="comment-body">Comment<textarea id="comment-body" name="body" rows="6" placeholder="Share a thoughtful response..." required /></label>
            <button type="submit" disabled={commentStatus === "submitting"}>
              {commentStatus === "submitting" ? "Submitting..." : "Submit for review"} <ArrowRight size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section data-section="seo-metadata" hidden>
        <p data-seo="title">{model.seo.title}</p>
        <p data-seo="description">{model.seo.description}</p>
        <p data-seo="og-title">{model.seo.ogTitle}</p>
        <p data-seo="og-description">{model.seo.ogDescription}</p>
      </section>
    </article>
  );
}
