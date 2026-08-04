import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import * as launchFixtures from "../data/launchFixtures.js";
import { buildContributorsRouteModel } from "./contributorsRouteModel.js";

export function ContributorsPage({ fixtures = launchFixtures }) {
  const model = buildContributorsRouteModel(fixtures);
  const { hero, sections } = model;
  const contributors = sections.contributorsGrid.items;
  const publishedCount = sections.publishedWorks.items.length;
  const categoryCount = new Set(sections.publishedWorks.items.map((work) => work.category.slug)).size;

  return (
    <section className="figma-public-page figma-contributors-page" data-page="contributors" data-design-reference="contributors-directory-v4" data-route={model.route.path} data-generated={model.generatedFrom} data-prototype-file={model.route.prototypeFile}>
      <header data-section="contributors-intro" className="figma-page-intro contributors-hero">
        <div className="contributors-hero__copy">
          <h1>{hero.title}</h1>
          <p>{hero.dek}</p>
          <Link className="contributors-hero__link" to="/content">
            Explore their work <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <dl className="contributors-hero__stats" aria-label="Contributor directory overview">
          <div>
            <dt>Creative voices</dt>
            <dd>{String(contributors.length).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Published pieces</dt>
            <dd>{String(publishedCount).padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Perspectives</dt>
            <dd>{String(categoryCount).padStart(2, "0")}</dd>
          </div>
        </dl>
      </header>

      <section data-section="contributors-grid" className="figma-content-section" data-state={sections.contributorsGrid.state}>
        <div className="contributors-section-heading">
          <div>
            <h2>{sections.contributorsGrid.heading}</h2>
            <p>Discover the people shaping each story, review, essay, and conversation.</p>
          </div>
          <Link to="/contact">Submit your work <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        {sections.contributorsGrid.state === "no-results" ? (
          <div className="figma-empty-state" data-state="no-results">
            <p>{sections.contributorsGrid.body}</p>
            <Link data-action="reset-filter" to={sections.contributorsGrid.resetHref}>View contributors</Link>
          </div>
        ) : (
          <div className="contributors-profile-grid" aria-label="Contributor profiles">
            {contributors.map((profile, index) => {
              const latestWork = profile.publishedWorks?.[0];
              const topics = [...new Map(profile.publishedWorks.map((work) => [work.category.slug, work.category])).values()].slice(0, 3);
              return (
                <article key={profile.id} className="contributors-profile-card" data-profile={profile.slug}>
                  <Link className="contributors-profile-card__media" to={profile.href} aria-label={`View ${profile.name}'s profile`}>
                    <img src={profile.image.url} alt={profile.image.altText} loading={index > 1 ? "lazy" : "eager"} />
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  </Link>
                  <div className="contributors-profile-card__body">
                    <p className="contributors-profile-card__role">{profile.role}</p>
                    <h3><Link to={profile.href}>{profile.name}</Link></h3>
                    <p className="contributors-profile-card__bio">{profile.shortBio}</p>
                    {topics.length > 0 ? (
                      <ul className="contributors-profile-card__topics" aria-label={`${profile.name}'s topics`}>
                        {topics.map((topic) => <li key={topic.slug}>{topic.label}</li>)}
                      </ul>
                    ) : null}
                    <div className="contributors-profile-card__latest">
                      <span>{profile.publishedWorks.length} published {profile.publishedWorks.length === 1 ? "piece" : "pieces"}</span>
                      {latestWork ? (
                        <p>
                          <span>Latest</span>
                          <Link to={latestWork.href}>{latestWork.title}</Link>
                        </p>
                      ) : <p>No published work yet</p>}
                    </div>
                    <Link className="contributors-profile-card__action" to={profile.href}>
                      View profile <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="contributors-cta" data-section="contributors-cta">
        <div>
          <p>Have something to say?</p>
          <h2>Your perspective belongs here.</h2>
          <span>Pitch an essay, share creative work, or start a conversation with the Babas &amp; Brasse team.</span>
        </div>
        <div className="contributors-cta__actions">
          <Link to="/contact">Submit your work <ArrowRight size={20} aria-hidden="true" /></Link>
          <Link to="/content">Read the magazine</Link>
        </div>
      </section>
    </section>
  );
}
