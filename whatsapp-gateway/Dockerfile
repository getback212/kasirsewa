FROM node:20-slim

# git is required: one of Baileys' transitive deps (libsignal-node) is fetched
# from a git URL. It uses an ssh:// URL, so rewrite it to https (public repo).
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
  && git config --global url."https://github.com/".insteadOf ssh://git@github.com/ \
  && rm -rf /var/lib/apt/lists/*

# Baileys talks directly to the WhatsApp Web protocol over WebSocket,
# so no Chromium/Puppeteer is needed (small + fast image).
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
