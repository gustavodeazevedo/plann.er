FROM node:18-alpine

WORKDIR /opt/render/project/src/backend

# Copy package files
COPY package*.json ./

# Install dependencies including production dependencies only
RUN npm ci --only=production

# Copy source files
COPY . .

# Create dist directory
RUN mkdir -p dist

# Create .env file with environment variables
RUN echo "NODE_ENV=production" > .env \
    && echo "PORT=3333" >> .env \
    && echo "MONGODB_URI=${MONGODB_URI}" >> .env \
    && echo "JWT_SECRET=${JWT_SECRET}" >> .env \
    && echo "CORS_ORIGIN=${CORS_ORIGIN}" >> .env

# Build the application
RUN npm run build

EXPOSE 3333

CMD ["npm", "start"]