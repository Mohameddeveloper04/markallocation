// ============================================================
//  src/components/Hero/Hero.jsx
// ============================================================

import './Hero.css';

export default function Hero() {
    return (
        <section id="home" className="hero">
            <div className="hero__bg" aria-hidden="true" />
            <div className="hero__grid" aria-hidden="true" />

            <div className="hero__content container">
                {/* Badge */}
                <div className="hero__badge">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Annual College Technical Symposium 2025
                </div>

                {/* Headline */}
                <h1 className="hero__title">
                    Inspire.{' '}
                    <span className="gradient-text">Innovate.</span>
                    <br />
                    Impact.
                </h1>

                {/* Subtitle */}
                <p className="hero__subtitle">
                    Join the most exciting technical and cultural event of the year.
                    Compete, collaborate, and connect with the brightest minds.
                </p>

                {/* CTAs */}
                <div className="hero__actions">
                    <a
                        href="https://your-registration-website.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                    >
                        Register Now
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
                    <a href="#events" className="hero__btn-outline">
                        View Events
                    </a>
                </div>

                {/* Stats */}
                <div className="hero__stats" role="list" aria-label="Event statistics">
                    {[
                        { num: '20+', label: 'Events' },
                        { num: '500+', label: 'Participants' },
                        { num: '50+', label: 'Colleges' },
                        { num: '₹2L+', label: 'Prize Pool' },
                    ].map(({ num, label }) => (
                        <div key={label} className="hero__stat" role="listitem">
                            <div className="hero__stat-num">{num}</div>
                            <div className="hero__stat-label">{label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="hero__scroll" aria-hidden="true">
                <div className="hero__scroll-line" />
                Scroll
            </div>
        </section>
    );
}
