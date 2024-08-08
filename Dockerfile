FROM node:18-alpine
WORKDIR /app
COPY yarn.lock package.json ./
RUN yarn install --production
COPY . .
EXPOSE 3030
CMD ["npm", "run", "dev"]
