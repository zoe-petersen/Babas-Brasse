import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import * as launchFixtures from "../data/launchFixtures.js";
import { FigmaArticleCard } from "../components/FigmaArticleCard.jsx";
import { buildCategoriesSearchRouteModel } from "./categoriesSearchRouteModel.js";

const sectionCopy = {
  theatre: {
    eyebrow: "Theatre Reviews",
    title: "Where the stage stays with us.",
    dek: "Reviews and conversations tracing South African performance from rehearsal room to opening night."
  },
  books: {
    eyebrow: "Book Reviews",
    title: "Books worth talking about.",
    dek: "Close readings of fiction, criticism, translation, and the ideas moving through our bookshelves."
  },
  opinion: {
    eyebrow: "Opinion",
    title: "Ideas that refuse to sit quietly.",
    dek: "Columns and commentary on language, access, institutions, and the stories shaping public culture."
  },
  essays: {
    eyebrow: "Essays",
    title: "Stories that linger beyond the page.",
    dek: "Essays on identity, memory, place, language, and the everyday rituals that hold communities together."
  }
};

export function CategoriesSearchPage({ fixtures = launchFixtures, query, category, topic, status = "ready" }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeQuery = query ?? params.get("q") ?? "";
  const activeCategory = category ?? params.get("category") ?? "";
  const normalizedCategory = activeCategory === "essays" ? "opinion" : activeCategory;
  const activeTopic = topic ?? params.get("topic") ?? "";
  const model = buildCategoriesSearchRouteModel(fixtures, {
    query: activeQuery,
    category: normalizedCategory,
    topic: activeTopic
  });
  const { hero, selectedCategory, sections } = model;
  const section = sectionCopy[activeTopic] || sectionCopy[normalizedCategory] || { ...hero, title: "Explore the magazine." };

  return (
    <section className="figma-public-page figma-search-page" data-page="categories-search" data-design-reference="search-archive-v4" data-route={model.route.path} data-generated={model.generatedFrom} data-state-note={model.stateNote} data-prototype-file={model.route.prototypeFile}>
      <header data-section="search-intro" className="figma-page-intro">
        <h1>{section.title}</h1>
        <p>{section.dek}</p>
      </header>

      <section data-section="search-results" className="figma-content-section" data-state={sections.results.state}>
        <div className="category-results-toolbar">
          <h2 className="sr-only">{selectedCategory?.label || section.eyebrow || "Magazine"} articles</h2>
          <span className="search-result-count" aria-live="polite">{sections.results.items.length} {sections.results.items.length === 1 ? "article" : "articles"}</span>
          {sections.results.state === "results" ? <Link to="/content">Browse all sections</Link> : null}
        </div>
        {status === "loading" ? (
          <div className="figma-search-state" role="status" aria-live="polite"><span className="figma-search-state__mark" aria-hidden="true" /><p>Finding your stories...</p></div>
        ) : status === "error" ? (
          <div className="figma-search-state figma-search-state--error" role="alert"><h3>Search is temporarily unavailable</h3><p>Try submitting your search again. Your query has been preserved.</p></div>
        ) : sections.results.state === "no-results" ? (
          <div className="figma-empty-state">
            <p>{sections.results.body}</p>
            <Link data-action="reset-search" to={sections.results.resetHref}>Reset search</Link>
          </div>
        ) : (
          <div data-section="figma-search-results" className="category-article-grid">
            {sections.results.items.map((article, index) => (
              <div key={article.id} className="category-article-card" data-result-index={index + 1}>
                <FigmaArticleCard article={article} />
                <Link className="category-article-card__link" to={article.href}>
                  Read article
                  <ArrowRight aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
