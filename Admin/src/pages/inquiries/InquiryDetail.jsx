import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inquiryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency, formatDateTime, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const InquiryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responseData, setResponseData] = useState({
    message: '',
    quotedPrice: '',
  });
  const [newNote, setNewNote] = useState('');
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    priority: '',
    quotedPrice: '',
  });

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  const fetchInquiry = async () => {
    try {
      const response = await inquiryService.getById(id);
      setInquiry(response.data);
      setStatusUpdate({
        status: response.data.status,
        priority: response.data.priority,
        quotedPrice: response.data.quotedPrice || '',
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/inquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    setResponding(true);

    try {
      await inquiryService.respond(id, responseData);
      toast.success('Response sent successfully');
      setResponseData({ message: '', quotedPrice: '' });
      await fetchInquiry();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResponding(false);
    }
  };

  const handleUpdateStatus = async () => {
    setResponding(true);

    try {
      await inquiryService.updateStatus(id, statusUpdate);
      toast.success('Status updated successfully');
      await fetchInquiry();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResponding(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setResponding(true);
    try {
      await inquiryService.addNote(id, { note: newNote });
      toast.success('Note added successfully');
      setNewNote('');
      await fetchInquiry();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (!inquiry) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Inquiry not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={`Inquiry #${inquiry.inquiryNumber}`}
        subtitle={`Received on ${formatDateTime(inquiry.createdAt)}`}
        actions={
          <Link to="/inquiries">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              Back to Inquiries
            </button>
          </Link>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main Content */}
        <div>
          {/* Product Information */}
          {inquiry.product && (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Product</h3>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {inquiry.product.images?.[0] && (
                  <div style={{
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}>
                    <img
                      src={getImageUrl(inquiry.product.images[0].url)}
                      alt={inquiry.product.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{inquiry.product.title}</h4>
                  {inquiry.product.artist && (
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      by {inquiry.product.artist.name}
                    </p>
                  )}
                  {inquiry.product.category && (
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      Category: {inquiry.product.category.name}
                    </p>
                  )}
                  {inquiry.quotedPrice && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' }}>
                      Quoted Price: {formatCurrency(inquiry.quotedPrice)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Message */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Customer Message</h3>
            <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {inquiry.message}
            </p>
          </div>

          {/* Admin Response */}
          {inquiry.adminResponse?.message ? (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Your Response</h3>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f8ff',
                borderRadius: '4px',
              }}>
                <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>
                  {inquiry.adminResponse.message}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                  Sent on {formatDateTime(inquiry.adminResponse.respondedAt)}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '1.5rem',
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Send Response</h3>
              
              <form onSubmit={handleRespond}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Quoted Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={responseData.quotedPrice}
                    onChange={(e) => setResponseData({ ...responseData, quotedPrice: e.target.value })}
                    placeholder="Enter price if applicable"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Response Message *
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    required
                    rows="6"
                    placeholder="Type your response to the customer..."
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={responding}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: responding ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: responding ? 'not-allowed' : 'pointer',
                  }}
                >
                  {responding ? 'Sending...' : 'Send Response'}
                </button>
              </form>
            </div>
          )}

          {/* Internal Notes */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Internal Notes</h3>

            {inquiry.notes && inquiry.notes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {inquiry.notes.map((note, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem', lineHeight: '1.6' }}>{note.content}</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                      {formatDateTime(note.addedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note..."
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={responding || !newNote.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: responding || !newNote.trim() ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: responding || !newNote.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Customer Information */}
          <div style={{
            position: 'sticky',
            top: '20px',
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            marginBottom: '1.5rem',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Customer Information</h3>

            <p style={{ margin: '0.5rem 0' }}>
              <strong>Name:</strong><br />
              {inquiry.customerInfo.firstName} {inquiry.customerInfo.lastName}
            </p>

            <p style={{ margin: '0.5rem 0' }}>
              <strong>Email:</strong><br />
              <a href={`mailto:${inquiry.customerInfo.email}`} style={{ color: '#007bff' }}>
                {inquiry.customerInfo.email}
              </a>
            </p>

            {inquiry.customerInfo.phoneNumber && (
              <p style={{ margin: '0.5rem 0' }}>
                <strong>Phone:</strong><br />
                {inquiry.customerInfo.phoneNumber}
              </p>
            )}
          </div>

          {/* Update Status */}
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Update Status</h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Status
              </label>
              <select
                value={statusUpdate.status}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="quoted">Quoted</option>
                <option value="responded">Responded</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
                <option value="spam">Spam</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Priority
              </label>
              <select
                value={statusUpdate.priority}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, priority: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quoted Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={statusUpdate.quotedPrice}
                onChange={(e) => setStatusUpdate({ ...statusUpdate, quotedPrice: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={responding}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: responding ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: responding ? 'not-allowed' : 'pointer',
              }}
            >
              {responding ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetail;