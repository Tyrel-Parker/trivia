FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then node src/index.js; else npx nodemon src/index.js; fi"]
