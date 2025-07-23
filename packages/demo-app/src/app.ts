import fastify, {
  FastifyReply,
  FastifyRequest,
  preHandlerHookHandler,
  HookHandlerDoneFunction,
} from 'fastify';
import cookie from '@fastify/cookie';
import * as passportNs from '@fastify/passport';
import secureSession from '@fastify/secure-session';
import view from '@fastify/view';
import Handlebars from 'handlebars';

import { ZitadelStrategy, ZitadelUser } from 'passport-zitadel';
import config from './config.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const passport = (passportNs as any).default;

const ensureAuth: preHandlerHookHandler = (
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction,
) => {
  return req.isAuthenticated() ? done() : reply.redirect('/auth/login');
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function build() {
  const app = fastify({ logger: true });
  await app.register(view, {
    engine: {
      handlebars: Handlebars,
    },
    root: join(__dirname, '..', 'res'),
    layout: 'main.hbs',
    options: {
      partials: {},
    },
  });

  await app.register(cookie);
  // @fastify/secure-session and @fastify/session are both session plugins for
  // Fastify which are capable of encrypting/decrypting the session. The main
  // difference is that @fastify/secure-session uses the stateless approach
  // and stores the whole session in an encrypted cookie whereas @fastify/session
  // uses the stateful approach for sessions and stores them in a session store.
  await app.register(secureSession, {
    secret: config.SESSION_SECRET,
    cookie: {
      httpOnly: true,
      secure: config.SESSION_COOKIE_SECURE,
      maxAge: config.SESSION_DURATION * 1000,
      path: config.SESSION_COOKIE_PATH,
    },
    salt: config.SESSION_SALT,
  });

  // A hook that must be added. Sets up a @fastify/passport instance's hooks.
  await app.register(passport.initialize());
  // A hook that must be added. Sets up @fastify/passport's connector with
  // @fastify/secure-session to store authentication in the session.
  await app.register(passport.secureSession());

  const strategy = await ZitadelStrategy.discover({
    domain: config.ZITADEL_DOMAIN,
    clientId: config.ZITADEL_CLIENT_ID,
    clientSecret: config.ZITADEL_CLIENT_SECRET,
    callbackURL: config.ZITADEL_CALLBACK_URL,
    scope: 'openid profile email',
    postLogoutRedirectUrl: config.ZITADEL_POST_LOGOUT_URL,
  });

  passport.use(strategy);

  passport.registerUserSerializer(async (user: ZitadelUser) => user);
  passport.registerUserDeserializer(async (user: ZitadelUser) => user);

  // -----------------------------------------------------------------------
  // Routes
  // -----------------------------------------------------------------------

  app.get(
    '/',
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await reply.view('index.hbs', {
        isAuthenticated: req.isAuthenticated(),
        loginUrl: '/auth/login',
      });
    },
  );

  // The login route simply triggers the 'zitadel' authentication strategy.
  app.get(
    '/auth/login',
    { preValidation: passport.authenticate('zitadel') },
    async (): Promise<void> => {
      //
    },
  );

  app.get(
    '/auth/callback',
    {
      preValidation: passport.authenticate('zitadel', {
        successRedirect: config.ZITADEL_POST_LOGIN_URL,
        failureRedirect: '/auth/error',
      }),
    },
    async () => {
      //
    },
  );

  app.get(
    '/auth/logout',
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const user = req.user as ZitadelUser;
      await req.logout();
      req.session.delete();

      const logoutUrl = strategy.getLogoutUrl({
        id_token_hint: user?.id_token,
        logout_hint: user.sub,
      });

      reply.redirect(logoutUrl);
    },
  );

  app.get(
    '/logout/callback',
    async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await reply.view('loggedout.hbs', {
        //
      });
    },
  );

  app.get(
    '/auth/error',
    async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      reply.code(401).send({ error: 'Authentication failed' });
    },
  );

  app.get(
    '/profile',
    { preHandler: ensureAuth },
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const user = req.user as ZitadelUser;
      await reply.view('profile.hbs', {
        userJson: JSON.stringify(user, null, 2),
        logoutUrl: '/auth/logout',
        isAuthenticated: req.isAuthenticated(),
      });
    },
  );

  return app;
}
