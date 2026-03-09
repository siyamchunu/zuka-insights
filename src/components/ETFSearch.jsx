import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Check, ArrowRight } from 'lucide-react';

const ETFSearch = ({ label, selectedId, onSelect, excludeId, etfData }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedETF = etfData.find(e => e.id === selectedId);

  const filteredETFs = etfData.filter(etf => 
    etf.id !== excludeId &&
    (etf.name.toLowerCase().includes(query.toLowerCase()) || 
    etf.id.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (id) => {
    onSelect(id);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect('');
    setQuery('');
    setIsOpen(true); // Re-open to allow immediate search
  };

  return (
    <div className="relative w-full font-swiss" ref={wrapperRef}>
      <label className="block text-[10px] font-bold text-forest uppercase tracking-widest mb-4 ml-1">
        {label}
      </label>
      
      <div 
        className="w-full cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {selectedETF && !isOpen ? (
          <div className="flex items-center justify-between w-full border-b-2 border-forest pb-2">
            <div className="flex flex-col items-start">
              <span className="font-bold text-forest text-2xl tracking-tighter leading-none">{selectedETF.name}</span>
              <span className="text-xs font-bold text-forest/60 tracking-wider mt-1">{selectedETF.id}</span>
            </div>
            <button 
              onClick={handleClear}
              className="p-2 hover:bg-forest hover:text-lime rounded-full text-forest transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center w-full border-b-2 border-forest/20 group-hover:border-forest transition-colors pb-2">
            <Search size={24} className="mr-4 shrink-0 text-forest" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent font-bold text-2xl text-forest placeholder:text-forest/20 focus:outline-none tracking-tight"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-4 bg-white border-2 border-forest shadow-[8px_8px_0px_0px_rgba(10,35,35,0.2)] max-h-[60vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {filteredETFs.length > 0 ? (
            filteredETFs.map(etf => (
              <button
                key={etf.id}
                className="w-full text-left px-6 py-4 hover:bg-bone transition-colors border-b border-forest/10 last:border-0 group flex items-center justify-between"
                onClick={() => handleSelect(etf.id)}
              >
                <div>
                  <div className="font-bold text-forest text-lg tracking-tight group-hover:translate-x-1 transition-transform">{etf.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                     <span className="text-[10px] font-bold tracking-wider bg-forest text-lime px-1.5 py-0.5 uppercase">{etf.id}</span>
                     <span className="text-[10px] text-forest/60 font-medium uppercase tracking-wide">{etf.holdings.length} holdings</span>
                  </div>
                </div>
                {selectedId === etf.id ? 
                  <Check size={20} className="text-forest" /> : 
                  <ArrowRight size={20} className="text-forest/0 group-hover:text-forest transition-all -translate-x-2 group-hover:translate-x-0" />
                }
              </button>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
                <p className="text-lg font-bold text-forest/40">No matches found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ETFSearch;
