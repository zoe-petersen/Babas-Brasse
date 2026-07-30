import { getRouteByPath } from "../routes.js";

function findById(items, id) {
  return items.find((item) => item.id === id) || null;
}

function isSeoReady(article) {
  return Boolean(
    article.seo?.title
    && article.seo?.description
    && article.featuredImage?.altText
  );
}

export function getArticleRows(fixtures) {
  return fixtures.articles.map((article) => {
    const category = findById(fixtures.categories, article.categoryId);
    const author = findById(fixtures.profiles, article.authorProfileId);
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      status: article.status,
      category: category?.label || "Uncategorised",
      categoryId: article.categoryId,
      author: author?.name || "Unknown author",
      authorProfileId: article.authorProfileId,
      date: article.publishedAt || article.updatedAt || "Not published",
      seoReady: isSeoReady(article),
      seoTitle: article.seo?.title || "",
      seoDescription: article.seo?.description || "",
      previewHref: `/visceral-mag/${article.slug}`
    };
  });
}

export function getArticleManagementStats(fixtures) {
  const rows = getArticleRows(fixtures);
  return {
    totalArticles: rows.length,
    publishedArticles: rows.filter((row) => row.status === "published").length,
    draftArticles: rows.filter((row) => row.status === "draft").length,
    seoReadyArticles: rows.filter((row) => row.seoReady).length
  };
}

function metricItems(stats) {
  return [
    { key: "totalArticles", label: "All articles", value: stats.totalArticles },
    { key: "publishedArticles", label: "Published", value: stats.publishedArticles },
    { key: "draftArticles", label: "Drafts", value: stats.draftArticles },
    { key: "seoReadyArticles", label: "SEO ready", value: stats.seoReadyArticles }
  ];
}

export function buildArticleManagementRouteModel(fixtures) {
  const route = getRouteByPath("/admin/articles");
  const rows = getArticleRows(fixtures);
  const stats = getArticleManagementStats(fixtures);
  return {
    pageId: "article-management",
    generatedFrom: "article-management-route-model",
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    auth: {
      required: route.authRequired === true,
      role: "admin",
      loginHref: "/admin/login"
    },
    hero: {
      title: "Articles",
      dek: "Create, edit, publish, unpublish, and permanently delete magazine content."
    },
    sections: {
      toolbar: {
        heading: "Find an article",
        search: {
          name: "article-search",
          label: "Search",
          placeholder: "Search title, slug, or author"
        },
        metrics: metricItems(stats)
      },
      articleTable: {
        heading: "Editorial content",
        columns: ["article", "status", "category", "author", "date", "actions"],
        items: rows
      },
      editor: {
        heading: "Create article"
      },
      seo: {
        heading: "SEO overview",
        body: "SEO fields are auto-filled from the article title and description, and can be refined at any time.",
        columns: ["article", "SEO title", "description", "status", "action"],
        items: rows
      }
    }
  };
}
