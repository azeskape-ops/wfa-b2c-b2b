import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const url = request.nextUrl;

  // Если клиент зашел именно по адресу termin... и находится на главной
  if (hostname === 'termin.workforall.sk' && url.pathname === '/') {
    // ...сервер мгновенно и незаметно отдает ему страницу /booking
    return NextResponse.rewrite(new URL('/booking', request.url));
  }

  return NextResponse.next();
}

// Запускаем это правило только для главной страницы
export const config = {
  matcher: '/',
};