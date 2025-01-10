FROM node:alpine
WORKDIR /usr/src/app
COPY . .
RUN npm install -g http-server
CMD ["http-server", "-p", "23631"]