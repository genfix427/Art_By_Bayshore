import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';

const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.3, 0.3, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" className="text-primary">
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

const FloatingCircle = ({ delay, startX, duration, size = 20 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, scale: 0.5 }}
    animate={{
      opacity: [0, 0.2, 0.2, 0],
      y: [-20, 500, 1000],
      scale: [0.5, 1, 0.5],
      x: [0, -40, 20],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full border-2 border-primary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

const FloatingDiamond = ({ delay, startX, duration, size = 16 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 45 }}
    animate={{
      opacity: [0, 0.25, 0.25, 0],
      y: [-20, 600, 1200],
      rotate: [45, 225, 405],
      x: [0, 50, -30],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="border-2 border-secondary"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

const FloatingDot = ({ delay, startX, duration, size = 8 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20 }}
    animate={{
      opacity: [0, 0.4, 0.4, 0],
      y: [-20, 700, 1400],
      x: [0, -20, 40, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <div 
      className="rounded-full bg-accent"
      style={{ width: size, height: size }}
    />
  </motion.div>
);

const PulsingOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full bg-primary pointer-events-none ${className}`}
    initial={{ opacity: 0.05, scale: 1 }}
    animate={{
      opacity: [0.05, 0.15, 0.05],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const FlowerDecor = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill="currentColor" opacity="0.6" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill="currentColor" opacity="0.6" />
  </svg>
);

const VerifyEmailPending = () => {
  useSEO({ title: 'Verify Your Email | Art Haven' });

  const location = useLocation();
  const { resendVerification } = useAuth();
  const email = location.state?.email || '';

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  const petals = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 3,
    startX: 5 + i * 15,
    duration: 18 + Math.random() * 10,
    size: 12 + Math.random() * 8,
  }));

  const circles = Array.from({ length: 5 }).map((_, i) => ({
    delay: i * 4 + 1,
    startX: 10 + i * 18,
    duration: 20 + Math.random() * 8,
    size: 15 + Math.random() * 10,
  }));

  const diamonds = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 5 + 2,
    startX: 15 + i * 20,
    duration: 22 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  const dots = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2.5,
    startX: 8 + i * 12,
    duration: 15 + Math.random() * 10,
    size: 6 + Math.random() * 6,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleResend = async () => {
    if (!email) {
      showFeedback('Email address not found. Please register again.', 'error');
      return;
    }

    setLoading(true);
    try {
      await resendVerification(email);
    } catch (error) {
      console.error('Resend verification error:', error);
    } finally {
      setLoading(false);
    }
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

      {/* Pulsing Background Orbs */}
      <PulsingOrb className="w-64 h-64 -top-32 -left-32 blur-3xl" delay={0} />
      <PulsingOrb className="w-80 h-80 -bottom-40 -right-40 blur-3xl" delay={2} />
      <PulsingOrb className="w-48 h-48 top-1/2 -left-24 blur-2xl" delay={1} />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal, i) => (
          <FloatingPetal key={`petal-${i}`} {...petal} />
        ))}
        {circles.map((circle, i) => (
          <FloatingCircle key={`circle-${i}`} {...circle} />
        ))}
        {diamonds.map((diamond, i) => (
          <FloatingDiamond key={`diamond-${i}`} {...diamond} />
        ))}
        {dots.map((dot, i) => (
          <FloatingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <motion.div
        className="absolute top-20 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-20 left-0 w-full h-px bg-primary pointer-events-none"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.1 }}
        transition={{ duration: 2, delay: 0.7 }}
      />

      {/* Decorative Corner Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -45 }}
        animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-32 left-10 w-40 h-40 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: 45 }}
        animate={{ opacity: 0.1, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-32 right-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-secondary" />
      </motion.div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-primary'
            } text-white`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="w-16 h-16 mx-auto mb-6 border-2 border-primary/30 flex items-center justify-center"
            >
              <FlowerDecor className="w-8 h-8 text-primary" />
            </motion.div>
          </Link>
          
          <motion.div className="w-12 h-px bg-primary mx-auto mb-6" />
        </motion.div>

        {/* Status Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white border-2 border-primary/20 p-10 shadow-lg"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
              className="w-20 h-20 mx-auto mb-6 border-2 border-primary/30 bg-accent/20 flex items-center justify-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Mail className="w-10 h-10 text-primary" />
              </motion.div>
            </motion.div>

            <h1 className="font-playfair text-3xl font-bold text-primary mb-3">
              Check Your Email
            </h1>
            
            <p className="text-black/70 mb-2 text-base">
              We've sent a verification link to
            </p>
            {email && (
              <p className="text-primary font-semibold mb-6 text-lg">
                {email}
              </p>
            )}

            <div className="bg-accent/30 border border-primary/20 p-4 mb-6 text-left">
              <p className="text-sm text-secondary font-semibold mb-2">
                What's next?
              </p>
              <ul className="text-sm text-black/80 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Check your inbox and spam folder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Sign in to your account</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={handleResend}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full border-2 border-primary/30 text-primary py-4 font-medium hover:bg-accent/20 hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </motion.button>

              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 cursor-pointer"
                >
                  Go to Login
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="w-24 h-px bg-primary/30 mx-auto mt-12"
        />
      </motion.div>
    </div>
  );
};

export default VerifyEmailPending;