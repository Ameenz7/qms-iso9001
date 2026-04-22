import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export const CSRF_COOKIE = 'XSRF-TOKEN';
export const CSRF_HEADER = 'x-xsrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit cookie CSRF protection.
 *
 * - On every request we ensure the client has an `XSRF-TOKEN` cookie (non
 *   httpOnly so SPA JS can read it). If absent, we mint a fresh one.
 * - For state-changing requests (not GET/HEAD/OPTIONS) we require the client
 *   to echo the cookie value in the `X-XSRF-TOKEN` header. A constant-time
 *   compare rejects mismatches.
 *
 * This is stateless and ties the token to the browser (cookie). A cross-origin
 * attacker cannot set a custom header, so reading the cookie on the attacker
 * origin is not possible either — the forged request fails the header check.
 *
 * The `/auth/login` route is exempted so the first login can mint cookies.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly exemptPaths = new Set<string>([
    '/api/auth/login',
    '/api/auth/csrf-token',
  ]);

  use(req: Request, res: Response, next: NextFunction): void {
    this.ensureCookie(req, res);

    if (SAFE_METHODS.has(req.method) || this.exemptPaths.has(req.path)) {
      return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.header(CSRF_HEADER);

    if (!cookieToken || !headerToken || !constantTimeEquals(cookieToken, headerToken)) {
      throw new ForbiddenException('Invalid CSRF token');
    }
    return next();
  }

  private ensureCookie(req: Request, res: Response): void {
    if (req.cookies?.[CSRF_COOKIE]) return;
    const token = randomBytes(24).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    // Make it readable on this same response too so the first caller can use it.
    (req as Request & { cookies: Record<string, string> }).cookies[CSRF_COOKIE] = token;
  }
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
