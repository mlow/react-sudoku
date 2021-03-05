FROM node:14-alpine as dev
WORKDIR /app
COPY *.json ./
RUN npm ci
COPY src ./src
COPY public ./public

FROM dev as build
ARG REACT_APP_SUDOKU_API_URL=/api

RUN npm run build

FROM nginx:1.19-alpine AS prod
COPY --from=build /app/build /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
