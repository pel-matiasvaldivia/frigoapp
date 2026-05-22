FROM node:18-alpine

# Install chromium and common fonts
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      nodejs \
      npm

WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install --production && \
    npm cache clean --force

COPY . .

# Session persistence setup
RUN mkdir -p session && chown -R node:node /app

# Puppeteer configuration for Alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Reverted to root to avoid permission denied on volume mounts (EACCES)
# USER node

CMD ["node", "index.js"]
