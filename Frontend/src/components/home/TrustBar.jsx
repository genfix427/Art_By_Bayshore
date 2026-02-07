// src/components/home/TrustBar.jsx
import { motion } from "framer-motion";
import { BadgeCheck, Lock, Truck, Undo2, Sparkles, Shield, Palette, Brush } from "lucide-react";

const items = [
  { 
    icon: BadgeCheck, 
    title: "Certificate of Authenticity", 
    desc: "Signed documentation with every artwork",
  },
  { 
    icon: Palette, 
    title: "Curated Collection", 
    desc: "Handpicked by art experts",
  },
  { 
    icon: Shield, 
    title: "Secure Purchase", 
    desc: "Protected art transactions",
  },
  { 
    icon: BadgeCheck, 
    title: "Gallery Authenticity", 
    desc: "Verified provenance & certificates",
  },
];

const TrustBar = () => {
  return (
    <section className="relative overflow-hidden bg-gray-50">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111827' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gray-900/10"
            style={{
              width: Math.random() * 6 + 2,
              height: Math.random() * 6 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center justify-center gap-3 mb-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border border-gray-400 rounded-full flex items-center justify-center bg-white/50"
            >
              <Shield className="w-5 h-5 text-gray-900" />
            </motion.div>
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xs tracking-[0.3em] text-gray-600 uppercase block mb-3"
          >
            Your Peace of Mind
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-900 font-playfair text-2xl sm:text-3xl font-light"
          >
            Art collecting made simple, secure & enjoyable
          </motion.h2>
        </motion.div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: idx * 0.1,
              }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              {/* Card */}
              <div className="relative bg-white/60 backdrop-blur-sm border border-gray-300 rounded-xl p-6 hover:bg-white hover:border-gray-400 hover:shadow-lg transition-all duration-300">
                {/* Icon */}
                <motion.div
                  className="mb-5 flex justify-center"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="relative w-14 h-14 flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 5, 0, -5, 0]
                    }}
                    transition={{ 
                      duration: 5, 
                      repeat: Infinity,
                      repeatType: "reverse",
                      delay: idx * 0.5
                    }}
                  >
                    {/* Icon background */}
                    <div className="absolute inset-0 bg-gray-900/5 rounded-xl group-hover:bg-gray-900/10 transition-colors" />
                    <div className="absolute inset-1 border border-gray-300 rounded-lg group-hover:border-gray-400 transition-colors" />
                    <item.icon className="w-6 h-6 text-gray-900 relative z-10" />
                  </motion.div>
                </motion.div>

                {/* Content */}
                <div className="text-center">
                  <motion.h3 
                    className="text-gray-900 font-medium text-base mb-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.2 }}
                  >
                    {item.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-gray-600 text-sm leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    {item.desc}
                  </motion.p>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-gray-300 group-hover:border-gray-400 transition-colors" />
                <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-gray-300 group-hover:border-gray-400 transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Decorative Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-14"
        >
          {/* Divider */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-16 h-px bg-gradient-to-r from-transparent to-gray-400"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-gray-600" />
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-16 h-px bg-gradient-to-l from-transparent to-gray-400"
            />
          </div>

          <motion.div
            className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-full px-6 py-3"
            animate={{ 
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-gray-700" />
            </motion.div>
            <span className="text-gray-700 text-sm">
              Trusted by over <span className="text-gray-900 font-semibold">10,000+</span> art collectors worldwide
            </span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-gray-700" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Animated background curve */}
      <svg className="absolute bottom-0 left-0 w-full h-24 pointer-events-none" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <motion.path
          d="M 0 100 Q 300 60, 600 80 T 1200 60 L 1200 100 L 0 100 Z"
          fill="rgba(156, 163, 175, 0.1)"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </svg>
    </section>
  );
};

export default TrustBar;