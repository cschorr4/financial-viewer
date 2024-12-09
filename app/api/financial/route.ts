// app/api/financial/route.ts
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

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

    // Transform the data into a more manageable structure
    const transformedData = {
      quote: {
        price: quote.regularMarketPrice,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        previousClose: quote.regularMarketPreviousClose,
      },
      fundamentals: {
        marketCap: quote.marketCap,
        peRatio: summary.summaryDetail?.trailingPE,
        eps: summary.defaultKeyStatistics?.trailingEps,
        profitMargin: summary.financialData?.profitMargins 
          ? (summary.financialData.profitMargins * 100) 
          : null,
        revenue: summary.financialData?.totalRevenue,
        fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh,
        companyName: quote.longName,
      },
      financials: {
        financial_statements: {
          quarterly: {
            income_statement: summary.incomeStatementHistory?.incomeStatementHistory?.reduce((acc, statement) => {
              const date = new Date(statement.endDate).toISOString().split('T')[0];
              acc[date] = {
                'Total Revenue': statement.totalRevenue,
                'Gross Profit': statement.grossProfit,
                'Operating Income': statement.operatingIncome,
                'Net Income': statement.netIncome,
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
        details: error.message
      },
      { status: 500 }
    );
  }
}