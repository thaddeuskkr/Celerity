FROM node:slim AS base
FROM node:latest AS build

LABEL org.opencontainers.image.description="Docker image for Celerity, a Discord music bot that focuses on performance without sacrificing functionality." \
      org.opencontainers.image.source=https://github.com/thaddeuskkr/Celerity \
      org.opencontainers.image.licenses=GPL-3.0-or-later

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY . /celerity
WORKDIR /celerity

FROM build AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM build AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base
COPY --from=prod-deps /celerity/node_modules /celerity/node_modules
COPY --from=builder /celerity/dist /celerity/dist
CMD [ "pnpm", "start" ]

################# OLD DOCKERFILE #################

#FROM node:latest

#LABEL org.opencontainers.image.description="Docker image for Celerity, a Discord music bot that focuses on performance without sacrificing functionality." \
#      org.opencontainers.image.source=https://github.com/thaddeuskkr/Celerity \
#      org.opencontainers.image.licenses=GPL-3.0-or-later

#WORKDIR /celerity
#COPY . .

#RUN npm install -g typescript
#RUN npm install
#RUN tsc

#CMD ["node", "."]