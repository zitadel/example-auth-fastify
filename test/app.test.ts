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
