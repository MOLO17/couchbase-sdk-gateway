require("dotenv").config({
  path: "./.env",
});
const CouchbaseConnection = require("./couchbaseConnection");
const bodyparser = require("koa-bodyparser");
const koaCompress = require("koa-compress");
const Koa = require("koa");
const Router = require("koa-router");
const http = require("http");
const cors = require("@koa/cors");

// destructure of the env variables we need
const {
  API_PORT: apiPort,
  CLUSTER_USERNAME: username,
  CLUSTER_PASSWORD: password,
  CLUSTER_CONNECTION_STRING: connectionString,
  BUCKET: bucketName,
  API_VERSION: apiVersion = "v1",
} = process.env;

const maxRetries = 3;
const isSecure = connectionString.startsWith("couchbases://");
const certpath = isSecure ? "./ca.pem" : undefined;
const certpathParam = isSecure ? `?certpath=${certpath}` : "";
const connection = new CouchbaseConnection(
  connectionString,
  certpathParam,
  username,
  password,
  bucketName,
  maxRetries
).connect();

const queryRouter = new Router().post("/", async (ctx, next) => {
  try {
    const { query = "", options = {} } = ctx.request.body;

    if (!query) {
      ctx.body = {
        error: "missing_query_parameter",
        message: "Missing Query Parameter",
      };
      ctx.status = 400;
      return next();
    }

    const result = await connection.query(
      query.replace("$bucket", `\`${connection.bucketName}\``),
      options
    );

    ctx.status = 200;
    ctx.body = result;

    return next();
  } catch ({ message, name }) {
    ctx.body = message;
    ctx.status = 500;
    return next();
  }
});

const router = new Router()
  // .use(authorizer)
  .prefix(`/api/${apiVersion}`)
  .use("/query", queryRouter.routes());

const app = new Koa()
  .use(cors())
  .use(bodyparser())
  .use(router.routes())
  .use(
    koaCompress({
      threshold: 0,
      flush: require("zlib").Z_SYNC_FLUSH,
    })
  );

http.createServer(app.callback()).listen(apiPort, () => {
  console.log(`API Server started on port ${apiPort}`);
});
