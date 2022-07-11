const Router = require('koa-router');

module.exports = new Router().get('/', (ctx, next) => {
  ctx.status = 200;
  ctx.body = 'OK';
  return next();
});
