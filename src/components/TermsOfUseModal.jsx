import React from 'react';
import { ScrollText, X } from 'lucide-react';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using the Zuka Insights ETF Overlap Tool ("the Tool"), you agree to these Terms of Use. If you do not agree, please discontinue use immediately. Continued use of the Tool following any updates to these Terms constitutes acceptance of the revised version.',
  },
  {
    title: '2. Nature of the Service',
    body: 'The Tool is a free, educational resource designed to help users explore and compare the holdings overlap between Exchange Traded Funds (ETFs) listed or available in South Africa. Zuka Insights is not a registered Financial Services Provider (FSP) and nothing on this site constitutes financial advice, a recommendation, or an offer to buy or sell any financial product. Always consult a registered FSP before making any investment decisions.',
  },
  {
    title: '3. Data & Information Accuracy',
    body: 'ETF holdings data is sourced from publicly available factsheets and disclosures published by fund providers (including Satrix, 10X Investments, Sygnia, and iShares proxy data) and is provided for informational purposes only. This data may be incomplete, out of date, or subject to change without notice — we do not guarantee its accuracy, completeness, or timeliness. Zuka Insights makes no warranty, expressed or implied, regarding the reliability of any data displayed, and you use it entirely at your own risk.',
  },
  {
    title: '4. Intellectual Property',
    body: "The Tool, its design, code, branding, and original content are the property of LoggedOn (Pty) Ltd and are protected under applicable South African intellectual property law. ETF data and factsheet content remains the property of the respective fund providers and is reproduced here under fair-use principles for educational purposes. You may not copy, reproduce, or redistribute any part of the Tool's interface or original content without prior written permission.",
  },
  {
    title: '5. Limitation of Liability',
    body: 'To the fullest extent permitted by South African law, Zuka Insights and LoggedOn (Pty) Ltd shall not be liable for any direct, indirect, incidental, or consequential loss or damage arising from your use of, or reliance on, the Tool or its data. This includes, without limitation, any investment decisions made based on information displayed. Our total liability in any circumstance shall not exceed zero rand (R0), as the Tool is provided entirely free of charge.',
  },
  {
    title: '6. Privacy & Cookies',
    body: 'The Tool does not require account registration and does not collect personally identifiable information. We use cookies solely for basic site functionality and anonymous usage analytics — you will be prompted to accept or decline non-essential cookies via our cookie consent banner. For full details on how we handle data, please refer to our Privacy Policy.',
  },
  {
    title: '7. Governing Law',
    body: 'These Terms are governed by the laws of the Republic of South Africa, including the Protection of Personal Information Act 4 of 2013 (POPIA), the Consumer Protection Act 68 of 2008 (CPA), and applicable financial services legislation. Any disputes arising from these Terms shall be subject to the jurisdiction of the South African courts.',
  },
  {
    title: '8. Changes to Terms',
    body: 'We may update these Terms from time to time to reflect changes in the Tool, applicable law, or our practices. The revised Terms will be posted on this page with an updated effective date. We encourage you to review this page periodically — continued use of the Tool after changes are posted constitutes your acceptance of the updated Terms.',
  },
  {
    title: '9. Contact',
    body: 'For questions about these Terms, please contact Zuka Insights (a brand of LoggedOn (Pty) Ltd) at hello@zukainsights.co.za.',
  },
];

const TermsOfUseModal = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-forest/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-forest/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-8 pb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-forest/5 rounded-2xl text-forest shrink-0">
              <ScrollText size={28} />
            </div>
            <div>
              <h2 className="text-xl font-black text-forest font-display mb-1">Terms of Use</h2>
              <p className="text-xs text-forest/50">Effective date: 1 March 2026 · Zuka Insights (a brand of LoggedOn (Pty) Ltd)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-forest/5 text-forest/40 hover:text-forest transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-8 pb-8 space-y-5 text-sm text-forest/75 leading-relaxed">
          {sections.map((s) => (
            <div key={s.title}>
              <h3 className="font-bold text-forest mb-1">{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 pt-4 border-t border-forest/5">
          <button
            onClick={onClose}
            className="w-full h-12 bg-forest text-lime font-black uppercase tracking-widest text-xs hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#0A2323] active:translate-y-[0px] active:shadow-none transition-all border-2 border-forest"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseModal;
