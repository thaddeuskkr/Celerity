FROM node:lts-alpine AS base
WORKDIR /celerity
COPY package.json package-lock.json .

CMD [ "node", "." ]

FROM node:lts AS builder
WORKDIR /celerity
COPY . . 
RUN npm install --omit=dev && cp -R node_modules prod_node_modules
RUN npm install -g typescript && npm install && tsc

FROM base AS copier
COPY --from=builder /celerity/prod_node_modules /celerity/node_modules
COPY --from=builder /celerity/dist /celerity/dist