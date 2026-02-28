import { NextResponse } from 'next/server';

export function checkApiKey(request: Request): NextResponse | null {
  const key = process.env.API_KEY;
  if (!key) return null; // dev: no key set → open
  const provided = request.headers.get('x-api-key');
  if (provided !== key) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
