import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export default function FactList() {
  const { user } = useAuth();
  const [facts, setFacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    api.get('/facts').then(setFacts).catch(console.error);
    api.get('/categories').then(setCategories).catch(console.error);
  }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this fact from the library?')) return;
    await api.delete(`/facts/${id}`);
    setFacts(f => f.filter(x => x.id !== id));
  }

  const filtered = facts.filter(f => {
    const matchesSearch = f.short_description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' ||
      (categoryFilter === 'null' ? f.category_id == null : String(f.category_id) === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Facts</h1>
        <Link to="/facts/new"><button>+ Add Fact</button></Link>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          placeholder="Search facts..."
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
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map(fact => (
          <li key={fact.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Link to={`/facts/${fact.id}`}>{fact.short_description}</Link>
              <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {fact.category_name && (
                  <span style={{ fontSize: '0.75rem', background: '#f0f0f0', borderRadius: 3, padding: '0.1rem 0.4rem', color: '#555' }}>
                    {fact.category_name}
                  </span>
                )}
                {fact.long_description && (
                  <span style={{ fontSize: '0.85rem', color: '#888' }}>
                    {fact.long_description.slice(0, 100)}{fact.long_description.length > 100 ? '…' : ''}
                  </span>
                )}
              </div>
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
