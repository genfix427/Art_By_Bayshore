const Table = ({ columns, data, onRowClick }) => {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        backgroundColor: 'white',
        borderCollapse: 'collapse',
        border: '1px solid #ddd',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            {columns.map((col, index) => (
              <th
                key={index}
                style={{
                  padding: '1rem',
                  textAlign: col.align || 'left',
                  borderBottom: '2px solid #ddd',
                  fontWeight: 'bold',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#666',
                }}
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  borderBottom: '1px solid #eee',
                }}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      padding: '1rem',
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render ? col.render(row) : row[col.field]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;