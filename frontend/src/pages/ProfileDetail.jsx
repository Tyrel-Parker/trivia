import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

function splitFrequency(minutes) {
  if (minutes % 60 === 0) return { freq_value: minutes / 60, freq_unit: 'hours' };
  return { freq_value: minutes, freq_unit: 'minutes' };
}

function toMinutes(value, unit) {
  return unit === 'hours' ? Math.round(parseFloat(value) * 60) : Math.round(parseFloat(value));
}

export default function ProfileDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileFacts, setProfileFacts] = useState([]);
  const [allFacts, setAllFacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [bulkAdding, setBulkAdding] = useState(false);
  const [factsExpanded, setFactsExpanded] = useState(false);

  useEffect(() => {
    api.get(`/profiles/${id}`).then(p => { setProfile(p); setEditForm({ ...p, ...splitFrequency(p.send_frequency_minutes) }); }).catch(console.error);
    api.get(`/profiles/${id}/facts`).then(setProfileFacts).catch(console.error);
    api.get('/facts').then(setAllFacts).catch(console.error);
    api.get('/categories').then(setCategories).catch(console.error);
  }, [id]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    try {
      const updated = await api.put(`/profiles/${id}`, {
        name: editForm.name,
        ntfy_topic: editForm.ntfy_topic,
        send_frequency_minutes: toMinutes(editForm.freq_value, editForm.freq_unit),
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

  async function handleAddAll() {
    if (filteredAddable.length === 0) return;
    setBulkAdding(true);
    try {
      const results = await Promise.all(
        filteredAddable.map(f => api.post(`/profiles/${id}/facts`, { fact_id: f.id }).then(pf => ({ ...f, ...pf })))
      );
      setProfileFacts(prev => [...prev, ...results]);
    } finally {
      setBulkAdding(false);
    }
  }

  const profileFactIds = new Set(profileFacts.map(f => f.fact_id ?? f.id));
  const addableFacts = allFacts.filter(f => !profileFactIds.has(f.id));

  const filteredAddable = addableFacts.filter(f => {
    const matchesSearch = f.short_description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' ||
      (categoryFilter === 'null' ? f.category_id == null : String(f.category_id) === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const selectedCategory = categories.find(c => String(c.id) === categoryFilter);

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
            Frequency
            <input type="number" min="1" step="any" value={editForm.freq_value || ''} onChange={e => setEditForm(f => ({ ...f, freq_value: e.target.value }))} style={{ marginLeft: '0.5rem', width: 80 }} />
            <select value={editForm.freq_unit || 'hours'} onChange={e => setEditForm(f => ({ ...f, freq_unit: e.target.value }))} style={{ marginLeft: '0.25rem' }}>
              <option value="minutes">min</option>
              <option value="hours">hr</option>
            </select>
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
        <button
          onClick={() => setFactsExpanded(s => !s)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <h2 style={{ margin: 0 }}>{factsExpanded ? '▾' : '▸'} Facts in this profile ({profileFacts.length})</h2>
        </button>
        {factsExpanded && (
          <>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {profileFacts.map(f => (
                <li key={f.id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Link to={`/facts/${f.fact_id ?? f.id}`}>{f.short_description}</Link>
                    <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {f.category_name && (
                        <span style={{ fontSize: '0.75rem', background: '#f0f0f0', borderRadius: 3, padding: '0.1rem 0.4rem', color: '#555' }}>
                          {f.category_name}
                        </span>
                      )}
                      {f.long_description && (
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>
                          {f.long_description.slice(0, 100)}{f.long_description.length > 100 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveFact(f.fact_id ?? f.id)}>Remove</button>
                </li>
              ))}
            </ul>
            {profileFacts.length === 0 && <p style={{ color: '#888' }}>No facts added yet.</p>}
          </>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Add facts</h2>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            placeholder="Search facts to add..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '0.5rem' }}
          />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '0.5rem' }}
          >
            <option value="">All categories</option>
            <option value="null">Uncategorized</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        {filteredAddable.length > 0 && (
          <button
            onClick={handleAddAll}
            disabled={bulkAdding}
            style={{ marginBottom: '0.75rem' }}
          >
            {bulkAdding
              ? 'Adding…'
              : selectedCategory
                ? `Add all ${filteredAddable.length} from "${selectedCategory.name}"`
                : `Add all ${filteredAddable.length} facts`}
          </button>
        )}

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredAddable.slice(0, 50).map(f => (
            <li key={f.id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {f.short_description}
                {f.category_name && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#f0f0f0', borderRadius: 3, padding: '0.1rem 0.4rem', color: '#555' }}>
                    {f.category_name}
                  </span>
                )}
              </span>
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
