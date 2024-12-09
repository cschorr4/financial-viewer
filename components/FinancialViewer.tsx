'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FinancialViewer = () => {
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="font-medium">{formatValue(data.quote?.price)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Market Cap</div>
                  <div className="font-medium">{formatValue(data.fundamentals?.marketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">P/E Ratio</div>
                  <div className="font-medium">
                    {data.fundamentals?.peRatio?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Revenue</div>
                  <div className="font-medium">{formatValue(data.fundamentals?.revenue)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Profit Margin</div>
                  <div className="font-medium">
                    {data.fundamentals?.profitMargin?.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">52 Week Range</div>
                  <div className="font-medium">
                    {formatValue(data.fundamentals?.fiftyTwoWeekLow)} - {formatValue(data.fundamentals?.fiftyTwoWeekHigh)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {data.financials?.financial_statements && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold mb-4">Recent Quarterly Results</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Metric</th>
                        {Object.keys(Object.values(data.financials.financial_statements.quarterly.income_statement)[0] || {})
                          .sort()
                          .map(date => (
                            <th key={date} className="text-right p-2">{date}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.financials.financial_statements.quarterly.income_statement[
                        Object.keys(data.financials.financial_statements.quarterly.income_statement)[0]
                      ] || {}).map(([metric]) => (
                        <tr key={metric} className="border-b">
                          <td className="p-2">{metric}</td>
                          {Object.keys(data.financials.financial_statements.quarterly.income_statement)
                            .sort()
                            .map(date => (
                              <td key={date} className="text-right p-2">
                                {formatValue(data.financials.financial_statements.quarterly.income_statement[date][metric])}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialViewer;