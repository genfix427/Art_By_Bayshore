import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSEO } from '../../hooks/useSEO';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2,
  User,
  Check,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Floating petal component
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

// Decorative corner
const CornerDecor = ({ position }) => {
  const positions = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0 rotate-90',
    'bottom-left': 'bottom-0 left-0 -rotate-90',
    'bottom-right': 'bottom-0 right-0 rotate-180',
  };
  
  return (
    <div className={`absolute w-8 h-8 ${positions[position]}`}>
      <svg viewBox="0 0 32 32" className="w-full h-full text-gray-900/10">
        <path d="M0 0 L32 0 L32 4 L4 4 L4 32 L0 32 Z" fill="currentColor" />
      </svg>
    </div>
  );
};

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
                : 'bg-gray-200'
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

const Register = () => {
  useSEO({ title: 'Create Account | Art Haven' });
  
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState({});
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });
  const [step, setStep] = useState(1); // For multi-step animation

  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 18 + Math.random() * 10,
    size: 10 + Math.random() * 8,
  }));

  // Animation variants
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

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
  };

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 4000);
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
      await register(formData);
      showFeedback('Account created successfully!', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      showFeedback(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

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
      
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: 45 }}
        animate={{ opacity: 0.05, scale: 1, rotate: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-32 right-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 ${
              feedback.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
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
        {/* Logo/Brand */}
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
          
          <motion.div
            variants={lineVariants}
            className="w-12 h-px bg-gray-900 mx-auto mb-6 origin-center"
          />
          
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-900/50 text-sm tracking-wide">
            Join our community of art enthusiasts
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white border border-gray-900/10 p-8 sm:p-10"
        >

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants}>
                <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                  First Name
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focused.firstName ? 'text-gray-900' : 'text-gray-900/30'
                  }`} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    onFocus={() => handleFocus('firstName')}
                    onBlur={() => handleBlur('firstName')}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                    placeholder="John"
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-px bg-gray-900"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: focused.firstName ? 1 : 0 }}
                    style={{ originX: 0 }}
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                  Last Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    onFocus={() => handleFocus('lastName')}
                    onBlur={() => handleBlur('lastName')}
                    required
                    className="w-full px-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                    placeholder="Doe"
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-px bg-gray-900"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: focused.lastName ? 1 : 0 }}
                    style={{ originX: 0 }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focused.email ? 'text-gray-900' : 'text-gray-900/30'
                }`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => handleFocus('email')}
                  onBlur={() => handleBlur('email')}
                  required
                  className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                  placeholder="john@example.com"
                />
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-gray-900"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: focused.email ? 1 : 0 }}
                  style={{ originX: 0 }}
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focused.password ? 'text-gray-900' : 'text-gray-900/30'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => handleFocus('password')}
                  onBlur={() => handleBlur('password')}
                  required
                  minLength="8"
                  className="w-full pl-12 pr-12 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-all duration-300 bg-transparent text-gray-900"
                  placeholder="Min. 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-900/30 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-gray-900"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: focused.password ? 1 : 0 }}
                  style={{ originX: 0 }}
                />
              </div>
              <PasswordStrength password={formData.password} />
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div variants={itemVariants}>
              <label className="block text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focused.confirmPassword ? 'text-gray-900' : 'text-gray-900/30'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onFocus={() => handleFocus('confirmPassword')}
                  onBlur={() => handleBlur('confirmPassword')}
                  required
                  minLength="8"
                  className={`w-full pl-12 pr-12 py-4 border outline-none transition-all duration-300 bg-transparent text-gray-900 ${
                    formData.confirmPassword 
                      ? passwordsMatch 
                        ? 'border-green-500 focus:border-green-600' 
                        : 'border-red-400 focus:border-red-500'
                      : 'border-gray-900/10 focus:border-gray-900'
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
                    className="text-gray-900/30 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 h-px bg-gray-900"
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

            {/* Terms */}
            <motion.div variants={itemVariants} className="flex items-start gap-3">
              <input
                type="checkbox"
                required
                className="mt-1 w-4 h-4 border border-gray-900/20 rounded-none accent-gray-900"
              />
              <span className="text-sm text-gray-900/60">
                I agree to the{' '}
                <Link to="/terms" className="text-gray-900 underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-gray-900 underline underline-offset-2">
                  Privacy Policy
                </Link>
              </span>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="pt-2">
              <motion.button
                type="submit"
                disabled={loading || !passwordsMatch}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-900/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-900/40">or sign up with</span>
            </div>
          </div>
        </motion.div>

        {/* Login Link */}
        <motion.p
          variants={itemVariants}
          className="text-center mt-8 text-gray-900/60"
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-gray-900 font-medium relative group"
          >
            Sign in
            <span className="absolute bottom-0 left-0 w-full h-px bg-gray-900 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
          </Link>
        </motion.p>

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

export default Register;