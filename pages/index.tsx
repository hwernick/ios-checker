/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    keywords: '',
    ageRating: ''
  });

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();
    setMessage(result.success ? 'Upload successful' : 'Upload failed');
    setResults(result.results || []);
  };

  // ✅ Group the results outside the JSX map to avoid type issues
  const grouped = Object.entries(
    results.reduce((acc, rule) => {
      const section = rule.section || 'Other';
      if (!acc[section]) acc[section] = [];
      acc[section].push(rule);
      return acc;
    }, {} as Record<string, any[]>)
  ) as [string, any[]][]; // ✅ Explicitly cast entries to the right type

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8 max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">App Store Compliance Checker</h1>

      <div className="space-y-4">
        <input
          className="w-full border border-gray-300 p-2 rounded"
          type="text"
          placeholder="App Title"
          value={metadata.title}
          onChange={e => setMetadata({ ...metadata, title: e.target.value })}
        />
        <textarea
          className="w-full border border-gray-300 p-2 rounded"
          placeholder="App Description"
          rows={3}
          value={metadata.description}
          onChange={e => setMetadata({ ...metadata, description: e.target.value })}
        />
        <input
          className="w-full border border-gray-300 p-2 rounded"
          type="text"
          placeholder="Keywords (comma-separated)"
          value={metadata.keywords}
          onChange={e => setMetadata({ ...metadata, keywords: e.target.value })}
        />
        <input
          className="w-full border border-gray-300 p-2 rounded"
          type="text"
          placeholder="Age Rating"
          value={metadata.ageRating}
          onChange={e => setMetadata({ ...metadata, ageRating: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Upload
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </div>

      {grouped.length > 0 && (
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="text-lg font-semibold mb-3">Scan Results</h2>

          {grouped.map(([section, groupedRules]) => (
            <div key={section} className="mb-6">
              <h3 className="text-md font-semibold mb-2 text-blue-800">{section}</h3>
              <ul className="space-y-2">
                {groupedRules.map((r, i) => (
                  <li
                    key={i}
                    className={`p-2 rounded ${r.passed ? 'bg-green-200' : 'bg-red-200'}`}
                  >
                    <strong>{r.description}</strong> —{' '}
                    <span>{r.passed ? '✅ Passed' : '❌ Missing or Invalid'}</span>
                    <span className="ml-2 text-sm text-gray-700">({r.severity})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
