// ============================================================
//  Frontend/src/components/RegisteredParticipants/RegisteredParticipants.jsx
//  Fetches data from the LOCAL backend (/api/participants).
//  External API key is never exposed here.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getParticipants,
    syncParticipants,
    deleteParticipant,
    getFriendlyError,
    refreshInterval,
} from '../../services/participantApi';
import { getStatusLabel } from '../../models/participant';
import './RegisteredParticipants.css';

const EVENT_OPTIONS = [
    { value: '', label: 'All Events' },
    { value: 'Hackathon', label: 'Hackathon' },
    { value: 'Paper Presentation', label: 'Paper Presentation' },
    { value: 'Robotics Challenge', label: 'Robotics Challenge' },
    { value: 'UI/UX Design Sprint', label: 'UI/UX Design Sprint' },
    { value: 'Quiz Championship', label: 'Quiz Championship' },
    { value: 'Tech Talk', label: 'Tech Talk' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'waitlisted', label: 'Waitlisted' },
    { value: 'cancelled', label: 'Cancelled' },
];

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
};

function SkeletonCards({ count = 6 }) {
    return Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card skeleton-card" aria-hidden="true">
            <div className="skeleton-line" style={{ width: '40%', height: '12px' }} />
            <div className="skeleton-line" style={{ width: '70%', height: '20px' }} />
            <div className="skeleton-line" style={{ width: '55%', height: '12px' }} />
            <div className="skeleton-line" style={{ width: '65%', height: '12px' }} />
        </div>
    ));
}

function ParticipantCard({ participant, onRemove, isRemoving }) {
    const { label: statusLabel, color: statusColor } = getStatusLabel(participant.status);
    const initials = getInitials(participant.name);

    return (
        <article className="glass-card participant-card" aria-label={`Participant: ${participant.name ?? 'Unknown'}`}>
            <div className="participant-card__header">
                <div className="participant-card__avatar" aria-hidden="true">{initials}</div>
                <div className="participant-card__name-block">
                    <div className="participant-card__name" title={participant.name}>
                        {participant.name ?? '—'}
                    </div>
                    {participant.registrationId && (
                        <div className="participant-card__reg-id">#{participant.registrationId}</div>
                    )}
                </div>
                {participant.status && (
                    <span className={`participant-card__status ${statusColor}`} aria-label={`Status: ${statusLabel}`}>
                        {statusLabel}
                    </span>
                )}
            </div>

            <div className="participant-card__fields">
                {participant.college && (
                    <div className="participant-card__field">
                        <svg className="participant-card__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="participant-card__field-value" title={participant.college}>{participant.college}</span>
                    </div>
                )}
                {participant.department && (
                    <div className="participant-card__field">
                        <svg className="participant-card__field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        <span className="participant-card__field-value">{participant.department}</span>
                        {participant.year && (
                            <span className="participant-card__field-label">· Year {participant.year}</span>
                        )}
                    </div>
                )}
            </div>

            <div className="participant-card__footer">
                {participant.event ? (
                    <span className="participant-card__event">🎯 {participant.event}</span>
                ) : <span />}
                <button
                    type="button"
                    className="participant-card__remove-btn"
                    onClick={() => onRemove(participant)}
                    disabled={isRemoving}
                    title="Remove participant from database"
                    aria-label={`Remove ${participant.name || participant.registrationId}`}
                >
                    {isRemoving ? '⏳ Removing…' : '🗑️ Remove'}
                </button>
            </div>
        </article>
    );
}

