import { FastifyRequest, FastifyReply } from 'fastify';
import { getSession } from '@mridang/fastify-auth';
import { authConfig } from './index.js';

/**
 * Middleware that ensures the user is authenticated before accessing
 * protected routes. It retrieves the current Auth.js session and validates
 * that a user is present. If authentication fails, the client is redirected
 * to the sign-in page with the original URL preserved in the callbackUrl
 * query parameter. On success, the session is attached to the context and
 * control is passed to the next handler.
 *
 * @param request - Fastify Request; the session will be available at reply.session
 *            after validation.
 * @param reply - Fastify Reply object
 *
 * @remarks
 * - Must be used after setting up Auth.js session handling so that request
 *   cookies are parsed.
 * - Relies on getSession() from @mridang/fastify-auth.
 * - Redirects unauthenticated users to
 *   `/auth/signin?callbackUrl=<original URL>`.
 * - Original request URL is URL-encoded in callbackUrl.
 *
 * @example
 * ```ts
 * import { requireAuth } from './guards'
 *
 * fastify.get('/profile', { preHandler: requireAuth }, async (request, reply) => {
 *   const session = reply.session
 *   return reply.view('profile', { user: session.user })
 * })
 * ```
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const session = await getSession(request, authConfig);
    if (!session?.user) {
      const callbackUrl: string = encodeURIComponent(request.url);
      return reply.redirect(`/auth/signin?callbackUrl=${callbackUrl}`);
    }
    reply.session = session;
  } catch (err) {
    throw err as Error;
  }
}
