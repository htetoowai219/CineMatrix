FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5174

# Pass --host flag so Vite listens to network requests inside Docker
CMD ["npm", "run", "dev", "--", "--host"]