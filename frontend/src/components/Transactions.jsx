import { useState } from 'react';
import { apiRequest } from '../utils/api';

export default function Transactions({
  books, setBooks, logs, setLogs, isAdmin
}) {
  const [bookId, setBookId] = useState('');
  const [action, setAction] = useState(isAdmin ? 'add' : 'deduct');
  const [qty, setQty] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bookId) {
      alert('Please select a book.');
      return;
    }
    const q = Number(qty);
    if (!Number.isSafeInteger(q) || q < 1) {
      alert('Please enter a valid quantity.');
      return;
    }

    try {
      const result = await apiRequest('/transactions', {
        method: 'POST',
        body: JSON.stringify({ bookId, action, quantity: q })
      });
      setBooks((previous) => previous.map((book) => (
        book.id === result.book.id ? result.book : book
      )));
      const transactions = await apiRequest('/transactions');
      setLogs(transactions.map((item) => item.message));
    } catch (error) {
      alert(error.message);
      return;
    }

    setBookId('');
    setQty('');
  };

  const clearLog = async () => {
    if (!isAdmin) return;
    if (logs.length === 0) {
      alert('Transaction history is already empty.');
      return;
    }
    if (!confirm('Clear all transaction history? This cannot be undone.')) return;
    try {
      await apiRequest('/transactions', { method: 'DELETE' });
      setLogs([]);
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
              <label htmlFor="trans-book">Select Book</label>
              <select
                id="trans-book"
                required
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
              >
                <option value="">-- Choose a book --</option>
                {books.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.title} (Qty: {b.quantity})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="trans-action">Action</label>
              <select
                id="trans-action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                {isAdmin && <option value="add">Add Stock</option>}
                <option value="deduct">Borrow Book</option>
                {!isAdmin && <option value="add">Return Book</option>}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="trans-qty">Quantity</label>
              <input
                type="number"
                id="trans-qty"
                placeholder="Enter quantity"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <button type="submit" className="btn btn-add">
                Process Transaction
              </button>
            </div>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem' }}>
        <h3 className="section-subtitle" style={{ marginTop: '0', borderBottom: 'none', paddingBottom: '0' }}>
          Transaction Log
        </h3>
        {isAdmin && (
          <button className="btn btn-delete" onClick={clearLog}>
            Clear History
          </button>
        )}
      </div>

      <ul className="log-list">
        {logs.slice().reverse().map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </>
  );
}