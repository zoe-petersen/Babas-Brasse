import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { buildContentRouteModel } from "./contentRouteModel.js";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }) : "Magazine archive";
}

export function ContentPage({ fixtures = launchFixtures }) {
  const model = buildContentRouteModel(fixtures);
  const { hero, sections } = model;

  return (
    <section className="figma-public-page figma-content-page" data-page="content" data-design-reference="content-directory-v1" data-route={model.route.path} data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile}>
      <header data-section="content-intro" className="figma-page-intro content-editorial-hero">
        <div className="content-editorial-hero__copy">
          <h1>{hero.title}</h1>
          <p>{hero.dek}</p>
          <div className="content-editorial-hero__actions">
            <Link to="/visceral-mag">Browse the archive <ArrowRight size={19} aria-hidden="true" /></Link>
            <Link to="/contributors">Meet the voices</Link>
          </div>
        </div>
        <span className="content-editorial-hero__accent" aria-hidden="true" />
      </header>

      <dl className="content-editorial-stats" aria-label="Magazine overview">
        {model.stats.map((stat) => (
          <div key={stat.id}>
            <dt>{stat.label}</dt>
            <dd>{String(stat.value).padStart(2, "0")}</dd>
          </div>
        ))}
      </dl>

      {sections.editorsShelf.items.length > 0 ? (
        <section className="content-editors-shelf" data-section="editors-shelf" aria-labelledby="editors-shelf-heading">
          <header className="content-editorial-heading">
            <div>
              <h2 id="editors-shelf-heading">{sections.editorsShelf.heading}</h2>
              <p>{sections.editorsShelf.dek}</p>
            </div>
            <Link to="/visceral-mag">All stories <ArrowRight size={18} aria-hidden="true" /></Link>
          </header>
          <div className="content-editors-shelf__grid">
            {sections.editorsShelf.items.map((article, index) => (
              <article key={article.id} className="content-shelf-card" data-article={article.slug}>
                <Link className="content-shelf-card__media" to={article.href} aria-label={`Read ${article.title}`}>
                  <img src={article.featuredImage.url} alt={article.featuredImage.altText || article.title} loading={index > 0 ? "lazy" : "eager"} />
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                </Link>
                <div className="content-shelf-card__body">
                  <p>{article.category.label}</p>
                  <h3><Link to={article.href}>{article.title}</Link></h3>
                  <span>{article.author?.name || "Babas & Brasse"} · {formatDate(article.publishedAt)}</span>
                  <Link className="content-shelf-card__link" to={article.href}>Read story <ArrowRight size={17} aria-hidden="true" /></Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section data-section="content-categories" className="figma-content-section" data-state={sections.categories.state}>
        <div className="section-heading-row">
          <h2>{sections.categories.heading}</h2>
          <Link to="/visceral-mag">View full archive</Link>
        </div>

        {sections.categories.items.length > 0 ? (
          <div className="figma-card-grid content-category-grid">
            {sections.categories.items.map((category) => (
              <article key={category.id} className="content-category-card" data-category={category.slug}>
                <p className="eyebrow">{category.count} {category.count === 1 ? "piece" : "pieces"}</p>
                <h3><Link to={category.href}>{category.label}</Link></h3>
                <p>{category.description}</p>
                {category.articles.length > 0 ? (
                  <ul aria-label={`Recent ${category.label} content`}>
                    {category.articles.map((article) => <li key={article.id}><Link to={article.href}>{article.title}</Link></li>)}
                  </ul>
                ) : <p>No published pieces in this section yet.</p>}
                <Link className="content-category-card__cta" to={category.href}>Browse {category.label}</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="figma-empty-state"><p>{sections.categories.body}</p></div>
        )}
      </section>

    

   
    </section>
  );
}
