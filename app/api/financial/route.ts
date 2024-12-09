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
        modules: [
          'price',
          'financialData',
          'defaultKeyStatistics',
          'summaryDetail',
          'incomeStatementHistory',
          'incomeStatementHistoryQuarterly',
          'assetProfile'  // Added for sector and industry info
        ]
      })
    ]);

    // Transform quarterly statements
    const quarterlyStatements = summary.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
    const transformedQuarterly = quarterlyStatements.reduce<IncomeStatements>((acc, statement) => {
      const date = new Date(statement.endDate).toISOString().split('T')[0];
      acc[date] = {
        totalRevenue: statement.totalRevenue || null,
        grossProfit: statement.grossProfit || null,
        operatingIncome: statement.operatingIncome || null,
        netIncome: statement.netIncome || null
      };
      return acc;
    }, {});

    // Transform annual statements
    const annualStatements = summary.incomeStatementHistory?.incomeStatementHistory || [];
    const transformedAnnual = annualStatements.reduce<IncomeStatements>((acc, statement) => {
      const date = new Date(statement.endDate).toISOString().split('T')[0];
      acc[date] = {
        totalRevenue: statement.totalRevenue || null,
        grossProfit: statement.grossProfit || null,
        operatingIncome: statement.operatingIncome || null,
        netIncome: statement.netIncome || null
      };
      return acc;
    }, {});

    const transformedData = {
      quote: {
        price: quote.regularMarketPrice || null,
        changePercent: quote.regularMarketChangePercent || null,
        volume: quote.regularMarketVolume || null,
        previousClose: quote.regularMarketPreviousClose || null,
        dayHigh: quote.regularMarketDayHigh || null,
        dayLow: quote.regularMarketDayLow || null,
        averageVolume: quote.averageDailyVolume3Month || null
      },
      fundamentals: {
        marketCap: quote.marketCap || null,
        peRatio: summary.summaryDetail?.trailingPE || null,
        eps: summary.defaultKeyStatistics?.trailingEps || null,
        profitMargin: summary.financialData?.profitMargins
          ? (summary.financialData.profitMargins * 100)
          : null,
        revenue: summary.financialData?.totalRevenue || null,
        fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow || null,
        fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh || null,
        companyName: quote.longName || symbol,
        sector: summary.assetProfile?.sector || null,
        industry: summary.assetProfile?.industry || null,
        beta: summary.defaultKeyStatistics?.beta || null,
        dividendYield: summary.summaryDetail?.dividendYield 
          ? (summary.summaryDetail.dividendYield * 100)
          : null,
        priceToBook: summary.defaultKeyStatistics?.priceToBook || null
      },
      financials: {
        financial_statements: {
          quarterly: {
            income_statement: transformedQuarterly
          },
          annual: {
            income_statement: transformedAnnual
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
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}