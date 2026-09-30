import { useState, useEffect, useMemo } from 'react';
import { getParticipants } from '../../services/participantApi';
import { fetchEventConfig, saveEventConfig, updateParticipantMarks } from '../../services/markAllocationApi';
import './MarkAllocation.css';

const EVENTS = ['Hackathon', 'Conference paper'];

/* ── Mark entry popup ───────────────────────────────────── */
function MarkModal({ participant, rounds, localMarks, onMarkChange, onSave, onClose }) {
    const total = rounds.reduce(
        (sum, r) => sum + (Number(localMarks[participant.registrationId]?.[r.roundName]) || 0),
        0
    );

    return (
        <div className="ma-overlay" onClick={onClose}>
            <div className="ma-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="ma-modal__header">
                    <div>
                        <h3 className="ma-modal__title">{participant.name}</h3>
                        <span className="ma-modal__reg">#{participant.registrationId}</span>
                    </div>
                    <button className="ma-modal__close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                {/* Round inputs */}
                {rounds.length === 0 ? (
                    <p style={{ opacity: 0.6, textAlign: 'center', padding: '1rem 0' }}>
                        No rounds configured yet.
                    </p>
                ) : (
                    <div className="ma-modal__rounds">
                        {rounds.map(r => (
                            <div key={r.roundName} className="ma-modal__round-row">
                                <label className="ma-modal__round-label">
                                    {r.roundName}
                                    <span className="ma-modal__round-max">(Max {r.maxMarks})</span>
                                </label>
                                <input
                                    type="number"
                                    className="ma-modal__round-input"
                                    min="0"
                                    max={r.maxMarks}
                                    value={localMarks[participant.registrationId]?.[r.roundName] ?? ''}
                                    onChange={e => {
                                        let v = Number(e.target.value);
                                        if (isNaN(v) || v < 0) v = 0;
                                        if (v > r.maxMarks) v = r.maxMarks;
                                        onMarkChange(participant.registrationId, r.roundName, v);
                                    }}
                                    placeholder="0"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="ma-modal__footer">
                    <span className="ma-modal__total">Total: <strong>{total}</strong></span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="ma-modal__cancel" onClick={onClose}>Cancel</button>
                        <button
                            className="ma-modal__save"
                            disabled={rounds.length === 0}
                            onClick={() => onSave(participant.registrationId)}
                        >
                            💾 Save Marks
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main component ─────────────────────────────────────── */
export default function MarkAllocation() {
    const [selectedEvent, setSelectedEvent] = useState(EVENTS[0]);
    const [participants, setParticipants] = useState([]);
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newRoundName, setNewRoundName] = useState('');
    const [newRoundMarks, setNewRoundMarks] = useState('');
    const [localMarks, setLocalMarks] = useState({});

    const [searchQuery, setSearchQuery] = useState('');
    const [activeParticipant, setActiveParticipant] = useState(null);

    useEffect(() => { loadData(); }, [selectedEvent]);

    const loadData = async () => {
        setLoading(true);
        try {
            const configRounds = await fetchEventConfig(selectedEvent);
            setRounds(configRounds);

            const result = await getParticipants();
            const filtered = result.participants.filter(p => p.event === selectedEvent);
            setParticipants(filtered);

            const initialMarks = {};
            filtered.forEach(p => { initialMarks[p.registrationId] = { ...(p.marks || {}) }; });
            setLocalMarks(initialMarks);
        } catch (err) {
            console.error('Failed to load data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRound = async () => {
        if (!newRoundName || !newRoundMarks) return;
        const newRounds = [...rounds, { roundName: newRoundName, maxMarks: Number(newRoundMarks) }];
        try {
            const updated = await saveEventConfig(selectedEvent, newRounds);
            setRounds(updated);
            setNewRoundName('');
            setNewRoundMarks('');
        } catch (err) {
            console.error('Failed to add round', err);
            alert(`Error adding round! Details: ${err.message || 'Unknown'}`);
        }
    };

    const handleRemoveRound = async (roundNameToRemove) => {
        const newRounds = rounds.filter(r => r.roundName !== roundNameToRemove);
        try {
            const updated = await saveEventConfig(selectedEvent, newRounds);
            setRounds(updated);
        } catch (err) {
            console.error('Failed to remove round', err);
        }
    };

    const handleMarkChange = (regId, roundName, value) => {
        setLocalMarks(prev => ({
            ...prev,
            [regId]: { ...prev[regId], [roundName]: Number(value) }
        }));
    };

    const handleSaveMarks = async (regId) => {
        const marksToSave = localMarks[regId] || {};
        try {
            await updateParticipantMarks(regId, marksToSave);
            alert('Marks saved successfully!');
            setActiveParticipant(null);
        } catch (err) {
            console.error('Failed to save marks', err);
            alert('Failed to save marks');
        }
    };

    const getTotalMark = (regId) => {
        const m = localMarks[regId] || {};
        return rounds.reduce((sum, r) => sum + (Number(m[r.roundName]) || 0), 0);
    };

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return participants.filter(p => (p.name ?? '').toLowerCase().includes(q));
    }, [participants, searchQuery]);

    return (
        <div className="mark-allocation">
            {/* Popup modal */}
            {activeParticipant && (
                <MarkModal
                    participant={activeParticipant}
                    rounds={rounds}
                    localMarks={localMarks}
                    onMarkChange={handleMarkChange}
                    onSave={handleSaveMarks}
                    onClose={() => setActiveParticipant(null)}
                />
            )}

            <header className="mark-allocation__header">
                <h2>Mark Allocation Board</h2>
                <p>Configure rounds and allocate points to participants centrally.</p>
            </header>

            {/* Event tabs */}
            <div className="mark-allocation__event-selector">
                {EVENTS.map(ev => (
                    <button
                        key={ev}
                        className={`mark-allocation__event-btn ${selectedEvent === ev ? 'active' : ''}`}
                        onClick={() => { setSelectedEvent(ev); setSearchQuery(''); }}
                    >
                        {ev}
                    </button>
                ))}
            </div>

            {/* Rounds config + search */}
            <div className="mark-allocation__config">
                <h3>Rounds Configuration for {selectedEvent}</h3>
                <div className="mark-allocation__round-list">
                    {rounds.length === 0 && <span style={{ opacity: 0.6 }}>No rounds configured yet.</span>}
                    {rounds.map(r => (
                        <div key={r.roundName} className="mark-allocation__round-item">
                            <strong>{r.roundName}</strong> — Max: {r.maxMarks}
                            <button onClick={() => handleRemoveRound(r.roundName)} title="Remove round">&times;</button>
                        </div>
                    ))}
                </div>

                <div className="mark-allocation__add-round">
                    <input
                        type="text"
                        placeholder="Round name (e.g. Round 1)"
                        className="mark-allocation__input"
                        value={newRoundName}
                        onChange={e => setNewRoundName(e.target.value)}
                    />
                    <input
                        type="number"
                        placeholder="Max marks"
                        className="mark-allocation__input"
                        value={newRoundMarks}
                        onChange={e => setNewRoundMarks(e.target.value)}
                    />
                    <button className="mark-allocation__btn" onClick={handleAddRound}>Add Round</button>
                </div>

                {/* ── Search bar ── */}
                <div className="ma-search-wrap">
                    <svg className="ma-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="search"
                        className="ma-search-input"
                        placeholder="Search team or participant name…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Search results */}
                {searchQuery.trim() && (
                    <div className="ma-search-results">
                        {searchResults.length === 0 ? (
                            <div className="ma-search-empty">No match for "{searchQuery}"</div>
                        ) : (
                            searchResults.map(p => (
                                <div key={p.registrationId} className="ma-search-row">
                                    <div className="ma-search-info">
                                        <span className="ma-search-name">{p.name}</span>
                                        <span className="ma-search-reg">#{p.registrationId}</span>
                                    </div>
                                    <div className="ma-search-meta">
                                        <span className="ma-search-total">Total: <strong>{getTotalMark(p.registrationId)}</strong></span>
                                        <button className="ma-mark-btn" onClick={() => setActiveParticipant(p)}>
                                            ✏️ Mark
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Participants */}
            {loading ? (
                <div style={{ textAlign: 'center', margin: '2rem 0' }}>Loading participants...</div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="ma-table-wrap">
                        <table className="mark-allocation__matrix">
                            <thead>
                                <tr>
                                    <th>Participant / Team</th>
                                    <th>Registration ID</th>
                                    {rounds.map(r => (
                                        <th key={r.roundName}>{r.roundName}<br /><small>(Max {r.maxMarks})</small></th>
                                    ))}
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.length === 0 && (
                                    <tr>
                                        <td colSpan={5 + rounds.length} style={{ textAlign: 'center' }}>
                                            No confirmed participants for this event yet.
                                        </td>
                                    </tr>
                                )}
                                {participants.map(p => (
                                    <tr key={p.registrationId}>
                                        <td><strong>{p.name}</strong></td>
                                        <td style={{ fontFamily: 'monospace', opacity: 0.8 }}>{p.registrationId}</td>
                                        {rounds.map(r => (
                                            <td key={r.roundName} style={{ textAlign: 'center', fontWeight: 600 }}>
                                                {localMarks[p.registrationId]?.[r.roundName] ?? '—'}
                                            </td>
                                        ))}
                                        <td><strong>{getTotalMark(p.registrationId)}</strong></td>
                                        <td>
                                            <button className="mark-allocation__save-btn" onClick={() => setActiveParticipant(p)}>
                                                ✏️ Edit Marks
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="ma-cards">
                        {participants.length === 0 && (
                            <p className="ma-cards__empty">No confirmed participants for this event yet.</p>
                        )}
                        {participants.map(p => (
                            <div key={p.registrationId} className="ma-card">
                                <div className="ma-card__top">
                                    <div>
                                        <div className="ma-card__name">{p.name}</div>
                                        <div className="ma-card__reg">#{p.registrationId}</div>
                                    </div>
                                    <div className="ma-card__total-block">
                                        <span className="ma-card__total-label">Total</span>
                                        <span className="ma-card__total-value">{getTotalMark(p.registrationId)}</span>
                                    </div>
                                </div>
                                {rounds.length > 0 && (
                                    <div className="ma-card__rounds">
                                        {rounds.map(r => (
                                            <div key={r.roundName} className="ma-card__round-pill">
                                                <span className="ma-card__round-name">{r.roundName}</span>
                                                <span className="ma-card__round-score">
                                                    {localMarks[p.registrationId]?.[r.roundName] ?? '—'}
                                                    <span className="ma-card__round-max">/{r.maxMarks}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button className="ma-card__edit-btn" onClick={() => setActiveParticipant(p)}>
                                    ✏️ Edit Marks
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
