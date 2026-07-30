import { getRouteByPath } from "../routes.js";

function getArticleContext(fixtures, articleId) {
  const article = fixtures.articles.find((item) => item.id === articleId || item.slug === articleId);
  const category = article
    ? fixtures.categories.find((item) => item.id === article.categoryId || item.slug === article.categoryId)
    : null;
  return article ? {
    title: article.title,
    slug: article.slug,
    href: `/visceral-mag/${article.slug}`,
    category: category?.label || "Uncategorised",
    categoryId: category?.id || article.categoryId || ""
  } : {
    title: "Unknown article",
    slug: "",
    href: "/admin/articles",
    category: "Uncategorised",
    categoryId: ""
  };
}

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function getModerationItems(fixtures) {
  return fixtures.comments.map((comment) => {
    const article = getArticleContext(fixtures, comment.articleId || comment.articleSlug);
    return {
      id: comment.id,
      author: comment.name,
      body: comment.body,
      status: comment.status,
      articleTitle: article.title,
      articleSlug: article.slug,
      articleHref: article.href,
      category: article.category,
      categoryId: article.categoryId,
      date: formatDate(comment.createdAt)
    };
  });
}

export function getModerationStats(fixtures) {
  const items = getModerationItems(fixtures);
  return {
    totalItems: items.length,
    pendingItems: items.filter((item) => item.status === "pending").length,
    approvedItems: items.filter((item) => item.status === "approved").length,
    rejectedItems: items.filter((item) => item.status === "rejected").length
  };
}

function metricItems(stats) {
  return [
    { key: "totalItems", label: "All comments", value: stats.totalItems },
    { key: "pendingItems", label: "Needs review", value: stats.pendingItems },
    { key: "approvedItems", label: "Published", value: stats.approvedItems },
    { key: "rejectedItems", label: "Denied", value: stats.rejectedItems }
  ];
}

export function buildCommentsReviewsModerationRouteModel(fixtures) {
  const route = getRouteByPath("/admin/moderation");
  const items = getModerationItems(fixtures);
  const stats = getModerationStats(fixtures);
  return {
    pageId: "comments-reviews-moderation",
    generatedFrom: "comments-reviews-moderation-route-model",
    route: { id: route.id, label: route.label, path: route.path, prototypeFile: route.prototypeFile },
    auth: { required: route.authRequired === true, role: "admin", loginHref: "/admin/login" },
    nav: { pendingCount: stats.pendingItems },
    hero: {
      title: "Comment moderation",
      dek: "Check every reader comment before it appears on the website."
    },
    sections: {
      stats: { heading: "Comment overview", items: metricItems(stats) },
      queues: {
        search: {
          name: "moderation-search",
          placeholder: "Search name, article, category, or comment"
        }
      },
      workspace: {
        heading: "Comments",
        columns: ["category", "name", "article", "status", "comment", "actions"],
        items
      }
    }
  };
}
