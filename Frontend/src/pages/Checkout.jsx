// pages/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { shippingService, couponService, paymentService } from '../api/services';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';

// Initialize Stripe outside component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return '/placeholder-image.jpg';
  
  // If it's already a full URL (Cloudinary)
  if (typeof image === 'string' && image.startsWith('http')) {
    return image;
  }
  
  // If it's an object with url property (Cloudinary format)
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // If it's a local path
  if (typeof image === 'string' && image.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL || ''}${image}`;
  }
  
  // Default
  return image || '/placeholder-image.jpg';
};

// Checkout Form Component
const CheckoutForm = ({ clientSecret, orderSummary, shippingAddress, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!stripe || !elements) {
      console.log('Stripe not loaded yet');
      return;
    }

    setProcessing(true);

    try {
      // First, validate the payment element
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        setProcessing(false);
        return;
      }

      // Confirm the payment without redirect
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Don't use return_url to avoid redirect issues
          payment_method_data: {
            billing_details: {
              name: shippingAddress.fullName,
              phone: shippingAddress.phoneNumber,
              address: {
                line1: shippingAddress.addressLine1,
                line2: shippingAddress.addressLine2 || '',
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zipCode,
                country: shippingAddress.country || 'US',
              },
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        setErrorMessage(error.message);
        toast.error(error.message);
        if (onError) onError(error);
      } else if (paymentIntent) {
        console.log('Payment Intent:', paymentIntent);
        
        if (paymentIntent.status === 'succeeded') {
          toast.success('Payment successful!');
          onSuccess(paymentIntent);
        } else if (paymentIntent.status === 'requires_action') {
          // Handle 3D Secure or other actions
          toast.info('Additional authentication required...');
        } else if (paymentIntent.status === 'processing') {
          toast.info('Payment is processing...');
          // You might want to poll for status updates
          onSuccess(paymentIntent);
        } else {
          setErrorMessage(`Payment status: ${paymentIntent.status}`);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
      if (onError) onError(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />
      
      {errorMessage && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginTop: '1rem',
        }}>
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        style={{
          width: '100%',
          padding: '1rem',
          backgroundColor: processing ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: processing ? 'not-allowed' : 'pointer',
          fontSize: '1.125rem',
          fontWeight: 'bold',
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {processing ? (
          <>
            <span className="spinner" style={{
              width: '20px',
              height: '20px',
              border: '2px solid #fff',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Processing...
          </>
        ) : (
          `Pay ${formatCurrency(orderSummary?.total || 0)}`
        )}
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

const Checkout = () => {
  useSEO({ title: 'Checkout' });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [addressValidated, setAddressValidated] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // Initialize shipping address with user data
  useEffect(() => {
    if (user) {
      setShippingAddress(prev => ({
        ...prev,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || prev.fullName,
        phoneNumber: user.phoneNumber || prev.phoneNumber,
      }));
    }
  }, [user]);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
  }, [isAuthenticated, navigate]);

  // Check cart
  useEffect(() => {
    if (!cart || cart.items?.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  // Handle Stripe redirect (for 3D Secure)
  useEffect(() => {
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (paymentIntentClientSecret && redirectStatus) {
      if (redirectStatus === 'succeeded') {
        const paymentIntentIdFromUrl = searchParams.get('payment_intent');
        handlePaymentSuccessFromRedirect(paymentIntentIdFromUrl);
      } else if (redirectStatus === 'failed') {
        toast.error('Payment failed. Please try again.');
      }
    }
  }, [searchParams]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({
      ...prev,
      [name]: value,
    }));
    setAddressValidated(false);
  };

  const handleValidateAddress = async () => {
    // Basic validation
    const required = ['fullName', 'phoneNumber', 'addressLine1', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !shippingAddress[field]?.trim());
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      const response = await shippingService.validateAddress(shippingAddress);
      setValidationResult(response.data);

      if (response.data.isValid) {
        setAddressValidated(true);
        toast.success('Address validated successfully!');
        
        if (response.data.resolvedAddress) {
          const resolved = response.data.resolvedAddress;
          setShippingAddress(prev => ({
            ...prev,
            addressLine1: resolved.streetLines?.[0] || prev.addressLine1,
            city: resolved.city || prev.city,
            state: resolved.stateOrProvinceCode || prev.state,
            zipCode: resolved.postalCode || prev.zipCode,
          }));
        }
      } else {
        toast.error(response.data.error || 'Address validation failed');
      }
    } catch (error) {
      console.error('Address validation error:', error);
      toast.error(error.message || 'Failed to validate address');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateShipping = async () => {
    if (!addressValidated) {
      toast.error('Please validate your address first');
      return;
    }

    setLoading(true);
    try {
      const response = await shippingService.calculateRates({ toAddress: shippingAddress });
      
      if (response.data.shippingOptions?.length > 0) {
        setShippingOptions(response.data.shippingOptions);
        setStep(2);
      } else {
        toast.error('No shipping options available for this address');
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      toast.error(error.message || 'Failed to calculate shipping');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);
    try {
      const response = await couponService.validate({
        code: couponCode,
        userId: user?._id,
        cartItems: cart.items,
        subtotal: cart.subtotal,
      });

      setAppliedCoupon(response.data);
      toast.success(`Coupon applied! You saved ${formatCurrency(response.data.discountAmount)}`);
    } catch (error) {
      console.error('Coupon error:', error);
      toast.error(error.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleSelectShipping = (option) => {
    setSelectedShipping(option);
  };

  const handleProceedToPayment = async () => {
    if (!selectedShipping) {
      toast.error('Please select a shipping method');
      return;
    }

    setLoading(true);
    try {
      // Save checkout data for potential redirect recovery
      localStorage.setItem('checkoutData', JSON.stringify({
        shippingAddress,
        selectedShipping,
        appliedCoupon,
      }));

      const response = await paymentService.createIntent({
        shippingCost: selectedShipping.totalCharge,
        couponCode: appliedCoupon?.code || '',
      });

      if (response.data.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setOrderSummary(response.data.breakdown);
        setPaymentIntentId(response.data.paymentIntentId);
        setStep(3);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Payment intent error:', error);
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  // Update handlePaymentSuccess function
const handlePaymentSuccess = async (paymentIntent) => {
  setLoading(true);
  try {
    const response = await paymentService.confirmPayment({
      paymentIntentId: paymentIntent.id,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phoneNumber: shippingAddress.phoneNumber,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'US',
      },
      billingAddress: {
        fullName: shippingAddress.fullName,
        phoneNumber: shippingAddress.phoneNumber,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country || 'US',
      },
      shippingService: selectedShipping.serviceType,
      couponCode: appliedCoupon?.code || '',
    });

    // Clear checkout data from localStorage
    localStorage.removeItem('checkoutData');
    
    // Clear the cart
    await clearCart();
    
    toast.success('Order placed successfully!');
    
    // Navigate to order confirmation
    const orderId = response.data._id || response.data.data?._id;
    navigate(`/order-confirmation/${orderId}`);
  } catch (error) {
    console.error('Order confirmation error:', error);
    toast.error(error.response?.data?.message || error.message || 'Failed to confirm order');
  } finally {
    setLoading(false);
  }
};

// Update handlePaymentSuccessFromRedirect function
const handlePaymentSuccessFromRedirect = async (paymentIntentId) => {
  if (!paymentIntentId) return;
  
  setLoading(true);
  try {
    // Restore checkout data from localStorage
    const savedCheckoutData = localStorage.getItem('checkoutData');
    if (savedCheckoutData) {
      const checkoutData = JSON.parse(savedCheckoutData);
      
      const response = await paymentService.confirmPayment({
        paymentIntentId,
        shippingAddress: checkoutData.shippingAddress,
        billingAddress: checkoutData.shippingAddress,
        shippingService: checkoutData.selectedShipping?.serviceType,
        couponCode: checkoutData.appliedCoupon?.code || '',
      });

      localStorage.removeItem('checkoutData');
      await clearCart();
      toast.success('Order placed successfully!');
      
      const orderId = response.data._id || response.data.data?._id;
      navigate(`/order-confirmation/${orderId}`);
    } else {
      toast.error('Order data not found. Please contact support.');
    }
  } catch (error) {
    console.error('Error confirming payment from redirect:', error);
    toast.error(error.response?.data?.message || error.message || 'Failed to confirm order');
  } finally {
    setLoading(false);
  }
};

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Don't navigate away, let user retry
  };

  // Loading state
  if (loading && step === 3) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <div>Processing your order...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  // Calculate totals
  const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const shippingCost = selectedShipping?.totalCharge || 0;
  const tax = orderSummary?.tax || 0;
  const total = orderSummary?.total || (subtotal - discount + shippingCost + tax);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Checkout</h1>

      {/* Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        {['Shipping Address', 'Shipping Method', 'Payment'].map((label, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: step > index + 1 ? '#28a745' : step === index + 1 ? '#007bff' : '#ddd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}>
              {step > index + 1 ? '✓' : index + 1}
            </div>
            <span style={{
              margin: '0 1rem',
              color: step >= index + 1 ? '#333' : '#999',
              fontWeight: step === index + 1 ? 'bold' : 'normal',
            }}>
              {label}
            </span>
            {index < 2 && (
              <div style={{
                width: '60px',
                height: '2px',
                backgroundColor: step > index + 1 ? '#28a745' : '#ddd',
                marginRight: '1rem',
              }} />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* For larger screens, use 2-column layout */}
        <style>{`
          @media (min-width: 768px) {
            .checkout-grid {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}</style>
        
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* Main Content */}
          <div>
            {/* Step 1: Shipping Address */}
            {step === 1 && (
              <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Shipping Address</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleAddressChange}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={shippingAddress.phoneNumber}
                      onChange={handleAddressChange}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleAddressChange}
                    required
                    placeholder="Street address"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleAddressChange}
                    placeholder="Apartment, suite, etc. (optional)"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleAddressChange}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={shippingAddress.state}
                      onChange={handleAddressChange}
                      required
                      maxLength="2"
                      placeholder="NY"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={shippingAddress.zipCode}
                      onChange={handleAddressChange}
                      required
                      placeholder="12345"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Country
                  </label>
                  <select
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleAddressChange}
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>

                {validationResult && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    backgroundColor: validationResult.isValid ? '#d4edda' : '#f8d7da',
                    color: validationResult.isValid ? '#155724' : '#721c24',
                  }}>
                    {validationResult.isValid ? (
                      <>
                        <strong>✓ Address Validated</strong>
                        {validationResult.classification && (
                          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                            Classification: {validationResult.classification}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <strong>✗ Validation Failed</strong>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                          {validationResult.error}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleValidateAddress}
                    disabled={loading}
                    style={{
                      flex: '1 1 200px',
                      padding: '0.75rem',
                      backgroundColor: loading ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    {loading ? 'Validating...' : 'Validate Address'}
                  </button>

                  <button
                    onClick={handleCalculateShipping}
                    disabled={!addressValidated || loading}
                    style={{
                      flex: '1 1 200px',
                      padding: '0.75rem',
                      backgroundColor: !addressValidated || loading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !addressValidated || loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {step === 2 && (
              <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Select Shipping Method</h2>

                {shippingOptions.length === 0 ? (
                  <p>No shipping options available. Please go back and check your address.</p>
                ) : (
                  shippingOptions.map((option, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectShipping(option)}
                      style={{
                        padding: '1rem',
                        border: selectedShipping?.serviceType === option.serviceType 
                          ? '2px solid #007bff' 
                          : '1px solid #ddd',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        cursor: 'pointer',
                        backgroundColor: selectedShipping?.serviceType === option.serviceType 
                          ? '#f0f8ff' 
                          : 'white',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1.125rem' }}>{option.serviceName}</strong>
                          {option.transitDays && option.transitDays !== 'N/A' && (
                            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.875rem' }}>
                              Estimated delivery: {option.transitDays} business days
                            </p>
                          )}
                          {option.deliveryTimestamp && (
                            <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.875rem' }}>
                              Delivery by: {new Date(option.deliveryTimestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <strong style={{ fontSize: '1.25rem', color: '#28a745' }}>
                          {formatCurrency(option.totalCharge)}
                        </strong>
                      </div>
                    </div>
                  ))
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedShipping || loading}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: !selectedShipping || loading ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !selectedShipping || loading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    {loading ? 'Processing...' : 'Continue to Payment →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && clientSecret && (
              <div style={{ padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Payment Information</h2>

                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#007bff',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    clientSecret={clientSecret}
                    orderSummary={orderSummary}
                    shippingAddress={shippingAddress}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>

                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginTop: '1rem',
                    fontSize: '1rem',
                  }}
                >
                  ← Back to Shipping
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div style={{
              position: 'sticky',
              top: '100px',
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Order Summary</h3>

              {/* Cart Items */}
              <div style={{ marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {cart.items.map((item) => (
                  <div key={item._id || item.product} style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    marginBottom: '1rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #eee',
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title || 'Product'}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, fontSize: '0.875rem' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', lineHeight: 1.3 }}>
                        {item.title || 'Product'}
                      </p>
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        Qty: {item.quantity}
                      </p>
                      <p style={{ margin: 0, fontWeight: '600' }}>
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div style={{ marginBottom: '1.5rem' }}>
                {!appliedCoupon ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode || loading}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: !couponCode || loading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !couponCode || loading ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#d4edda',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <div>
                      <strong style={{ color: '#155724' }}>
                        ✓ {appliedCoupon.code}
                      </strong>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#155724' }}>
                        -{formatCurrency(appliedCoupon.discountAmount)}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#721c24',
                        cursor: 'pointer',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '0.5rem', 
                    color: '#28a745' 
                  }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Shipping:</span>
                  <span>
                    {selectedShipping 
                      ? formatCurrency(shippingCost) 
                      : <span style={{ color: '#666' }}>Calculated next</span>
                    }
                  </span>
                </div>

                {tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Tax:</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}

                <div style={{
                  borderTop: '2px solid #333',
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}>
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: '#e8f5e9',
                borderRadius: '4px',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: '#2e7d32',
              }}>
                🔒 Secure checkout powered by Stripe
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;