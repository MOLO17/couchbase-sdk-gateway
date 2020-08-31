FROM node:12.0-slim
COPY . .
RUN yarn
CMD [ "yarn", "start" ]
