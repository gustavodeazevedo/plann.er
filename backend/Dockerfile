FROM node:18-alpine

WORKDIR /opt/render/project/src/backend

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Create .env file with default values if not provided
RUN echo "NODE_ENV=production" > .env \
    && echo "PORT=3333" >> .env \
    && echo "MONGODB_URI=${MONGODB_URI}" >> .env \
    && echo "JWT_SECRET=${JWT_SECRET}" >> .env \
    && echo "CORS_ORIGIN=${CORS_ORIGIN}" >> .env

# Build the application
RUN npm run build

# Move .env to dist folder
RUN cp .env dist/.env

EXPOSE 3333

CMD ["npm", "start"]