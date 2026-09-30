// ============================================================
//  src/components/Navbar/Navbar.jsx
// ============================================================

import { useState, useEffect } from 'react';
import './Navbar.css';

const NAV_LINKS = [
    { label: 'Home', href: '#home' },
    { label: 'Events', href: '#events' },
    { label: 'Participants', href: '#participants' },
    { label: 'About', href: '#about' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeLink, setActiveLink] = useState('#home');

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (href) => {
        setActiveLink(href);
        setMenuOpen(false);
    };

    return (
        <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
            <div className="navbar__inner">
                {/* Logo */}
                <a href="#home" className="navbar__logo" onClick={() => handleNavClick('#home')}>
                    POINTERS '25
                </a>

                {/* Nav links */}
                <ul className={`navbar__nav${menuOpen ? ' open' : ''}`} role="list">
                    {NAV_LINKS.map(({ label, href }) => (
                        <li key={href}>
                            <a
                                href={href}
                                className={`navbar__link${activeLink === href ? ' active' : ''}`}
                                onClick={() => handleNavClick(href)}
                            >
                                {label}
                            </a>
                        </li>
                    ))}
                    <li>
                        <a
                            href="https://your-registration-website.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="navbar__cta"
                        >
                            Register Now
                        </a>
                    </li>
                </ul>

                {/* Hamburger */}
                <button
                    className={`navbar__hamburger${menuOpen ? ' open' : ''}`}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </nav>
    );
}
