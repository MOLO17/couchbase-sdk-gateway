const authorizer = (ctx, next) => {
  const {
    headers: { "x-api-key": apikey },
  } = ctx;

  if (!apikey) {
    return ctx.throw(400, {
      error: "Bad Request",
      message: "Missing x-api-key header",
    });
  }

  if (apikey !== process.env.X_API_KEY) {
    return ctx.throw(401, {
      error: "Unauthorized",
      message: "You are not authorized to access this resource",
    });
  }
  return next();
};

module.exports = authorizer;
