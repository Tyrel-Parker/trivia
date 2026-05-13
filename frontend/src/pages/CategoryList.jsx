import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then(setCategories).catch(console.error);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const cat = await api.post('/categories', { name: newName });
      setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  async function handleRename(e) {
    e.preventDefault();
    setError('');
    try {
      const updated = await api.put(`/categories/${editingId}`, { name: editName });
      setCategories(prev => prev.map(c => c.id === editingId ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this category? Facts in it will become uncategorized.')) return;
    await api.delete(`/categories/${id}`);
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Categories</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name"
          required
          style={{ flex: 1, padding: '0.4rem' }}
        />
        <button type="submit">Add</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {categories.map(cat => (
          <li key={cat.id} style={{ borderBottom: '1px solid #eee', padding: '0.6rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {editingId === cat.id ? (
              <form onSubmit={handleRename} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  style={{ flex: 1, padding: '0.3rem' }}
                  autoFocus
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span style={{ flex: 1 }}>{cat.name}</span>
                <button onClick={() => startEdit(cat)}>Rename</button>
                <button onClick={() => handleDelete(cat.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>

      {categories.length === 0 && <p style={{ color: '#888' }}>No categories yet.</p>}
    </div>
  );
}
