import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { newsletterService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const CampaignForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    content: {
      html: '',
      text: '',
    },
    recipients: 'subscribed',
    recipientTags: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('html');

  useEffect(() => {
    if (isEdit) {
      fetchCampaign();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await newsletterService.getCampaign(id);
      const campaign = response.data;

      setFormData({
        name: campaign.name,
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        content: campaign.content,
        recipients: campaign.recipients,
        recipientTags: campaign.recipientTags?.join(', ') || '',
      });
    } catch (error) {
      toast.error(error.message);
      navigate('/newsletter/campaigns');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        recipientTags: formData.recipientTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (isEdit) {
        await newsletterService.updateCampaign(id, data);
        toast.success('Campaign updated successfully');
      } else {
        await newsletterService.createCampaign(data);
        toast.success('Campaign created successfully');
      }

      navigate('/newsletter/campaigns');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const variables = [
    { key: '{{firstName}}', label: 'First Name' },
    { key: '{{email}}', label: 'Email' },
  ];

  const insertVariable = (variable) => {
    const field = activeTab === 'html' ? 'html' : 'text';
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [field]: formData.content[field] + variable,
      },
    });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader title={isEdit ? 'Edit Campaign' : 'Create Campaign'} />

      <div className="max-w-[900px] bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Monthly Newsletter - January 2024"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Internal name (not visible to recipients)
            </p>
          </div>

          {/* Email Subject */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-black">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              placeholder="What subscribers will see in their inbox"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                         focus:border-black transition-all duration-200"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-gray-500">Keep it under 50 characters for best results</p>
              <p
                className={`text-xs font-medium ${
                  formData.subject.length > 50 ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {formData.subject.length}/50
              </p>
            </div>
          </div>

          {/* Sender Info */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018
                     0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Sender Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  From Name
                </label>
                <input
                  type="text"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  placeholder="Art By Bayshore"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  From Email
                </label>
                <input
                  type="email"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  placeholder="noreply@yourstore.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black
                             placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black
                             focus:border-black transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0
                     002 2h11a2 2 0 002-2v-5m-1.414-9.414a2
                     2 0 112.828 2.828L11.828
                     15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Email Content
            </h3>

            {/* Variables */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-black mb-2 uppercase tracking-wider">
                Available Variables
              </p>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono
                               font-medium bg-white border border-gray-300 text-black rounded-md
                               cursor-pointer hover:bg-black hover:text-white hover:border-black
                               transition-all duration-200 active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {v.key}
                    <span className="text-gray-400 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Click to insert. Unsubscribe link will be added automatically.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-300 mb-0">
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200
                           cursor-pointer -mb-px ${
                             activeTab === 'html'
                               ? 'border-black text-black'
                               : 'border-transparent text-gray-400 hover:text-black'
                           }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  HTML
                  <span className="text-red-500">*</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200
                           cursor-pointer -mb-px ${
                             activeTab === 'text'
                               ? 'border-black text-black'
                               : 'border-transparent text-gray-400 hover:text-black'
                           }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0
                         012-2h5.586a1 1 0 01.707.293l5.414 5.414a1
                         1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Plain Text
                </span>
              </button>
            </div>

            {/* HTML Content */}
            {activeTab === 'html' && (
              <div>
                <textarea
                  value={formData.content.html}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, html: e.target.value },
                    })
                  }
                  required
                  rows="16"
                  placeholder="<h1>Hello {{firstName}}!</h1>&#10;<p>Your HTML content here...</p>"
                  className="w-full px-4 py-3 border border-gray-300 border-t-0 rounded-b-md
                             bg-white text-black font-mono text-sm placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                             transition-all duration-200 resize-y"
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">Write your email HTML content</p>
                  <p className="text-xs text-gray-400">
                    {formData.content.html.length} characters
                  </p>
                </div>
              </div>
            )}

            {/* Plain Text Content */}
            {activeTab === 'text' && (
              <div>
                <textarea
                  value={formData.content.text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, text: e.target.value },
                    })
                  }
                  rows="12"
                  placeholder="Plain text version for email clients that don't support HTML"
                  className="w-full px-4 py-3 border border-gray-300 border-t-0 rounded-b-md
                             bg-white text-black text-sm placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                             transition-all duration-200 resize-y"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional fallback for email clients without HTML support
                </p>
              </div>
            )}
          </div>

          {/* Recipients */}
          <div className="border-t border-gray-300 pt-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17
                     20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7
                     20H2v-2a3 3 0 015.356-1.857M7
                     20v-2c0-.656.126-1.283.356-1.857m0
                     0a5.002 5.002 0 019.288 0M15
                     7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Recipients
            </h3>

            <div>
              <label className="block mb-2 text-sm font-semibold text-black">
                Send To <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2 mb-4">
                {[
                  {
                    value: 'all',
                    label: 'All Subscribers',
                    desc: 'Send to everyone including unsubscribed',
                  },
                  {
                    value: 'subscribed',
                    label: 'Active Subscribers Only',
                    desc: 'Recommended — only active subscribers',
                  },
                  {
                    value: 'tags',
                    label: 'Subscribers with Specific Tags',
                    desc: 'Target specific groups by tag',
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer
                                transition-all duration-200
                                ${
                                  formData.recipients === option.value
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-400'
                                }`}
                  >
                    <input
                      type="radio"
                      name="recipients"
                      value={option.value}
                      checked={formData.recipients === option.value}
                      onChange={(e) =>
                        setFormData({ ...formData, recipients: e.target.value })
                      }
                      className="w-4 h-4 accent-black cursor-pointer mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-black">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {formData.recipients === 'tags' && (
                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Recipient Tags
                  </label>
                  <input
                    type="text"
                    value={formData.recipientTags}
                    onChange={(e) =>
                      setFormData({ ...formData, recipientTags: e.target.value })
                    }
                    placeholder="vip, early-access (comma-separated)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-black focus:border-black transition-all duration-200"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple tags with commas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preview Card */}
          {formData.subject && (
            <div className="border-t border-gray-300 pt-6">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478
                       0 8.268 2.943 9.542 7-1.274 4.057-5.064
                       7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Inbox Preview
              </h3>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {(formData.fromName || 'N')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-black">
                        {formData.fromName || 'Sender Name'}
                      </p>
                      <p className="text-xs text-gray-400">Just now</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {formData.fromEmail || 'sender@email.com'}
                    </p>
                  </div>
                </div>
                <p className="text-base font-semibold text-black">{formData.subject}</p>
                {formData.content.text && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {formData.content.text.substring(0, 120)}...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-300">
            <button
              type="button"
              onClick={() => navigate('/newsletter/campaigns')}
              className="flex-1 py-3 px-6 bg-white text-black border-2 border-black rounded-md
                         font-semibold cursor-pointer hover:bg-gray-100
                         transition-all duration-200 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all duration-200
                         active:scale-[0.98] ${
                           loading
                             ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                             : 'bg-black text-white border-2 border-black cursor-pointer hover:bg-gray-800'
                         }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962
                         7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : isEdit ? (
                'Update Campaign'
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignForm;