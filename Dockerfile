FROM node:10.15.3-alpine as build-node

WORKDIR /app

ADD ./package.json /app/package.json

COPY ./websocket-relay.js /app/websocket-relay.js

COPY ./test.mp4 /app/test.mp4

COPY ./static /app/static

RUN cd /app && \
    npm i --production

EXPOSE 8081 8082

CMD [ "node", "/app/websocket-relay", "fpmpassword", "8081", "8082"]

