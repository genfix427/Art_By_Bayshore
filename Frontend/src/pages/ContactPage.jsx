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
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
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
      secondary: "Mon-Fri: 10am-8pm EST",
      tertiary: "Sat-Sun: 11am-6pm EST"
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
    { icon: Facebook, name: "Facebook", url: "#" },
    { icon: Instagram, name: "Instagram", url: "#" },
    { icon: Twitter, name: "Twitter", url: "#" },
    { icon: Linkedin, name: "LinkedIn", url: "#" }
  ];

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3593.883147443072!2d-80.18739172422224!3d25.78618917737203!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88d9b6823bcf83f7%3A0xef6b2824b4e9f65f!2s1717%20N%20Bayshore%20Dr%20%23121%2C%20Miami%2C%20FL%2033132%2C%20USA!5e0!3m2!1sen!2s!4v1701200000000!5m2!1sen!2s";

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
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
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute top-40 left-10 w-64 h-64 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.03, scale: 1 }}
        transition={{ duration: 1, delay: 0.7 }}
        className="absolute bottom-40 right-10 w-48 h-48 pointer-events-none hidden lg:block"
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
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 flex items-center gap-2 shadow-lg ${feedback.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
              } text-white`}
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
          className="flex items-center gap-2 text-sm text-gray-900/50 mb-12"
        >
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Contact</span>
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
            className="w-16 h-px bg-gray-900 mx-auto mb-8 origin-center"
          />

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border border-gray-900/10 flex items-center justify-center"
            >
              <FlowerDecor className="w-5 h-5 text-gray-900/20" />
            </motion.div>
          </motion.div>

          <motion.span
            variants={itemVariants}
            className="text-xs tracking-[0.3em] text-gray-900/50 uppercase block mb-4"
          >
            Get in Touch
          </motion.span>

          <motion.h1
            variants={itemVariants}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
          >
            Contact Our Gallery
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-900/60 max-w-2xl mx-auto leading-relaxed"
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
              className="relative bg-white border border-gray-900/10 p-8 text-center group hover:border-gray-900/30 transition-colors"
            >

              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-14 h-14 border border-gray-900/10 flex items-center justify-center mx-auto mb-6 group-hover:border-gray-900/30 transition-colors"
              >
                <info.icon className="w-6 h-6 text-gray-900" />
              </motion.div>

              <h3 className="text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-3">
                {info.title}
              </h3>
              <p className="font-playfair text-lg font-bold text-gray-900 mb-2">
                {info.primary}
              </p>
              <p className="text-sm text-gray-900/60 mb-1">
                {info.secondary}
              </p>
              <p className="text-sm text-gray-900/40">
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
            <div className="relative bg-white border border-gray-900/10 p-8">

              {/* Form Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-gray-900">
                    Send a Message
                  </h2>
                  <p className="text-sm text-gray-900/50">
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
                      className="w-20 h-20 bg-gray-900 flex items-center justify-center mx-auto mb-6"
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>

                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.4 }}
                      className="w-12 h-px bg-gray-900 mx-auto mb-6"
                    />

                    <h3 className="font-playfair text-2xl font-bold text-gray-900 mb-3">
                      Message Sent
                    </h3>
                    <p className="text-gray-900/60 mb-6">
                      Thank you for reaching out. We'll get back to you soon!
                    </p>

                    <motion.button
                      onClick={() => setIsSubmitted(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 border border-gray-900 text-gray-900 px-6 py-3 font-medium hover:bg-gray-900 hover:text-white transition-colors cursor-pointer"
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
                      <label className="block text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-2">
                        Your Name <span className="text-gray-900/30">*</span>
                      </label>
                      <div className="relative">
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused.name ? 'text-gray-900' : 'text-gray-900/30'
                          }`} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          onFocus={() => handleFocus('name')}
                          onBlur={() => handleBlur('name')}
                          required
                          className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                          placeholder="John Doe"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.name ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>

                    {/* Phone & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-2">
                          Phone <span className="text-gray-900/20">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused.phone ? 'text-gray-900' : 'text-gray-900/30'
                            }`} />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={() => handleFocus('phone')}
                            onBlur={() => handleBlur('phone')}
                            className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                            placeholder="+1 (555) 000-0000"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px bg-gray-900"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.phone ? 1 : 0 }}
                            style={{ originX: 0 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-2">
                          Email <span className="text-gray-900/30">*</span>
                        </label>
                        <div className="relative">
                          <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused.email ? 'text-gray-900' : 'text-gray-900/30'
                            }`} />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => handleFocus('email')}
                            onBlur={() => handleBlur('email')}
                            required
                            className="w-full pl-12 pr-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                            placeholder="john@example.com"
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 h-px bg-gray-900"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: focused.email ? 1 : 0 }}
                            style={{ originX: 0 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-2">
                        Subject <span className="text-gray-900/30">*</span>
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
                          className="w-full px-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors"
                          placeholder="How can we help you?"
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.subject ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-xs tracking-[0.15em] text-gray-900/50 uppercase mb-2">
                        Message <span className="text-gray-900/30">*</span>
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
                          className="w-full px-4 py-4 border border-gray-900/10 focus:border-gray-900 outline-none transition-colors resize-none"
                          placeholder="Tell us about your inquiry..."
                        />
                        <motion.div
                          className="absolute bottom-0 left-0 h-px bg-gray-900"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: focused.message ? 1 : 0 }}
                          style={{ originX: 0 }}
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                      className="w-full bg-gray-900 text-white py-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
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
            <div className="relative bg-white border border-gray-900/10 p-8">

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-gray-900" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-gray-900">
                    Connect With Us
                  </h3>
                  <p className="text-sm text-gray-900/50">
                    Follow our journey
                  </p>
                </div>
              </div>

              <p className="text-gray-900/60 mb-6">
                Stay updated with our latest exhibitions, artist features, and gallery events.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    whileHover={{ y: -3 }}
                    className="flex items-center gap-3 p-4 border border-gray-900/10 hover:border-gray-900 transition-colors group cursor-pointer"
                  >
                    <social.icon className="w-5 h-5 text-gray-900/50 group-hover:text-gray-900 transition-colors" />
                    <span className="font-medium text-gray-900">{social.name}</span>
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Quick Contact */}
            <div className="relative bg-gray-900 text-white p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-playfair text-xl font-bold">
                  Visiting Hours
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-white/10">
                  <div className="flex flex-col">
                    <span className="font-medium mb-2">Monday - Saturday</span>
                    <span className="text-white/70">10 AM - 7 PM</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/10">
                  <div className="flex flex-col">
                    <span className="font-medium mb-2">Sunday</span>
                    <span className="text-white/70">10 AM - 3 PM</span>
                  </div>
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
          className="relative bg-white border border-gray-900/10 mb-16 overflow-hidden"
        >

          {/* Map Header */}
          <div className="p-6 border-b border-gray-900/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-gray-900/10 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-gray-900" />
              </div>
              <div>
                <h2 className="font-playfair text-xl font-bold text-gray-900">
                  Find Us
                </h2>
                <p className="text-sm text-gray-900/50">
                  Visit our gallery in Miami
                </p>
              </div>
            </div>
          </div>

          {/* Google Maps */}
          <div className="relative h-80 sm:h-96 bg-gray-100">
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
          <div className="p-6 border-t border-gray-900/10 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs text-gray-900/40 uppercase tracking-wide mb-1">
                  Address
                </p>
                <p className="font-medium text-gray-900">
                  1717 N Bayshore Dr #121, Miami, FL 33132
                </p>
              </div>
              <motion.a
                href="https://maps.google.com/?q=1717+N+Bayshore+Dr+%23121,+Miami,+FL+33132"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors cursor-pointer"
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
          <div className="relative max-w-2xl mx-auto bg-white border border-gray-900/10 p-10">

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border border-gray-900/10 flex items-center justify-center mx-auto mb-6"
            >
              <FlowerDecor className="w-6 h-6 text-gray-900/20" />
            </motion.div>

            <p className="font-playfair text-xl text-gray-900/70 italic mb-4">
              "Art enables us to find ourselves and lose ourselves at the same time."
            </p>
            <p className="text-gray-900 font-medium">— Thomas Merton</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5 }}
        className="w-32 h-px bg-gray-900/10 mx-auto my-16"
      />

      {/* Floating Call Button */}
      <motion.a
        href="tel:+13053713060"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors cursor-pointer"
      >
        <Phone className="w-6 h-6" />
      </motion.a>
    </div>
  );
};

export default ContactPage;