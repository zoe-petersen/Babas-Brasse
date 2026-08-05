import { getRouteByPath } from "../routes.js";

function getCategory(categories, categoryId) {
  return categories.find((category) => category.id === categoryId) || {
    label: categoryId,
    slug: categoryId
  };
}

function getAuthor(profiles, profileId) {
  return profiles.find((profile) => profile.id === profileId) || {
    name: "Babas & Brasse",
    slug: "babas-brasse"
  };
}

function relatedArticleSummary(article, fixtures) {
  const category = getCategory(fixtures.categories, article.categoryId);
  const author = getAuthor(fixtures.profiles, article.authorProfileId);

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    dek: article.dek,
    publishedAt: article.publishedAt,
    featuredImage: article.featuredImage || null,
    href: `/visceral-mag/${article.slug}`,
    category: {
      label: category.label,
      slug: category.slug
    },
    author: {
      name: author.name,
      slug: author.slug,
      href: `/people/${author.slug}`
    }
  };
}

function readingTime(bodyBlocks) {
  const wordCount = bodyBlocks.join(" ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

function authorImage(image) {
  return image?.url && !image.url.includes("profile-placeholder") ? image : null;
}

export function getArticleDetailRoute(articleOrSlug) {
  const slug = typeof articleOrSlug === "string" ? articleOrSlug : articleOrSlug?.slug;
  const normalizedSlug = String(slug || "").trim().replace(/^\/+|\/+$/g, "");
  return normalizedSlug ? `/visceral-mag/${encodeURIComponent(normalizedSlug)}` : "";
}

function notFoundModel(route, slug) {
  return {
    pageId: "article-detail",
    generatedFrom: "article-detail-route-model",
    state: "not-found",
    slug,
    backHref: "/visceral-mag",
    article: null,
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    relatedArticles: [],
    comments: [],
    seo: null
  };
}

export function buildArticleDetailRouteModel(fixtures, slug = "send-a-text-before-you-knock") {
  const route = getRouteByPath("/visceral-mag/:slug");
  const article = fixtures.articles.find((item) => item.slug === slug);

  if (!article || article.status !== "published") {
    return notFoundModel(route, slug);
  }

  const category = getCategory(fixtures.categories, article.categoryId);
  const author = getAuthor(fixtures.profiles, article.authorProfileId);

  return {
    pageId: "article-detail",
    generatedFrom: "article-detail-route-model",
    state: "published",
    slug: article.slug,
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    article: {
      id: article.id,
      title: article.title,
      slug: article.slug,
      href: `/visceral-mag/${article.slug}`,
      dek: article.dek,
      publishedAt: article.publishedAt,
      readingMinutes: readingTime(article.bodyBlocks || []),
      featuredImage: article.featuredImage || null,
      bodyBlocks: [...(article.bodyBlocks || [])],
      category: {
        id: article.categoryId,
        label: category.label,
        slug: category.slug,
        href: `/search?category=${category.slug}`
      },
      author: {
        id: article.authorProfileId,
        name: author.name,
        role: author.role,
        shortBio: author.shortBio,
        slug: author.slug,
        href: `/people/${author.slug}`,
        image: authorImage(author.image)
      }
    },
    relatedArticles: fixtures.articles
      .filter((item) => item.status === "published" && item.slug !== article.slug)
      .filter((item) => item.categoryId === article.categoryId || item.featuredImage)
      .slice(0, 3)
      .map((item) => relatedArticleSummary(item, fixtures)),
    comments: fixtures.comments
      .filter((comment) => comment.articleId === article.id && comment.status === "approved")
      .map((comment) => ({ id: comment.id, name: comment.name, body: comment.body, createdAt: comment.createdAt || null })),
    seo: { ...article.seo }
  };
}
