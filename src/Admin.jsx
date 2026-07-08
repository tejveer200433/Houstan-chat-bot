import { useState, useEffect, useCallback, useMemo } from 'react';
import './Admin.css';

export default function Admin() {
  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://houstan-chat-bot.onrender.com';

  // Fetch all leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://houstan-chat-bot.onrender.com/api/leads");
        const data = await res.json();
        if (data.success) {
          setLeads(data.leads);
        }
        setError('');
      } catch (err) {
        setError('Failed to load leads: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name.toLowerCase().includes(query) ||
      lead.phone.includes(query) ||
      (lead.email && lead.email.toLowerCase().includes(query))
    );
  }, [searchQuery, leads]);

  const handleEditClick = useCallback((lead) => {
    setEditingId(lead.id);
    setEditFormData({ ...lead });
  }, []);

  const handleEditChange = useCallback((field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSave = useCallback(async (leadId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to update lead');
        return;
      }

      setLeads(prev => prev.map(l => l.id === leadId ? editFormData : l));
      setEditingId(null);
      setEditFormData({});
      setError('');
    } catch (err) {
      setError('Failed to update lead: ' + err.message);
    }
  }, [editFormData, BACKEND_URL]);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setEditFormData({});
  }, []);

  const handleDelete = useCallback(async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/leads/${leadId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to delete lead');
        return;
      }

      setLeads(prev => prev.filter(l => l.id !== leadId));
      setError('');
    } catch (err) {
      setError('Failed to delete lead: ' + err.message);
    }
  }, [BACKEND_URL]);

  const handleExportCSV = useCallback(() => {
    if (filteredLeads.length === 0) {
      setError('No leads to export');
      return;
    }

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Regarding', 'Date & Time'];
    const rows = filteredLeads.map(lead => [
      lead.id,
      `"${lead.name}"`,
      `"${lead.phone}"`,
      `"${lead.email || ''}"`,
      `"${lead.regarding}"`,
      `"${lead.created_at}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredLeads]);

  const handleBackToChat = useCallback(() => {
    window.location.href = '/#/';
  }, []);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button className="back-btn" onClick={handleBackToChat} title="Back to chat">
          ← Back to Chat
        </button>
      </div>

      {error && (
        <div className="admin-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      <div className="admin-controls">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search leads"
          />
          <span className="search-icon">🔍</span>
        </div>
        <button className="export-btn" onClick={handleExportCSV} title="Export to CSV">
          📥 Export CSV
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="empty-state">
          {leads.length === 0 ? 'No leads yet' : 'No leads match your search'}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Regarding</th>
                <th>Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className={editingId === lead.id ? 'editing' : ''}>
                  <td className="cell-id">{lead.id}</td>
                  <td>
                    {editingId === lead.id ? (
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={e => handleEditChange('name', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      lead.name
                    )}
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={e => handleEditChange('phone', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      lead.phone
                    )}
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e => handleEditChange('email', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      lead.email || '—'
                    )}
                  </td>
                  <td>
                    {editingId === lead.id ? (
                      <select
                        value={editFormData.regarding}
                        onChange={e => handleEditChange('regarding', e.target.value)}
                        className="edit-select"
                      >
                        <option>Service Inquiry</option>
                        <option>Project Quote</option>
                        <option>Technical Support</option>
                        <option>General Query</option>
                      </select>
                    ) : (
                      lead.regarding
                    )}
                  </td>
                  <td className="cell-timestamp">{lead.created_at}</td>
                  <td className="cell-actions">
                    {editingId === lead.id ? (
                      <>
                        <button
                          className="save-btn"
                          onClick={() => handleSave(lead.id)}
                          title="Save changes"
                        >
                          ✓ Save
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={handleCancel}
                          title="Cancel editing"
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => handleEditClick(lead)}
                          title="Edit lead"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(lead.id)}
                          title="Delete lead"
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-footer">
        <small>Total leads: <strong>{leads.length}</strong> | Showing: <strong>{filteredLeads.length}</strong></small>
      </div>
    </div>
  );
}
