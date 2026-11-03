import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev serverless plugin to serve /api/sync-fip locally during `npm run dev`
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/sync-fip', async (req, res) => {
        try {
          const { default: handler } = await import('./api/sync-fip.js');
          // Mock express/vercel res.status and res.json if needed
          if (!res.status) {
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };
          }
          if (!res.json) {
            res.json = (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            };
          }
          await handler(req, res);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8501',
        changeOrigin: true
      }
    }
  }
});
