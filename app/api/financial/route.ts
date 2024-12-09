// app/api/financial/route.ts
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface FinancialStatement {
  totalRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
}

interface IncomeStatements {
  [date: string]: FinancialStatement;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Stock symbol is required' },
        { status: 400 }
      );
    }

    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ['price', 'financialData', 'defaultKeyStatistics', 'summaryDetail', 'incomeStatementHistory', 'balanceSheetHistory']
      })
    ]);

    // Ensure we have the required data
    if (!summary.incomeStatementHistory?.incomeStatementHistory) {
      throw new Error('Income statement data not available');
    }

    const transformedData = {
      quote: {
        price: quote.regularMarketPrice ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
        volume: quote.regularMarketVolume ?? null,
        previousClose: quote.regularMarketPreviousClose ?? null,
      },
      fundamentals: {
        marketCap: quote.marketCap ?? null,
        peRatio: summary.summaryDetail?.trailingPE ?? null,
        eps: summary.defaultKeyStatistics?.trailingEps ?? null,
        profitMargin: summary.financialData?.profitMargins 
          ? (summary.financialData.profitMargins * 100) 
          : null,
        revenue: summary.financialData?.totalRevenue ?? null,
        fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow ?? null,
        fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh ?? null,
        companyName: quote.longName ?? symbol,
      },
      financials: {
        financial_statements: {
          quarterly: {
            income_statement: summary.incomeStatementHistory.incomeStatementHistory.reduce<IncomeStatements>((acc, statement) => {
              const date = new Date(statement.endDate).toISOString().split('T')[0];
              acc[date] = {
                totalRevenue: statement.totalRevenue ?? null,
                grossProfit: statement.grossProfit ?? null,
                operatingIncome: statement.operatingIncome ?? null,
                netIncome: statement.netIncome ?? null,
              };
              return acc;
            }, {})
          }
        }
      }
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Stock API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}