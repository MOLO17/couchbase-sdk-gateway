if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({
    path: './.env',
  });
}
const authorizer = require('./middlewares/authorizer');
const bodyparser = require('koa-bodyparser');
const cors = require('@koa/cors');
const healthPathRouter = require('./routers/healthRouter');
const http = require('http');
const Koa = require('koa');
const koaCompress = require('koa-compress');
const logger = require('./middlewares/logger');
const queryPathRouter = require('./routers/queryRouter');
const Router = require('koa-router');
const mount = require('koa-mount');
const basicAuth = require('koa-basic-auth');

const swStats = require('swagger-stats');
const apiSpec = require('./swagger.json');
const e2k = require('express-to-koa');
const koaSwagger = require('koa2-swagger-ui');
const openApiDocs = require('./swagger.json');

const {
  API_PORT: apiPort = 3000,
  API_VERSION: apiVersion = 'v1',
  STATS_USERNAME: statsUsername,
  DOCS_USERNAME: docsUsername,
  STATS_PASSWORD: statsPassword,
  DOCS_PASSWORD: docsPassword,
  BUCKET: bucketName,
} = process.env;

const apiRouter = new Router()
  .prefix(`/api/${apiVersion}`)
  .use(authorizer)
  .use(`/query`, queryPathRouter.routes())
  .use(`/query/${bucketName}`, queryPathRouter.routes());

const healthRouter = new Router().use('/health', healthPathRouter.routes());

const app = new Koa()
  .use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
    console.log(`Response served in ${ms}`);
  })
  .use(cors())
  .use(bodyparser())
  .use(logger())
  .use(
    mount(
      '/api/docs',
      basicAuth({
        name: docsUsername,
        pass: docsPassword,
      })
    )
  )
  .use(
    mount(
      '/stats',
      basicAuth({
        name: statsUsername,
        pass: statsPassword,
      })
    )
  )
  .use(
    koaSwagger({
      routePrefix: '/api/docs',
      hideTopbar: true,
      title: 'API Docs',
      swaggerOptions: {
        docExpansion: 'list',
        withCredentials: true,
        filter: true,
        showCommonExtensions: true,
        jsonEditor: false,
        defaultModelRendering: 'schema',
        displayRequestDuration: true,
        spec: openApiDocs,
      },
    })
  )
  .use(
    e2k(
      swStats.getMiddleware({
        swaggerSpec: apiSpec,
        authentication: false, // Broken: https://github.com/slanatech/swagger-stats/issues/109
        uriPath: '/stats',
        apdexThreshold: 250,
        onAuthenticate: (_, username, password) => {
          return username === statsUsername && password === statsPassword;
        },
      })
    )
  )
  .use(
    koaCompress({
      threshold: 0,
      flush: require('zlib').Z_SYNC_FLUSH,
    })
  )
  .use(healthRouter.routes())
  .use(apiRouter.routes());

http.createServer(app.callback()).listen(apiPort, () => {
  console.log(`API Server started on port ${apiPort}`);
});
