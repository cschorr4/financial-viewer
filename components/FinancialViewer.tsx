'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface FinancialStatement {
  [metric: string]: number | null;
}

interface StatementCollection {
  [date: string]: FinancialStatement;
}

interface FinancialStatements {
  income_statement: StatementCollection;
  balance_sheet: StatementCollection;
  cash_flow: StatementCollection;
}

interface CompanyInfo {
  name: string;
  sector: string | null;
  industry: string | null;
  employees: number | null;
  exchange: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
}

interface Metrics {
  [category: string]: {
    [metric: string]: number | null;
  };
}

interface FinancialData {
  company_info: CompanyInfo;
  financial_statements: {
    quarterly: FinancialStatements;
    annual: FinancialStatements;
  };
  metrics: Metrics;
}

interface FinancialViewerProps {
  data: FinancialData;
}

const formatCurrency = (value: number | null) => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: value > 1e9 ? 'compact' : 'standard'
  }).format(value);
};

const formatPercentage = (value: number | null) => {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const formatMetricName = (key: string): string => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface StatementViewerProps {
  data: FinancialData;
  periodicity: 'quarterly' | 'annual';
}

const StatementViewer: React.FC<StatementViewerProps> = ({ data, periodicity }) => {
  if (!data?.financial_statements?.[periodicity]) return null;
  
  const statements = data.financial_statements[periodicity];
  const getFormattedText = () => {
    let text = '';
    
    for (const [statementType, statement] of Object.entries(statements)) {
      text += `\n${statementType.toUpperCase()}\n`;
      text += '='.repeat(40) + '\n';
      
      const dates = Object.keys(statement).sort().reverse();
      const metrics = Object.keys(statement[dates[0]] || {}).sort();
      
      // Header
      text += 'Metric'.padEnd(30) + '|';
      dates.forEach(date => {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        text += ` ${formattedDate.padEnd(15)}|`;
      });
      text += '\n' + '-'.repeat(30 + (dates.length * 16)) + '\n';
      
      // Data rows
      metrics.forEach(metric => {
        const formattedMetric = formatMetricName(metric).padEnd(30);
        
        text += formattedMetric + '|';
        dates.forEach(date => {
          const value = statement[date]?.[metric];
          const formattedValue = formatCurrency(value).padEnd(15);
          text += ` ${formattedValue}|`;
        });
        text += '\n';
      });
      
      text += '\n\n';
    }
    
    return text;
  };

  return (
    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
      {getFormattedText()}
    </pre>
  );
};

interface MetricsCardProps {
  title: string;
  metrics: Record<string, number | null>;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, metrics }) => (
  <Card>
    <CardContent className="p-4">
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key}>
            <div className="text-sm text-gray-500">
              {formatMetricName(key)}
            </div>
            <div className="font-medium">
              {key.includes('margin') || key.includes('growth') || 
               key.includes('return') || key.includes('yield')
                ? formatPercentage(value)
                : formatCurrency(value)}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const FinancialViewer: React.FC<FinancialViewerProps> = ({ data }) => {
  const [periodicity, setPeriodicity] = useState<'quarterly' | 'annual'>('quarterly');
  const [copied, setCopied] = useState(false);

  const getFormattedText = () => {
    if (!data?.financial_statements?.[periodicity]) return '';
    
    let text = `${data.company_info.name} - Financial Statements (${periodicity.toUpperCase()})\n\n`;
    
    for (const [statementType, statement] of Object.entries(data.financial_statements[periodicity])) {
      text += `${statementType.toUpperCase()}\n`;
      text += '='.repeat(40) + '\n';
      
      const dates = Object.keys(statement).sort().reverse();
      const metrics = Object.keys(statement[dates[0]] || {}).sort();
      
      // Header
      text += 'Metric'.padEnd(30) + '|';
      dates.forEach(date => {
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
        text += ` ${formattedDate.padEnd(15)}|`;
      });
      text += '\n' + '-'.repeat(30 + (dates.length * 16)) + '\n';
      
      // Data rows
      metrics.forEach(metric => {
        const formattedMetric = formatMetricName(metric).padEnd(30);
        
        text += formattedMetric + '|';
        dates.forEach(date => {
          const value = statement[date]?.[metric];
          const formattedValue = formatCurrency(value).padEnd(15);
          text += ` ${formattedValue}|`;
        });
        text += '\n';
      });
      
      text += '\n\n';
    }
    
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFormattedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-4">{data.company_info.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-500">Sector</div>
              <div className="font-medium">{data.company_info.sector || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Industry</div>
              <div className="font-medium">{data.company_info.industry || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Employees</div>
              <div className="font-medium">
                {data.company_info.employees?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Exchange</div>
              <div className="font-medium">{data.company_info.exchange || 'N/A'}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{data.company_info.description}</p>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(data.metrics).map(([category, metrics]) => (
          <MetricsCard
            key={category}
            title={formatMetricName(category)}
            metrics={metrics}
          />
        ))}
      </div>

      {/* Financial Statements */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
          
          <Tabs 
            value={periodicity} 
            onValueChange={(value: string) => {
              if (value === 'quarterly' || value === 'annual') {
                setPeriodicity(value);
              }
            }} 
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
              <TabsTrigger value="annual">Annual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Card>
          <CardContent className="p-4">
            <StatementViewer data={data} periodicity={periodicity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialViewer;