import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  User,
  MessageSquare,
  Check,
  Clock,
  Globe,
  Navigation,
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa'
import { FaXTwitter } from "react-icons/fa6";

// Theme Colors
const theme = {
  primary: '#4169E1',    // Royal Blue
  secondary: '#1E3A5F',  // Deep Navy
  accent: '#B0C4DE',     // Light Steel Blue
  black: '#111111',
  white: '#FFFFFF',
};

// Floating petal component with theme colors
const FloatingPetal = ({ delay, startX, duration, size = 14 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.15, 0.15, 0],
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
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: theme.primary }}>
      <path
        d="M12 2C12 2 14 6 14 8C14 10 12 12 12 12C12 12 10 10 10 8C10 6 12 2 12 2Z"
        fill="currentColor"
      />
    </svg>
  </motion.div>
);

// Floating geometric shapes for background
const FloatingShape = ({ delay, startX, duration, type = 'circle' }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, bottom: "-5%" }}
    initial={{ opacity: 0, y: 20, rotate: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 0.1, 0.1, 0],
      y: [20, -400, -800],
      rotate: [0, 90, 180],
      scale: [0.5, 1, 0.5],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    {type === 'circle' ? (
      <div
        className="w-4 h-4 rounded-full border-2"
        style={{ borderColor: theme.accent }}
      />
    ) : type === 'square' ? (
      <div
        className="w-3 h-3 border-2 rotate-45"
        style={{ borderColor: theme.primary }}
      />
    ) : (
      <div
        className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
        style={{ borderBottomColor: theme.accent }}
      />
    )}
  </motion.div>
);

