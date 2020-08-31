const authorizer = (ctx, next) => {
  const {
    headers: { "x-api-key": apikey },
  } = ctx;

  if (!apikey) {
    return ctx.throw(401, {
      error: "Unauthorized",
    });
  }

  if (apikey !== process.env.X_API_KEY) {
    return ctx.throw(403, {
      error: "Forbidden",
      message: "You don't have permission to access this resource",
    });
  }
  return next();
};

module.exports = authorizer;
