FROM node:latest

LABEL org.opencontainers.image.description="Docker image for Celerity, a Discord music bot that focuses on performance without sacrificing functionality."
LABEL org.opencontainers.image.source=https://github.com/thaddeuskkr/Celerity
LABEL org.opencontainers.image.licenses=GPL-3.0-or-later

WORKDIR /celerity
COPY . .

RUN npm install -g typescript
RUN npm install
RUN tsc

CMD ["node", "."]