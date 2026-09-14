import { NextResponse } from 'next/server';

export async function GET() {
  // Check for explicit environment variable first
  const explicitEnv =
    process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT;

  if (
    explicitEnv === 'production' ||
    explicitEnv === 'staging' ||
    explicitEnv === 'local'
  ) {
    return NextResponse.json({ environment: explicitEnv });
  }

  // Fallback to NODE_ENV
  const nodeEnv = process.env.NODE_ENV || 'development';

  let environment: 'production' | 'staging' | 'local' = 'local';

  if (nodeEnv === 'production') {
    environment = 'production';
  } else if (nodeEnv === 'development') {
    environment = 'staging';
  } else {
    environment = 'local';
  }

  return NextResponse.json({ environment });
}
