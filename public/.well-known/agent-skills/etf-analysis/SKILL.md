# Zuka Insights — SA ETF Analysis

Retrieve information about South African ETFs and use the ETF Overlap
Analyzer to compare fund holdings, sectors, and overlap scores.

## When to Use

- A user asks about South African ETF overlap or diversification
- An agent needs JSE-listed ETF data for portfolio analysis
- Comparing two ETFs to check for hidden duplication in a portfolio

## Resources

- **LLM-friendly overview:** [/llms.txt](https://zuka.loggedon.co.za/llms.txt) — Markdown summary of the tool, supported ETFs, and analysis methodology
- **Sitemap:** [/sitemap.xml](https://zuka.loggedon.co.za/sitemap.xml) — All public page URLs
- **Live tool:** [https://zuka.loggedon.co.za](https://zuka.loggedon.co.za) — Interactive ETF overlap analyzer

## Capabilities

1. **Overlap Score** — Weight-based percentage showing how much two ETFs share in common (0% = no overlap, 100% = identical)
2. **Shared Holdings** — Every stock held by both ETFs with individual weights and overlap impact
3. **Sector Breakdown** — GICS-aligned sector comparison across ETFs
4. **Cross-Market Detection** — Warns when comparing ETFs from different markets

## Key Facts

- **Coverage:** 88+ ETFs listed on the JSE and popular international ETFs
- **Data source:** Fund factsheets and official holding reports
- **Free:** No registration, no cost
- **Built by:** LoggedOn (South African software company)

## Example Usage

To get an overview of the tool and its data:

```
GET https://zuka.loggedon.co.za/llms.txt
Accept: text/markdown
```
