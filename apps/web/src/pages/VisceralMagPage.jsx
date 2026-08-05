import * as launchFixtures from "../data/launchFixtures.js";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FigmaArticleCard } from "../components/FigmaArticleCard.jsx";
import { buildVisceralMagRouteModel } from "./visceralMagRouteModel.js";

export function VisceralMagPage({ fixtures = launchFixtures }) {
  const model = buildVisceralMagRouteModel(fixtures);
  const { hero, sections } = model;
  const [leadStory, ...stories] = sections.articleListing;

  return (
    <section className="figma-public-page figma-archive-page" data-page="visceral-mag" data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile}>
      <header data-section="archive-intro" className="figma-page-intro visceral-archive-hero">
        <h1>{hero.title}</h1>
        <p>{hero.dek}</p>
      </header>

      <section data-section="article-listing" className="figma-content-section visceral-archive">
        <div className="section-heading-row visceral-archive__heading">
          <div>
            <span>{sections.articleListing.length} stories</span>
            <h2>Latest Visceral Articles</h2>
          </div>
          <Link to="/search">Search archive <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        {leadStory ? (
          <div className="visceral-lead-story">
            <FigmaArticleCard article={leadStory} featured />
          </div>
        ) : null}
        <div className="visceral-story-feed">
          {stories.map((article) => (
            <FigmaArticleCard key={article.id} article={article} compact />
          ))}
        </div>
      </section>
    </section>
  );
}
