FROM node:10.15.3-alpine as build-node

WORKDIR /app

ADD ./package.json /app/package.json

COPY ./websocket-relay.js /app/websocket-relay.js

RUN cd /app && npm i

EXPOSE 8081 8082

CMD [ "node", "/app/websocket-relay", "fpmpassword", "8081", "8082"]

