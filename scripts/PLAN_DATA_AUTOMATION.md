# ETF Data Automation

## Problem
We need to calculate the overlap between "Feeder Funds" (like 10X S&P 500) and other ETFs.
- Local Feeder Funds only list "Vanguard S&P 500" as their single holding.
- To find the true overlap, we need the ~503 stocks inside that Vanguard fund.
- 10X does not provide this granular data in their CSV.

## Solution: The Proxy Strategy
Since all S&P 500 funds hold the same stocks in the same weights (roughly), we can use a "Master Proxy" CSV from a major US provider (iShares IVV) to represent the holdings of *any* S&P 500 feeder fund.

## Data Source
**iShares Core S&P 500 ETF (IVV)**
- **URL:** `https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/1467271812596.ajax?fileType=csv&fileName=IVV_holdings&dataType=fund`
- **Reliability:** Official BlackRock data, updated daily.
- **Format:** CSV with header rows (skip ~9 lines), columns: Ticker, Name, Sector, Weight (%).

## Automation Workflow (n8n or Python Script)
1.  **Fetch Proxy Data:** Download IVV CSV.
2.  **Parse & Clean:**
    - Skip header metadata.
    - Extract `Ticker`, `Name`, `Sector`, `Weight (%)`.
    - Normalize weights (ensure they sum to ~100%).
3.  **Update `etfs.json`:**
    - Target specific Feeder Funds (e.g., `10X-CSP500`, `STX500`).
    - Replace their single "Wrapper" holding with the list of ~503 stocks from the Proxy CSV.
    - *Crucial:* Maintain the Feeder Fund's metadata (TER, Fund Size) but swap the holdings.

## Implementation Plan
1.  Create a Python script `scripts/update_sp500_holdings.py`.
2.  Script will download the IVV CSV.
3.  Script will read `src/data/etfs.json`.
4.  Script will inject the IVV holdings into `10X-CSP500` and `STX500`.
5.  Run script to fix the current overlap data immediately.
