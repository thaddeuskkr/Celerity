FROM node:latest AS base

LABEL org.opencontainers.image.description="Docker image for Celerity, a Discord music bot that focuses on performance without sacrificing functionality." \
      org.opencontainers.image.source=https://github.com/thaddeuskkr/Celerity \
      org.opencontainers.image.licenses=GPL-3.0-or-later

COPY . /celerity
WORKDIR /celerity

FROM base AS prod-deps
RUN npm install --omit=dev

FROM base AS build
RUN npm install
RUN npm run build

FROM base
COPY --from=prod-deps /celerity/node_modules /celerity/node_modules
COPY --from=build /celerity/dist /celerity/dist

CMD [ "node", "." ]