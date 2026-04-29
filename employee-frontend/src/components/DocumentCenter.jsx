import { useState, useEffect, useCallback, useRef } from 'react';
import { getDocuments, uploadDocument, deleteDocument, downloadDocument } from '../api/funFeaturesApi';

const CATEGORIES = ['All', 'Policy', 'Handbook', 'Form', 'Announcement', 'General'];
const CAT_ICON = { Policy: '📋', Handbook: '📚', Form: '📝', Announcement: '📢', General: '📄' };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentCenter({ role }) {
  const isHrAdmin = role === 'Admin' || role === 'HR';
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'General' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [downloading, setDownloading] = useState({});
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getDocuments(catFilter === 'All' ? undefined : catFilter);
      setDocs(r.data);
    } catch {}
    setLoading(false);
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async () => {
    if (!form.title.trim() || !file) { setUploadError('Title and file required.'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('Max file size is 10MB.'); return; }
    setUploading(true); setUploadError('');
    try {
      const b64 = await toBase64(file);
      await uploadDocument({ title: form.title, category: form.category, fileName: file.name, contentType: file.type || 'application/octet-stream', fileBase64: b64.split(',')[1] });
      setShowUpload(false); setForm({ title: '', category: 'General' }); setFile(null);
      load();
    } catch (e) {
      setUploadError(e.response?.data || 'Upload failed.');
    }
    setUploading(false);
  };

  const handleDownload = async (doc) => {
    setDownloading(d => ({ ...d, [doc.id]: true }));
    try {
      const r = await downloadDocument(doc.id);
      const url = window.URL.createObjectURL(new Blob([r.data], { type: doc.contentType }));
      const a = document.createElement('a');
      a.href = url; a.download = doc.fileName; a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
    setDownloading(d => ({ ...d, [doc.id]: false }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    await deleteDocument(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ color: '#fff', margin: 0 }}>Document Center 📁</h3>
        {isHrAdmin && (
          <button onClick={() => setShowUpload(true)}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#74b9ff,#0984e3)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            ↑ Upload Document
          </button>
        )}
      </div>

      {showUpload && (
        <div style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h4 style={{ color: '#74b9ff', margin: '0 0 16px' }}>Upload Document</h4>
          {uploadError && <div style={{ color: '#ff6b6b', marginBottom: 12, fontSize: 13 }}>{uploadError}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Document title"
              style={{ padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff' }} />
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              style={{ padding: '10px 14px', background: '#2a2a3e', border: '1px solid #444', borderRadius: 8, color: '#fff' }}>
              {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div
            onClick={() => fileRef.current.click()}
            style={{ border: `2px dashed ${file ? '#74b9ff' : '#444'}`, borderRadius: 10, padding: 24, textAlign: 'center', cursor: 'pointer', marginBottom: 12, background: file ? '#74b9ff11' : '#2a2a3e' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            {file ? (
              <div style={{ color: '#74b9ff' }}>{file.name} ({formatSize(file.size)})</div>
            ) : (
              <div style={{ color: '#888' }}>Click to choose a file (max 10MB)</div>
            )}
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0] || null)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleUpload} disabled={uploading}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#74b9ff,#0984e3)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : '↑ Upload'}
            </button>
            <button onClick={() => { setShowUpload(false); setFile(null); setUploadError(''); }}
              style={{ padding: '10px 20px', background: '#2a2a3e', border: '1px solid #555', borderRadius: 8, color: '#aaa', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: catFilter === cat ? '#74b9ff' : '#2a2a3e', color: catFilter === cat ? '#000' : '#aaa' }}>
            {cat !== 'All' ? CAT_ICON[cat] + ' ' : ''}{cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : docs.length === 0 ? (
        <div style={{ color: '#666', textAlign: 'center', padding: 60, background: '#1e1e2e', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
          <div>No documents found.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {docs.map(doc => (
            <div key={doc.id} style={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32 }}>{CAT_ICON[doc.category] ?? '📄'}</div>
                <span style={{ background: '#2a2a3e', color: '#888', padding: '2px 10px', borderRadius: 10, fontSize: 11 }}>{doc.category}</span>
              </div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginTop: 10 }}>{doc.title}</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{doc.fileName}</div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
                {formatSize(doc.fileSizeBytes)} · v{doc.version} · {new Date(doc.createdAt).toLocaleDateString()}
              </div>
              <div style={{ color: '#666', fontSize: 11 }}>Uploaded by {doc.uploadedBy}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={() => handleDownload(doc)} disabled={downloading[doc.id]}
                  style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg,#74b9ff,#0984e3)', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                  {downloading[doc.id] ? '...' : '↓ Download'}
                </button>
                {isHrAdmin && (
                  <button onClick={() => handleDelete(doc.id)}
                    style={{ padding: '8px 14px', background: '#ff6b6b22', border: '1px solid #ff6b6b44', borderRadius: 7, color: '#ff6b6b', cursor: 'pointer' }}>
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
