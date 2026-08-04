import { getRouteByPath } from "../routes.js";

function publishedArticles(fixtures) {
  return fixtures.articles.filter((article) => article.status === "published");
}

function getCategory(fixtures, categoryId) {
  return fixtures.categories.find((category) => category.id === categoryId || category.slug === categoryId) || {
    id: categoryId,
    label: categoryId,
    slug: categoryId
  };
}

function getAuthor(fixtures, authorProfileId) {
  return fixtures.profiles.find((profile) => profile.id === authorProfileId || profile.slug === authorProfileId) || null;
}

function publicArticleSummary(fixtures, article) {
  const category = getCategory(fixtures, article.categoryId);
  const author = getAuthor(fixtures, article.authorProfileId);

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    dek: article.dek,
    status: article.status,
    categoryId: article.categoryId,
    publishedAt: article.publishedAt,
    href: `/visceral-mag/${article.slug}`,
    featuredImage: article.featuredImage,
    category: {
      id: category.id || article.categoryId,
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

function buildSectionShortcuts() {
  return [
    { id: "literature", label: "Literature", description: "Books, poetry, and the written word.", href: "/search?category=reviews&topic=books" },
    { id: "opinion", label: "Opinion", description: "Essays, arguments, and lived perspective.", href: "/search?category=opinion" },
    { id: "interviews", label: "Interviews", description: "Conversations with people making culture.", href: "/search?category=interviews" },
    { id: "theatre", label: "Theatre", description: "Stages, performances, and rehearsal rooms.", href: "/search?category=reviews&topic=theatre" },
    { id: "short-stories", label: "Short Stories", description: "Original fiction and literary experiments.", href: "/search?category=short-stories" },
    { id: "fashion", label: "Fashion", description: "Style, identity, and the people shaping both.", href: "/search?category=articles&topic=fashion" },
    { id: "music", label: "Music", description: "Sound, scenes, and artists worth hearing.", href: "/search?category=articles&topic=music" },
    { id: "art", label: "Art", description: "Visual culture, makers, and new ideas.", href: "/search?category=articles&topic=art" },
    { id: "articles", label: "Articles", description: "Dispatches from across the magazine.", href: "/search?category=articles" }
  ];
}

function buildContributorSpotlight(fixtures, article) {
  if (!article?.author?.id) return null;

  const profile = getAuthor(fixtures, article.author.id);
  if (!profile) return null;

  const publishedWorks = fixtures.articles.filter((item) => item.status === "published" && item.authorProfileId === profile.id);

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    shortBio: profile.shortBio,
    href: `/people/${profile.slug}`,
    image: profile.image || article.featuredImage || null,
    publishedCount: publishedWorks.length,
    latestWork: publishedWorks[0] ? publicArticleSummary(fixtures, publishedWorks[0]) : null
  };
}

function buildCarouselSlides() {
  return [
    {
      id: "cape-collage",
      image: "/media/carousel/babas-brasse-cape-collage-replacement.jpeg",
      alt: "Babas and Brasse collage banner with Table Mountain, Cape Town imagery, books, theatre masks, flowers, wildlife, and South African cultural symbols",
      eyebrow: "Babas & Brasse",
      title: "South African culture, cut loose.",
      description: "Original voices, visual culture, performance, books, and the people making the present tense.",
      href: "/visceral-mag",
      cta: "Read the magazine"
    },
    {
      id: "stage-collage",
      image: "/media/carousel/babas-brasse-stage-collage.webp",
      alt: "Cape Town performers, readers, and writers assembled in a vivid cut-paper theatre collage",
      eyebrow: "Performance / Publishing",
      title: "The stage is also a page.",
      description: "Enter the rehearsal rooms, independent presses, and shared spaces where new cultural language is built.",
      href: "/search?category=reviews&topic=theatre",
      cta: "Explore theatre"
    },
    {
      id: "city-collage",
      image: "/media/carousel/babas-brasse-city-collage.webp",
      alt: "Johannesburg musicians, a fashion maker, and a mural artist in an energetic night-time collage",
      eyebrow: "Music / Fashion / Art",
      title: "Made in the city after dark.",
      description: "A visual dispatch from the artists, musicians, and makers shaping contemporary Johannesburg.",
      href: "/featured",
      cta: "View featured media"
    }
  ];
}

function buildFeaturedMedia(fixtures, articles) {
  const heights = [640, 500, 720, 560, 680];
  return fixtures.mediaItems.filter((item) => item.type === "image").map((item, index) => {
    const article = articles.find((candidate) => candidate.featuredImage?.id === item.id);
    return {
      id: item.id,
      title: item.title,
      category: "Photography",
      thumbnail: item.url,
      alt: item.altText,
      description: item.caption,
      publishedAt: article?.publishedAt || "2026-07-14",
      href: `/media/${encodeURIComponent(item.id)}`,
      label: article ? "Article" : "Media",
      height: heights[index % heights.length]
    };
  });
}
function buildMoreFromMagazine(fixtures, articles) {
  if (articles.length >= 3) {
    return { heading: "From the Archive", items: articles.slice(0, 4) };
  }

  return {
    heading: "From the Archive",
    items: [
      ...fixtures.categories.map((category) => ({
        id: `category-${category.id}`,
        label: category.label,
        title: category.description,
        href: `/search?category=${category.slug}`
      })),
      ...fixtures.mediaItems.map((item) => ({
        id: `media-${item.id}`,
        label: "Featured / Media",
        title: item.title,
        href: "/featured"
      }))
    ].slice(0, 6)
  };
}

export function buildHomeRouteModel(fixtures) {
  const route = getRouteByPath("/");
  const articles = publishedArticles(fixtures).map((article) => publicArticleSummary(fixtures, article));
  const homeArticles = articles.filter((article) => article.id !== "send-a-text-before-you-knock");
  const leadStory = homeArticles[0] || null;
  const recentArticles = homeArticles.slice(0, 3);
  const recentIds = new Set(recentArticles.map((article) => article.id));
  const moreArticles = homeArticles.filter((article) => !recentIds.has(article.id));
  const editorsPick = moreArticles[0] || leadStory;
  const archiveArticles = moreArticles.filter((article) => article.id !== editorsPick?.id);

  return {
    pageId: "home",
    generatedFrom: "home-route-model",
    designSource: "figma-author-website-design",
    route: {
      id: route.id,
      label: route.label,
      path: route.path,
      prototypeFile: route.prototypeFile
    },
    hero: {
      eyebrow: "Babas & Brasse Online Magazine",
      title: "Culture, essays, reviews, interviews, photography, and artwork.",
      dek: "Launch-ready discovery hub for the July 31, 2026 MVP."
    },
    sections: {
      leadStory,
      featuredArticle: leadStory,
      carouselSlides: buildCarouselSlides(),
      featuredMedia: buildFeaturedMedia(fixtures, homeArticles),
      recentArticles,
      latestArticles: homeArticles.slice(0, 3),
      sectionShortcuts: buildSectionShortcuts(),
      editorsPick,
      contributorSpotlight: buildContributorSpotlight(fixtures, editorsPick),
      categoryAccess: fixtures.categories.map((category) => ({
        id: category.id,
        label: category.label,
        slug: category.slug,
        href: `/search?category=${category.slug}`
      })),
      mediaPreview: fixtures.mediaItems.slice(0, 3).map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        altText: item.altText,
        caption: item.caption,
        credit: item.credit
      })),
      peoplePreview: fixtures.profiles.slice(0, 4).map((profile) => ({
        id: profile.id,
        name: profile.name,
        role: profile.role,
        type: profile.type,
        slug: profile.slug
      })),
      moreFromMagazine: buildMoreFromMagazine(fixtures, archiveArticles)
    }
  };
}
