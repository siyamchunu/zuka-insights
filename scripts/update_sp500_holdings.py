import requests
import pandas as pd
import json
import io
import os

# Configuration
IVV_CSV_URL = "https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/1467271812596.ajax?fileType=csv&fileName=IVV_holdings&dataType=fund"
ETFS_JSON_PATH = os.path.join(os.path.dirname(__file__), "../public/data/etfs.json")

def download_ivv_holdings():
    print(f"Downloading IVV holdings from {IVV_CSV_URL}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(IVV_CSV_URL, headers=headers)
    response.raise_for_status()
    return response.content

def parse_ivv_csv(csv_content):
    print("Parsing CSV content...")
    # iShares CSVs often have a header block. We need to find the start of the data.
    # Based on our curl test, the header is ~9 lines, but let's be robust.
    # The header row starts with "Ticker,Name,Sector"
    
    # Read as string stream
    csv_str = csv_content.decode('utf-8-sig') # Handle BOM if present
    
    # Skip lines until we find the header
    lines = csv_str.split('\n')
    start_line = 0
    for i, line in enumerate(lines):
        if line.startswith('Ticker,Name,Sector'):
            start_line = i
            break
            
    print(f"Found header at line {start_line}")
    
    # Read into DataFrame
    df = pd.read_csv(io.StringIO(csv_str), skiprows=start_line)
    
    # Filter for Equity only (exclude Cash, Futures, etc. for cleaner overlap)
    # The curl output showed "Asset Class" column.
    if 'Asset Class' in df.columns:
        df = df[df['Asset Class'] == 'Equity']
        
    # Select relevant columns
    # Curl output: Ticker,Name,Sector,Asset Class,Market Value,Weight (%),Notional Value,Quantity,Price,Location,Exchange,Currency,FX Rate,Market Currency,Accrual Date
    df = df[['Ticker', 'Name', 'Sector', 'Weight (%)']]
    
    # Rename columns to match our app's schema
    df = df.rename(columns={
        'Ticker': 'Ticker',
        'Name': 'Name',
        'Sector': 'Sector',
        'Weight (%)': 'Weight'
    })
    
    # Clean data
    df = df.dropna(subset=['Ticker']) # Drop rows without tickers
    
    # Convert numeric weights
    df['Weight'] = pd.to_numeric(df['Weight'], errors='coerce').fillna(0)
    
    # Normalize weights to sum to 100% (in case we filtered out cash)
    total_weight = df['Weight'].sum()
    if total_weight > 0:
        df['Weight'] = (df['Weight'] / total_weight) * 100
        
    # Convert to list of dicts
    holdings = df.to_dict(orient='records')
    print(f"Extracted {len(holdings)} holdings.")
    return holdings

def update_etfs_json(holdings):
    print(f"Updating {ETFS_JSON_PATH}...")
    
    with open(ETFS_JSON_PATH, 'r') as f:
        etfs_data = json.load(f)
        
    # Funds to update with Proxy Data
    # 10X S&P 500 (10X-CSP500) -> Feeds into Vanguard S&P 500
    # Satrix S&P 500 (STX500) -> Feeds into iShares Core S&P 500
    # Sygnia Itrix S&P 500 (SYG500) -> Feeds into iShares Core S&P 500
    target_ids = ['10X-CSP500', 'STX500', 'SYG500'] 
    
    updated_count = 0
    for etf in etfs_data:
        if etf['id'] in target_ids:
            print(f"Updating holdings for {etf['id']} ({etf['name']})...")
            etf['holdings'] = holdings
            # Update hold_count
            etf['hold_count'] = len(holdings)
            updated_count += 1
            
    if updated_count > 0:
        with open(ETFS_JSON_PATH, 'w') as f:
            json.dump(etfs_data, f, indent=2)
        print(f"Successfully updated {updated_count} ETFs.")
    else:
        print("No matching ETFs found to update.")

def main():
    try:
        csv_content = download_ivv_holdings()
        holdings = parse_ivv_csv(csv_content)
        update_etfs_json(holdings)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
