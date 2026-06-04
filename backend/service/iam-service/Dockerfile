FROM node:20-alpine

RUN apk add --no-cache bash
RUN npm i -g typescript ts-node

COPY package*.json /tmp/app/
RUN cd /tmp/app && npm install

COPY . /usr/src/app
RUN cp -a /tmp/app/node_modules /usr/src/app
COPY ./wait-for-it.sh /opt/wait-for-it.sh
RUN chmod +x /opt/wait-for-it.sh
COPY ./startup.sh /opt/startup.sh
RUN chmod +x /opt/startup.sh
RUN sed -i 's/\r//g' /opt/wait-for-it.sh
RUN sed -i 's/\r//g' /opt/startup.sh

WORKDIR /usr/src/app
RUN npm run build

EXPOSE 3001

CMD ["/opt/startup.sh"]
