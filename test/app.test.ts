/* eslint-env jest */
import { build } from '../src/app.js';
import { FastifyInstance } from 'fastify';

describe('GET /', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 200 OK and render the home page', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(res.statusCode).toBe(200);
  });
});

describe('GET /auth/logout/callback', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('clears authjs.* and logout_state via Set-Cookie on success', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/logout/callback?state=teststate123',
      headers: {
        cookie: [
          'logout_state=teststate123',
          'authjs.session-token=fakesession',
          'authjs.csrf-token=fakecsrf',
          'authjs.callback-url=http://example.com',
        ].join('; '),
      },
    });

    const status = res.statusCode;
    const location = res.headers.location;
    const setCookies = res.headers['set-cookie'] as unknown as string[];

    expect(status).toBe(302);
    expect(location).toMatch(/\/(auth\/)?logout\/success$/);
    expect(setCookies).toBeDefined();
    expect(Array.isArray(setCookies)).toBe(true);

    const wasCleared = (name: string) =>
      setCookies.some(
        (sc) =>
          sc.startsWith(`${name}=`) &&
          (sc.includes('Max-Age=0') || /Expires=Thu, 01 Jan 1970/i.test(sc)),
      );

    expect(wasCleared('authjs.session-token')).toBe(true);
    expect(wasCleared('authjs.csrf-token')).toBe(true);
    expect(wasCleared('authjs.callback-url')).toBe(true);
    expect(wasCleared('logout_state')).toBe(true);

    const logoutStateCookie = setCookies.find((sc) =>
      sc.startsWith('logout_state='),
    );
    expect(logoutStateCookie).toMatch(/Path=\/auth\/logout\/callback/);
  });
});
