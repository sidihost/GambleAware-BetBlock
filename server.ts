import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    const firebaseConnect =
      'https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://apis.google.com https://firebaseinstallations.googleapis.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com';
    const connectSrc = IS_PRODUCTION
      ? `connect-src 'self' ${firebaseConnect}`
      : `connect-src 'self' ws://localhost:* ws://127.0.0.1:* ${firebaseConnect}`;
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.googleusercontent.com https://www.google.com; font-src 'self' data:; ${connectSrc}; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self';`,
    );
    next();
  });

  app.use(express.json({ limit: '32kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true });
  });

  app.all('/api/{*splat}', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(404).json({ error: 'API route not found' });
  });

  // Never let the SPA catch-all return index.html for a missing APK binary.
  app.get('/downloads/:file', (req: Request, res: Response) => {
    const requested = req.params.file;
    if (!requested || !/^[A-Za-z0-9._-]+$/.test(requested)) {
      res.status(400).json({ error: 'Invalid download filename' });
      return;
    }

    const candidateRoots = [
      path.resolve(__dirname, 'public', 'downloads'),
      path.resolve(__dirname, 'dist', 'downloads'),
    ];

    for (const rootDir of candidateRoots) {
      const resolvedPath = path.resolve(rootDir, requested);
      if (!resolvedPath.startsWith(`${rootDir}${path.sep}`)) continue;
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
        if (requested.toLowerCase().endsWith('.apk')) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          res.setHeader('Content-Disposition', 'attachment; filename="GambleAware-v2.1.1.apk"');
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=300');
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.sendFile(resolvedPath);
        return;
      }
    }

    if (requested === 'GambleAware-Nigeria.apk') {
      res.setHeader('Cache-Control', 'no-store');
      res.redirect(
        302,
        'https://github.com/sidihost/GambleAware-BetBlock/releases/latest/download/GambleAware-Nigeria.apk',
      );
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(404).json({
      error: 'APK package not yet published on this server',
      file: requested,
    });
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders: (res, filePath) => {
          const base = path.basename(filePath);
          if (base === 'sw.js' || base === 'manifest.webmanifest' || base === 'index.html') {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
          }
        },
      }),
    );
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GambleAware server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GambleAware server:', err);
  process.exit(1);
});