export default function RegisteredParticipants() {
    const [participants, setParticipants] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');
    const [removingId, setRemovingId] = useState(null);
    const [error, setError] = useState(null);

    const [searchName, setSearchName] = useState('');
    const [searchCollege, setSearchCollege] = useState('');
    const [filterEvent, setFilterEvent] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // ── Fetch cached participants from MongoDB via backend ─────
    const fetchParticipants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getParticipants();
            setParticipants(result.participants);
            setTotal(result.total);
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Sync: backend fetches from external API → DB ──────────
    const handleSync = useCallback(async () => {
        setSyncing(true);
        setSyncMsg('');
        setError(null);
        try {
            const result = await syncParticipants();
            setParticipants(result.participants);
            setTotal(result.total);
            setSyncMsg(`✅ Synced ${result.synced} participant${result.synced !== 1 ? 's' : ''} from registration API.`);
        } catch (err) {
            setError(getFriendlyError(err));
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMsg(''), 5000);
        }
    }, []);

    // ── Remove participant from database ───────────────────────
    const handleRemove = useCallback(async (participant) => {
        const confirmMsg = `Are you sure you want to remove "${participant.name || participant.registrationId}" from the database?`;
        if (!window.confirm(confirmMsg)) return;

        setRemovingId(participant.registrationId);
        try {
            await deleteParticipant(participant.registrationId);
            setParticipants((prev) => prev.filter((p) => p.registrationId !== participant.registrationId));
            setTotal((prev) => Math.max(0, prev - 1));
            setSyncMsg(`🗑️ Removed ${participant.name || participant.registrationId} from database.`);
            setTimeout(() => setSyncMsg(''), 4000);
        } catch (err) {
            alert(`Failed to remove participant: ${err.message || 'Unknown error'}`);
        } finally {
            setRemovingId(null);
        }
    }, []);

    // On load: only read existing data from DB (fast). Sync only on button click.
    useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

    // Client-side search + filter
    const filtered = useMemo(() => {
        return participants.filter((p) => {
            if (searchName && !(p.name ?? '').toLowerCase().includes(searchName.toLowerCase())) return false;
            if (searchCollege && !(p.college ?? '').toLowerCase().includes(searchCollege.toLowerCase())) return false;
            if (filterEvent && !(p.event ?? '').toLowerCase().includes(filterEvent.toLowerCase())) return false;
            if (filterStatus && (p.status ?? '').toLowerCase() !== filterStatus.toLowerCase()) return false;
            return true;
        });
    }, [participants, searchName, searchCollege, filterEvent, filterStatus]);

    return (
        <section id="participants" className="participants" aria-labelledby="participants-heading">
            <div className="container">
                {/* Header */}
                <header className="participants__header">
                    <p className="section-label">Who&rsquo;s Joining</p>
                    <h2 className="section-title" id="participants-heading">
                        Registered <span>Participants</span>
                    </h2>
                    <p className="section-subtitle" style={{ margin: '0 auto' }}>
                        Onboarded participants from the registration portal.
                    </p>

                    {/* Count + Sync row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '20px' }}>
                        <div className="participants__count-badge" aria-live="polite">
                            Registered Participants:&nbsp;
                            <span className="count-num">{loading && !participants.length ? '…' : total}</span>
                        </div>
                        <button
                            className="participants__retry-btn"
                            onClick={handleSync}
                            disabled={syncing}
                            aria-label="Sync latest participants from registration API"
                            style={{ borderColor: syncing ? 'var(--clr-primary)' : undefined }}
                        >
                            {syncing ? '⏳ Syncing…' : '🔄 Sync Now'}
                        </button>
                    </div>

                    {syncMsg && (
                        <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--clr-confirmed)' }} aria-live="polite">
                            {syncMsg}
                        </p>
                    )}
                </header>

                {/* Toolbar */}
                <div className="participants__toolbar" role="search">
                    <div className="participants__search-wrap">
                        <svg className="participants__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input id="search-name" type="search" className="participants__search"
                            placeholder="Search by name…" value={searchName}
                            onChange={(e) => setSearchName(e.target.value)} aria-label="Search by name" />
                    </div>

                    <div className="participants__search-wrap">
                        <svg className="participants__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <input id="search-college" type="search" className="participants__search"
                            placeholder="Search by college…" value={searchCollege}
                            onChange={(e) => setSearchCollege(e.target.value)} aria-label="Search by college" />
                    </div>

                    <select id="filter-event" className="participants__filter"
                        value={filterEvent} onChange={(e) => setFilterEvent(e.target.value)} aria-label="Filter by event">
                        {EVENT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>

                    <select id="filter-status" className="participants__filter"
                        value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
                        {STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>

                {!loading && !error && participants.length > 0 && (
                    <p className="participants__result-count" aria-live="polite">
                        Showing {filtered.length} of {participants.length} participant{participants.length !== 1 ? 's' : ''}
                    </p>
                )}

                {/* Grid */}
                <div className="participants__grid" aria-live="polite" aria-busy={loading}>

                    {loading && <SkeletonCards count={6} />}

                    {!loading && error && (
                        <div className="participants__error" role="alert">
                            <div className="participants__error-icon" aria-hidden="true">⚠️</div>
                            <h3>Something Went Wrong</h3>
                            <p>{error}</p>
                            <button className="participants__retry-btn" onClick={fetchParticipants}>Try Again</button>
                        </div>
                    )}

                    {!loading && !error && participants.length === 0 && (
                        <div className="participants__empty" role="status">
                            <div className="participants__empty-icon" aria-hidden="true">🔄</div>
                            <h3>No Participants Loaded</h3>
                            <p>Click <strong>Sync Now</strong> above to fetch the latest onboarded participants.</p>
                        </div>
                    )}

                    {!loading && !error && participants.length > 0 && filtered.length === 0 && (
                        <div className="participants__empty" role="status">
                            <div className="participants__empty-icon" aria-hidden="true">🔍</div>
                            <h3>No Matches Found</h3>
                            <p>Try adjusting your search or filter.</p>
                        </div>
                    )}

                    {!loading && !error && filtered.map((p) => (
                        <ParticipantCard
                            key={p._id ?? p.registrationId ?? p.name}
                            participant={p}
                            onRemove={handleRemove}
                            isRemoving={removingId === p.registrationId}
                        />
                    ))}

                </div>
            </div>
        </section>
    );
}
