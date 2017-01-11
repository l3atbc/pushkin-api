FROM node:latest
MAINTAINER Robert Wilkinson
LABEL Name=whichenglish-api Version=0.0.1 
RUN npm install -g nodemon
RUN apt-get update
RUN apt-get install -y netcat
COPY package.json /tmp/package.json
RUN cd /tmp && npm install --production
RUN mkdir -p /usr/src/app && mv /tmp/node_modules /usr/src
WORKDIR /usr/src/app
COPY . /usr/src/app
CMD npm start
