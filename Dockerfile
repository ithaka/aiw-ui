# Builds a Docker to deliver dist/
FROM node:10

# Add environment variables
# ARG NODE_ENV=production
# ENV NODE_ENV $NODE_ENV
ARG PORT=80
ENV PORT $PORT
ENV SAGOKU=true

# Expose port
EXPOSE $PORT

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY ng-add-pug-loader.js ./
RUN npm install -g -s --no-progress yarn && \
    yarn install

# Bundle app source
COPY . .

# Build app
RUN yarn run build:ssr && \
    yarn cache clean

# the official node image provides an unprivileged user as a security best practice
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node

CMD [ "npm", "run", "serve:ssr" ]
