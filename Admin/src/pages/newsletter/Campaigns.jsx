import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsletterService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import Table from '../../components/common/Table';
import { formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await newsletterService.getCampaigns();
      setCampaigns(response.data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id) => {
    if (!window.confirm('Send this campaign to all recipients? This action cannot be undone.')) {
      return;
    }

    try {
      await newsletterService.sendCampaign(id);
      toast.success('Campaign sent successfully!');
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await newsletterService.deleteCampaign(id);
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const columns = [
    {
      header: 'Campaign',
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            {row.subject}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const colors = {
          draft: '#6c757d',
          scheduled: '#ffc107',
          sending: '#17a2b8',
          sent: '#28a745',
          failed: '#dc3545',
        };

        return (
          <span style={{
            padding: '4px 12px',
            backgroundColor: colors[row.status],
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}>
            {row.status.toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Recipients',
      render: (row) => (
        row.stats?.totalSent || 0
      ),
    },
    {
      header: 'Opened',
      render: (row) => (
        row.stats?.totalSent > 0
          ? `${row.stats.opened} (${((row.stats.opened / row.stats.totalSent) * 100).toFixed(1)}%)`
          : '-'
      ),
    },
    {
      header: 'Date',
      render: (row) => (
        row.sentAt ? formatDate(row.sentAt) : formatDate(row.createdAt)
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'draft' && (
            <>
              <Link to={`/newsletter/campaigns/edit/${row._id}`}>
                <button style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}>
                  Edit
                </button>
              </Link>
              <button
                onClick={() => handleSend(row._id)}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Send
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(row._id)}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Newsletter Campaigns"
        subtitle="Create and send email campaigns"
        actions={
          <Link to="/newsletter/campaigns/new">
            <button style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}>
              + Create Campaign
            </button>
          </Link>
        }
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : (
        <Table columns={columns} data={campaigns} />
      )}
    </div>
  );
};

export default Campaigns;