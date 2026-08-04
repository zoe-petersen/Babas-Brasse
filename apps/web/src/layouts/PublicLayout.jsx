import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Facebook, Instagram, Menu, Music2, Pin, X as CloseIcon } from "lucide-react";
import { Button } from "../components/ui/button.jsx";

const primaryNavigation = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Content", href: "/content", hasDropdown: true },
  { label: "Contributors", href: "/contributors" },
  { label: "Photography", href: "/photography" },
  { label: "Contact Us", href: "/contact" }
];

const contentDropdownNavigation = [
  { label: "Literature", href: "/search?category=reviews&topic=books" },
  { label: "Opinion", href: "/search?category=opinion" },
  { label: "Interviews", href: "/search?category=interviews" },
  { label: "Theatre", href: "/search?category=reviews&topic=theatre" },
  { label: "Short Stories", href: "/search?category=short-stories" },
  { label: "Fashion", href: "/search?category=articles&topic=fashion" },
  { label: "Music", href: "/search?category=articles&topic=music" },
  { label: "Art", href: "/search?category=articles&topic=art" },
  { label: "Articles", href: "/search?category=articles" }
];

// Replace these platform homepages with verified Babas & Brasse profile URLs before launch.
const socialNavigation = [
  { label: "Facebook", href: "https://www.facebook.com/", placeholder: true, Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/", placeholder: true, Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/", placeholder: true, Icon: Music2 },
  { label: "Pinterest", href: "https://www.pinterest.com/", placeholder: true, Icon: Pin },
  { label: "X / Twitter", href: "https://x.com/", placeholder: true, Icon: CloseIcon }
];

export function PublicLayout({ route, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contentMenuOpen, setContentMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  function isSectionActive(item) {
    const [pathname, search = ""] = item.href.split("?");
    if (location.pathname !== pathname) return false;
    if (!search) return location.search === "";

    const expected = new URLSearchParams(search);
    const actual = new URLSearchParams(location.search);
    const allExpectedMatch = [...expected.entries()].every(([key, value]) => actual.get(key) === value);
    const hasUnexpectedTopic = !expected.has("topic") && actual.has("topic");
    return allExpectedMatch && !hasUnexpectedTopic;
  }

  function closeNavigation() {
    setContentMenuOpen(false);
    setMobileMenuOpen(false);
  }

  function closeContentMenu() {
    setContentMenuOpen(false);
  }


  useEffect(() => {
    closeNavigation();
  }, [location.pathname, location.search]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") closeNavigation();
    }

    function handlePointerDown(event) {
      if (contentMenuOpen && !headerRef.current?.contains(event.target)) {
        closeContentMenu();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [contentMenuOpen]);

  return (
    <div className="app-layout public-layout" data-public-design="visceral-brutalist-archive">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header final-design-header production-editorial-header" ref={headerRef}>
        <div className="header-topline">
          <Link className="brand-mark" to="/" onClick={closeNavigation}>
            <img className="brand-logo" src="/media/logo.png" alt="Babas and Brasse" />
          </Link>

          <div
            id="public-navigation"
            className="final-design-navigation"
            data-mobile-open={mobileMenuOpen ? "true" : "false"}
          >
            <div className="primary-navigation-cluster">
              <nav className="primary-public-navigation" aria-label="Public navigation">
                {primaryNavigation.map((item) => (
                  item.hasDropdown ? (
                    <div className="primary-nav-dropdown" key={item.href}>
                      <div className="primary-nav-dropdown__topline">
                        <Link to={item.href} aria-current={isSectionActive(item) ? "page" : undefined} onClick={closeNavigation}>
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          className="primary-nav-dropdown__toggle"
                          aria-label={`${contentMenuOpen ? "Close" : "Open"} Content sections`}
                          aria-expanded={contentMenuOpen}
                          aria-controls="content-navigation-menu"
                          onClick={() => setContentMenuOpen((open) => !open)}
                        >
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                      </div>
                      <div id="content-navigation-menu" className="primary-nav-menu" data-open={contentMenuOpen ? "true" : "false"} hidden={!contentMenuOpen}>
                        {contentDropdownNavigation.map((section) => (
                          <Link key={section.href} to={section.href} aria-current={isSectionActive(section) ? "page" : undefined} onClick={closeNavigation}>
                            {section.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      key={`${item.label}-${item.href}`}
                      to={item.href}
                      aria-current={isSectionActive(item) ? "page" : undefined}
                      onClick={closeNavigation}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </nav>
            </div>
            <nav className="header-social-navigation" aria-label="Social media">
              {socialNavigation.map(({ label, href, placeholder, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-placeholder={placeholder ? "true" : undefined}
                  aria-label={`${label}${placeholder ? " placeholder profile" : ""} (opens in a new tab)`}
                  title={label}
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>

          <Button
            className="final-design-menu-toggle"
            type="button"
            variant="ghost"
            size="icon"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-navigation"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              closeContentMenu();
            }}
          >
            {mobileMenuOpen ? <CloseIcon size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            <span className="sr-only">{mobileMenuOpen ? "Close navigation" : "Open navigation"}</span>
          </Button>
        </div>
      </header>

      <main id="main-content" data-route-id={route.id}>{children}</main>

      <footer id="site-footer" className="figma-footer" aria-label="Site footer">
        <div className="figma-footer__inner">
          <section className="figma-footer__brand" aria-label="Babas and Brasse summary">
            <img className="figma-footer__logo" src="/media/logo.png" alt="Babas and Brasse" />
            <h2>Independent stories.<br />South African voices.</h2>
            <p>Culture, criticism, and creative work made with nerve, care, and a point of view.</p>
            <Link className="figma-footer__cta" to="/contact">
              Submit your work <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </section>

          <section className="figma-footer__links" aria-labelledby="footer-explore-heading">
            <h2 id="footer-explore-heading">Explore</h2>
            <nav aria-label="Explore Babas and Brasse">
              <Link to="/content">Content</Link>
              <Link to="/contributors">Contributors</Link>
              <Link to="/photography">Photography</Link>
              <Link to="/about">About</Link>
              <Link to="/contact">Contact Us</Link>
            </nav>
          </section>

          <section className="figma-footer__links" aria-labelledby="footer-sections-heading">
            <h2 id="footer-sections-heading">Read</h2>
            <nav aria-label="Magazine sections">
              {contentDropdownNavigation.slice(0, 5).map((section) => (
                <Link key={section.href} to={section.href}>{section.label}</Link>
              ))}
            </nav>
          </section>

          <section className="figma-footer__socials" aria-label="Social media">
            <h2>Follow the magazine</h2>
            <p>Keep up with new stories, contributors, and open calls.</p>
            <div className="figma-footer__social-links">
              {socialNavigation.map(({ label, href, placeholder, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-placeholder={placeholder ? "true" : undefined}
                  aria-label={label + (placeholder ? " placeholder profile" : "") + " (opens in a new tab)"}
                  title={label + (placeholder ? " placeholder profile" : "")}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
        <div className="figma-footer__bottom">
          <p>Copyright 2026 Babas &amp; Brasse. All rights reserved.</p>
          <p>Independent arts &amp; culture from South Africa.</p>
        </div>
      </footer>
    </div>
  );
}
