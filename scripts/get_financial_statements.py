#!/usr/bin/env python3
import yfinance as yf
import pandas as pd
import json
import sys
from time import sleep
from datetime import datetime
from typing import Dict, Any

def safe_float(value) -> float | None:
    try:
        return float(value) if pd.notna(value) else None
    except:
        return None

def process_financial_statement(df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
    if df.empty:
        return {}
    
    return {
        k.strftime('%Y-%m-%d'): {
            metric: safe_float(v)
            for metric, v in values.items()
        }
        for k, values in df.to_dict().items()
    }

def get_financial_data(symbol: str) -> Dict[str, Any]:
    try:
        # Initialize ticker with longer timeout
        ticker = yf.Ticker(symbol)
        
        # Get financial statements with retries
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                # Quarterly statements
                income_stmt_q = ticker.quarterly_financials
                balance_sheet_q = ticker.quarterly_balance_sheet
                cash_flow_q = ticker.quarterly_cashflow
                
                # Annual statements
                income_stmt = ticker.financials
                balance_sheet = ticker.balance_sheet
                cash_flow = ticker.cashflow
                
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                sleep(retry_delay)
        
        financial_data = {
            'quarterly': {
                'income_statement': process_financial_statement(income_stmt_q),
                'balance_sheet': process_financial_statement(balance_sheet_q),
                'cash_flow': process_financial_statement(cash_flow_q)
            },
            'annual': {
                'income_statement': process_financial_statement(income_stmt),
                'balance_sheet': process_financial_statement(balance_sheet),
                'cash_flow': process_financial_statement(cash_flow)
            }
        }

        # Get additional metrics and info
        info = ticker.info

        # Add key metrics and ratios
        try:
            additional_metrics = {
                'key_metrics': {
                    'market_cap': safe_float(info.get('marketCap')),
                    'enterprise_value': safe_float(info.get('enterpriseValue')),
                    'pe_ratio': safe_float(info.get('trailingPE')),
                    'forward_pe': safe_float(info.get('forwardPE')),
                    'peg_ratio': safe_float(info.get('pegRatio')),
                    'price_to_book': safe_float(info.get('priceToBook')),
                    'price_to_sales': safe_float(info.get('priceToSalesTrailing12Months')),
                    'beta': safe_float(info.get('beta')),
                    'dividend_yield': safe_float(info.get('dividendYield')),
                    'dividend_rate': safe_float(info.get('dividendRate')),
                    'five_year_avg_dividend_yield': safe_float(info.get('fiveYearAvgDividendYield')),
                },
                'efficiency_metrics': {
                    'return_on_equity': safe_float(info.get('returnOnEquity')),
                    'return_on_assets': safe_float(info.get('returnOnAssets')),
                    'profit_margin': safe_float(info.get('profitMargins')),
                    'operating_margin': safe_float(info.get('operatingMargins')),
                    'gross_margin': safe_float(info.get('grossMargins')),
                },
                'growth_metrics': {
                    'revenue_growth': safe_float(info.get('revenueGrowth')),
                    'earnings_growth': safe_float(info.get('earningsGrowth')),
                    'earnings_quarterly_growth': safe_float(info.get('earningsQuarterlyGrowth')),
                },
                'debt_metrics': {
                    'debt_to_equity': safe_float(info.get('debtToEquity')),
                    'current_ratio': safe_float(info.get('currentRatio')),
                    'quick_ratio': safe_float(info.get('quickRatio')),
                },
            }
        except Exception as e:
            print(f"Warning: Error processing additional metrics: {str(e)}", file=sys.stderr)
            additional_metrics = {}

        return {
            "status": "success",
            "symbol": symbol,
            "company_info": {
                "name": info.get('longName'),
                "sector": info.get('sector'),
                "industry": info.get('industry'),
                "website": info.get('website'),
                "description": info.get('longBusinessSummary'),
                "country": info.get('country'),
                "employees": info.get('fullTimeEmployees'),
                "exchange": info.get('exchange'),
            },
            "financial_statements": financial_data,
            "metrics": additional_metrics
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"status": "error", "error": "Symbol argument required"}))
        sys.exit(1)
    
    try:
        symbol = sys.argv[1].upper()
        result = get_financial_data(symbol)
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"status": "error", "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()