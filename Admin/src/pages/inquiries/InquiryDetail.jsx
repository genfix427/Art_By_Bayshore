import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inquiryService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import {
  formatCurrency,
  formatDateTime,
  getImageUrl,
} from '../../utils/formatters';
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

  const getStatusInfo = (status) => {
    const map = {
      new: { label: 'New', styles: 'bg-black text-white', dot: 'bg-green-400' },
      reviewing: { label: 'Reviewing', styles: 'bg-gray-800 text-white', dot: 'bg-gray-300' },
      quoted: { label: 'Quoted', styles: 'bg-gray-700 text-white', dot: 'bg-gray-300' },
      responded: { label: 'Responded', styles: 'bg-gray-600 text-white', dot: 'bg-green-400' },
      converted: { label: 'Converted', styles: 'bg-white text-black border border-black', dot: 'bg-black' },
      closed: { label: 'Closed', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' },
      spam: { label: 'Spam', styles: 'bg-gray-200 text-gray-400', dot: 'bg-gray-400' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
  };

  const getPriorityInfo = (priority) => {
    const map = {
      low: { label: 'Low', styles: 'bg-gray-100 text-gray-500 border border-gray-200' },
      normal: { label: 'Normal', styles: 'bg-gray-100 text-gray-700 border border-gray-200' },
      high: { label: 'High', styles: 'bg-gray-800 text-white' },
      urgent: { label: 'Urgent', styles: 'bg-black text-white' },
    };
    return map[priority] || { label: priority, styles: 'bg-gray-100 text-gray-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <svg
          className="animate-spin h-8 w-8 text-black"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0
               5.373 0 12h4zm2 5.291A7.962
               7.962 0 014 12H0c0 3.042 1.135
               5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-sm text-gray-500 font-medium">Loading inquiry...</p>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.172 16.172a4 4 0 015.656 0M9
                 10h.01M15 10h.01M21 12a9 9 0
                 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold text-black mb-1">
          Inquiry not found
        </p>
        <Link to="/inquiries">
          <button
            className="mt-4 px-5 py-2.5 bg-black text-white text-sm font-semibold
                       rounded-md cursor-pointer hover:bg-gray-800 transition-all
                       duration-200 active:scale-95"
          >
            Back to Inquiries
          </button>
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusInfo(inquiry.status);
  const priorityInfo = getPriorityInfo(inquiry.priority);

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title={`Inquiry #${inquiry.inquiryNumber}`}
        subtitle={`Received on ${formatDateTime(inquiry.createdAt)}`}
        actions={
          <div className="flex items-center gap-3">
            {/* Status & Priority badges */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs
                          font-semibold ${statusInfo.styles}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs
                          font-semibold ${priorityInfo.styles}`}
            >
              {priorityInfo.label}
            </span>

            <Link to="/inquiries">
              <button
                className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black
                           text-black text-sm font-semibold rounded-md cursor-pointer
                           hover:bg-black hover:text-white transition-all duration-200
                           active:scale-95"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Content (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          {inquiry.product && (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828
                       0L16 16m-2-2l1.586-1.586a2 2 0
                       012.828 0L20 14m-6-6h.01M6
                       20h12a2 2 0 002-2V6a2 2 0
                       00-2-2H6a2 2 0 00-2 2v12a2
                       2 0 002 2z"
                  />
                </svg>
                Product
              </h3>

              <div className="flex gap-4">
                {inquiry.product.images?.[0] ? (
                  <div
                    className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 border
                                border-gray-200 flex-shrink-0"
                  >
                    <img
                      src={getImageUrl(inquiry.product.images[0].url)}
                      alt={inquiry.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-28 h-28 rounded-lg bg-gray-100 border border-gray-200
                                flex items-center justify-center flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828
                           0L16 16m-2-2l1.586-1.586a2 2 0
                           012.828 0L20 14m-6-6h.01M6
                           20h12a2 2 0 002-2V6a2 2 0
                           00-2-2H6a2 2 0 00-2 2v12a2
                           2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-black">
                    {inquiry.product.title}
                  </h4>
                  {inquiry.product.artist && (
                    <p className="text-sm text-gray-500 mt-1">
                      by{' '}
                      <span className="font-medium text-black">
                        {inquiry.product.artist.name}
                      </span>
                    </p>
                  )}
                  {inquiry.product.category && (
                    <span
                      className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium
                                  bg-gray-100 text-gray-600 rounded border border-gray-200"
                    >
                      {inquiry.product.category.name}
                    </span>
                  )}
                  {inquiry.quotedPrice && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xl font-bold text-black">
                        {formatCurrency(inquiry.quotedPrice)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        Quoted
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Message */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
                  d="M8 12h.01M12 12h.01M16
                     12h.01M21 12c0 4.418-4.03
                     8-9 8a9.863 9.863 0
                     01-4.255-.949L3 20l1.395-3.72C3.512
                     15.042 3 13.574 3 12c0-4.418
                     4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Customer Message
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          </div>

          {/* Admin Response */}
          {inquiry.adminResponse?.message ? (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
                    d="M3 10h10a8 8 0 018 8v2M3
                       10l6 6m-6-6l6-6"
                  />
                </svg>
                Your Response
              </h3>

              <div className="bg-black/5 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
                  {inquiry.adminResponse.message}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0
                         11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Sent on {formatDateTime(inquiry.adminResponse.respondedAt)}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0
                       0v-8"
                  />
                </svg>
                Send Response
              </h3>

              <form onSubmit={handleRespond} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Quoted Price
                    <span className="text-gray-400 font-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm font-semibold">
                        $
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={responseData.quotedPrice}
                      onChange={(e) =>
                        setResponseData({
                          ...responseData,
                          quotedPrice: e.target.value,
                        })
                      }
                      placeholder="Enter price if applicable"
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md bg-white
                                 text-black placeholder-gray-400 focus:outline-none focus:ring-2
                                 focus:ring-black focus:border-black transition-all duration-200
                                 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-black">
                    Response Message{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) =>
                      setResponseData({
                        ...responseData,
                        message: e.target.value,
                      })
                    }
                    required
                    rows="6"
                    placeholder="Type your response to the customer..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-black focus:border-black transition-all duration-200
                               resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={responding}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md
                             text-sm font-semibold transition-all duration-200 active:scale-[0.98]
                             ${
                               responding
                                 ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                 : 'bg-black text-white border-2 border-black cursor-pointer hover:bg-gray-800'
                             }`}
                >
                  {responding ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0
                             5.373 0 12h4zm2 5.291A7.962
                             7.962 0 014 12H0c0 3.042 1.135
                             5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0
                             0v-8"
                        />
                      </svg>
                      Send Response
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Internal Notes */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
              Internal Notes
              {inquiry.notes && inquiry.notes.length > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full
                              bg-gray-200 text-xs font-bold text-gray-600"
                >
                  {inquiry.notes.length}
                </span>
              )}
            </h3>

            {inquiry.notes && inquiry.notes.length > 0 && (
              <div className="space-y-3 mb-6">
                {inquiry.notes.map((note, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <p className="text-sm text-gray-800 leading-relaxed">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0
                             11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDateTime(note.addedAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add internal note..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newNote.trim()) {
                    handleAddNote();
                  }
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md bg-white
                           text-black text-sm placeholder-gray-400 focus:outline-none
                           focus:ring-2 focus:ring-black focus:border-black transition-all
                           duration-200"
              />
              <button
                onClick={handleAddNote}
                disabled={responding || !newNote.trim()}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm
                           font-semibold transition-all duration-200 active:scale-95
                           ${
                             responding || !newNote.trim()
                               ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                               : 'bg-black text-white cursor-pointer hover:bg-gray-800'
                           }`}
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 lg:sticky lg:top-5">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
              Customer
            </h3>

            <div className="space-y-4">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full bg-black text-white flex items-center
                              justify-center text-sm font-bold flex-shrink-0"
                >
                  {inquiry.customerInfo.firstName?.charAt(0)?.toUpperCase()}
                  {inquiry.customerInfo.lastName?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">
                    {inquiry.customerInfo.firstName}{' '}
                    {inquiry.customerInfo.lastName}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0
                         002.22 0L21 8M5 19h14a2
                         2 0 002-2V7a2 2 0
                         00-2-2H5a2 2 0 00-2
                         2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">Email</p>
                    <a
                      href={`mailto:${inquiry.customerInfo.email}`}
                      className="text-sm text-black font-medium hover:underline
                                 break-all cursor-pointer"
                    >
                      {inquiry.customerInfo.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {inquiry.customerInfo.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0
                           01.948.684l1.498 4.493a1 1 0
                           01-.502 1.21l-2.257 1.13a11.042
                           11.042 0 005.516 5.516l1.13-2.257a1
                           1 0 011.21-.502l4.493 1.498a1 1 0
                           01.684.949V19a2 2 0 01-2
                           2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm text-black font-medium">
                        {inquiry.customerInfo.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35
                     0a1.724 1.724 0 002.573 1.066c1.543-.94
                     3.31.826 2.37 2.37a1.724 1.724 0
                     001.065 2.572c1.756.426 1.756 2.924 0
                     3.35a1.724 1.724 0 00-1.066 2.573c.94
                     1.543-.826 3.31-2.37 2.37a1.724 1.724
                     0 00-2.572 1.065c-.426 1.756-2.924
                     1.756-3.35 0a1.724 1.724 0
                     00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724
                     1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924
                     0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31
                     2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Update Status
            </h3>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusUpdate.status}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black text-sm appearance-none cursor-pointer focus:outline-none
                               focus:ring-2 focus:ring-black focus:border-black transition-all
                               duration-200"
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="quoted">Quoted</option>
                    <option value="responded">Responded</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                    <option value="spam">Spam</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Priority
                </label>
                <div className="relative">
                  <select
                    value={statusUpdate.priority}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        priority: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white
                               text-black text-sm appearance-none cursor-pointer focus:outline-none
                               focus:ring-2 focus:ring-black focus:border-black transition-all
                               duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quoted Price */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Quoted Price
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm font-semibold">
                      $
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={statusUpdate.quotedPrice}
                    onChange={(e) =>
                      setStatusUpdate({
                        ...statusUpdate,
                        quotedPrice: e.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md
                               bg-white text-black placeholder-gray-400 focus:outline-none
                               focus:ring-2 focus:ring-black focus:border-black transition-all
                               duration-200 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={responding}
                className={`w-full py-2.5 rounded-md text-sm font-semibold transition-all
                           duration-200 active:scale-[0.98] flex items-center justify-center gap-2
                           ${
                             responding
                               ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                               : 'bg-black text-white cursor-pointer hover:bg-gray-800'
                           }`}
              >
                {responding ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0
                           5.373 0 12h4zm2 5.291A7.962
                           7.962 0 014 12H0c0 3.042 1.135
                           5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryDetail;