import json
import os

etfs_path = '/home/siya/workspace/etf-overlap/src/data/etfs.json'
momentum_path = '/home/siya/momentum.json'

try:
    with open(etfs_path, 'r') as f:
        etfs_data = json.load(f)
    
    with open(momentum_path, 'r') as f:
        momentum_data = json.load(f)
    
    # Check if Momentum already exists
    exists = False
    for i, etf in enumerate(etfs_data):
        if etf['id'] == momentum_data['id']:
            etfs_data[i] = momentum_data
            exists = True
            break
    
    if not exists:
        etfs_data.append(momentum_data)
    
    with open(etfs_path, 'w') as f:
        json.dump(etfs_data, f, indent=2)
    
    print(f"Successfully added {momentum_data['name']} to etfs.json")
    
except Exception as e:
    print(f"Error: {e}")
