import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const APK_FILENAME = 'GambleAware-Nigeria.apk';
const GITHUB_APK_URL =
  'https://github.com/sidihost/GambleAware-BetBlock/releases/latest/download/GambleAware-Nigeria.apk';
const APK_CACHE_DIR = path.join(os.tmpdir(), 'gambleaware-apk-cache');
const APK_CACHE_PATH = path.join(APK_CACHE_DIR, APK_FILENAME);
const APK_CACHE_TTL_MS = 10 * 60 * 1000;
const MIN_VALID_APK_BYTES = 100 * 1024;

let inFlightApkFetch: Promise<string> | null = null;

async function isValidApkFile(filePath: string): Promise<{ valid: boolean; mtimeMs: number }> {
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile() || stat.size < MIN_VALID_APK_BYTES) {
      return { valid: false, mtimeMs: 0 };
    }
    const handle = await fsp.open(filePath, 'r');
    try {
      const header = Buffer.alloc(4);
      const { bytesRead } = await handle.read(header, 0, 4, 0);
      const isZipHeader =
        bytesRead === 4 &&
        header[0] === 0x50 &&
        header[1] === 0x4b &&
        header[2] === 0x03 &&
        header[3] === 0x04;
      return { valid: isZipHeader, mtimeMs: stat.mtimeMs };
    } finally {
      await handle.close();
    }
  } catch {
    return { valid: false, mtimeMs: 0 };
  }
}

async function fetchAndCacheApk(): Promise<string> {
  await fsp.mkdir(APK_CACHE_DIR, { recursive: true });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(GITHUB_APK_URL, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'GambleAware-APK-Proxy/2.1.1',
        Accept: 'application/vnd.android.package-archive, application/octet-stream, */*',
      },
    });
    if (!response.ok) {
      throw new Error(`Upstream APK returned HTTP ${response.status}`);
    }

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    if (
      buffer.length < MIN_VALID_APK_BYTES ||
      buffer[0] !== 0x50 ||
      buffer[1] !== 0x4b ||
      buffer[2] !== 0x03 ||
      buffer[3] !== 0x04
    ) {
      throw new Error(`Upstream response is not a valid APK binary (${buffer.length} bytes)`);
    }

    const tmpPath = path.join(APK_CACHE_DIR, `${APK_FILENAME}.tmp.${process.pid}.${Date.now()}`);
    await fsp.writeFile(tmpPath, buffer);
    await fsp.rename(tmpPath, APK_CACHE_PATH);
    return APK_CACHE_PATH;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureApkCached(): Promise<string> {
  const existing = await isValidApkFile(APK_CACHE_PATH);
  if (existing.valid && Date.now() - existing.mtimeMs < APK_CACHE_TTL_MS) {
    return APK_CACHE_PATH;
  }

  if (!inFlightApkFetch) {
    inFlightApkFetch = fetchAndCacheApk()
      .catch((err) => {
        if (existing.valid) {
          return APK_CACHE_PATH;
        }
        throw err;
      })
      .finally(() => {
        inFlightApkFetch = null;
      });
  }

  return inFlightApkFetch;
}

const UNREGISTER_SW_SCRIPT = `
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {}
    try {
      await self.registration.unregister();
    } catch {}
  })());
});
`.trim();

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
      `default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.googleusercontent.com https://www.google.com; font-src 'self' data:; ${connectSrc}; frame-src 'self' https://*.firebaseapp.com https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self';`,
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

  // Neutralize any previously registered PWA service worker & manifest
  app.get('/sw.js', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(UNREGISTER_SW_SCRIPT);
  });

  app.get('/manifest.webmanifest', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.status(410).json({ error: 'Web App removed — download the Android APK instead' });
  });

  // Same-origin binary APK streaming with Accept-Ranges & Content-Length (fixes iframe/mobile download failures)
  app.get('/downloads/:file', async (req: Request, res: Response) => {
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
          res.setHeader('Content-Disposition', `attachment; filename="${requested}"`);
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=300');
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.sendFile(resolvedPath);
        return;
      }
    }

    if (requested === APK_FILENAME) {
      try {
        const cachedApkPath = await ensureApkCached();
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${APK_FILENAME}"`);
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.sendFile(cachedApkPath);
        return;
      } catch (err) {
        console.warn('Same-origin APK cache proxy failed, falling back to direct GitHub URL:', err);
        res.setHeader('Cache-Control', 'no-store');
        res.redirect(302, GITHUB_APK_URL);
        return;
      }
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
          if (base === 'index.html') {
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
    void ensureApkCached().catch(() => {});
  });
}

startServer().catch((err) => {
  console.error('Failed to start GambleAware server:', err);
  process.exit(1);
});
