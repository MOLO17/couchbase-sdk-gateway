const chalk = require("chalk");

const logger = () => async (ctx, next) => {
  const now = new Date();

  await next();

  if(ctx.request.url !== '/health') {
    process.stdout.write(
      chalk.greenBright("\nTimestamp: ") +
        chalk.green(now.toISOString()) +
        chalk.yellowBright("\nResponse time: ") +
        chalk.yellow(`${Date.now() - now.getTime()}ms`) +
        chalk.magentaBright("\nRequest path: ") +
        chalk.magenta(`${ctx.request.method}: ${ctx.request.url}\n`)
    );
  }
};

module.exports = logger;
