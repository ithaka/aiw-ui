# Builds a Docker to deliver dist/
FROM node:10

# Add environment variables
ENV PORT=80
ENV SAGOKU=true
# Build argument with default value "test"
ARG SAGOKU_ENV="test"

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
# Set node environment variables
RUN set SAGOKU_ENV=${SAGOKU_ENV}
# Install heavier/unreliable dependencies independently to take advantage of cache
# RUN npm install appdynamics
# Add to image
COPY ng-add-pug-loader.js ./
# COPY assets ./
# Install remaining dependencies
# RUN npm install
# Install dep, build app and remove dependencies
# PASS APPD ENVIRONMENT IN TO BUILD SSR COMMAND!!! SOMEHOW???
RUN npm install && npm run build:ssr && npm run postinstall && npm link @angular/cli && rm -rf node_module
# # Compiled on first build, and avoid "missing command" issue in @angular cache
# RUN npm run postinstall
# RUN npm link @angular/cli
# # Build app
# RUN npm run build:ssr
# Bundle app source
COPY ./dist . 

EXPOSE 80

CMD [ "npm", "run", "serve:ssr" ]
