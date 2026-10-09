export default function Dashboard({ books }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>ISBN</th>
            <th>Quantity</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b) => {
            const isLow = b.quantity < 2;
            return (
              <tr key={b.id} className={isLow ? 'low-stock' : ''}>
                <td>{b.title}</td>
                <td>{b.author}</td>
                <td>{b.genre}</td>
                <td>{b.isbn}</td>
                <td>{b.quantity}</td>
                <td>
                  {isLow ? <span className="badge-low">Low Stock</span> : 'Available'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}