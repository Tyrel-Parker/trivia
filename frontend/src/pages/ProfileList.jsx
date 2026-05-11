import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function ProfileList() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', ntfy_topic: '', send_frequency_hours: 4, cycling_order: 'shuffle', user_id: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/profiles').then(setProfiles).catch(console.error);
    if (user.role === 'admin') {
      api.get('/auth/users').then(setUsers).catch(console.error);
    }
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const created = await api.post('/profiles', { ...form, send_frequency_hours: Number(form.send_frequency_hours), user_id: Number(form.user_id) });
      setProfiles(p => [...p, created]);
      setShowForm(false);
      setForm({ name: '', ntfy_topic: '', send_frequency_hours: 4, cycling_order: 'shuffle', user_id: '' });
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
          <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input placeholder="ntfy topic (e.g. trivia-tyrel)" value={form.ntfy_topic} onChange={e => setForm(f => ({ ...f, ntfy_topic: e.target.value }))} required />
          <label>
            Frequency (hours)
            <input type="number" min="1" value={form.send_frequency_hours} onChange={e => setForm(f => ({ ...f, send_frequency_hours: e.target.value }))} required style={{ marginLeft: '0.5rem', width: 80 }} />
          </label>
          <label>
            Cycling order
            <select value={form.cycling_order} onChange={e => setForm(f => ({ ...f, cycling_order: e.target.value }))} style={{ marginLeft: '0.5rem' }}>
              <option value="shuffle">Shuffle</option>
              <option value="round-robin">Round-robin</option>
              <option value="random">Random</option>
            </select>
          </label>
          <label>
            User
            <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} required style={{ marginLeft: '0.5rem' }}>
              <option value="">Select user</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </label>
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
              {p.ntfy_topic} · every {p.send_frequency_hours}h · {p.cycling_order}
            </span>
          </li>
        ))}
      </ul>
      {profiles.length === 0 && <p style={{ color: '#888' }}>No profiles yet.</p>}
    </div>
  );
}
