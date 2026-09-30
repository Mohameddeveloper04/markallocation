// ============================================================
//  src/components/Events/Events.jsx
// ============================================================

import './Events.css';

const EVENTS = [
    {
        id: 1,
        icon: '💻',
        category: 'Technical',
        title: 'Hackathon',
        desc: '12-hour coding marathon. Build innovative solutions to real-world problems.',
        tags: ['Team', '12 Hours'],
        prize: '₹15,000',
    },
    {
        id: 2,
        icon: '🧠',
        category: 'Technical',
        title: 'Paper Presentation',
        desc: 'Present your original research to a panel of expert judges from industry.',
        tags: ['Individual / Pair'],
        prize: '₹10,000',
    },
    {
        id: 3,
        icon: '🤖',
        category: 'Technical',
        title: 'Robotics Challenge',
        desc: 'Design and program autonomous robots to navigate obstacle courses.',
        tags: ['Team'],
        prize: '₹12,000',
    },
    {
        id: 4,
        icon: '🎨',
        category: 'Creative',
        title: 'UI/UX Design Sprint',
        desc: 'Craft beautiful, user-centric designs for the problem statement given on the day.',
        tags: ['Individual', '3 Hours'],
        prize: '₹8,000',
    },
    {
        id: 5,
        icon: '💡',
        category: 'Technical',
        title: 'Quiz Championship',
        desc: 'Test your knowledge across computer science, math, and current technology trends.',
        tags: ['Team of 2'],
        prize: '₹6,000',
    },
    {
        id: 6,
        icon: '🎤',
        category: 'Cultural',
        title: 'Tech Talk',
        desc: 'Present a 10-minute talk on any emerging technology that excites you.',
        tags: ['Individual'],
        prize: '₹5,000',
    },
];

export default function Events() {
    return (
        <section id="events" className="events">
            <div className="container">
                <header className="events__header">
                    <p className="section-label">What&rsquo;s On</p>
                    <h2 className="section-title">
                        Explore Our <span>Events</span>
                    </h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Something for every skill set — from hardcore coding to creative design.
                    </p>
                </header>

                <div className="events__grid" role="list" aria-label="Event categories">
                    {EVENTS.map((event) => (
                        <article key={event.id} className="glass-card event-card" role="listitem">
                            <div className="event-card__glow" aria-hidden="true" />
                            <div className="event-card__icon" aria-hidden="true">{event.icon}</div>
                            <p className="event-card__category">{event.category}</p>
                            <h3 className="event-card__title">{event.title}</h3>
                            <p className="event-card__desc">{event.desc}</p>
                            <div className="event-card__meta">
                                {event.tags.map((t) => (
                                    <span key={t} className="event-card__tag">{t}</span>
                                ))}
                                {event.prize && (
                                    <span className="event-card__prize">🏆 {event.prize}</span>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
