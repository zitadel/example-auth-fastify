import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import view from '@fastify/view';
import Handlebars from 'handlebars';
import { join } from 'path';

const viewMiddleware: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  await fastify.register(view, {
    engine: {
      handlebars: Handlebars,
    },
    root: join(process.cwd(), 'res'),
    layout: './main.hbs',
  });
};

export { viewMiddleware };
