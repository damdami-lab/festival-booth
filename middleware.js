import { NextResponse } from 'next/server';
import { adminSessionToken } from '@/lib/hash';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isAdminApi = pathname.startsWith('/api/admin/') && pathname !== '/api/admin/login';
  const isDashboard = pathname.startsWith('/admin/dashboard');

  if (!isAdminApi && !isDashboard) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('admin_session')?.value;
  const expected = await adminSessionToken();

  if (!cookie || cookie !== expected) {
    if (isAdminApi) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/api/admin/:path*'],
};
