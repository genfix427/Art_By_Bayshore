import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    }}>
      <div>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, color: '#666' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '1rem' }}>{actions}</div>}
    </div>
  );
};

export default PageHeader;