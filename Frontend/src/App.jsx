import { useState } from 'react';
import './index.css';
import RegisteredParticipants from './components/RegisteredParticipants/RegisteredParticipants';
import MarkAllocation from './components/MarkAllocation/MarkAllocation';

export default function App() {
  const [view, setView] = useState('registrations');

  return (
    <main>
      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setView('registrations')}
          style={{
            margin: '0 0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
            background: view === 'registrations' ? 'var(--clr-primary, #646cff)' : 'transparent',
            color: '#fff', border: '1px solid var(--clr-primary, #646cff)'
          }}>
          Registrations
        </button>
        <button
          onClick={() => setView('marks')}
          style={{
            margin: '0 0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
            background: view === 'marks' ? 'var(--clr-primary, #646cff)' : 'transparent',
            color: '#fff', border: '1px solid var(--clr-primary, #646cff)'
          }}>
          Mark Allocation
        </button>
      </div>

      {view === 'registrations' ? <RegisteredParticipants /> : <MarkAllocation />}
    </main>
  );
}
