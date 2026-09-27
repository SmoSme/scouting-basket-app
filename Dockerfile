# Build & Execution Base Image
FROM node:20-slim

# Prevent npm update notifications
ENV NO_UPDATE_NOTIFIER=true

WORKDIR /app

# Copy dependency specifications
COPY package.json ./

# Install npm dependencies
RUN npm install

# Copy application source code
COPY . .

# Build Vite React production bundle into dist/
RUN npm run build

# Expose server port 8501
EXPOSE 8501

# Start Node.js Express server (serves API endpoints + Vite React static dist)
CMD ["npm", "start"]
