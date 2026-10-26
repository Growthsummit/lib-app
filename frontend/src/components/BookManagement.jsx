import { useState } from 'react';
import { apiRequest } from '../utils/api';

export default function BookManagement({ books, setBooks, isAdmin, onTransactionsChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [isbn, setIsbn] = useState('');
  const [qty, setQty] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setAuthor('');
    setGenre('');
    setIsbn('');
    setQty('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    const t = title.trim();
    const a = author.trim();
    const g = genre.trim();
    const i = isbn.trim();
    const q = Number(qty);

    if (!t || !a || !i || !Number.isSafeInteger(q) || q < 1) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    try {
      const payload = { title: t, author: a, genre: g, isbn: i, quantity: q };
      const savedBook = editingId
        ? await apiRequest(`/books/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
        : await apiRequest('/books', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      const quantityChanged = !editingId || books.find((book) => book.id === editingId)?.quantity !== savedBook.quantity;
      setBooks((previous) => editingId
        ? previous.map((book) => book.id === editingId ? savedBook : book)
        : [...previous, savedBook]);
      resetForm();
      if (quantityChanged) await onTransactionsChanged();
    } catch (error) {
      alert(error.message);
    }
  };

  const startEdit = (b) => {
    if (!isAdmin) return;
    setEditingId(b.id);
    setTitle(b.title);
    setAuthor(b.author);
    setGenre(b.genre);
    setIsbn(b.isbn);
    setQty(String(b.quantity));
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return;
    if (!confirm('Delete this book?')) return;
    try {
      await apiRequest(`/books/${id}`, { method: 'DELETE' });
      setBooks((previous) => previous.filter((book) => book.id !== id));
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
              <label htmlFor="book-title">Book Title</label>
              <input
                type="text"
                id="book-title"
                placeholder="Enter book title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label htmlFor="book-author">Author</label>
              <input
                type="text"
                id="book-author"
                placeholder="Enter author name"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="book-genre">Genre</label>
              <input
                type="text"
                id="book-genre"
                placeholder="Enter genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label htmlFor="book-isbn">ISBN</label>
              <input
                type="text"
                id="book-isbn"
                placeholder="Enter ISBN"
                required
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
            <div className="form-group">
              <label htmlFor="book-qty">Quantity</label>
              <input
                type="number"
                id="book-qty"
                placeholder="Enter quantity"
                min="1"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={!isAdmin}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <button type="submit" className="btn btn-add" disabled={!isAdmin}>
                {editingId ? 'Update Book' : 'Add Book'}
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

      <h3 className="section-subtitle">Book Inventory</h3>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Genre</th>
              <th>ISBN</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.genre}</td>
                <td>{b.isbn}</td>
                <td>{b.quantity}</td>
                <td>
                  <button
                    className="btn btn-update"
                    style={{ marginRight: '0.5rem' }}
                    disabled={!isAdmin}
                    onClick={() => startEdit(b)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-delete"
                    disabled={!isAdmin}
                    onClick={() => handleDelete(b.id)}
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