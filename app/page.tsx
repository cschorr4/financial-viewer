'use client';

import { useState } from 'react';
import FinancialViewer from '@/components/FinancialViewer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function Home() {
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
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <div className="mb-8">
        <div className="flex gap-2 max-w-xl mx-auto mb-4">
          <Input
            placeholder="Enter stock symbol (e.g. AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <Button 
            onClick={fetchData}
            disabled={loading || !symbol}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive" className="max-w-xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {data && <FinancialViewer data={data} />}
    </main>
  );
}