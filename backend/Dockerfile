FROM node:18-alpine

WORKDIR /opt/render/project/src/backend

# Copy package files
COPY package*.json ./

# Install dependencies including development dependencies for build
RUN npm ci

# Copy source files
COPY . .

# Create dist directory
RUN mkdir -p dist

# Create .env file with environment variables
RUN echo "NODE_ENV=production" > .env \
    && echo "PORT=3333" >> .env \
    && echo "MONGODB_URI=${MONGODB_URI}" >> .env \
    && echo "JWT_SECRET=${JWT_SECRET}" >> .env \
    && echo "SENDGRID_API_KEY=${SENDGRID_API_KEY}" >> .env \
    && echo "SENDGRID_FROM_EMAIL=${SENDGRID_FROM_EMAIL}" >> .env \
    && echo "CORS_ORIGIN=${CORS_ORIGIN}" >> .env \
    && echo "FRONTEND_URL=${FRONTEND_URL}" >> .env

# Build the application
RUN npm run build

# Verify the build output
RUN ls -la dist/
RUN cat dist/server.js | head -n 5

EXPOSE 3333

CMD ["npm", "start"]