// Pulsing dot decoration
const PulsingDot = ({ delay, position, size = 8 }) => (
  <motion.div
    className="absolute pointer-events-none z-0 rounded-full"
    style={{
      ...position,
      width: size,
      height: size,
      backgroundColor: theme.accent
    }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.3, 0],
      scale: [0.5, 1.5, 0.5],
    }}
    transition={{
      duration: 4,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Animated line decoration
const AnimatedLine = ({ delay, vertical = false, position }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={position}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.08, 0.08, 0],
      scale: [0, 1, 1, 0],
    }}
    transition={{
      duration: 8,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  >
    <div
      className={vertical ? "w-px h-32" : "w-32 h-px"}
      style={{ backgroundColor: theme.primary }}
    />
  </motion.div>
);

// Flower decoration component
const FlowerDecor = ({ className, color = theme.primary }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2.5" fill={color} />
    <ellipse cx="12" cy="5" rx="2" ry="4" fill={color} opacity="0.5" />
    <ellipse cx="12" cy="19" rx="2" ry="4" fill={color} opacity="0.5" />
    <ellipse cx="5" cy="12" rx="4" ry="2" fill={color} opacity="0.5" />
    <ellipse cx="19" cy="12" rx="4" ry="2" fill={color} opacity="0.5" />
  </svg>
);

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focused, setFocused] = useState({});
  const [feedback, setFeedback] = useState({ show: false, message: '', type: 'success' });

  // Generate floating petals
  const petals = Array.from({ length: 10 }).map((_, i) => ({
    delay: i * 1.5,
    startX: 5 + i * 10,
    duration: 15 + Math.random() * 8,
    size: 12 + Math.random() * 8,
  }));

  // Generate floating shapes
  const shapes = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 10 + i * 12,
    duration: 20 + Math.random() * 10,
    type: ['circle', 'square', 'triangle'][i % 3],
  }));

  // Generate pulsing dots
  const dots = Array.from({ length: 6 }).map((_, i) => ({
    delay: i * 1.5,
    position: {
      top: `${15 + i * 15}%`,
      left: i % 2 === 0 ? '5%' : '95%',
    },
    size: 6 + Math.random() * 6,
  }));

  // Generate animated lines
  const lines = Array.from({ length: 4 }).map((_, i) => ({
    delay: i * 3,
    vertical: i % 2 === 0,
    position: {
      top: `${20 + i * 20}%`,
      [i % 2 === 0 ? 'right' : 'left']: '10%',
    },
  }));

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
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const lineAnimation = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: { duration: 1, ease: "easeInOut" }
    }
  };

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init("YOUR_PUBLIC_KEY");
  }, []);

  const handleFocus = (field) => setFocused({ ...focused, [field]: true });
  const handleBlur = (field) => setFocused({ ...focused, [field]: false });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const showFeedback = (message, type = 'success') => {
    setFeedback({ show: true, message, type });
    setTimeout(() => setFeedback({ show: false, message: '', type: 'success' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        from_phone: formData.phone || 'Not provided',
        subject: formData.subject,
        message: formData.message,
        to_name: 'ArtGallery Team',
        reply_to: formData.email,
        date: new Date().toLocaleString(),
      };

      const result = await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
        templateParams
      );

      if (result.status === 200) {
        setIsSubmitted(true);
        setFormData({
          name: '',
          phone: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Email sending error:', error);
      showFeedback('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Building2,
      title: "Visit Our Gallery",
      primary: "The Grand Retail Plaza",
      secondary: "1717 N Bayshore Dr #121",
      tertiary: "Miami, FL 33132"
    },
    {
      icon: Phone,
      title: "Call Us",
      primary: "+1 305-371-3060",
      secondary: "Mon-Sat: 10am-7pm",
      tertiary: "Sunday: 10am-3pm EST"
    },
    {
      icon: Mail,
      title: "Email Us",
      primary: "bayshoreart@gmail.com",
      secondary: "We reply within 24 hours",
      tertiary: "Contact us anytime"
    }
  ];

  const socialLinks = [
    {
      icon: FaFacebook,
      name: "Facebook",
      url: "#",
      color: "#1877F2" // Facebook blue
    },
    {
      icon: FaInstagram,
      name: "Instagram",
      url: "#",
      color: "#E4405F" // Instagram pink/red
    },
    {
      icon: FaXTwitter,
      name: "X",
      url: "#",
      color: "#111111" // Twitter blue
    },
    {
      icon: FaLinkedin,
      name: "LinkedIn",
      url: "#",
      color: "#0A66C2" // LinkedIn blue
    }
  ];

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.883147443072!2d-80.18739172422224!3d25.78618917737203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b6823bcf83f7%3A0xef6b2824b4e9f65f!2s1717%20N%20Bayshore%20Dr%20%23121%2C%20Miami%2C%20FL%2033132%2C%20USA!5e0!3m2!1sen!2s!4v1701200000000!5m2!1sen!2s";

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: theme.white }}>
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

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {shapes.map((shape, i) => (
          <FloatingShape key={`shape-${i}`} {...shape} />
        ))}
      </div>

      {/* Pulsing Dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {dots.map((dot, i) => (
          <PulsingDot key={`dot-${i}`} {...dot} />
        ))}
      </div>

      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {lines.map((line, i) => (
          <AnimatedLine key={`line-${i}`} {...line} />
        ))}
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-40 left-10 w-64 h-64 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.primary} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-48 h-48 pointer-events-none hidden lg:block"
      >
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        >
          <FlowerDecor className="w-full h-full" color={theme.accent} />
        </motion.div>
      </motion.div>

      {/* Decorative Circles */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute top-20 right-20 w-72 h-72 rounded-full border hidden lg:block"
        style={{ borderColor: theme.primary }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.05, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute bottom-32 left-20 w-56 h-56 rounded-full border hidden lg:block"
        style={{ borderColor: theme.accent }}
      />

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 shadow-lg text-white"
            style={{ backgroundColor: feedback.type === 'error' ? '#DC2626' : theme.primary }}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm mb-12"
          style={{ color: `${theme.primary}80` }}
        >
          <Link
            to="/"
            className="transition-colors hover:opacity-100"
            style={{ color: theme.primary }}
          >
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span style={{ color: theme.secondary }}>Contact</span>
        </motion.nav>

        {/* Page Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.div
            variants={lineAnimation}
            className="w-16 h-px mx-auto mb-8 origin-center"
            style={{ backgroundColor: theme.primary }}
          />

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 flex items-center justify-center border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-5 h-5" color={`${theme.primary}40`} />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] uppercase block mb-4"
            style={{ color: theme.secondary }}
          >
            Get in Touch
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            style={{ color: theme.primary }}
          >
            Contact Our Gallery
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto leading-relaxed"
            style={{ color: `${theme.secondary}cc` }}
          >
            Located in The Grand Retail Plaza, Miami. Experience art in person at our
            beautiful gallery space or reach out to us for any inquiries.
          </motion.p>
        </motion.div>

        {/* Contact Info Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="relative p-8 text-center group transition-colors border"
              style={{
                backgroundColor: theme.white,
                borderColor: `${theme.primary}20`
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = `${theme.primary}60`}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = `${theme.primary}20`}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 flex items-center justify-center mx-auto mb-6 transition-colors border"
                style={{ borderColor: `${theme.primary}30` }}
              >
                <info.icon className="w-6 h-6" style={{ color: theme.primary }} />
              </motion.div>

              <h3
                className="text-xs tracking-[0.2em] uppercase mb-3"
                style={{ color: theme.primary }}
              >
                {info.title}
              </h3>
              <p
                className="font-playfair text-lg font-bold mb-2"
                style={{ color: theme.secondary }}
              >
                {info.primary}
              </p>
              <p
                className="text-sm mb-1"
                style={{ color: `${theme.secondary}b3` }}
              >
                {info.secondary}
              </p>
              <p
                className="text-sm"
                style={{ color: `${theme.secondary}80` }}
              >
                {info.tertiary}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="relative p-8 border"
              style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
            >
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-8">
                <div
                  className="w-10 h-10 flex items-center justify-center border"
                  style={{ borderColor: `${theme.primary}30` }}
                >
                  <MessageSquare className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <h2
                    className="font-playfair text-2xl font-bold"
                    style={{ color: theme.primary }}
                  >
                    Send a Message
                  </h2>
                  <p
                    className="text-sm"
                    style={{ color: `${theme.secondary}` }}
                  >
                    We'll respond within 24 hours
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Check className="w-10 h-10" style={{ color: theme.white }} />
                    </motion.div>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4 }}
                      className="w-12 h-px mx-auto mb-6"
                      style={{ backgroundColor: theme.primary }}
                    />

                    <h3
                      className="font-playfair text-2xl font-bold mb-3"
                      style={{ color: theme.secondary }}
                    >
                      Message Sent
                    </h3>
                    <p
                      className="mb-6"
                      style={{ color: `${theme.secondary}b3` }}
                    >
                      Thank you for reaching out. We'll get back to you soon!
                    </p>

                    <motion.button
                      onClick={() => setIsSubmitted(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 px-6 py-3 font-medium transition-colors cursor-pointer border-2"
                      style={{
                        borderColor: theme.primary,
                        color: theme.primary
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.primary;
                        e.target.style.color = theme.white;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = theme.primary;
                      }}
                    >
                      <Send className="w-4 h-4" />
                      Send Another Message
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Name */}
                    <div>
                      <label
                        className="block text-xs tracking-[0.15em] uppercase mb-2"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Your Name <span style={{ color: `${theme.primary}60` }}>*</span>
                      </label>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                          style={{ color: focused.name ? theme.primary : `${theme.primary}50` }}
                        />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => handleFocus('name')}
                          onBlur={() => handleBlur('name')}
                          required
                          className="w-full pl-12 pr-4 py-4 outline-none transition-colors"
                          style={{
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.name ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="John Doe"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.name ? 1 : 0 }}
                        />
                      </div>
                    </div>

                    {/* Phone & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-xs tracking-[0.15em] uppercase mb-2"
                          style={{ color: `${theme.secondary}80` }}
                        >
                          Phone <span style={{ color: `${theme.primary}40` }}>(Optional)</span>
                        </label>
                        <div className="relative">
                          <Phone
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                            style={{ color: focused.phone ? theme.primary : `${theme.primary}50` }}
                          />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={() => handleFocus('phone')}
                            onBlur={() => handleBlur('phone')}
                            className="w-full pl-12 pr-4 py-4 outline-none transition-colors"
                            style={{
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor: focused.phone ? theme.primary : `${theme.primary}20`,
                              color: theme.secondary
                            }}
                            placeholder="+1 (555) 000-0000"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px"
                            style={{ backgroundColor: theme.primary }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.phone ? 1 : 0 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          className="block text-xs tracking-[0.15em] uppercase mb-2"
                          style={{ color: `${theme.secondary}80` }}
                        >
                          Email <span style={{ color: `${theme.primary}60` }}>*</span>
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                            style={{ color: focused.email ? theme.primary : `${theme.primary}50` }}
                          />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => handleFocus('email')}
                            onBlur={() => handleBlur('email')}
                            required
                            className="w-full pl-12 pr-4 py-4 outline-none transition-colors"
                            style={{
                              borderWidth: 1,
                              borderStyle: 'solid',
                              borderColor: focused.email ? theme.primary : `${theme.primary}20`,
                              color: theme.secondary
                            }}
                            placeholder="john@example.com"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px"
                            style={{ backgroundColor: theme.primary }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.email ? 1 : 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label
                        className="block text-xs tracking-[0.15em] uppercase mb-2"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Subject <span style={{ color: `${theme.primary}60` }}>*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          onFocus={() => handleFocus('subject')}
                          onBlur={() => handleBlur('subject')}
                          required
                          className="w-full px-4 py-4 outline-none transition-colors"
                          style={{
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.subject ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="How can we help you?"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.subject ? 1 : 0 }}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label
                        className="block text-xs tracking-[0.15em] uppercase mb-2"
                        style={{ color: `${theme.secondary}80` }}
                      >
                        Message <span style={{ color: `${theme.primary}60` }}>*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          onFocus={() => handleFocus('message')}
                          onBlur={() => handleBlur('message')}
                          required
                          rows="5"
                          className="w-full px-4 py-4 outline-none transition-colors resize-none"
                          style={{
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderColor: focused.message ? theme.primary : `${theme.primary}20`,
                            color: theme.secondary
                          }}
                          placeholder="Tell us about your inquiry..."
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px"
                          style={{ backgroundColor: theme.primary }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.message ? 1 : 0 }}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full py-4 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
                      style={{
                        backgroundColor: theme.primary,
                        color: theme.white
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) e.target.style.backgroundColor = theme.secondary;
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) e.target.style.backgroundColor = theme.primary;
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Send Message</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Column - Info Sections */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-8"
          >

            {/* Social Media */}
            {/* Social Media */}
            <div
              className="relative p-8 border"
              style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 flex items-center justify-center border"
                  style={{ borderColor: `${theme.primary}30` }}
                >
                  <Globe className="w-5 h-5" style={{ color: theme.primary }} />
                </div>
                <div>
                  <h3
                    className="font-playfair text-xl font-bold"
                    style={{ color: theme.primary }}
                  >
                    Connect With Us
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: `${theme.secondary}` }}
                  >
                    Follow our journey
                  </p>
                </div>
              </div>

              <p
                className="mb-6"
                style={{ color: `${theme.secondary}b3` }}
              >
                Stay updated with our latest exhibitions, artist features, and gallery events.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ y: -3 }}
                      className="flex items-center gap-3 p-4 transition-all duration-300 group cursor-pointer border"
                      style={{
                        borderColor: `${theme.primary}20`,
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = social.color;
                        e.currentTarget.style.backgroundColor = `${social.color}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${theme.primary}20`;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <IconComponent
                        className="w-5 h-5 transition-colors"
                        style={{ color: social.color }}
                      />
                      <span
                        className="font-medium transition-colors"
                        style={{ color: theme.secondary }}
                        onMouseEnter={(e) => e.target.style.color = social.color}
                        onMouseLeave={(e) => e.target.style.color = theme.secondary}
                      >
                        {social.name}
                      </span>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Quick Contact / Visiting Hours */}
            <div
              className="relative p-8 bg-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
                <h3
                  className="font-playfair text-xl font-bold"
                  style={{ color: theme.primary }}
                >
                  Visiting Hours
                </h3>
              </div>

              <div className="space-y-3">
                <div
                  className="flex flex-col p-4"
                  style={{ backgroundColor: `${theme.white}` }}
                >
                  <span
                    className="font-medium mb-2"
                    style={{ color: theme.secondary }}
                  >
                    Monday - Saturday
                  </span>
                  <span style={{ color: `${theme.primary}` }}>10 AM - 7 PM</span>
                </div>

                <div
                  className="flex flex-col p-4"
                  style={{ backgroundColor: `${theme.white}` }}
                >
                  <span
                    className="font-medium mb-2"
                    style={{ color: theme.secondary }}
                  >
                    Sunday
                  </span>
                  <span style={{ color: `${theme.primary}` }}>10 AM - 3 PM</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative mb-16 overflow-hidden border"
          style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
        >
          {/* Map Header */}
          <div
            className="p-6 border-b"
            style={{ borderColor: `${theme.primary}20` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center border"
                style={{ borderColor: `${theme.primary}30` }}
              >
                <Navigation className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <h2
                  className="font-playfair text-xl font-bold"
                  style={{ color: theme.primary }}
                >
                  Find Us
                </h2>
                <p
                  className="text-sm"
                  style={{ color: `${theme.secondary}` }}
                >
                  Visit our gallery in Miami
                </p>
              </div>
            </div>
          </div>

          {/* Google Maps */}
          <div
            className="relative h-80 sm:h-96"
            style={{ backgroundColor: `${theme.accent}30` }}
          >
            <iframe
              src={googleMapsUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Gallery Location"
              className="absolute inset-0"
            />
          </div>

          {/* Map Footer */}
          <div
            className="p-6 border-t"
            style={{ borderColor: `${theme.primary}20`, backgroundColor: `${theme.accent}10` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: `${theme.primary}` }}
                >
                  Address
                </p>
                <p
                  className="font-medium"
                  style={{ color: theme.secondary }}
                >
                  1717 N Bayshore Dr #121, Miami, FL 33132
                </p>
              </div>
              <motion.a
                href="https://maps.google.com/?q=1717+N+Bayshore+Dr+%23121,+Miami,+FL+33132"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 font-medium transition-colors cursor-pointer"
                style={{ backgroundColor: theme.primary, color: theme.white }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
                onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
              >
                <Navigation className="w-4 h-4" />
                Get Directions
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Bottom Quote */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div
            className="relative max-w-2xl mx-auto p-10 border"
            style={{ backgroundColor: theme.white, borderColor: `${theme.primary}20` }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 flex items-center justify-center mx-auto mb-6 border"
              style={{ borderColor: `${theme.primary}20` }}
            >
              <FlowerDecor className="w-6 h-6" color={`${theme.primary}40`} />
            </motion.div>

            <p
              className="font-playfair text-xl italic mb-4"
              style={{ color: `${theme.secondary}b3` }}
            >
              "Art enables us to find ourselves and lose ourselves at the same time."
            </p>
            <p
              className="font-medium"
              style={{ color: theme.primary }}
            >
              — Thomas Merton
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px mx-auto my-16"
        style={{ backgroundColor: `${theme.primary}30` }}
      />

      {/* Floating Call Button */}
      <motion.a
        href="tel:+13053713060"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        style={{ backgroundColor: theme.primary, color: theme.white }}
        onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondary}
        onMouseLeave={(e) => e.target.style.backgroundColor = theme.primary}
      >
        <Phone className="w-6 h-6" />
      </motion.a>
    </div>
  );
};

export default ContactPage;