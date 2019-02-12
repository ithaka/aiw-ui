# Builds a Docker to deliver dist/
FROM node:10

# Add environment variables
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV
ENV PORT=80
ENV SAGOKU=true


# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
RUN npm install --no-optional && npm cache clean --force

# Bundle app source
COPY . .

# Ensure pug is compiled on first build, and avoid "missing command" issue in @angular cache
RUN npm run postinstall
RUN npm link @angular/cli

# the official node image provides an unprivileged user as a security best practice
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node

# Build app
RUN npm run build:ssr

EXPOSE 80

CMD [ "npm", "run", "serve:ssr" ]
