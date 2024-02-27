FROM  node:latest
RUN apt-get update && apt-get install -y vim
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Copy the actual app's code
COPY . .

EXPOSE 3000
