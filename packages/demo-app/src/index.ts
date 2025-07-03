import 'dotenv/config';

import { build } from './app.js';

build()
  .then((app) =>
    app.listen({
      port: Number(process.env.PORT ?? '3000'),
      host: '0.0.0.0',
    }),
  )
  .then((addr) => {
    console.log(`⇢  ready on ${addr}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
