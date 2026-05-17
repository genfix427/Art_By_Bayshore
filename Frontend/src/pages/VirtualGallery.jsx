// src/sections/home/VirtualGallerySection.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, Info, ExternalLink } from 'lucide-react';
// import SectionHeading from '@components/ui/SectionHeading';

export default function VirtualGallerySection() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // ArtSteps embed code with responsive dimensions (16:9 ratio base, but full width/height in fullscreen)
  const embedCode = "https://www.artsteps.com/embed/6a055ece96e33e5284c4af5b";

  return (
    <section 
      className="bg-gray-50 relative overflow-hidden" 
      aria-label="Virtual Gallery Tour"
    >
      {/* Simple dot and plus background animation (preserved from original) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-[5%] w-3 h-3 rounded-full bg-primary-300/30 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-20 right-[10%] w-2 h-2 rounded-full bg-primary-400/40 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 left-[15%] w-4 h-4 rounded-full bg-primary-500/20 animate-bounce" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-[8%] w-3 h-3 rounded-full bg-primary-600/25 animate-pulse" style={{ animationDuration: '5s', animationDelay: '0.3s' }} />
        <div className="absolute top-2/3 left-[20%] w-2 h-2 rounded-full bg-primary-700/30 animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.8s' }} />
        <div className="absolute bottom-10 right-[20%] w-5 h-5 rounded-full bg-primary-300/20 animate-bounce" style={{ animationDuration: '7s', animationDelay: '0.2s' }} />
        
        <div className="absolute top-40 left-[30%] text-primary-400/25 text-4xl font-thin animate-pulse" style={{ animationDuration: '8s' }}>+</div>
        <div className="absolute bottom-32 left-[10%] text-primary-500/20 text-3xl font-thin animate-ping" style={{ animationDuration: '5s', animationDelay: '0.4s' }}>+</div>
        <div className="absolute top-1/2 right-[15%] text-primary-600/30 text-5xl font-thin animate-bounce" style={{ animationDuration: '6s', animationDelay: '1.2s' }}>+</div>
        <div className="absolute bottom-20 right-[25%] text-primary-300/25 text-4xl font-thin animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '0.6s' }}>+</div>
        <div className="absolute top-24 right-[40%] text-primary-700/20 text-2xl font-thin animate-ping" style={{ animationDuration: '3s', animationDelay: '0.1s' }}>+</div>
        <div className="absolute bottom-40 left-[35%] text-primary-400/20 text-3xl font-thin animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '0.9s' }}>+</div>
        
        <div className="absolute top-1/4 right-[5%] w-1.5 h-1.5 rounded-full bg-primary-200/40 animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.7s' }} />
        <div className="absolute bottom-1/3 left-[40%] w-2.5 h-2.5 rounded-full bg-primary-400/30 animate-ping" style={{ animationDuration: '4s', animationDelay: '0.2s' }} />
        <div className="absolute top-3/4 right-[30%] w-2 h-2 rounded-full bg-primary-500/25 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
        <div className="absolute top-10 left-[60%] w-3 h-3 rounded-full bg-primary-600/20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.4s' }} />
        <div className="absolute bottom-10 left-[70%] w-1.5 h-1.5 rounded-full bg-primary-300/35 animate-ping" style={{ animationDuration: '3.8s', animationDelay: '0.6s' }} />
        <div className="absolute top-1/2 left-[45%] text-primary-500/20 text-4xl font-thin animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }}>+</div>
        <div className="absolute bottom-1/4 left-[55%] w-2 h-2 rounded-full bg-primary-700/25 animate-bounce" style={{ animationDuration: '4.2s', animationDelay: '1.1s' }} />
        <div className="absolute top-32 left-[75%] w-4 h-4 rounded-full bg-primary-400/20 animate-ping" style={{ animationDuration: '5s', animationDelay: '0.3s' }} />
        <div className="absolute bottom-48 right-[5%] text-primary-300/20 text-3xl font-thin animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.8s' }}>+</div>
      </div>

      <div className="container-custom relative z-10">
        {/* <SectionHeading
          subtitle="Virtual Experience"
          title="Explore Our Virtual Gallery"
          description="Step into our immersive 360° virtual gallery. Walk through the space, examine exhibits up close, and experience our work from anywhere in the world."
        /> */}

        {/* Gallery Container - Professional Card Style */}
        <div 
          ref={containerRef}
          className={`
            relative mx-auto shadow-2xl overflow-hidden 
            bg-black/5 backdrop-blur-sm transition-all duration-500
            ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-[90vh]'}
          `}
          style={{
            height: isFullscreen ? '100vh' : 'clamp(300px, 90vh, 100vh)',
          }}
        >
          {/* Gradient Overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/5 to-transparent pointer-events-none z-10 rounded-2xl" />
          
          {/* Iframe - Fully Responsive */}
          <iframe
            ref={iframeRef}
            src={embedCode}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; xr-spatial-tracking"
            title="Buildcare Virtual Gallery - 360° Art Exhibition Tour"
          />

          {/* Floating Controls - Professional UI */}
          <div className="absolute bottom-4 right-4 flex gap-3 z-20">
            {/* Info Button */}
            <button
              onClick={() => setIsInfoVisible(!isInfoVisible)}
              className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-white transition-all duration-300 cursor-pointer border border-gray-200/50"
              aria-label="Gallery information"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-700 hover:text-primary-600 hover:bg-white transition-all duration-300 cursor-pointer border border-gray-200/50"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Info Panel - Animated */}
          <AnimatePresence>
            {isInfoVisible && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-20 right-4 w-72 bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-4 z-20 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-heading font-semibold text-gray-900">Virtual Gallery Tour</h4>
                  <button 
                    onClick={() => setIsInfoVisible(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Navigate through our immersive 360° exhibition space. Click and drag to look around, 
                  or use the on-screen controls to walk through the gallery.
                </p>
                <div className="flex items-center text-xs text-primary-600 gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <span>Powered by ArtSteps</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Footer - Tips & Instructions */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <p className="text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              Click & drag to look around
            </span>
            <span className="inline-flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              Use arrow keys or on-screen buttons to move
            </span>
            <span className="inline-flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
              Fullscreen for best experience
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}