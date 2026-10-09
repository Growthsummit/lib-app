import { useState } from 'react';

export default function Transactions({
  books, setBooks, logs, setLogs, isAdmin, currentUser, addLog
}) {
  const [bookId, setBookId] = useState('');
  const [action, setAction] = useState(isAdmin ? 'add' : 'deduct');
  const [qty, setQty] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!bookId) {
      alert('Please select a book.');
      return;
    }
    const q = parseInt(qty, 10);
    if (!q || q < 1) {
      alert('Please enter a valid quantity.');
      return;
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    if (action === 'add') {
      setBooks(prev => prev.map(b =>
        b.id === bookId ? { ...b, quantity: b.quantity + q } : b
      ));
      if (isAdmin) {
        addLog(`Added ${q} stock to "${book.title}" (now ${book.quantity + q})`);
      } else {
        addLog(`${currentUser.username} returned ${q} of "${book.title}" (now ${book.quantity + q})`);
      }
    } else {
      if (book.quantity < q) {
        alert(`Not enough stock. Only ${book.quantity} available.`);
        return;
      }
      setBooks(prev => prev.map(b =>
        b.id === bookId ? { ...b, quantity: b.quantity - q } : b
      ));
      if (isAdmin) {
        addLog(`Deducted ${q} from "${book.title}" (now ${book.quantity - q})`);
      } else {
        addLog(`${currentUser.username} borrowed ${q} of "${book.title}" (now ${book.quantity - q})`);
      }
    }

    setBookId('');
    setQty('');
  };

  const clearLog = () => {
    if (!isAdmin) return;
    if (logs.length === 0) {
      alert('Transaction history is already empty.');
      return;
    }
    if (!confirm('Clear all transaction history? This cannot be undone.')) return;
    setLogs([]);
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
        <button
          className="btn btn-delete"
          disabled={!isAdmin}
          onClick={clearLog}
        >
          Clear History
        </button>
      </div>

      <ul className="log-list">
        {logs.slice().reverse().map((log, i) => (
          <li key={i}>{log}</li>
        ))}
      </ul>
    </>
  );
}