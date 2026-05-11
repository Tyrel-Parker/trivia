import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function FactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shortDesc, setShortDesc] = useState('');
  const [longDesc, setLongDesc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/facts/${id}`).then(fact => {
        setShortDesc(fact.short_description);
        setLongDesc(fact.long_description || '');
      }).catch(err => setError(err.message));
    }
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (id) {
        await api.put(`/facts/${id}`, { short_description: shortDesc, long_description: longDesc });
      } else {
        await api.post('/facts', { short_description: shortDesc, long_description: longDesc });
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
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit">{id ? 'Save' : 'Add Fact'}</button>
          <button type="button" onClick={() => navigate('/facts')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
