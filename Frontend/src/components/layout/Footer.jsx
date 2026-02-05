import { Link } from 'react-router-dom';
import NewsletterSubscribe from '../newsletter/NewsletterSubscribe';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#333',
      color: 'white',
      padding: '3rem 2rem 1rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
      }}>
        <div>
          <h3>Artwork Store</h3>
          <p style={{ marginTop: '1rem', color: '#ccc' }}>
            Discover unique artworks and paintings from talented artists around the world.
          </p>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/products" style={{ color: '#ccc', textDecoration: 'none' }}>Browse Art</Link>
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <Link to="/orders" style={{ color: '#ccc', textDecoration: 'none' }}>My Orders</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Newsletter</h4>
          <p style={{ marginTop: '1rem', color: '#ccc', marginBottom: '1rem' }}>
            Subscribe to get updates on new arrivals and exclusive offers.
          </p>
          <NewsletterSubscribe />
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0',
        paddingTop: '1rem',
        borderTop: '1px solid #555',
        textAlign: 'center',
        color: '#ccc',
      }}>
        <p>&copy; {new Date().getFullYear()} Artwork Store. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;