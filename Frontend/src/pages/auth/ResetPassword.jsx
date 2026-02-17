import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';

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

// Password strength indicator
const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength();
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3"
    >
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.div
            key={level}
            className={`h-1 flex-1 ${
              level <= strength
                ? strength <= 2 ? 'bg-red-400' : strength <= 3 ? 'bg-yellow-400' : 'bg-green-400'
                : 'bg-accent/30'
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level <= strength ? 1 : 0.3 }}
            transition={{ duration: 0.3, delay: level * 0.05 }}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength <= 2 ? 'text-red-500' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'
      }`}>
        {labels[strength - 1] || 'Too short'}
      </p>
    </motion.div>
  );
};

const ResetPassword = () => {
  useSEO({ title: 'Reset Password | Art Haven' });

  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState({});
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });
  const [validToken, setValidToken] = useState(true);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

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
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
  };

  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
  }, [success, countdown, navigate]);

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleFocus = (field) => setFocused({ ...focused, [field]: true });
  const handleBlur = (field) => setFocused({ ...focused, [field]: false });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showFeedback('Passwords do not match', 'error');
      return;
    }

    if (formData.password.length < 8) {
      showFeedback('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, formData.password);
      setSuccess(true);
    } catch (error) {
      if (error.message && (error.message.includes('Invalid') || error.message.includes('expired'))) {
        setValidToken(false);
      }
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

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
              className="w-16 h-16 mx-auto mb-6 border border-accent/40 flex items-center justify-center"
            >
              <FlowerDecor className="w-8 h-8 text-primary" />
            </motion.div>
          </Link>

          <motion.div
            variants={lineVariants}
            className="w-12 h-px bg-primary mx-auto mb-6 origin-center"
          />

          <h1 className="font-playfair text-4xl font-bold text-primary mb-2">
            Reset Password
          </h1>
          <p className="text-secondary/70 text-sm tracking-wide">
            Enter your new password below
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white border border-accent/30 p-8 sm:p-10"
        >
          <AnimatePresence mode="wait">
            {!validToken ? (
              <motion.div
                key="invalid"
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

                <h2 className="font-playfair text-2xl font-bold text-secondary mb-3">
                  Invalid or Expired Link
                </h2>

                <p className="text-secondary/70 mb-6">
                  This password reset link is invalid or has expired.
                </p>

                <div className="bg-red-50 border border-red-200 p-4 mb-6">
                  <p className="text-sm text-red-800">
                    Password reset links expire after 1 hour for security reasons. Please request a new one.
                  </p>
                </div>

                <Link to="/forgot-password">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-3 group"
                  >
                    <span>Request New Reset Link</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>
            ) : success ? (
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
                  className="w-20 h-20 mx-auto mb-6 border border-accent/30 bg-accent/10 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </motion.div>

                <h2 className="font-playfair text-2xl font-bold text-secondary mb-3">
                  Password Reset Successful!
                </h2>

                <p className="text-secondary/70 mb-6">
                  Your password has been successfully reset. You can now login with your new password.
                </p>

                <div className="bg-accent/10 border border-accent/20 p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-secondary/70">
                    <Clock className="w-4 h-4 text-primary/60" />
                    <span>Redirecting to login in {countdown} seconds...</span>
                  </div>
                </div>

                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 flex items-center justify-center gap-3 group"
                  >
                    <span>Continue to Login</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Security Notice */}
                <div className="bg-accent/10 border border-accent/20 p-4 flex gap-3">
                  <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-secondary font-medium mb-1">
                      Create a Strong Password
                    </p>
                    <p className="text-sm text-secondary/70">
                      Use at least 8 characters with a mix of uppercase, lowercase, and numbers.
                    </p>
                  </div>
                </div>

                {/* Password Field */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs tracking-[0.2em] text-secondary/60 uppercase mb-3">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      focused.password ? 'text-primary' : 'text-accent'
                    }`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      onFocus={() => handleFocus('password')}
                      onBlur={() => handleBlur('password')}
                      required
                      minLength="8"
                      className="w-full pl-12 pr-12 py-4 border border-accent/30 focus:border-primary outline-none transition-all duration-300 bg-transparent text-secondary"
                      placeholder="Min. 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-accent hover:text-primary transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-primary"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: focused.password ? 1 : 0 }}
                      style={{ originX: 0 }}
                    />
                  </div>
                  <PasswordStrength password={formData.password} />
                </motion.div>

                {/* Confirm Password Field */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs tracking-[0.2em] text-secondary/60 uppercase mb-3">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                      focused.confirmPassword ? 'text-primary' : 'text-accent'
                    }`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      onFocus={() => handleFocus('confirmPassword')}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                      minLength="8"
                      className={`w-full pl-12 pr-12 py-4 border outline-none transition-all duration-300 bg-transparent text-secondary ${
                        formData.confirmPassword
                          ? passwordsMatch
                            ? 'border-green-500 focus:border-green-600'
                            : 'border-red-400 focus:border-red-500'
                          : 'border-accent/30 focus:border-primary'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {formData.confirmPassword && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          {passwordsMatch ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </motion.div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-accent hover:text-primary transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <motion.div
                      className="absolute bottom-0 left-0 h-px bg-primary"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: focused.confirmPassword ? 1 : 0 }}
                      style={{ originX: 0 }}
                    />
                  </div>
                  <AnimatePresence>
                    {formData.confirmPassword && !passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500 text-xs mt-2"
                      >
                        Passwords do not match
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading || !passwordsMatch}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full bg-primary text-white py-4 font-medium hover:bg-secondary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Resetting password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Links */}
        {validToken && !success && (
          <motion.div
            variants={itemVariants}
            className="text-center mt-8"
          >
            <Link
              to="/login"
              className="text-secondary/70 font-medium relative group"
            >
              Remember your password? Sign in
              <span className="absolute bottom-0 left-0 w-full h-px bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
          </motion.div>
        )}

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

export default ResetPassword;