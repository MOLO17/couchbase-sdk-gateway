require("dotenv").config({
  path: "./.env",
});
const authorizer = require("./middlewares/authorizer");
const bodyparser = require("koa-bodyparser");
const cors = require("@koa/cors");
const healthPathRouter = require("./routers/healthRouter");
const http = require("http");
const Koa = require("koa");
const koaCompress = require("koa-compress");
const logger = require("./middlewares/logger");
const queryPathRouter = require("./routers/queryRouter");
const Router = require("koa-router");

const {
  API_PORT: apiPort = 3000,
  API_VERSION: apiVersion = "v1",
} = process.env;

const apiRouter = new Router()
  .prefix(`/api/${apiVersion}`)
  .use(authorizer)
  .use("/query", queryPathRouter.routes());

const healthRouter = new Router().use("/health", healthPathRouter.routes());

const app = new Koa()
  .use(cors())
  .use(bodyparser())
  .use(logger())
  .use(
    koaCompress({
      threshold: 0,
      flush: require("zlib").Z_SYNC_FLUSH,
    })
  )
  .use(healthRouter.routes())
  .use(apiRouter.routes());

http.createServer(app.callback()).listen(apiPort, () => {
  console.log(`API Server started on port ${apiPort}`);
});
