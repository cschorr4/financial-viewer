import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

async function runPythonScript(symbol: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'get_financial_statements.py');
    
    const pythonProcess = spawn('python3', [scriptPath, symbol], {
      env: { 
        ...process.env, 
        PYTHONPATH: process.env.PYTHONPATH || process.cwd(),
        PATH: process.env.PATH
      },
      cwd: process.cwd()
    });
    
    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
      console.error('Python stderr:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process failed with code ${code}: ${errorString}`));
      }

      try {
        const result = JSON.parse(dataString);
        if (result.status === 'error') {
          return reject(new Error(result.error));
        }
        return resolve(result);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown JSON parse error';
        return reject(new Error(`Failed to parse Python output: ${errorMessage}`));
      }
    });

    pythonProcess.on('error', (err) => {
      const errorMessage = err instanceof Error ? err.message : 'Unknown process error';
      reject(new Error(`Failed to start Python process: ${errorMessage}`));
    });
  });
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

    const data = await runPythonScript(symbol);
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}