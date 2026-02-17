import { useState, useEffect, useRef } from 'react';
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
import { toast } from 'react-hot-toast';

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
    style={{ left: '50%', top: '50%', width: dotSize, height: dotSize }}
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
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
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

const VerifyEmail = () => {
  useSEO({ title: 'Verify Email | Art Haven' });

  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  // Generate animations data
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  const diamonds = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 3 + 1,
    startX: 8 + i * 20,
    duration: 22 + Math.random() * 12,
    size: 6 + Math.random() * 6,
  }));

  const orbs = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 1.5,
    x: 10 + i * 25,
    y: 15 + (i % 3) * 30,
    size: 70 + Math.random() * 100,
  }));

  const lines = Array.from({ length: 3 }).map((_, i) => ({
    delay: i * 6,
    y: 25 + i * 25,
    direction: i % 2 === 0 ? 1 : -1,
  }));

  const hasCalled = useRef(false);

  useEffect(() => {
    if (token && !hasCalled.current) {
      hasCalled.current = true;
      handleVerifyEmail();
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    try {
      const response = await authService.verifyEmail(token);

      console.log('📥 Response:', response);

      setStatus('success');
      setMessage(response.message || 'Email verified successfully!');
      setAlreadyVerified(response.alreadyVerified || false);

      if (response.alreadyVerified) {
        toast.success('Email is already verified. Please login.', {
          duration: 5000,
          position: 'top-right',
        });
      } else {
        toast.success('🎉 Email verified successfully!');
      }
    } catch (error) {
      console.error('❌ Error:', error);

      const errorMessage = error.message || 'Email verification failed';
      setStatus('error');
      setMessage(errorMessage);

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
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4 py-12">
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute" style={{ left: '12%', top: '30%' }}>
          <OrbitingDot radius={50} duration={12} delay={0} dotSize={3} />
          <OrbitingDot radius={50} duration={12} delay={6} dotSize={3} />
        </div>
        <div className="absolute" style={{ left: '85%', top: '65%' }}>
          <OrbitingDot radius={38} duration={10} delay={3} dotSize={3} />
          <OrbitingDot radius={38} duration={10} delay={8} dotSize={3} />
        </div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: 0.05, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-32 left-10 w-40 h-40 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
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
              className="w-16 h-16 mx-auto mb-6 border border-accent/40 flex items-center justify-center"
            >
              <FlowerDecor className="w-8 h-8 text-primary" />
            </motion.div>
          </Link>

          <motion.div className="w-12 h-px bg-primary mx-auto mb-6" />
        </motion.div>

        {/* Status Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white border border-accent/30 p-10"
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
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6 border border-primary/20 flex items-center justify-center"
                >
                  <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-primary mb-3">
                  Verifying Email
                </h1>

                <p className="text-secondary/70">
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
                      className="w-2 h-2 bg-primary rounded-full"
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
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className={`w-20 h-20 mx-auto mb-6 border flex items-center justify-center ${
                    alreadyVerified
                      ? 'border-accent/30 bg-accent/10'
                      : 'border-green-500/20 bg-green-50'
                  }`}
                >
                  {alreadyVerified ? (
                    <Info className="w-10 h-10 text-primary" />
                  ) : (
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  )}
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-secondary mb-3">
                  {alreadyVerified ? 'Already Verified!' : 'Email Verified!'}
                </h1>

                <p className="text-secondary/70 mb-6">
                  {message}
                </p>

                {alreadyVerified && (
                  <div className="bg-accent/10 border border-accent/20 p-4 mb-6">
                    <p className="text-sm text-secondary">
                      Your email was already verified. You can proceed to login.
                    </p>
                  </div>
                )}

                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
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
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="w-20 h-20 mx-auto mb-6 border border-red-500/20 bg-red-50 flex items-center justify-center"
                >
                  <XCircle className="w-10 h-10 text-red-600" />
                </motion.div>

                <h1 className="font-playfair text-3xl font-bold text-secondary mb-3">
                  Verification Failed
                </h1>

                <p className="text-secondary/70 mb-6">
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
                      className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-3 group cursor-pointer"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>Request New Verification Email</span>
                    </motion.button>
                  </Link>

                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full border border-accent/40 text-secondary py-4 font-medium hover:bg-accent/10 transition-all duration-300 cursor-pointer"
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
          className="w-24 h-px bg-accent mx-auto mt-12"
        />
      </motion.div>
    </div>
  );
};

export default VerifyEmail;