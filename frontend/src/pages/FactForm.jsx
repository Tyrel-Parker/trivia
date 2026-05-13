import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function FactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(() => {});
    if (id) {
      api.get(`/facts/${id}`).then(fact => {
        setShortDesc(fact.short_description);
        setLongDesc(fact.long_description || '');
        setCategoryId(fact.category_id ?? '');
      }).catch(err => setError(err.message));
    } else {
      api.get('/profiles').then(setProfiles).catch(() => {});
    }
  }, [id]);

  function toggleProfile(profileId) {
    setSelectedProfiles(prev =>
      prev.includes(profileId) ? prev.filter(p => p !== profileId) : [...prev, profileId]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        short_description: shortDesc,
        long_description: longDesc,
        category_id: categoryId !== '' ? Number(categoryId) : null,
      };
      if (id) {
        await api.put(`/facts/${id}`, payload);
      } else {
        const fact = await api.post('/facts', payload);
        await Promise.all(selectedProfiles.map(pid => api.post(`/profiles/${pid}/facts`, { fact_id: fact.id })));
      }
      navigate('/facts');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>{id ? 'Edit Fact' : 'Add Fact'}</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <label>
          Short description (shown in notifications)
          <input
            value={shortDesc}
            onChange={e => setShortDesc(e.target.value)}
            placeholder="Grace Hopper developed the first compiler"
            required
            style={{ display: 'block', width: '100%', marginTop: '0.25rem' }}
          />
        </label>
        <label>
          Long description (detail page)
          <textarea
            value={longDesc}
            onChange={e => setLongDesc(e.target.value)}
            placeholder="More context, links, notes..."
            rows={10}
            style={{ display: 'block', width: '100%', marginTop: '0.25rem', fontFamily: 'inherit' }}
          />
        </label>
        <label>
          Category
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            style={{ display: 'block', marginTop: '0.25rem' }}
          >
            <option value="">— none —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        {!id && profiles.length > 0 && (
          <fieldset style={{ border: '1px solid #ccc', borderRadius: 4, padding: '0.75rem' }}>
            <legend>Add to profiles</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {profiles.map(p => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={selectedProfiles.includes(p.id)}
                    onChange={() => toggleProfile(p.id)}
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit">{id ? 'Save' : 'Add Fact'}</button>
          <button type="button" onClick={() => navigate('/facts')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
