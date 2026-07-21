FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Build the Expo web bundle
COPY . .
ENV EXPO_PUBLIC_API_URL=https://windecker-crm.up.railway.app
RUN npx expo export --platform web

# Add PWA/Apple home-screen icons + manifest (Expo export only emits a favicon)
RUN node scripts/inject-pwa.mjs

# Serve the static bundle
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "dist", "-s", "-l", "3000"]
