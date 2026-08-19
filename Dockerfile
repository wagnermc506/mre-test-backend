FROM node:24 AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

CMD yarn start:dev