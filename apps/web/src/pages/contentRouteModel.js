import { getRouteByPath } from "../routes.js";

function publishedArticles(fixtures) {
  return (fixtures.articles || []).filter((article) => article.status === "published");
}

function getCategory(fixtures, categoryId) {
  return (fixtures.categories || []).find((category) => category.id === categoryId || category.slug === categoryId) || {
    id: categoryId,
    label: categoryId,
    slug: categoryId
  };
}

function getAuthor(fixtures, authorProfileId) {
  return (fixtures.profiles || []).find((profile) => profile.id === authorProfileId || profile.slug === authorProfileId) || null;
}

function articleSummary(fixtures, article) {
  const category = getCategory(fixtures, article.categoryId);
  const author = getAuthor(fixtures, article.authorProfileId);

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    dek: article.dek,
    status: article.status,
    publishedAt: article.publishedAt,
    href: `/visceral-mag/${article.slug}`,
    featuredImage: article.featuredImage || null,
    category: {
      id: category.id,
      label: category.label,
      slug: category.slug
    },
    author: author ? {
      id: author.id,
      name: author.name,
      slug: author.slug,
      href: `/people/${author.slug}`
    } : null
  };
}

function getCategoryArticles(fixtures, category) {
  return publishedArticles(fixtures)
    .filter((article) => article.categoryId === category.id || article.categoryId === category.slug)
    .map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      href: `/visceral-mag/${article.slug}`
    }));
}

function buildReadingPaths() {
  return [
    {
      id: "lived-perspective",
      number: "01",
      title: "Lived perspective",
      description: "Personal essays, arguments, and reflections that begin close to home.",
      href: "/search?category=opinion",
      linkLabel: "Read opinion"
    },
    {
      id: "stage-and-performance",
      number: "02",
      title: "Stage & performance",
      description: "Reviews and conversations from rehearsal rooms, theatres, and live work.",
      href: "/search?category=reviews&topic=theatre",
      linkLabel: "Explore theatre"
    },
    {
      id: "books-and-language",
      number: "03",
      title: "Books & language",
      description: "Writing on fiction, criticism, translation, and multilingual craft.",
      href: "/search?category=reviews&topic=books",
      linkLabel: "Browse literature"
    },
    {
      id: "creative-conversations",
      number: "04",
      title: "Creative conversations",
      description: "Meet the artists, writers, and cultural voices shaping what comes next.",
      href: "/search?category=interviews",
      linkLabel: "Read interviews"
    }
  ];
}

export function buildContentRouteModel(fixtures) {
  const route = getRouteByPath("/content");
  const published = publishedArticles(fixtures);
  const visualStories = published.filter((article) => article.featuredImage).map((article) => articleSummary(fixtures, article));
  const contributorCount = new Set(published.map((article) => article.authorProfileId).filter(Boolean)).size;
  const categories = (fixtures.categories || []).map((category) => {
    const articles = getCategoryArticles(fixtures, category);
    return {
      id: category.id,
      label: category.label,
      slug: category.slug,
      description: category.description,
      href: `/search?category=${category.slug}`,
      count: articles.length,
      articles: articles.slice(0, 3)
    };
  });

  return {
    pageId: "content",
    generatedFrom: "content-route-model",
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    hero: {
      eyebrow: "Content",
      title: "Find your next read.",
      dek: "Come for the story that catches your eye. Stay for bold essays, sharp reviews, intimate fiction, and the voices shaping South African culture.",
      featuredStory: visualStories[0] || null
    },
    stats: [
      { id: "published", value: published.length, label: "Published pieces" },
      { id: "sections", value: categories.length, label: "Magazine sections" },
      { id: "voices", value: contributorCount, label: "Contributing voices" }
    ],
    sections: {
      editorsShelf: {
        heading: "Start here",
        dek: "Three reads selected from across the magazine for your next quiet hour.",
        items: visualStories.slice(1, 4)
      },
      categories: categories.length > 0 ? {
        state: "ready",
        heading: "Magazine sections",
        items: categories
      } : {
        state: "empty",
        heading: "No sections are available yet",
        body: "Categories will appear here once editorial content is published.",
        items: []
      },
      readingPaths: {
        heading: "Choose a way in",
        dek: "Follow an idea, a form, or a feeling through the archive.",
        items: buildReadingPaths()
      },
      submission: {
        heading: "The next story could be yours.",
        body: "We welcome thoughtful writing, original creative work, and pitches rooted in South African life and culture.",
        primaryHref: "/contact",
        primaryLabel: "Submit your work",
        secondaryHref: "/contributors",
        secondaryLabel: "Meet the contributors"
      }
    }
  };
}
