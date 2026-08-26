// CommonJS wrapper for cPanel LiteSpeed hosting.
// cPanel's lsnode.js uses require() which cannot load ES Modules directly.
// This wrapper uses dynamic import() to bridge the gap.
import('./src/server.js').catch(function (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
});
