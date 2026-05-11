async function publish({ topic, message, title, actions = [] }) {
  const headers = {
    'Authorization': `Bearer ${process.env.NTFY_TOKEN}`,
    'Content-Type': 'text/plain',
  };
  if (title) headers['Title'] = title;
  if (actions.length) headers['Actions'] = actions.join('; ');

  const res = await fetch(`${process.env.NTFY_URL}/${topic}`, {
    method: 'POST',
    headers,
    body: message,
  });

  if (!res.ok) {
    throw new Error(`ntfy publish failed: ${res.status} ${await res.text()}`);
  }
}

module.exports = { publish };
