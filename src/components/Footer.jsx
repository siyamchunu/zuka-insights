import React, { useState } from 'react';
import TermsOfUseModal from './TermsOfUseModal';

const Footer = () => {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <>
      <footer className="mt-12 py-8 px-6 border-t border-forest/5 bg-bone/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <div className="font-bold text-forest text-sm mb-1">Zuka Insights</div>
            <div className="text-xs text-forest/50">
              &copy; {new Date().getFullYear()} Zuka Insights. All rights reserved.
            </div>
          </div>
          
          <div className="max-w-2xl text-xs text-forest/40 text-center md:text-right leading-relaxed">
            <p className="mb-2">
              <strong>Disclaimer:</strong> This tool is for educational purposes only and does not constitute financial advice. 
              Data is sourced from public factsheets and may not reflect real-time holdings.
            </p>
            <p>
              Consult a registered Financial Services Provider (FSP) before making investment decisions.{' '}
              Use of this site is subject to our{' '}
              <button
                onClick={() => setShowTerms(true)}
                className="underline underline-offset-2 hover:text-forest/70 transition-colors cursor-pointer"
              >
                Terms of Use
              </button>
              .
            </p>
          </div>
        </div>
      </footer>

      {showTerms && <TermsOfUseModal onClose={() => setShowTerms(false)} />}
    </>
  );
};

export default Footer;
