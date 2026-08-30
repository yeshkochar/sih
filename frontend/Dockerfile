FROM node:18-alpine

WORKDIR /app

# Copy lock and package files
COPY package.json ./

# Install npm dependencies
RUN npm install

# Copy application source
COPY . .

EXPOSE 3000

# Start Vite server on host interface
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
