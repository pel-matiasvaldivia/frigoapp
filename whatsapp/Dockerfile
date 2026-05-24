FROM node:18-slim

WORKDIR /app

# Install git and ffmpeg (required for audio processing)
RUN apt-get update && apt-get install -y git ffmpeg && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm install --production && \
    npm cache clean --force

COPY . .

# Session persistence setup
RUN mkdir -p auth_info_baileys

# Run as root to avoid volume permission issues with persistent sessions
# USER node

CMD ["node", "index.js"]
