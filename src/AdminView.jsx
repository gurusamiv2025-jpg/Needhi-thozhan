import React, { useEffect, useState } from 'react';

export default function AdminView() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feedback')
      .then(res => res.json())
      .then(data => {
        setFeedback(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Moderation / Admin View</h1>
      <p>Recent User Feedback</p>
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Query</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Response Snippet</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Feedback</th>
            </tr>
          </thead>
          <tbody>
            {feedback.map(f => (
              <tr key={f.id}>
                <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '14px' }}>
                  {new Date(f.created_at).toLocaleString()}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '14px' }}>
                  {f.query}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '14px', color: '#555' }}>
                  {f.response_summary}
                </td>
                <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center' }}>
                  {f.feedback_type === 'up' ? '👍' : '👎'}
                </td>
              </tr>
            ))}
            {feedback.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No feedback yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: '30px' }}>
        <a href="/" style={{ color: '#0066cc', textDecoration: 'none' }}>&larr; Back to App</a>
      </div>
    </div>
  );
}
