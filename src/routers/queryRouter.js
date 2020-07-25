const connection = require("../shared/couchbaseConnection");
const Router = require("koa-router");

module.exports = new Router().post("/", async (ctx, next) => {
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
