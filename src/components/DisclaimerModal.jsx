import React, { useState, useEffect } from 'react';
import { ShieldAlert, X } from 'lucide-react';

const DisclaimerModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const hasAccepted = localStorage.getItem('zuka_disclaimer_accepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('zuka_disclaimer_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-forest/10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-forest/5 rounded-2xl text-forest">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-forest font-display mb-2">Important Disclaimer</h2>
            <p className="text-sm text-forest/70 leading-relaxed">
              Please read this before using the tool.
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8 text-sm text-forest/80 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <p>
            <strong>1. Not Financial Advice:</strong> The Zuka Insights ETF Overlap Tool is for informational and educational purposes only. We are not a registered Financial Services Provider (FSP) and do not provide financial, investment, tax, or legal advice.
          </p>
          <p>
            <strong>2. Data Accuracy:</strong> While we strive to source data from reputable public factsheets, ETF holdings change daily. We <strong>do not guarantee</strong> the accuracy, completeness, or timeliness of the data presented.
          </p>
          <p>
            <strong>3. Your Responsibility:</strong> Investment decisions should be based on your own research (DYOR) and consultation with a qualified financial advisor. Zuka Insights is <strong>not liable</strong> for any financial losses or damages resulting from the use of this tool.
          </p>
        </div>

        <button 
          onClick={handleAccept}
          className="w-full h-14 bg-forest text-lime font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0A2323] active:translate-y-[0px] active:shadow-none transition-all border-2 border-forest"
        >
          I Understand & Agree
        </button>
      </div>
    </div>
  );
};

export default DisclaimerModal;
