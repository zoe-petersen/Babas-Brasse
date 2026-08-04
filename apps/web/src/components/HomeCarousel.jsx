import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getArticleDetailRoute } from "../pages/articleDetailRouteModel.js";

function resolveSlideDestination(slide) {
  const candidate = slide?.href || slide?.url || slide?.route || getArticleDetailRoute(slide);
  const destination = String(candidate || "").trim();
  return /^(?:\/|https?:\/\/)/i.test(destination) ? destination : "";
}

export function HomeCarousel({ slides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  if (!slides.length) return null;

  function SlideLink({ slide, children, className, tabIndex }) {
    const destination = resolveSlideDestination(slide);
    if (!destination) return <div className={className}>{children}</div>;
    const label = `Open ${slide.title}`;
    if (/^https?:\/\//i.test(destination)) {
      return <a className={className} href={destination} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} aria-label={`${label} (opens in a new tab)`}>{children}</a>;
    }
    return <Link className={className} to={destination} tabIndex={tabIndex} aria-label={label}>{children}</Link>;
  }

  return (
    <section
      className="home-carousel"
      aria-label="Babas and Brasse featured stories"
      aria-roledescription="carousel"
    >
      <div className="home-carousel__track">
        {slides.map((slide, index) => {
          const active = index === activeIndex;
          const Heading = index === 0 ? "h1" : "h2";
          return (
            <article
              className="home-carousel__slide"
              data-active={active ? "true" : "false"}
              key={slide.id}
              aria-hidden={!active}
              aria-roledescription="slide"
              aria-label={"Slide " + (index + 1) + " of " + slides.length}
            >
              <SlideLink
                className="home-carousel__media-link"
                slide={slide}
                tabIndex={active ? 0 : -1}
              >
                <div className="home-carousel__media">
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    width="1600"
                    height="900"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    draggable="false"
                  />
                </div>
              </SlideLink>
              {index === 0 ? <h1 className="sr-only">{slide.title}</h1> : (
                <div className="home-carousel__copy">
                  <SlideLink slide={slide} className="home-carousel__copy-link" tabIndex={active ? 0 : -1}>
                    <p className="eyebrow">{slide.eyebrow}</p>
                    <Heading>{slide.title}</Heading>
                    <p>{slide.description}</p>
                  </SlideLink>
                  <SlideLink slide={slide} tabIndex={active ? 0 : -1}>
                    {slide.cta}
                    <ArrowRight size={18} aria-hidden="true" />
                  </SlideLink>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="home-carousel__controls">
        <button className="home-carousel__control home-carousel__control--previous" type="button" onClick={showPrevious} aria-label="Previous slide">
          <ArrowLeft aria-hidden="true" />
        </button>
        <button className="home-carousel__control home-carousel__control--next" type="button" onClick={showNext} aria-label="Next slide">
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
