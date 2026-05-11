import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function ProfileDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileFacts, setProfileFacts] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/profiles/${id}`).then(p => { setProfile(p); setEditForm(p); }).catch(console.error);
    api.get(`/profiles/${id}/facts`).then(setProfileFacts).catch(console.error);
    api.get('/facts').then(setAllFacts).catch(console.error);
  }, [id]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const updated = await api.put(`/profiles/${id}`, {
        name: editForm.name,
        ntfy_topic: editForm.ntfy_topic,
        send_frequency_hours: Number(editForm.send_frequency_hours),
        cycling_order: editForm.cycling_order,
      });
      setProfile(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddFact(factId) {
    const pf = await api.post(`/profiles/${id}/facts`, { fact_id: factId });
    const fact = allFacts.find(f => f.id === factId);
    setProfileFacts(prev => [...prev, { ...fact, ...pf }]);
  }

  async function handleRemoveFact(factId) {
    await api.delete(`/profiles/${id}/facts/${factId}`);
    setProfileFacts(prev => prev.filter(f => f.fact_id !== factId && f.id !== factId));
  }

  const profileFactIds = new Set(profileFacts.map(f => f.fact_id ?? f.id));
  const addableFacts = allFacts.filter(f => !profileFactIds.has(f.id));
  const filteredAddable = addableFacts.filter(f =>
    f.short_description.toLowerCase().includes(search.toLowerCase())
  );

  if (!profile) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{profile.name}</h1>
        <button onClick={() => setEditing(s => !s)}>Edit Settings</button>
      </div>

      {editing && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0', padding: '1rem', border: '1px solid #ddd' }}>
          <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" required />
          <input value={editForm.ntfy_topic || ''} onChange={e => setEditForm(f => ({ ...f, ntfy_topic: e.target.value }))} placeholder="ntfy topic" required />
          <label>
            Frequency (hours)
            <input type="number" min="1" value={editForm.send_frequency_hours || 4} onChange={e => setEditForm(f => ({ ...f, send_frequency_hours: e.target.value }))} style={{ marginLeft: '0.5rem', width: 80 }} />
          </label>
          <label>
            Cycling order
            <select value={editForm.cycling_order || 'shuffle'} onChange={e => setEditForm(f => ({ ...f, cycling_order: e.target.value }))} style={{ marginLeft: '0.5rem' }}>
              <option value="shuffle">Shuffle</option>
              <option value="round-robin">Round-robin</option>
              <option value="random">Random</option>
            </select>
          </label>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      <section style={{ marginTop: '1.5rem' }}>
        <h2>Facts in this profile ({profileFacts.length})</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {profileFacts.map(f => (
            <li key={f.id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                <Link to={`/facts/${f.fact_id ?? f.id}`}>{f.short_description}</Link>
                <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#aaa' }}>
                  sent {f.send_count}×{f.last_sent_at ? `, last ${new Date(f.last_sent_at).toLocaleDateString()}` : ''}
                </span>
              </span>
              <button onClick={() => handleRemoveFact(f.fact_id ?? f.id)}>Remove</button>
            </li>
          ))}
        </ul>
        {profileFacts.length === 0 && <p style={{ color: '#888' }}>No facts added yet.</p>}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Add facts</h2>
        <input
          placeholder="Search facts to add..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem' }}
        />
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredAddable.slice(0, 50).map(f => (
            <li key={f.id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{f.short_description}</span>
              <button onClick={() => handleAddFact(f.id)}>Add</button>
            </li>
          ))}
        </ul>
        {filteredAddable.length === 0 && addableFacts.length > 0 && <p style={{ color: '#888' }}>No matching facts.</p>}
        {addableFacts.length === 0 && <p style={{ color: '#888' }}>All facts are already in this profile.</p>}
      </section>
    </div>
  );
}
