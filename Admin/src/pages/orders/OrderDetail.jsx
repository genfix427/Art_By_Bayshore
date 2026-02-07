import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../api/services';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { formatCurrency, formatDateTime, getImageUrl } from '../../utils/formatters';
import toast from 'react-hot-toast';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [trackingRefreshing, setTrackingRefreshing] = useState(false);

  const [shipmentModal, setShipmentModal] = useState({
    isOpen: false,
    loading: false,
  });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getById(id);
      setOrder(response.data);
      setNewStatus(response.data.orderStatus);
    } catch (error) {
      toast.error(error.message);
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await orderService.updateStatus(id, { orderStatus: newStatus, adminNote });
      toast.success('Order status updated successfully');
      setAdminNote('');
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateShipment = async () => {
    setShipmentModal((p) => ({ ...p, loading: true }));
    try {
      const response = await orderService.createShipment(id);
      toast.success(`Shipment created! Tracking: ${response.data.trackingNumber}`);
      setShipmentModal({ isOpen: false, loading: false });
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
      setShipmentModal((p) => ({ ...p, loading: false }));
    }
  };

  const handleUpdateTracking = async () => {
    setTrackingRefreshing(true);
    try {
      await orderService.updateTracking(id);
      toast.success('Tracking information updated');
      await fetchOrder();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTrackingRefreshing(false);
    }
  };

  const getOrderStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', styles: 'bg-gray-200 text-gray-600', dot: 'bg-gray-400' },
      processing: { label: 'Processing', styles: 'bg-gray-800 text-white', dot: 'bg-yellow-400' },
      confirmed: { label: 'Confirmed', styles: 'bg-gray-700 text-white', dot: 'bg-blue-400' },
      shipped: { label: 'Shipped', styles: 'bg-white text-black border border-black', dot: 'bg-black' },
      delivered: { label: 'Delivered', styles: 'bg-black text-white', dot: 'bg-green-400' },
      cancelled: { label: 'Cancelled', styles: 'bg-gray-200 text-gray-400', dot: 'bg-red-400' },
      refunded: { label: 'Refunded', styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500', dot: 'bg-gray-400' };
  };

  const getPaymentStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pending', styles: 'bg-gray-200 text-gray-600' },
      paid: { label: 'Paid', styles: 'bg-black text-white' },
      failed: { label: 'Failed', styles: 'bg-gray-200 text-gray-400' },
      refunded: { label: 'Refunded', styles: 'bg-gray-200 text-gray-500' },
    };
    return map[status] || { label: status, styles: 'bg-gray-200 text-gray-500' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-gray-500 font-medium">Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-black mb-1">Order not found</p>
        <Link to="/orders">
          <button className="mt-4 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-md cursor-pointer hover:bg-gray-800 transition-all duration-200 active:scale-95">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  const orderStatusInfo = getOrderStatusInfo(order.orderStatus);
  const paymentStatusInfo = getPaymentStatusInfo(order.paymentStatus);

  return (
    <div className="min-h-screen bg-white text-black">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={`Placed on ${formatDateTime(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${orderStatusInfo.styles}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${orderStatusInfo.dot}`} />
              {orderStatusInfo.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusInfo.styles}`}>
              {paymentStatusInfo.label}
            </span>
            <Link to="/orders">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 border-2 border-black text-black text-sm font-semibold rounded-md cursor-pointer hover:bg-black hover:text-white transition-all duration-200 active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
          {/* Order Items */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Order Items
              <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-bold text-gray-600">
                {order.items.length}
              </span>
            </h3>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item._id} className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-black">{item.title}</h4>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Qty: <span className="font-medium text-black">{item.quantity}</span> × {formatCurrency(item.price)}
                      </p>
                      {item.dimensions?.artwork && (
                        <p className="text-xs text-gray-500">
                          Dimensions: {item.dimensions.artwork.length}" × {item.dimensions.artwork.width}" × {item.dimensions.artwork.height}"
                        </p>
                      )}
                      {item.weight && (
                        <p className="text-xs text-gray-500">
                          Weight: {item.weight.value} {item.weight.unit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-black">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipping Address
            </h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-bold text-black">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-gray-600 mt-1">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-sm text-gray-600">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-sm text-gray-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm text-gray-600">{order.shippingAddress.country}</p>

              <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {order.shippingAddress.phoneNumber}
              </div>

              {order.shippingAddress.validationData && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-black">
                    Address validated via FedEx
                    {order.shippingAddress.validationData.classification && (
                      <span className="text-gray-500"> — {order.shippingAddress.validationData.classification}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FedEx Shipment & Tracking */}
          {order.fedexShipment?.trackingNumber && (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-black flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  Shipment & Tracking
                </h3>

                <button
                  onClick={handleUpdateTracking}
                  disabled={trackingRefreshing}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 active:scale-95 ${
                    trackingRefreshing
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'border-2 border-black text-black cursor-pointer hover:bg-black hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${trackingRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {trackingRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                    <p className="text-lg font-mono font-bold text-black">{order.fedexShipment.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Service Type</p>
                    <p className="text-sm font-semibold text-black">{order.fedexShipment.serviceType?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Shipping Status</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-black border border-black">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      {order.shippingStatus?.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>
                  {order.fedexShipment.estimatedDelivery && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estimated Delivery</p>
                      <p className="text-sm font-semibold text-black">{formatDateTime(order.fedexShipment.estimatedDelivery)}</p>
                    </div>
                  )}
                </div>

                {order.fedexShipment.labelUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={order.fedexShipment.labelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Shipping Label
                    </a>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {order.trackingHistory && order.trackingHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-black mb-4">Tracking History</h4>
                  <div className="relative pl-8">
                    {/* Line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />

                    {order.trackingHistory.map((event, index) => (
                      <div key={index} className="relative mb-6 last:mb-0">
                        {/* Dot */}
                        <div className={`absolute -left-8 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                          index === 0 ? 'bg-black' : 'bg-gray-300'
                        }`} />

                        <div className={`p-4 rounded-lg border ${
                          index === 0 ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-semibold ${index === 0 ? 'text-black' : 'text-gray-600'}`}>
                              {event.status}
                            </p>
                            <span className="text-xs text-gray-400">{formatDateTime(event.timestamp)}</span>
                          </div>
                          {event.location && event.location !== 'N/A' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-xs text-gray-500">{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Status History
              </h3>

              <div className="space-y-3">
                {order.statusHistory.map((history, index) => {
                  const info = getOrderStatusInfo(history.status);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${info.styles}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
                          {info.label}
                        </span>
                        {history.note && (
                          <span className="text-xs text-gray-500">{history.note}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(history.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar (1/3) ── */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 lg:sticky lg:top-5">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-black font-medium">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Discount {order.couponUsed?.code && (
                      <span className="inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-gray-100 text-gray-600 rounded border border-gray-200">
                        {order.couponUsed.code}
                      </span>
                    )}
                  </span>
                  <span className="text-black font-medium">-{formatCurrency(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-black font-medium">{formatCurrency(order.shippingCost)}</span>
              </div>

              {order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-black font-medium">{formatCurrency(order.tax)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between">
                <span className="text-lg font-bold text-black">Total</span>
                <span className="text-lg font-bold text-black">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Status Badges */}
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Payment</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${paymentStatusInfo.styles}`}>
                  {paymentStatusInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Order</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${orderStatusInfo.styles}`}>
                  <span className={`w-1 h-1 rounded-full ${orderStatusInfo.dot}`} />
                  {orderStatusInfo.label}
                </span>
              </div>
            </div>

            {/* Customer */}
            {order.user && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs text-gray-500 font-medium mb-2">Customer</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {order.user.firstName?.[0]?.toUpperCase()}{order.user.lastName?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-black">{order.user.firstName} {order.user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{order.user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="bg-white border border-gray-300 rounded-lg p-6">
            <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Update Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-black">New Status</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-black">
                  Admin Note <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows="3"
                  placeholder="Add a note about this status change..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-md bg-white text-black text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all duration-200 resize-y"
                />
              </div>

              <button
                onClick={handleUpdateStatus}
                disabled={updating || newStatus === order.orderStatus}
                className={`w-full py-2.5 rounded-md text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 ${
                  updating || newStatus === order.orderStatus
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white cursor-pointer hover:bg-gray-800'
                }`}
              >
                {updating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </button>
            </div>
          </div>

          {/* Create FedEx Shipment */}
          {!order.fedexShipment?.trackingNumber && order.paymentStatus === 'paid' && (
            <div className="bg-white border border-gray-300 rounded-lg p-6">
              <h3 className="text-base font-bold text-black mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Create Shipment
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                Generate a FedEx shipping label and tracking number for this order.
              </p>

              <button
                onClick={() => setShipmentModal({ isOpen: true, loading: false })}
                className="w-full py-2.5 bg-black text-white rounded-md text-sm font-semibold cursor-pointer hover:bg-gray-800 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Create FedEx Shipment
              </button>

              <p className="text-xs text-gray-400 mt-3">
                This will calculate shipping rates, create the shipment, and generate a label automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shipment Confirmation Modal */}
      <ConfirmModal
        isOpen={shipmentModal.isOpen}
        onClose={() => !shipmentModal.loading && setShipmentModal({ isOpen: false, loading: false })}
        onConfirm={handleCreateShipment}
        loading={shipmentModal.loading}
        title="Create FedEx Shipment"
        message={
          <>
            Create a FedEx shipment for{' '}
            <span className="font-semibold text-black font-mono">Order #{order?.orderNumber}</span>?
            This will generate a shipping label and tracking number. This action cannot be undone.
          </>
        }
        confirmText="Create Shipment"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
};

export default OrderDetail;