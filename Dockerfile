FROM node:14.0-slim
COPY src src
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn
CMD [ "yarn", "start" ]
