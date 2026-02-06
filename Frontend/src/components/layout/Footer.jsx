// src/components/layout/Footer.jsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Heart,
  Mail,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';
import CompanyLogo from '../../assets/ABBS_LOGO_O.png';
import NewsletterSubscribe from '../newsletter/NewsletterSubscribe';

// Floating petal component
const FloatingPetal = ({ delay, startX, duration, size = 12 }) => (
  <motion.div
    className="absolute pointer-events-none z-0"
    style={{ left: `${startX}%`, top: "-5%" }}
    initial={{ opacity: 0, y: -20, rotate: 0 }}
    animate={{
      opacity: [0, 0.05, 0.05, 0],
      y: [-20, 150, 300],
      rotate: [0, 180, 360],
      x: [0, 20, -10],
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

const Footer = () => {
  // Generate floating petals
  const petals = Array.from({ length: 8 }).map((_, i) => ({
    delay: i * 2,
    startX: 5 + i * 12,
    duration: 15 + Math.random() * 8,
    size: 10 + Math.random() * 6,
  }));

  const quickLinks = [
    { name: 'Art Store', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Featured Artists', path: '/artists' },
    { name: 'New Arrivals', path: '/products?sortBy=newest' },
  ];

  const companyLinks = [
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'My Orders', path: '/orders' },
    { name: 'My Profile', path: '/profile' },
  ];

  const socialLinks = [
    { icon: Facebook, url: 'https://facebook.com', name: 'Facebook' },
    { icon: Instagram, url: 'https://instagram.com', name: 'Instagram' },
    { icon: Twitter, url: 'https://twitter.com', name: 'Twitter' },
    { icon: Linkedin, url: 'https://linkedin.com', name: 'LinkedIn' },
  ];

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

  return (
    <footer className="relative bg-white border-t border-gray-900/10 overflow-hidden">
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
        whileInView={{ opacity: 0.03, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="absolute top-20 left-10 w-40 h-40 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.03, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute bottom-20 right-10 w-32 h-32 pointer-events-none hidden lg:block"
      >
        <FlowerDecor className="w-full h-full text-gray-900" />
      </motion.div>

      {/* Newsletter Section - Using NewsletterSubscribe Component */}
      <div className="relative z-10 border-b border-gray-900/10">
        <div className="container mx-auto px-6 py-16">
          <NewsletterSubscribe variant="default" showHeader={true} />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10"
        >
          {/* Logo & About - Takes 2 columns on large screens */}
          <motion.div variants={itemVariants} className="md:col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block mb-6 group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <img 
                  src={CompanyLogo} 
                  alt="ArtByBayshore Logo" 
                  className="h-24 w-auto filter grayscale hover:grayscale-0 transition-all duration-500" 
                />
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  className="absolute -bottom-2 left-0 w-full h-px bg-gray-900 origin-left"
                />
              </motion.div>
            </Link>

            <p className="text-gray-900/60 mb-6 leading-relaxed max-w-md">
              Curating exceptional artworks from talented artists worldwide. 
              Each piece tells a story, waiting to become part of yours.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, idx) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 border border-gray-900/10 flex items-center justify-center hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all cursor-pointer group"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links - Takes 1 column */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link, idx) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className="group flex items-center text-gray-900/70 hover:text-gray-900 transition-colors text-sm"
                  >
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    <span>{link.name}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company Links - Takes 1 column */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-6">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link, idx) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className="group flex items-center text-gray-900/70 hover:text-gray-900 transition-colors text-sm"
                  >
                    <ChevronRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    <span>{link.name}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info - Takes 1 column */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] text-gray-900/50 uppercase mb-6">
              Visit Us
            </h4>
            
            <div className="space-y-4">
              <motion.div 
                whileHover={{ x: 3 }}
                className="flex items-start gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 border border-gray-900/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">The Grand Retail Plaza</p>
                  <p className="text-gray-900/60 text-xs">1717 N Bayshore Dr #121</p>
                  <p className="text-gray-900/60 text-xs">Miami, FL 33132</p>
                </div>
              </motion.div>

              <motion.a 
                href="tel:+13053713060"
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 border border-gray-900/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">+1 305-371-3060</p>
                  <p className="text-gray-900/60 text-xs">Call us anytime</p>
                </div>
              </motion.a>

              <motion.a 
                href="mailto:bayshoreart@gmail.com"
                whileHover={{ x: 3 }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-8 h-8 border border-gray-900/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">bayshoreart@gmail.com</p>
                  <p className="text-gray-900/60 text-xs">Email us</p>
                </div>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-gray-900/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            {/* Copyright */}
            <div className="flex items-center gap-2 text-gray-900/60 text-sm">
              <span>© {new Date().getFullYear()} ArtByBayshore.</span>
              <span className="hidden sm:inline">Crafted with</span>
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <Heart className="w-4 h-4 text-gray-900 fill-gray-900" />
              </motion.span>
              <span className="hidden sm:inline">for art lovers</span>
            </div>

            {/* Decorative Element */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border border-gray-900/10 flex items-center justify-center hidden md:flex"
            >
              <FlowerDecor className="w-4 h-4 text-gray-900/20" />
            </motion.div>

            {/* Payment & Security */}
            <div className="flex items-center gap-4 text-gray-900/40 text-sm">
              <span>Secure Payments</span>
              <span>•</span>
              <span>100% Authentic</span>
              <span>•</span>
              <span>Fedex Shipping</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Line */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className="h-1 bg-gradient-to-r from-transparent via-gray-900 to-transparent"
      />
    </footer>
  );
};

export default Footer;