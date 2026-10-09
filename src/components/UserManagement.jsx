import { useState } from 'react';

export default function UserManagement({ users, setUsers, isAdmin, addLog }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const n = name.trim();
    const m = memberId.trim();
    if (!n || !m) {
      alert('Please fill in all required fields.');
      return;
    }

    if (editingId) {
      setUsers(prev => prev.map(u =>
        u.id === editingId ? { ...u, name: n, memberId: m, role } : u
      ));
      addLog(`Updated user: ${n}`);
    } else {
      setUsers(prev => [...prev, { id: Date.now().toString(), name: n, memberId: m, role }]);
      addLog(`Added user: ${n}`);
    }
    resetForm();
  };

  const startEdit = (u) => {
    if (!isAdmin) return;
    setEditingId(u.id);
    setName(u.name);
    setMemberId(u.memberId);
    setRole(u.role);
  };

  const handleDelete = (id) => {
    if (!isAdmin) return;
    if (!confirm('Delete this user?')) return;
    const u = users.find(x => x.id === id);
    setUsers(prev => prev.filter(x => x.id !== id));
    if (u) addLog(`Deleted user: ${u.name}`);
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

      <h3 className="section-subtitle">Registered Users</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Member ID</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.memberId}</td>
                <td>{u.role}</td>
                <td>
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
                    onClick={() => handleDelete(u.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}