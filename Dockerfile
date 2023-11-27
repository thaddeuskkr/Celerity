FROM node:slim AS base

LABEL org.opencontainers.image.description="Docker image for Celerity, a Discord music bot that focuses on performance without sacrificing functionality." \
      org.opencontainers.image.source=https://github.com/thaddeuskkr/Celerity \
      org.opencontainers.image.licenses=GPL-3.0-or-later

COPY . /celerity
WORKDIR /celerity

CMD [ "node", "." ]

FROM base AS prod-deps
RUN npm install --omit=dev

FROM base AS builder
RUN npm install -g typescript
RUN npm install
RUN tsc

FROM base
COPY --from=prod-deps /celerity/node_modules /celerity/node_modules
COPY --from=builder /celerity/dist /celerity/dist