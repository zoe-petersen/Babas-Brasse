import { Link } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { FigmaArticleCard } from "../components/FigmaArticleCard.jsx";
import { HomeCarousel } from "../components/HomeCarousel.jsx";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buildHomeRouteModel } from "./homeRouteModel.js";

export function HomePage({ fixtures = launchFixtures }) {
  const model = buildHomeRouteModel(fixtures);
  const { sections } = model;
  const recent = sections.recentArticles.length ? sections.recentArticles : sections.latestArticles;

  return (
    <section className="figma-final-home" data-design-reference="home-brutalist-broadsheet" data-page="home" data-design-source={model.designSource} data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile}>
      <HomeCarousel slides={sections.carouselSlides} />
      <section id="latest-content" data-section="figma-recent-articles" className="figma-home__recent-shell">
        <div className="section-heading-row">
          <h2>Latest Content</h2>
          <Link to="/content">View more <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="figma-card-grid">
          {recent.map((article) => <FigmaArticleCard key={article.id} article={article} />)}
        </div>
      </section>

      <section id="explore-sections" data-section="home-section-directory" className="home-section-directory">
        <div className="section-heading-row">
          <div>
            <p className="home-section-kicker">Find your way in</p>
            <h2>Explore by Section</h2>
          </div>
          <Link to="/content">All content <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <nav className="home-section-directory__grid" aria-label="Magazine sections">
          {sections.sectionShortcuts.map((section, index) => (
            <Link key={section.id} to={section.href} className="home-section-directory__card">
              <span className="home-section-directory__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className="home-section-directory__copy">
                <strong>{section.label}</strong>
                <span>{section.description}</span>
              </span>
              <ArrowUpRight size={22} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </section>

      {sections.editorsPick ? (
        <section id="editors-pick" data-section="home-editors-pick" className="home-editors-pick">
          <div className="section-heading-row">
            <div>
              <p className="home-section-kicker">Selected by the editorial team</p>
              <h2>Editor&apos;s Pick</h2>
            </div>
            <Link to={sections.editorsPick.href}>Read the story <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <FigmaArticleCard article={sections.editorsPick} featured />
        </section>
      ) : null}

      <section id="submit-your-work" data-section="home-submission-cta" className="home-submission-cta">
        <div>
          <p className="home-section-kicker">Your work belongs in the conversation</p>
          <h2>Have something to say?</h2>
          <p>Send us your writing, visual work, pitch, or big idea. We are always looking for original South African voices.</p>
        </div>
        <Link to="/contact">Submit your work <ArrowRight size={19} aria-hidden="true" /></Link>
      </section>
    </section>
  );
}
