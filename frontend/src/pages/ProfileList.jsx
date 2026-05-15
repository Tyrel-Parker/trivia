import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

function formatFrequency(minutes) {
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${minutes}m`;
}

const UTC_OFFSET_HOURS = new Date().getTimezoneOffset() / 60;
function formatHour(utcH) {
  const h = (utcH - UTC_OFFSET_HOURS + 24) % 24;
  return `${String(h).padStart(2, '0')}:00`;
}

function toMinutes(value, unit) {
  return unit === 'hours' ? Math.round(parseFloat(value) * 60) : Math.round(parseFloat(value));
}

export default function ProfileList() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [form, setForm] = useState({ name: '', ntfy_topic: '', freq_value: 4, freq_unit: 'hours', cycling_order: 'shuffle', username: '', password: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/profiles').then(setProfiles).catch(console.error);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const created = await api.post('/profiles', {
        name: form.name,
        ntfy_topic: form.ntfy_topic,
        send_frequency_minutes: toMinutes(form.freq_value, form.freq_unit),
        cycling_order: form.cycling_order,
        username: form.username,
        password: form.password,
      });
      setProfiles(p => [...p, created]);
      setShowForm(false);
      setForm({ name: '', ntfy_topic: '', freq_value: 4, freq_unit: 'hours', cycling_order: 'shuffle', username: '', password: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Profiles</h1>
        {user.role === 'admin' && <button onClick={() => setShowForm(s => !s)}>+ New Profile</button>}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid #ddd' }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onBlur={e => setForm(f => ({ ...f, username: f.username || e.target.value }))}
            required
          />
          <input placeholder="ntfy topic (e.g. trivia-tyrel)" value={form.ntfy_topic} onChange={e => setForm(f => ({ ...f, ntfy_topic: e.target.value }))} required />
          <label>
            Frequency
            <input type="number" min="1" step="any" value={form.freq_value} onChange={e => setForm(f => ({ ...f, freq_value: e.target.value }))} required style={{ marginLeft: '0.5rem', width: 80 }} />
            <select value={form.freq_unit} onChange={e => setForm(f => ({ ...f, freq_unit: e.target.value }))} style={{ marginLeft: '0.25rem' }}>
              <option value="minutes">min</option>
              <option value="hours">hr</option>
            </select>
          </label>
          <label>
            Cycling order
            <select value={form.cycling_order} onChange={e => setForm(f => ({ ...f, cycling_order: e.target.value }))} style={{ marginLeft: '0.5rem' }}>
              <option value="shuffle">Shuffle</option>
              <option value="round-robin">Round-robin</option>
              <option value="random">Random</option>
            </select>
          </label>
          <input placeholder="Login username" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />
          <input type="password" placeholder="Login password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Create</button>
            <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {profiles.map(p => (
          <li key={p.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
            <Link to={`/profiles/${p.id}`}><strong>{p.name}</strong></Link>
            <span style={{ marginLeft: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
              {p.ntfy_topic} · every {formatFrequency(p.send_frequency_minutes)} · {p.cycling_order}
              {p.quiet_start_hour != null && p.quiet_end_hour != null &&
                ` · quiet ${formatHour(p.quiet_start_hour)}–${formatHour(p.quiet_end_hour)}`}
            </span>
          </li>
        ))}
      </ul>
      {profiles.length === 0 && <p style={{ color: '#888' }}>No profiles yet.</p>}
    </div>
  );
}
