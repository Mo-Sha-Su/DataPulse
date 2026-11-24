import { startServer } from './index';

startServer().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal: server failed to start', err);
  process.exit(1);
});
