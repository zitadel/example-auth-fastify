import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import { build } from './app.js';

/**
 * Starts the Fastify server and begins listening for incoming connections.
 *
 * @returns Promise that resolves when the server starts successfully
 */
async function startServer(): Promise<void> {
  const app: FastifyInstance = await build();
  const PORT: number = Number(process.env.PORT) || 3000;

  try {
    await app.listen({ port: PORT });
    console.log(`Stateless server with Fastify running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer().catch(console.error);
