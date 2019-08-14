FROM node:12 as build

WORKDIR /app

COPY ./ /app

RUN yarn && yarn build

FROM node:12-alpine

WORKDIR /app

COPY --from=build /app/out/ /app

CMD ["node", "./api/index.js"]
