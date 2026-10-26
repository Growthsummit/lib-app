import { useState } from 'react';
import { apiRequest } from '../utils/api';

export default function UserManagement({ users, setUsers, isAdmin }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [role, setRole] = useState('Librarian');

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setMemberId('');
    setRole('Librarian');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const n = name.trim();
    const m = memberId.trim();
    if (!n || !m) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const payload = { name: n, memberId: m, role };
      const savedUser = editingId
        ? await apiRequest(`/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        : await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      setUsers((previous) => editingId
        ? previous.map((user) => user.id === editingId ? savedUser : user)
        : [...previous, savedUser]);
      resetForm();
    } catch (error) {
      alert(error.message);
    }
  };

  const startEdit = (u) => {
    if (!isAdmin) return;
    setEditingId(u.id);
    setName(u.name);
    setMemberId(u.memberId);
    setRole(u.role);
  };

  const handleDelete = async (user) => {
    if (!isAdmin) return;
    const confirmation = user.username
      ? `Delete registered account "${user.username}"? They will no longer be able to sign in.`
      : 'Delete this user?';
    if (!confirm(confirmation)) return;
    try {
      await apiRequest(`/users/${user.id}`, { method: 'DELETE' });
      setUsers((previous) => previous.filter((item) => item.id !== user.id));
    } catch (error) {
      alert(error.message);
    }
  };

  const refreshUsers = async () => {
    try {
      setUsers(await apiRequest('/users'));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <div className="form-wrapper">
        <form className="classic-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="user-name">Full Name</label>
              <input
                type="text"
                id="user-name"
                placeholder="Enter full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-mid">Member ID</label>
              <input
                type="text"
                id="user-mid"
                placeholder="Enter member ID"
                required
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label htmlFor="user-role">Role</label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={!isAdmin}
              >
                <option value="Librarian">Librarian</option>
                <option value="Member">Member</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <button type="submit" className="btn btn-add" disabled={!isAdmin}>
                {editingId ? 'Update User' : 'Add User'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-cancel"
                  style={{ display: 'inline-block', marginLeft: '0.5rem' }}
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <h3 className="section-subtitle">Registered Users</h3>
        {isAdmin && (
          <button className="btn btn-update" onClick={refreshUsers}>
            Refresh Users
          </button>
        )}
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Member ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5">No users are currently stored in the database.</td>
              </tr>
            ) : users.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.memberId}</td>
                  <td>{u.username || '—'}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.username
                      ? (
                        <>
                          <span style={{ marginRight: '0.5rem' }}>Registered account</span>
                          <button
                            className="btn btn-delete"
                            disabled={!isAdmin}
                            onClick={() => handleDelete(u)}
                          >
                            Delete
                          </button>
                        </>
                      )
                      : (
                        <>
                          <button
                            className="btn btn-update"
                            style={{ marginRight: '0.5rem' }}
                            disabled={!isAdmin}
                            onClick={() => startEdit(u)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-delete"
                            disabled={!isAdmin}
                            onClick={() => handleDelete(u)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}