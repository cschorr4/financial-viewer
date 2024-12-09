'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MetricKey = 'totalRevenue' | 'grossProfit' | 'operatingIncome' | 'netIncome' | 'ebitda' | 'researchDevelopment' | 'sellingGeneralAdministrative' | 'totalOperatingExpenses';

interface FinancialStatement {
  totalRevenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  ebitda: number | null;
  researchDevelopment: number | null;
  sellingGeneralAdministrative: number | null;
  totalOperatingExpenses: number | null;
}

interface ApiResponse {
  quote: {
    price: number | null;
    changePercent: number | null;
    volume: number | null;
    previousClose: number | null;
    averageVolume: number | null;
    dayHigh: number | null;
    dayLow: number | null;
  };
  fundamentals: {
    marketCap: number | null;
    peRatio: number | null;
    eps: number | null;
    profitMargin: number | null;
    revenue: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyTwoWeekHigh: number | null;
    companyName: string;
    beta: number | null;
    dividendYield: number | null;
    priceToBook: number | null;
  };
  financials?: {
    financial_statements: {
      quarterly: {
        income_statement: {
          [date: string]: FinancialStatement;
        };
      };
      annual: {
        income_statement: {
          [date: string]: FinancialStatement;
        };
      };
    };
  };
}

const metricLabels: Record<MetricKey, string> = {
  totalRevenue: 'Total Revenue',
  grossProfit: 'Gross Profit',
  operatingIncome: 'Operating Income',
  netIncome: 'Net Income',
  ebitda: 'EBITDA',
  researchDevelopment: 'R&D Expenses',
  sellingGeneralAdministrative: 'SG&A Expenses',
  totalOperatingExpenses: 'Total Operating Expenses'
};

const FinancialViewer = () => {
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('quarterly');

  const fetchData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/financial?symbol=${symbol.toUpperCase()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }
      
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number | null, isPercentage = false) => {
    if (value == null) return 'N/A';
    if (isPercentage) {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  const formatPercentageChange = (value: number | null) => {
    if (value == null) return 'N/A';
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</span>;
  };

  const renderFinancialMetrics = () => {
    if (!data) return null;
    const { quote, fundamentals } = data;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-sm text-gray-500">Price</div>
          <div className="font-medium">{formatValue(quote?.price)}</div>
          <div className="text-sm">{formatPercentageChange(quote?.changePercent)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Market Cap</div>
          <div className="font-medium">{formatValue(fundamentals?.marketCap)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">P/E Ratio</div>
          <div className="font-medium">{fundamentals?.peRatio?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">EPS</div>
          <div className="font-medium">{formatValue(fundamentals?.eps)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Revenue (TTM)</div>
          <div className="font-medium">{formatValue(fundamentals?.revenue)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Profit Margin</div>
          <div className="font-medium">{formatValue(fundamentals?.profitMargin, true)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">52 Week Range</div>
          <div className="font-medium text-sm">
            {formatValue(fundamentals?.fiftyTwoWeekLow)} - {formatValue(fundamentals?.fiftyTwoWeekHigh)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Volume</div>
          <div className="font-medium">
            {quote?.volume?.toLocaleString() || 'N/A'}
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialTable = (type: 'quarterly' | 'annual') => {
    if (!data?.financials?.financial_statements?.[type]?.income_statement) {
      return <div className="text-gray-500">No {type} data available</div>;
    }

    const statements = data.financials.financial_statements[type].income_statement;
    const dates = Object.keys(statements).sort().reverse();
    if (dates.length === 0) return null;

    const metrics: MetricKey[] = [
      'totalRevenue',
      'grossProfit',
      'operatingIncome',
      'ebitda',
      'researchDevelopment',
      'sellingGeneralAdministrative',
      'totalOperatingExpenses',
      'netIncome'
    ];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Metric</th>
              {dates.map(date => (
                <th key={date} className="text-right p-2">
                  {new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(metric => (
              <tr key={metric} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{metricLabels[metric]}</td>
                {dates.map(date => (
                  <td key={date} className="text-right p-2">
                    {formatValue(statements[date][metric])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter stock symbol (e.g. AAPL)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          onClick={fetchData}
          disabled={loading || !symbol}
        >
          {loading ? 'Loading...' : 'Fetch Data'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">{data.fundamentals?.companyName || symbol}</h2>
              {renderFinancialMetrics()}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Tabs defaultValue="quarterly" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="quarterly">Quarterly Results</TabsTrigger>
                  <TabsTrigger value="annual">Annual Results</TabsTrigger>
                </TabsList>
                <TabsContent value="quarterly">
                  {renderFinancialTable('quarterly')}
                </TabsContent>
                <TabsContent value="annual">
                  {renderFinancialTable('annual')}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FinancialViewer;