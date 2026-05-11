import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function FactList() {
  const { user } = useAuth();
  const [facts, setFacts] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/facts').then(setFacts).catch(console.error);
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this fact from the library?')) return;
    await api.delete(`/facts/${id}`);
    setFacts(f => f.filter(x => x.id !== id));
  }

  const filtered = facts.filter(f =>
    f.short_description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Facts</h1>
        <Link to="/facts/new"><button>+ Add Fact</button></Link>
      </div>
      <input
        placeholder="Search facts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
      />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map(fact => (
          <li key={fact.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Link to={`/facts/${fact.id}`}>{fact.short_description}</Link>
              {fact.long_description && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
                  {fact.long_description.slice(0, 120)}{fact.long_description.length > 120 ? '…' : ''}
                </p>
              )}
            </div>
            <Link to={`/facts/${fact.id}/edit`}><button>Edit</button></Link>
            {user.role === 'admin' && (
              <button onClick={() => handleDelete(fact.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
      {filtered.length === 0 && <p style={{ color: '#888' }}>No facts found.</p>}
    </div>
  );
}
