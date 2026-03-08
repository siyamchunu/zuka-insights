import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('zuka_cookie_consent');
    if (!consent) {
      // Show banner after a small delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('zuka_cookie_consent', 'accepted');
    setIsVisible(false);
    // Here you would initialize ad scripts
    console.log('Cookies accepted - Ads initialized');
  };

  const handleDecline = () => {
    localStorage.setItem('zuka_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 flex justify-center">
      <div className="bg-white/95 backdrop-blur-md border border-forest/10 shadow-2xl rounded-2xl max-w-4xl w-full p-6 flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-bottom-10 duration-500">
        
        <div className="p-3 bg-forest/5 rounded-xl text-forest shrink-0">
          <Cookie size={24} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="font-bold text-forest text-sm mb-1">Cookie Policy</h3>
          <p className="text-xs text-forest/70 leading-relaxed">
            We use cookies to personalize content and ads, to provide social media features and to analyze our traffic. 
            We also share information about your use of our site with our social media, advertising and analytics partners.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleDecline}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-forest text-xs hover:bg-forest/5 transition-colors"
          >
            Decline
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-6 py-3 bg-forest text-lime rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-forest/10 active:scale-95 transition-all"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
