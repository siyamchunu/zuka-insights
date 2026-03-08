import pandas as pd

excel_path = '/home/siya/Downloads/etf-Satrix S&P 500.xlsx'
df = pd.read_excel(excel_path, header=1)
df = df.dropna(subset=['CODE'])
print(df[['CODE', 'SHARE NAME', 'WEIGHT']].head())
