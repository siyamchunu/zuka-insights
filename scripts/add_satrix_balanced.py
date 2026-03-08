import pandas as pd
import json
import os

excel_path = '/home/siya/Downloads/etf-Satrix Balanced.xlsx'
json_path = '/home/siya/workspace/etf-overlap/src/data/etfs.json'

try:
    # Read the Excel file, skipping the first row (header is on row 2)
    df = pd.read_excel(excel_path, header=1)
    
    # Clean column names
    df.columns = [c.strip() for c in df.columns]
    
    # Filter out empty rows based on 'CODE'
    df = df.dropna(subset=['CODE'])
    
    holdings = []
    for _, row in df.iterrows():
        # Handle percentage conversion if necessary
        weight = row['WEIGHT']
        if isinstance(weight, str):
            weight = float(weight.replace('%', ''))
        elif weight < 1: # Assuming decimal format like 0.05 for 5%
            weight = weight * 100
            
        holding = {
            "ticker": str(row['CODE']).strip(),
            "name": str(row['SHARE NAME']).strip(),
            "weight": round(weight, 2)
        }
        holdings.append(holding)
        
    # Create the ETF object
    new_etf = {
        "id": "STXBAL", 
        "name": "Satrix Balanced Index Fund",
        "provider": "Satrix",
        "holdings": holdings
    }
    
    # Load existing data
    if os.path.exists(json_path):
        with open(json_path, 'r') as f:
            data = json.load(f)
    else:
        data = []
        
    # Remove existing entry if it exists (update)
    data = [etf for etf in data if etf['id'] != new_etf['id']]
    
    # Add new ETF
    data.append(new_etf)
    
    # Save back to file
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(json.dumps(new_etf, indent=2))
    print(f"\nSuccessfully added {new_etf['name']} with {len(holdings)} holdings.")

except Exception as e:
    print(f"Error: {e}")
