import { FastifyInstance, FastifyPluginAsync, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

// minimal ResponseInit type for HTML responses
type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
};

declare module 'fastify' {
  interface FastifyReply {
    view<T extends Record<string, unknown> = Record<string, unknown>>(
      name: string,
      data?: T,
      init?: ResponseInit,
    ): FastifyReply;
  }
}

const viewMiddleware: FastifyPluginAsync = fp(
  async (fastify: FastifyInstance) => {
    const viewsRoot = join(process.cwd(), 'res');
    const layoutTpl = Handlebars.compile(
      readFileSync(join(viewsRoot, 'main.hbs'), 'utf8'),
    );

    fastify.decorateReply('view', function <
      T extends Record<string, unknown>,
    >(this: FastifyReply, name: string, data?: T, init: ResponseInit = {}): FastifyReply {
      const tplSrc = readFileSync(join(viewsRoot, `${name}.hbs`), 'utf8');
      const tpl = Handlebars.compile(tplSrc);
      const body = tpl(data ?? {});

      this.status(init.status ?? 200);
      this.header('Content-Type', 'text/html; charset=utf-8');

      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.header(key, value);
        });
      }

      return this.send(
        layoutTpl({ body, ...(data as Record<string, unknown>) }),
      );
    });
  },
);

export { viewMiddleware };
