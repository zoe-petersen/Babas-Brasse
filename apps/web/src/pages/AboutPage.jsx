import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import * as launchFixtures from "../data/launchFixtures.js";
import { buildAboutRouteModel } from "./aboutRouteModel.js";

export function AboutPage({ fixtures = launchFixtures }) {
  const model = buildAboutRouteModel(fixtures);
  const { sections } = model;

  return (
    <section className="figma-public-page figma-about-page about-editorial-page" data-design-reference="about-brutalist-manifest" data-page="about" data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile}>
      <section className="about-client-banner" data-section="about-banner" data-image-status={sections.banner.image.url ? "ready" : "awaiting-client-image"} aria-label="Babas and Brasse about banner">
        {sections.banner.image.url ? (
          <img src={sections.banner.image.url} alt={sections.banner.image.altText} />
        ) : (
          <div className="about-client-banner__placeholder" aria-hidden="true">
            <img src="/media/logo.png" alt="" />
          </div>
        )}
        <div className="about-client-banner__content">
          {/* <p>Independent South African arts &amp; culture</p> */}
          <h1>
            <span>A place to be</span>
            <span>seen, heard, and</span>
            <span>remembered.</span>
          </h1>
          <span>{model.hero.dek}</span>
        </div>
      </section>

      <section id="who-we-are" data-section="about-who-we-are" className="about-editorial-section about-story-section about-story-section--who">
        <div className="about-who-section__inner">
          <div className="about-who-opening-row">
            <header className="about-story-heading">
              <span className="about-story-index" aria-hidden="true">01</span>
              <h2>Who we are</h2>
            </header>
            <p className="about-who-opening"><strong>{sections.overview.whoWeAre[0]}</strong></p>
          </div>
          <div className="about-who-centered-copy">
            {sections.overview.whoWeAre.slice(1).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <blockquote className="about-editorial-standfirst">
              <span aria-hidden="true">“</span>
              <p>{sections.overview.collective}</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section id="whats-in-the-name" data-section="about-name" className="about-editorial-section about-editorial-section--split about-name-restored">
        <figure className="about-name-logo">
          <img src={sections.overview.image.url} alt={sections.overview.image.altText} />
        </figure>
        <div className="about-editorial-copy">
          <h2>What&apos;s in the name?</h2>
          {sections.overview.name.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </section>

      <section id="creative-team" data-section="about-creative-team" className="about-editorial-section about-team-section">
        <div className="about-team-section__inner">
          <div className="about-team-heading">
            <div>
              <span className="about-story-index" aria-hidden="true">03</span>
              <h2>Meet the creative team</h2>
            </div>
            <div className="about-team-heading__aside">
              <p>The people shaping the words, images, ideas, and digital home of Babas &amp; Brasse.</p>
              <Link to="/creative-team">View the team <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="about-team-grid">
            {sections.creativeTeam.map((member, index) => (
              <Link key={member.id} to={member.href} className="about-team-card" aria-label={`Open ${member.name} profile`}>
                <span className="about-team-card__topline">
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <ArrowUpRight size={21} aria-hidden="true" />
                </span>
                <span className="about-team-card__media">
                  <img src={member.image.url} alt={member.image.altText} />
                </span>
                <span className="about-team-card__body">
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="submit-your-work" data-section="about-submission-cta" className="about-submission-cta">
        <div className="about-submission-cta__copy">
          <p className="eyebrow">The door is open</p>
          <h2>Want to submit your work?</h2>
          <p>Share your writing, photography, artwork, fashion, or creative project with the Babas &amp; Brasse team.</p>
        </div>
        <Link className="about-submission-cta__button" to="/contact">Start a submission <ArrowRight size={19} aria-hidden="true" /></Link>
      </section>
    </section>
  );
}
