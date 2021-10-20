const connection = require('../shared/couchbaseConnection');
const Router = require('koa-router');

module.exports = new Router().post('/', async (ctx, next) => {
  try {
    const { query = '', options = {} } = ctx.request.body;

    if (!query) {
      ctx.body = {
        error: 'missing_query_parameter',
        message: 'Missing Query Parameter',
      };
      ctx.status = 400;
      return next();
    }

    const queryString = query
      .split('$bucket')
      .join(`\`${connection.bucketName}\``);

    console.log(`Query ${queryString}`);
    console.log(` WITH -> ${JSON.stringify(options)}`);

    const t1 = Date.now();

    const result = await connection.query(queryString, options);

    console.log('FETCH EXECUTION TIME:', Date.now() - t1);

    ctx.status = 200;
    ctx.body = result;

    return next();
  } catch ({ message, name }) {
    ctx.body = message;
    ctx.status = 500;
    return next();
  }
});
