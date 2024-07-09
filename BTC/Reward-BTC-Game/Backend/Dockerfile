FROM node:16-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app/api

COPY ./package.json /usr/src/app/


RUN apk --no-cache --virtual build-dependencies add git python3 make g++ \
    && apk add curl \
    && git config --global url."https://".insteadOf git:// \
    && yarn install \
    && yarn cache clean --force \
    && apk del build-dependencies \
    && apk add git bash

COPY . /usr/src/app

COPY entrypoint.sh /usr/src/app

RUN chmod +x /usr/src/app/entrypoint.sh

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["yarn", "start"]