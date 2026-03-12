/**
 * GlossaryTooltip.jsx
 *
 * Inline expandable definition panel for financial terms.
 * Design spec: DESIGN_SPEC_BEGINNER_VIEWS.md § 6
 *
 * Pattern: Click/tap the ℹ button to expand a definition card below the label.
 * Mobile-first — no hover dependency. One definition open at a time (controlled
 * via the `openTerm` / `onToggle` pattern from the parent, OR self-contained
 * via internal state when used standalone).
 *
 * Usage (standalone — manages its own open state):
 *   <GlossaryTooltip term="Annual Fee" definition="The fund charges...">
 *     <span>Annual Fee</span>
 *   </GlossaryTooltip>
 *
 * Usage (controlled — parent manages which term is open):
 *   <GlossaryTooltip
 *     term="Annual Fee"
 *     definition="The fund charges..."
 *     isOpen={openTerm === 'ter'}
 *     onToggle={() => setOpenTerm(openTerm === 'ter' ? null : 'ter')}
 *   >
 *     <span>Annual Fee</span>
 *   </GlossaryTooltip>
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

const GlossaryTooltip = ({
  term,
  definition,
  children,
  // Controlled mode props (optional — omit for self-contained)
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
}) => {
  // Support both controlled and uncontrolled usage
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = useCallback(
    (e) => {
      e.stopPropagation(); // Don't bubble up to parent row clicks
      if (isControlled) {
        controlledOnToggle();
      } else {
        setInternalIsOpen((prev) => !prev);
      }
    },
    [isControlled, controlledOnToggle]
  );

  return (
    <div>
      {/* Label row: children + ℹ toggle button */}
      <div className="flex items-center gap-1.5">
        {/* The label content passed as children */}
        <span className="flex-1">{children}</span>

        {/* Info toggle button — 44×44px touch target via negative margin + padding */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Close definition for ${term}` : `What is ${term}?`}
          className={`
            -m-2 p-2 rounded-full
            transition-colors duration-150
            focus:outline-none focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-2
            ${isOpen
              ? 'bg-forest text-lime'
              : 'text-forest/30 hover:text-forest hover:bg-bone'
            }
          `}
        >
          {isOpen ? (
            <X size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <HelpCircle size={14} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Expandable definition panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            role="region"
            aria-label={`Definition: ${term}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }} // Required for height animation
          >
            {/* Spacer so the card doesn't butt up against the label */}
            <div className="pt-2">
              <div className="bg-forest rounded-xl p-3">
                {/* Term heading */}
                <p className="text-[10px] font-bold text-lime uppercase tracking-widest mb-1.5">
                  📖 {term}
                </p>
                {/* Plain-language definition */}
                <p className="text-xs text-bone/80 leading-relaxed">
                  {definition}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlossaryTooltip;
