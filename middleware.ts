import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const key = process.env.API_KEY;
  if (!key) return NextResponse.next(); // dev: no key → open
  const provided = req.headers.get('x-api-key');
  if (provided !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
