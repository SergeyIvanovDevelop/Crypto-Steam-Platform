FROM ubuntu:20.04
RUN apt-get update && apt-get -y install curl dirmngr apt-transport-https lsb-release ca-certificates
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get -y install nodejs && apt-get -y install gcc g++ make git
RUN npm i --global jest-cli
RUN mkdir /home/backend
RUN mkdir /home/backend/scripts
RUN mkdir /home/backend/tests
COPY ./scripts/* /home/backend/scripts/
COPY ./tests/* /home/backend/tests/
RUN cd /home/backend/script && npm init -y && npm install ws && npm install --save-optional utf-8-validate && npm install express && npm install mongodb
RUN cd /home/backend/tests && npm init -y && jest
CMD cd /home/backend/scripts && node server.js
