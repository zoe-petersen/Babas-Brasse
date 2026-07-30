import { Link } from "react-router-dom";
import { ArrowRight, Facebook, Instagram, Linkedin, Mail, Music2, ExternalLink } from "lucide-react";
import * as launchFixtures from "../data/launchFixtures.js";
import { FigmaArticleCard } from "../components/FigmaArticleCard.jsx";
import { buildProfileDetailRouteModel } from "./profileDetailRouteModel.js";

const socialPlatforms = [
  { key: "facebook", label: "Facebook", Icon: Facebook },
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "tiktok", label: "TikTok", Icon: Music2 }
];

function platformForLink(link) {
  const value = `${link.label || ""} ${link.url || ""}`.toLowerCase();
  return socialPlatforms.find((platform) => value.includes(platform.key));
}

function ProfileLink({ link }) {
  const isExternal = /^(?:https?:|mailto:)/i.test(link.url);
  const label = String(link.label || "").toLowerCase();
  const Icon = label.includes("instagram") ? Instagram : label.includes("facebook") ? Facebook : label.includes("linkedin") ? Linkedin : label.includes("tiktok") ? Music2 : label.includes("email") ? Mail : ExternalLink;
  const content = <><Icon size={18} aria-hidden="true" /><span>{link.label}</span></>;
  return isExternal
    ? <a href={link.url} target="_blank" rel="noreferrer" aria-label={`${link.label} for this profile opens in a new tab`}>{content}</a>
    : <Link to={link.url}>{content}</Link>;
}

function ProfileSocials({ name, links }) {
  return (
    <nav className="profile-social-icons" aria-label={`Social media for ${name}`}>
      <span className="profile-social-icons__label">Follow</span>
      <span className="profile-social-icons__items">
        {socialPlatforms.map(({ key, label, Icon }) => {
          const link = links.find((candidate) => platformForLink(candidate)?.key === key);
          return link ? (
            <a key={key} href={link.url} target="_blank" rel="noreferrer" aria-label={`${label} for ${name} opens in a new tab`} title={label}>
              <Icon size={21} aria-hidden="true" />
            </a>
          ) : (
            <span key={key} className="profile-social-icon--unavailable" aria-label={`${label} link not provided for ${name}`} title={`${label} link not provided`}>
              <Icon size={21} aria-hidden="true" />
            </span>
          );
        })}
      </span>
    </nav>
  );
}

export function ProfileDetailPage({ slug, fixtures = launchFixtures }) {
  const model = buildProfileDetailRouteModel(fixtures, slug);

  if (model.state === "not-found") {
    return (
      <section className="figma-public-page figma-profile-detail" data-page="profile-detail" data-state="not-found">
        <p className="eyebrow">Profile unavailable</p>
        <h1>This profile could not be found.</h1>
        <p>It may be unpublished or have moved.</p>
        <Link to={model.backHref}>Browse contributors</Link>
      </section>
    );
  }

  const { profile, publishedWorks, mediaItems } = model;
  const supportingLinks = profile.socialLinks.filter((link) => !platformForLink(link));
  const hasPublishedContent = publishedWorks.length > 0 || mediaItems.length > 0;

  return (
    <article className="figma-public-page figma-profile-detail profile-editorial-detail" data-page="profile-detail" data-design-reference="profile-detail-v4" data-route={model.route.path} data-profile={profile.slug}>
      <nav className="figma-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span aria-hidden="true">/</span>
        <Link to={model.backHref}>{profile.type === "creative_team" ? "Creative Team" : "Contributors"}</Link>
        <span aria-hidden="true">/</span><span>{profile.name}</span>
      </nav>

      <header className="profile-detail-hero profile-editorial-hero">
        <img src={profile.image.url} alt={profile.image.altText} />
        <div>
          <p className="eyebrow">{profile.role}</p>
          <h1>{profile.name}</h1>
          <p className="profile-detail-bio">{profile.fullBio}</p>
          <ProfileSocials name={profile.name} links={profile.socialLinks} />
          {supportingLinks.length > 0 ? (
            <nav className="profile-detail-links profile-supporting-links" aria-label={`Additional links for ${profile.name}`}>
              {supportingLinks.map((link) => <ProfileLink key={link.url} link={link} />)}
            </nav>
          ) : null}
        </div>
      </header>

      <section className="figma-content-section profile-work-section" aria-labelledby="profile-published-work">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Contributor archive</p>
            <h2 id="profile-published-work">Articles &amp; Media</h2>
          </div>
          <Link to="/visceral-mag">Read Visceral Mag</Link>
        </div>
        {hasPublishedContent ? (
          <>
          <div className="figma-published-story-feed">
            {publishedWorks.map((article) => <FigmaArticleCard key={article.id} article={article} compact />)}
          </div>
          {mediaItems.length > 0 ? (
            <div className="profile-media-grid" aria-label={`Media by ${profile.name}`}>
              {mediaItems.map((item) => (
                <Link key={item.id} to={item.href} className="profile-media-card">
                  <img src={item.url} alt={item.altText} />
                  <span>{item.caption || item.title}</span>
                </Link>
              ))}
            </div>
          ) : null}
          </>
        ) : (
          <div className="figma-empty-state">
            <p>No published articles or media are attached to this profile yet.</p>
          </div>
        )}
      </section>

      <section className="profile-contact-cta" aria-labelledby="profile-contact-heading">
        <p className="eyebrow">Start a conversation</p>
        <h2 id="profile-contact-heading">Have a story, project, or collaboration in mind?</h2>
        <p>Send the Babas &amp; Brasse team a message and tell us what you are working on.</p>
        <Link to="/contact">Contact us <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </article>
  );
}
