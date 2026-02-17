// pages/Checkout.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSEO } from '../hooks/useSEO';
import { shippingService, couponService, paymentService } from '../api/services';
import { formatCurrency } from '../utils/formatters';
import toast from 'react-hot-toast';
import {
  ChevronRight,
  MapPin,
  Truck,
  CreditCard,
  Check,
  User,
  Phone,
  Home,
  Building2,
  MapPinned,
  Tag,
  X,
  Lock,
  ShieldCheck,
  Package,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Gift
} from 'lucide-react';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: '-5%' }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.12, 0.12, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-primary">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating orb component
const FloatingOrb = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute pointer-events-none z-0 rounded-full bg-primary/5 border border-primary/10"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    animate={{
      scale: [1, 1.4, 1],
      opacity: [0.3, 0.08, 0.3],
    }}
    transition={{
      duration: 6 + Math.random() * 4,
      delay,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Drifting diamond shape
const FloatingDiamond = ({ delay, startX, duration, size = 10 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: '-3%' }}
    initial={{ opacity: 0, y: -10, rotate: 45 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      y: [-10, 500, 1000],
      rotate: [45, 225, 405],
      x: [0, -25, 15],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <div
      className="bg-accent/30 border border-accent/20"
      style={{ width: size, height: size, transform: 'rotate(45deg)' }}
    />
  </motion.div>
);

// Orbiting dot
const OrbitingDot = ({ radius, duration, delay, dotSize = 4 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{
      left: '50%',
      top: '50%',
      width: dotSize,
      height: dotSize,
    }}
    animate={{
      x: [
        Math.cos(0) * radius,
        Math.cos(Math.PI / 2) * radius,
        Math.cos(Math.PI) * radius,
        Math.cos((3 * Math.PI) / 2) * radius,
        Math.cos(2 * Math.PI) * radius,
      ],
      y: [
        Math.sin(0) * radius,
        Math.sin(Math.PI / 2) * radius,
        Math.sin(Math.PI) * radius,
        Math.sin((3 * Math.PI) / 2) * radius,
        Math.sin(2 * Math.PI) * radius,
      ],
      opacity: [0.15, 0.06, 0.15, 0.06, 0.15],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  >
    <div className="w-full h-full rounded-full bg-primary" />
  </motion.div>
);

// Animated horizontal line
const DriftingLine = ({ delay, y, direction = 1 }) => (
  <motion.div
    className="absolute pointer-events-none z-0 h-px bg-accent/15"
    style={{ top: `${y}%`, width: '120px' }}
    initial={{ x: direction === 1 ? '-150px' : '100vw', opacity: 0 }}
    animate={{
      x: direction === 1 ? ['-150px', '100vw'] : ['100vw', '-150px'],
      opacity: [0, 0.15, 0.15, 0],
    }}
    transition={{
      duration: 20 + Math.random() * 10,
      delay,
      repeat: Infinity,
      ease: 'linear',
    }}
  />
);

// Flower decoration component
const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
  </svg>
);

// Helper function to get image URL
const getImageUrl = (image) => {
  if (!image) return '/placeholder-image.jpg';
  if (typeof image === 'string' && image.startsWith('http')) return image;
  if (typeof image === 'object' && image.url) return image.url;
  if (typeof image === 'string' && image.startsWith('/')) {
    return `${import.meta.env.VITE_API_URL || ''}${image}`;
  }
  return image || '/placeholder-image.jpg';
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// Input component with animations
const AnimatedInput = ({
  icon: Icon,
  label,
  required,
  error,
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <label className="block text-xs tracking-[0.15em] text-secondary/60 uppercase mb-2">
        {label} {required && <span className="text-secondary/40">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
            focused ? 'text-primary' : 'text-accent'
          }`} />
        )}
        <input
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-4 border border-accent/30 focus:border-primary outline-none transition-all duration-300 bg-white text-secondary ${
            error ? 'border-red-500' : ''
          }`}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-px bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: focused ? 1 : 0 }}
          style={{ originX: 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
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

    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message);
        setProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
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
        setErrorMessage(error.message);
        toast.error(error.message);
        if (onError) onError(error);
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          toast.success('Payment successful!');
          onSuccess(paymentIntent);
        } else if (paymentIntent.status === 'processing') {
          toast.info('Payment is processing...');
          onSuccess(paymentIntent);
        } else {
          setErrorMessage(`Payment status: ${paymentIntent.status}`);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast.error('Payment failed. Please try again.');
      if (onError) onError(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white border border-accent/30 p-6">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          }}
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 mt-4"
          >
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={!stripe || !elements || processing}
        whileHover={{ scale: processing ? 1 : 1.02 }}
        whileTap={{ scale: processing ? 1 : 0.98 }}
        className="w-full mt-6 bg-primary text-white py-4 font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            <span>Pay {formatCurrency(orderSummary?.total || 0)}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
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
  const [direction, setDirection] = useState(0);
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

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 5 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 12 + Math.random() * 8,
  }));

  // Generate floating diamonds
  const diamonds = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 5 + i * 18,
    duration: 22 + Math.random() * 12,
    size: 6 + Math.random() * 6,
  }));

  // Generate floating orbs
  const orbs = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 1.5,
    x: 10 + i * 20,
    y: 15 + (i % 3) * 30,
    size: 80 + Math.random() * 120,
  }));

  // Generate drifting lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 5,
    y: 20 + i * 20,
    direction: i % 2 === 0 ? 1 : -1,
  }));

  const steps = [
    { number: 1, title: 'Shipping', icon: MapPin },
    { number: 2, title: 'Delivery', icon: Truck },
    { number: 3, title: 'Payment', icon: CreditCard },
  ];

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

  // Handle Stripe redirect
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
        setDirection(1);
        setStep(2);
      } else {
        toast.error('No shipping options available for this address');
      }
    } catch (error) {
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
        setDirection(1);
        setStep(3);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

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

      localStorage.removeItem('checkoutData');
      await clearCart();
      toast.success('Order placed successfully!');

      const orderId = response.data._id || response.data.data?._id;
      navigate(`/order-confirmation/${orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to confirm order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccessFromRedirect = async (paymentIntentId) => {
    if (!paymentIntentId) return;

    setLoading(true);
    try {
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
      toast.error(error.response?.data?.message || error.message || 'Failed to confirm order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  if (loading && step === 3) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border border-primary/20 flex items-center justify-center mx-auto mb-6"
          >
            <FlowerDecor className="w-8 h-8 text-primary/30" />
          </motion.div>
          <p className="text-secondary/70">Processing your order...</p>
        </motion.div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const shippingCost = selectedShipping?.totalCharge || 0;
  const tax = orderSummary?.tax || 0;
  const total = orderSummary?.total || (subtotal - discount + shippingCost + tax);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234169E1' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
      </div>

      {/* Floating Diamonds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {diamonds.map((diamond, i) => (
          <FloatingDiamond key={`diamond-${i}`} {...diamond} />
        ))}
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbs.map((orb, i) => (
          <FloatingOrb key={`orb-${i}`} {...orb} />
        ))}
      </div>

      {/* Drifting Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <DriftingLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Orbiting Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute" style={{ left: '10%', top: '30%' }}>
          <OrbitingDot radius={55} duration={12} delay={0} dotSize={3} />
          <OrbitingDot radius={55} duration={12} delay={6} dotSize={3} />
        </div>
        <div className="absolute" style={{ left: '88%', top: '65%' }}>
          <OrbitingDot radius={40} duration={10} delay={2} dotSize={3} />
          <OrbitingDot radius={40} duration={10} delay={7} dotSize={3} />
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.04, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-40 left-10 w-64 h-64 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.04, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-48 h-48 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-primary mb-8"
        >
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/cart" className="hover:text-secondary transition-colors">Cart</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-secondary font-medium">Checkout</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.div
            variants={itemVariants}
            className="w-16 h-px bg-primary mx-auto mb-8 origin-center"
          />

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border border-accent/30 flex items-center justify-center"
            >
              <FlowerDecor className="w-5 h-5 text-primary/30" />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] text-secondary/60 uppercase block mb-4"
          >
            Secure Checkout
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl sm:text-5xl font-bold text-secondary mb-4"
          >
            Complete Your Order
          </motion.h1>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center items-center mb-12"
        >
          <div className="flex items-center gap-4 md:gap-8">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`flex items-center gap-3 px-4 py-3 border transition-all duration-300 ${
                    step === s.number
                      ? 'bg-primary text-white border-primary'
                      : step > s.number
                        ? 'bg-white text-secondary border-primary'
                        : 'bg-white text-accent border-accent/40'
                  }`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center ${
                    step > s.number ? 'bg-primary text-white' : ''
                  }`}>
                    {step > s.number ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden sm:block font-medium text-sm tracking-wide">
                    {s.title}
                  </span>
                </motion.div>
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step > s.number ? 1 : 0 }}
                    className="w-8 md:w-16 h-px bg-primary origin-left"
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait" custom={direction}>

              {/* Step 1: Shipping Address */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="bg-white border border-accent/30 p-8"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 border border-accent/30 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-2xl font-bold text-secondary">
                        Shipping Address
                      </h2>
                      <p className="text-sm text-secondary/70">
                        Where should we deliver your artwork?
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <AnimatedInput
                        icon={User}
                        label="Full Name"
                        required
                        type="text"
                        name="fullName"
                        value={shippingAddress.fullName}
                        onChange={handleAddressChange}
                        placeholder="John Doe"
                      />
                      <AnimatedInput
                        icon={Phone}
                        label="Phone Number"
                        required
                        type="tel"
                        name="phoneNumber"
                        value={shippingAddress.phoneNumber}
                        onChange={handleAddressChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <AnimatedInput
                      icon={Home}
                      label="Address Line 1"
                      required
                      type="text"
                      name="addressLine1"
                      value={shippingAddress.addressLine1}
                      onChange={handleAddressChange}
                      placeholder="Street address"
                    />

                    <AnimatedInput
                      icon={Building2}
                      label="Address Line 2"
                      type="text"
                      name="addressLine2"
                      value={shippingAddress.addressLine2}
                      onChange={handleAddressChange}
                      placeholder="Apartment, suite, etc. (optional)"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <AnimatedInput
                        label="City"
                        required
                        type="text"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleAddressChange}
                        placeholder="Miami"
                      />
                      <AnimatedInput
                        label="State"
                        required
                        type="text"
                        name="state"
                        value={shippingAddress.state}
                        onChange={handleAddressChange}
                        placeholder="FL"
                        maxLength="2"
                        style={{ textTransform: 'uppercase' }}
                      />
                      <AnimatedInput
                        label="ZIP Code"
                        required
                        type="text"
                        name="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={handleAddressChange}
                        placeholder="33132"
                      />
                    </div>

                    <div>
                      <label className="block text-xs tracking-[0.15em] text-secondary/60 uppercase mb-2">
                        Country
                      </label>
                      <select
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-4 border border-accent/30 focus:border-primary outline-none transition-all duration-300 bg-white text-secondary"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>

                    {/* Validation Result */}
                    <AnimatePresence>
                      {validationResult && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`flex items-center gap-3 p-4 ${
                            validationResult.isValid
                              ? 'bg-primary text-white'
                              : 'bg-red-50 border border-red-200 text-red-700'
                          }`}
                        >
                          {validationResult.isValid ? (
                            <>
                              <Check className="w-5 h-5" />
                              <div>
                                <strong>Address Validated</strong>
                                {validationResult.classification && (
                                  <p className="text-sm text-white/70">
                                    Classification: {validationResult.classification}
                                  </p>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5" />
                              <div>
                                <strong>Validation Failed</strong>
                                <p className="text-sm">{validationResult.error}</p>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <motion.button
                        onClick={handleValidateAddress}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="flex-1 py-4 border border-primary text-primary font-medium hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <MapPinned className="w-5 h-5" />
                            Validate Address
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        onClick={handleCalculateShipping}
                        disabled={!addressValidated || loading}
                        whileHover={{ scale: !addressValidated || loading ? 1 : 1.02 }}
                        whileTap={{ scale: !addressValidated || loading ? 1 : 0.98 }}
                        className="flex-1 py-4 bg-primary text-white font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Continue to Shipping
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Shipping Method */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="bg-white border border-accent/30 p-8"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 border border-accent/30 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-2xl font-bold text-secondary">
                        Delivery Options
                      </h2>
                      <p className="text-sm text-secondary/70">
                        Choose your preferred shipping method
                      </p>
                    </div>
                  </div>

                  {/* Delivery Address Summary */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-accent/10 border border-accent/20 p-4 mb-6"
                  >
                    <p className="text-xs tracking-[0.15em] text-secondary/60 uppercase mb-2">
                      Delivering to
                    </p>
                    <p className="font-medium text-secondary">
                      {shippingAddress.fullName}
                    </p>
                    <p className="text-sm text-secondary/80">
                      {shippingAddress.addressLine1}, {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                    </p>
                  </motion.div>

                  {/* Shipping Options */}
                  <div className="space-y-4 mb-8">
                    {shippingOptions.length === 0 ? (
                      <p className="text-secondary/70 text-center py-8">
                        No shipping options available.
                      </p>
                    ) : (
                      shippingOptions.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleSelectShipping(option)}
                          whileHover={{ scale: 1.01 }}
                          className={`p-6 border cursor-pointer transition-all duration-300 ${
                            selectedShipping?.serviceType === option.serviceType
                              ? 'bg-primary text-white border-primary'
                              : 'bg-white border-accent/30 hover:border-primary/40'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 border flex items-center justify-center ${
                                selectedShipping?.serviceType === option.serviceType
                                  ? 'border-white/30'
                                  : 'border-accent/30'
                              }`}>
                                <Package className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-medium text-lg">{option.serviceName}</h3>
                                {option.transitDays && option.transitDays !== 'N/A' && (
                                  <p className={`text-sm ${
                                    selectedShipping?.serviceType === option.serviceType
                                      ? 'text-white/70'
                                      : 'text-secondary/60'
                                  }`}>
                                    {option.transitDays} business days
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-playfair text-2xl font-bold">
                                {formatCurrency(option.totalCharge)}
                              </p>
                              {selectedShipping?.serviceType === option.serviceType && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="flex items-center justify-end gap-1 mt-1"
                                >
                                  <Check className="w-4 h-4" />
                                  <span className="text-xs">Selected</span>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <motion.button
                      onClick={goBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 py-4 border border-primary text-primary font-medium hover:bg-accent/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </motion.button>

                    <motion.button
                      onClick={handleProceedToPayment}
                      disabled={!selectedShipping || loading}
                      whileHover={{ scale: !selectedShipping || loading ? 1 : 1.02 }}
                      whileTap={{ scale: !selectedShipping || loading ? 1 : 0.98 }}
                      className="flex-1 py-4 bg-primary text-white font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Continue to Payment
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && clientSecret && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="bg-white border border-accent/30 p-8"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 border border-accent/30 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-playfair text-2xl font-bold text-secondary">
                        Payment Details
                      </h2>
                      <p className="text-sm text-secondary/70">
                        Complete your purchase securely
                      </p>
                    </div>
                  </div>

                  {/* Order Summary Mini */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-accent/10 border border-accent/20 p-4"
                    >
                      <p className="text-xs tracking-[0.15em] text-secondary/60 uppercase mb-1">
                        Shipping to
                      </p>
                      <p className="font-medium text-secondary text-sm">
                        {shippingAddress.city}, {shippingAddress.state}
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-accent/10 border border-accent/20 p-4"
                    >
                      <p className="text-xs tracking-[0.15em] text-secondary/60 uppercase mb-1">
                        Delivery
                      </p>
                      <p className="font-medium text-secondary text-sm">
                        {selectedShipping?.serviceName}
                      </p>
                    </motion.div>
                  </div>

                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#4169E1',
                          colorBackground: '#ffffff',
                          colorText: '#1E3A5F',
                          colorDanger: '#ef4444',
                          fontFamily: 'system-ui, sans-serif',
                          borderRadius: '0px',
                        },
                        rules: {
                          '.Input': {
                            border: '1px solid #B0C4DE4D',
                            boxShadow: 'none',
                          },
                          '.Input:focus': {
                            border: '1px solid #4169E1',
                            boxShadow: 'none',
                          },
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

                  <motion.button
                    onClick={goBack}
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full mt-4 py-4 border border-primary text-primary font-medium hover:bg-accent/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Shipping
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-24"
            >
              <div className="bg-white border border-accent/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 border border-accent/30 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-secondary">
                    Order Summary
                  </h3>
                </div>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cart.items.map((item, index) => (
                    <motion.div
                      key={item._id || item.product}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-4 pb-4 border-b border-accent/20 last:border-0"
                    >
                      <div className="w-16 h-16 bg-accent/10 flex-shrink-0 overflow-hidden">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title || 'Product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-secondary text-sm truncate">
                          {item.title || 'Product'}
                        </h4>
                        <p className="text-xs text-secondary/60 mt-1">
                          Qty: {item.quantity}
                        </p>
                        <p className="font-medium text-secondary mt-1">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="mb-6">
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                        <input
                          type="text"
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="w-full pl-10 pr-4 py-3 border border-accent/30 focus:border-primary outline-none text-sm text-secondary"
                        />
                      </div>
                      <motion.button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode || loading}
                        whileHover={{ scale: !couponCode || loading ? 1 : 1.02 }}
                        whileTap={{ scale: !couponCode || loading ? 1 : 0.98 }}
                        className="px-4 py-3 bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Apply
                      </motion.button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-primary text-white p-4 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5" />
                        <div>
                          <p className="font-medium">{appliedCoupon.code}</p>
                          <p className="text-xs text-white/70">
                            -{formatCurrency(appliedCoupon.discountAmount)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-accent/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary/70">Subtotal</span>
                    <span className="font-medium text-secondary">{formatCurrency(subtotal)}</span>
                  </div>

                  <AnimatePresence>
                    {discount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex justify-between text-sm text-green-600"
                      >
                        <span>Discount</span>
                        <span>-{formatCurrency(discount)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex justify-between text-sm">
                    <span className="text-secondary/70">Shipping</span>
                    <span className="font-medium text-secondary">
                      {selectedShipping
                        ? formatCurrency(shippingCost)
                        : <span className="text-secondary/50">Calculated next</span>
                      }
                    </span>
                  </div>

                  {tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary/70">Tax</span>
                      <span className="font-medium text-secondary">{formatCurrency(tax)}</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-primary">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-secondary">Total</span>
                      <span className="font-playfair text-2xl font-bold text-secondary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 pt-6 border-t border-accent/20"
                >
                  <div className="flex items-center justify-center gap-3 text-secondary/60">
                    <ShieldCheck className="w-5 h-5 text-primary/60" />
                    <span className="text-xs tracking-wide">
                      Secure checkout powered by Stripe
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6 grid grid-cols-3 gap-4"
              >
                {[
                  { icon: Lock, text: 'Secure' },
                  { icon: Truck, text: 'Tracked' },
                  { icon: Sparkles, text: 'Insured' },
                ].map((badge, index) => (
                  <motion.div
                    key={badge.text}
                    whileHover={{ y: -2 }}
                    className="bg-white border border-accent/30 p-4 text-center"
                  >
                    <badge.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                    <span className="text-xs text-secondary/70">{badge.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5 }}
            className="w-32 h-px bg-accent mx-auto mb-8"
          />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border border-accent/30 flex items-center justify-center mx-auto mb-4"
          >
            <FlowerDecor className="w-5 h-5 text-primary/30" />
          </motion.div>

          <p className="text-sm text-secondary/60">
            Your artwork will be carefully packaged and shipped with care
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;