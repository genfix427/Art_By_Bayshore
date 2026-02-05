import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Clock,
  Info
} from 'lucide-react';
import { authService } from '../../api/services.js';
import { useSEO } from '../../hooks/useSEO';
import { toast } from 'react-hot-toast'; // Or your toast library of choice

const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
      y: [-20, 400, 800],
      rotate: [0, 180, 360],
      x: [0, 30, -20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-900">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.5" />
  </svg>
);

const VerifyEmail = () => {
  useSEO({ title: 'Verify Email | Art Haven' });

  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    }
  }, [token]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [status, countdown, navigate]);

  const handleVerifyEmail = async () => {
    try {
      // Direct API call
      const response = await authService.verifyEmail(token);
      
      console.log('📥 Response:', response);
      
      // Response is already unwrapped by axios interceptor
      // response = { success: true, message: "...", alreadyVerified: false }
      
      setStatus('success');
      setMessage(response.message || 'Email verified successfully!');
      setAlreadyVerified(response.alreadyVerified || false);
      
      // Show success toast
      if (response.alreadyVerified) {
        toast.success('Email is already verified. Please login.', {
          duration: 5000,
          position: 'top-right',
        });
      } else {
        toast.success('🎉 Email verified successfully! Redirecting to login...', {
          duration: 5000,
          position: 'top-right',
        });
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      
      const errorMessage = error.message || 'Email verification failed';
      setStatus('error');
      setMessage(errorMessage);
      
      // Show error toast
      toast.error(`Verification failed: ${errorMessage}`, {
        duration: 6000,
        position: 'top-right',
        icon: '❌',
      });
    }
  };

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
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={i} {...petal} />
        ))}
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: 0.05, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-32 left-10 w-40 h-40 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <Link to="/" className="inline-block group">
            <motion.div
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="w-16 h-16 mx-auto mb-6 border border-gray-900/20 flex items-center justify-center"
            >
              <FlowerDecor className="w-8 h-8 text-gray-900" />
            </motion.div>
          </Link>

          <motion.div className="w-12 h-px bg-gray-900 mx-auto mb-6" />
        </motion.div>

        {/* Status Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white border border-gray-900/10 p-10"
        >
          <AnimatePresence mode="wait">
            {/* Verifying State */}
            {status === 'verifying' && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 mx-auto mb-6 border border-gray-900/20 flex items-center justify-center"
                >
                  <Loader2 className="w-10 h-10 text-gray-900" />
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-3">
                  Verifying Email
                </h1>
                
                <p className="text-gray-900/60">
                  Please wait while we verify your email address...
                </p>

                <motion.div
                  className="mt-8 flex justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-900 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2 
                  }}
                  className={`w-20 h-20 mx-auto mb-6 border flex items-center justify-center ${
                    alreadyVerified 
                      ? 'border-blue-500/20 bg-blue-50' 
                      : 'border-green-500/20 bg-green-50'
                  }`}
                >
                  {alreadyVerified ? (
                    <Info className="w-10 h-10 text-blue-600" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  )}
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-3">
                  {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
                </h1>
                
                <p className="text-gray-900/60 mb-6">
                  {message}
                </p>

                {alreadyVerified && (
                  <div className="bg-blue-50 border border-blue-200 p-4 mb-6">
                    <p className="text-sm text-blue-900">
                      Your email was already verified. You can proceed to login.
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-900/10 p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-900/60">
                    <Clock className="w-4 h-4" />
                    <span>Redirecting to login in {countdown} seconds...</span>
                  </div>
                </div>

                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 group"
                  >
                    <span>Continue to Login</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2 
                  }}
                  className="w-20 h-20 mx-auto mb-6 border border-red-500/20 bg-red-50 flex items-center justify-center"
                >
                  <XCircle className="w-10 h-10 text-red-600" />
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-gray-900 mb-3">
                  Verification Failed
                </h1>
                
                <p className="text-gray-900/60 mb-6">
                  {message}
                </p>

                <div className="bg-red-50 border border-red-200 p-4 mb-6">
                  <p className="text-sm text-red-800 mb-2">
                    The verification link may have expired or is invalid.
                  </p>
                  <p className="text-sm text-red-800">
                    Verification links expire after 24 hours. Please request a new one.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link to="/resend-verification">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Request New Verification Email</span>
                    </motion.button>
                  </Link>

                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full border border-gray-900/20 text-gray-900 py-4 font-medium hover:bg-gray-50 transition-all duration-300"
                    >
                      Back to Login
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="w-24 h-px bg-gray-900/10 mx-auto mt-12"
        />
      </motion.div>
    </div>
  );
};

export default VerifyEmail;