import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function FactDetail() {
  const { id } = useParams();
  const [fact, setFact] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/facts/${id}`).then(setFact).catch(err => setError(err.message));
  }, [id]);

  if (error) return <div style={{ padding: '2rem' }}>Fact not found.</div>;
  if (!fact) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>{fact.short_description}</h1>
      {fact.category_name && (
        <span style={{ fontSize: '0.8rem', background: '#f0f0f0', borderRadius: 3, padding: '0.15rem 0.5rem', color: '#555' }}>
          {fact.category_name}
        </span>
      )}
      {fact.long_description && (
        <div style={{ marginTop: '1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {fact.long_description}
        </div>
      )}
      <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#888' }}>
        Added {new Date(fact.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
