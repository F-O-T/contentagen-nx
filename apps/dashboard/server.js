import path from 'node:path'
import express from 'express'
import getPort, { portNumbers } from 'get-port'
import * as zlib from 'node:zlib'

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort,
) {
  const app = express()
  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        },
      },
      appType: 'custom',
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use(
      (await import('compression')).default({
        brotli: {
          flush: zlib.constants.BROTLI_OPERATION_FLUSH,
        },
        flush: zlib.constants.Z_SYNC_FLUSH,
      }),
    )
  }

  if (isProd) app.use(express.static('./dist/client'))

  // File proxy API route for serving Minio files
  app.get('/api/files/proxy', async (req, res) => {
    try {
      const { path: filePath } = req.query;
      
      if (!filePath) {
        return res.status(400).json({ error: 'Missing path parameter' });
      }

      // Import Minio client and functions
      const { getMinioClient, streamFileForProxy } = await import('@packages/files/client');
      const { getServerEnv } = await import('@packages/environment/server');
      
      const env = getServerEnv();
      const minioClient = getMinioClient(env);
      
      // Get file from Minio with proper content type
      const { buffer, contentType } = await streamFileForProxy(filePath, 'competitors', minioClient);
      
      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });
      
      // Send the file buffer
      res.send(buffer);
    } catch (error) {
      console.error('File proxy error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  });

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      if (path.extname(url) !== '') {
        console.warn(`${url} is not valid router path`)
        res.status(404)
        res.end(`${url} is not valid router path`)
        return
      }

      // Best effort extraction of the head from vite's index transformation hook
      let viteHead = !isProd
        ? await vite.transformIndexHtml(
          url,
          `<html><head></head><body></body></html>`,
        )
        : ''

      viteHead = viteHead.substring(
        viteHead.indexOf('<head>') + 6,
        viteHead.indexOf('</head>'),
      )

      const entry = await (async () => {
        if (!isProd) {
          return vite.ssrLoadModule('/src/entry-server.tsx')
        } else {
          return import('./dist/server/entry-server.js')
        }
      })()

      console.info('Rendering: ', url, '...')
      entry.render({ req, res, head: viteHead })
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e)
      console.info(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(async ({ app }) => {
    // In production, the PORT env var is set by the hosting provider.
    // In development, we use get-port to find an available port.
    const port = process.env.PORT || (await getPort({ port: portNumbers(3000, 3100) }));
 
    app.listen(port, () => {
      // The log now dynamically shows the correct port.
      console.info(`Client Server listening on port: ${port}`);
    });
  });
}