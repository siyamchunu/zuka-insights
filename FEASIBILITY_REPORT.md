# Zuka Insights: ETF Overlap Tool - Feasibility & Strategy Report

**Date:** 2026-03-07
**Status:** MVP Validated (Local)
**Dataset:** 10 Major Satrix ETFs (Top 40, S&P 500, Nasdaq 100, Momentum, Inclusion & Diversity, etc.)

## 1. Executive Summary
We have successfully built a working MVP of the ETF Overlap Tool. The core hypothesis—that investors unknowingly hold duplicate assets across multiple "diversified" funds—has been validated by our initial data.

**Key Finding:**
- **High Overlap:** Significant redundancy found between `Satrix Top 40` and `Satrix Momentum` (large cap bias).
- **Hidden Risks:** Investors buying both `Satrix Nasdaq 100` and `Satrix S&P 500` have massive exposure to the "Magnificent 7" tech stocks, despite holding two different fund names.

## 2. Technical Feasibility
- **Data Ingestion:** Automated Python scripts can parse standard Satrix/Provider Excel sheets.
  - *Action:* Build a drag-and-drop admin uploader for easier updates.
- **Frontend Performance:** React + Vite handles the client-side intersection logic instantly for <5000 holdings.
  - *Action:* Stick to client-side logic for MVP to reduce server costs (Cloudflare Pages is free).
- **UI/UX:** The new "Pro Dashboard" layout works well for deep analysis.

## 3. Strategic Differentiators (Why We Win)
1.  **"Look Through" Technology:** Competitors often just compare top 10 holdings. We ingest the *entire* constituent list (e.g., all 101 Nasdaq stocks), revealing hidden overlap in the "long tail".
2.  **South African Context:** Most tools are US-centric. We focus on JSE-listed ETFs (Satrix, Sygnia, CoreShares), solving a local pain point.
3.  **Privacy First:** Client-side processing means user portfolio data never leaves their browser.

## 4. Action Plan & Roadmap

### Phase 1: Public Beta (Immediate)
- [ ] **Deploy to Cloudflare Pages:** Host the current MVP for public testing.
- [ ] **Mobile Optimization:** Tweaks for the new dashboard on small screens.
- [ ] **Share Buttons:** Allow users to share their "Overlap Score" on social media (viral loop).

### Phase 2: Data Expansion (Next 2 Weeks)
- [ ] **Add Sygnia & CoreShares:** Broaden the database beyond Satrix.
- [ ] **Fund of Funds Logic:** Handle nested funds (e.g., a fund holding other ETFs) by recursively fetching their holdings.

### Phase 3: Monetization (Future)
- [ ] **"Fix My Portfolio" Button:** Suggest alternative ETFs with lower overlap (Affiliate/Lead Gen).
- [ ] **Premium Reports:** PDF export of portfolio health.

## 5. Recommendation
**Proceed to Deployment.** The technical risk is low, and the value proposition is clear.
