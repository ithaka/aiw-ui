# Artstor Image Workspace
The latest version of the Artstor Image Workspace interface, aiming to make browsing the Artstor collections a modern and refreshing experience.

If you are a new developer to the project, please read through the entire README. 
You won't regret it.

## Ithaka Open Source Initiative
This repository is open sourced by Ithaka as part of our initiative to increase transparency and contribute to the community. This particular repository is a working repository not intended as software available for consumption.

[Learn more](http://artstor.org/open-source) about our open source initiative

**Copyright 2018 Ithaka Harbors, Inc.**

# Table of Contents
* [Project Stack](#project-stack)
* [Quick Start](#quick-start)
* [File Structure](#file-structure)
* [Getting Started](#getting-started)
    * [Dependencies](#dependencies)
    * [Installing](#installing)
    * [Running the app](#running-the-app)
* [Configuration](#configuration)
* [WLVs Local Setup](#white-label-verticals)
* [Styles](#styles)
* [TypeScript](#typescript)
* [Accessibility](#accessibility)
* [@Types](#types)
* [Frequently asked questions](#frequently-asked-questions)

*Project References:*
[Avatar Jira Project](https://jira.jstor.org/projects/AIR/summary)

---

## Project Stack

(Originally based on the [Angular 2 webpack starter](https://github.com/AngularClass/angular2-webpack-starter))

**Core Application**
* [Angular 2](https://angular.io) ([Router](https://angular.io/docs/js/latest/api/router/), [Forms](https://angular.io/docs/js/latest/api/forms/), [Http](https://angular.io/docs/js/latest/api/http/), [Services](https://gist.github.com/gdi2290/634101fec1671ee12b3e#_follow_@AngularClass_on_twitter), [Tests](https://angular.io/docs/js/latest/api/test/)
* [TypeScript](http://www.typescriptlang.org/) 
* [@types](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=3&cad=rja&uact=8&ved=0ahUKEwjgjdrR7u_NAhUQ7GMKHXgpC4EQFggnMAI&url=https%3A%2F%2Fwww.npmjs.com%2F~types&usg=AFQjCNG2PFhwEo88JKo12mrw_4d0w1oNiA&sig2=N69zbO0yN8ET7v4KVCUOKA) (type manager)
* [Bootstrap 4](http://v4-alpha.getbootstrap.com/) and  [ngBootstrap](https://ng-bootstrap.github.io/#/home)
* [Sass](http://sass-lang.com/guide) (plus [Bourbon](http://bourbon.io/docs/))

#### Dev Tools and Testing
* [Webpack 2](http://webpack.github.io/)
* [Karma](https://karma-runner.github.io/) 
* [Protractor](https://angular.github.io/protractor/) (for end-to-end tests)
* [Jasmine](https://github.com/jasmine/jasmine) (unit tests)
* [TsLint](http://palantir.github.io/tslint/) 
* [Codelyzer](https://github.com/mgechev/codelyzer)
* [Nucleus](https://holidaypirates.github.io/nucleus/index.html) (style guide generator)

---

## Quick Start
**Requires latest version of Node and Yarn**

On Mac, we recommended installing Node, NPM, and Yarn with [Homebrew](http://brew.sh/)

Instructions for Mac:
```bash
# clone the project
git clone https://github.com/ithaka/ang-ui.git

# change directory to our repo
cd ang-ui

# install node, npm, and yarn with Homebrew
brew install node yarn

# Install global build packages
yarn global add webpack webpack-dev-server karma karma-cli protractor typescript rimraf phantomjs-prebuilt

# install the repo with npm
yarn install

# start the server
yarn start

```
Access at [http://0.0.0.0:3000](http://0.0.0.0:3000) or [http://localhost:3000](http://localhost:3000) in your browser. 

---

## File Structure
Component approach! The goal is flat and modular. This is the new standard for developing Angular apps and a great way to ensure maintainable code by encapsulation of our behavior logic. A component is basically a self contained app usually in a single file or a folder with each concern as a file: style, template, specs, e2e, and component class. Here's how it looks:
```
angular2-webpack-starter/
 ├──config/                    * our configuration
 |   ├──helpers.js             * helper functions for our configuration files
 |   ├──spec-bundle.js         * ignore this magic that sets up our angular 2 testing environment
 |   ├──karma.conf.js          * karma config for our unit tests
 |   ├──protractor.conf.js     * protractor config for our end-to-end tests
 │   ├──webpack.dev.js         * our development webpack config
 │   ├──webpack.prod.js        * our production webpack config
 │   └──webpack.test.js        * our testing webpack config
 │
 ├──src/                       * our application source files
 |   ├──main.browser.ts        * our entry file for our browser environment
 │   │
 |   ├──index.html             * Index.html: where we generate our index page
 │   │
 |   ├──polyfills.ts           * our polyfills file
 │   │
 |   ├──vendor.ts              * our vendor file
 │   │
 │   ├──app/                   * WebApp: folder (holds components)
 │   │   ├──app.spec.ts        * a simple test of components in app.ts
 │   │   ├──app.e2e.ts         * a simple end-to-end test for /
 │   │   └──app.ts             * App.ts: a simple version of our App component
 |   |   └──white-label-config * Options for WLVs, white label sites
 │   │
 │   ├──sass/                  * Sass style folder
 │   │   ├──core/              * Core sass utilities, variables, and reset
 │   │   ├──libraries/         * Sass files from other resources
 │   │   ├──modules/           * Elements for project-wide use and inheritance
 │   │   └──app.scss           * App.ts: a simple version of our App component
 │   │
 │   └──assets/                * static assets are served here
 │       ├──icon/              * our list of icons from www.favicon-generator.org
 │       ├──service-worker.js  * ignore this. Web App service worker that's not complete yet
 │       ├──robots.txt         * for search engines to crawl your website
 │       └──humans.txt          * for humans to know who the developers are
 │
 │
 ├──build.sh                   * build script for deployment to Sagoku
 ├──tslint.json                * typescript lint config
 ├──typedoc.json               * typescript documentation generator
 ├──tsconfig.json              * config that webpack uses for typescript
 ├──package.json               * what npm uses to manage it's dependencies
 └──webpack.config.js          * webpack main configuration file

```

---

# Getting Started
## Dependencies and Installing
See [Quick Start](#quick-start)

## Running the app
After you have installed all dependencies you can now run the app. Run `npm run server` to start a local server using `webpack-dev-server` which will watch, build (in-memory), and reload for you. The port will be displayed to you as `http://0.0.0.0:3000` (or if you prefer IPv6, if you're using `express` server, then it's `http://[::1]:3000/`).

### server
```bash
# development
npm run server
# production
npm run build:prod
npm run server:prod
```

### build files
```bash
# development
npm run build:dev
# production
npm run build:prod
```

### watch and build files
```bash
npm run watch
```

### run tests
```bash
npm run test
```

### watch and run our tests
```bash
npm run watch:test
```

### run end-to-end tests
```bash
# make sure you have your server running in another terminal
npm run e2e
```

### run webdriver (for end-to-end)
```bash
npm run webdriver:update
npm run webdriver:start
```

### run Protractor's elementExplorer (for end-to-end)
```bash
npm run webdriver:start
# in another terminal
npm run e2e:live
```

### build Docker
```bash
npm run build:docker
```

---

# Configuration
NPM and Webpack combine to provide all of our task running needs.

Configuration files live in `config/` for webpack, karma, and protractor.

---

# White Label Verticals
## Developing WLVs locally.

WLVs, such as SAHARA, use the hostname to determine different configuration options.

For local development on Mac, you'll need to edit your /etc/hosts file:
```bash
sudo nano /etc/hosts
```

And add:
```bash
127.0.0.1 local.artstor.org
127.0.0.1 local.stage.artstor.org
127.0.0.1 local.sahara.artstor.org
127.0.0.1 local.sahara.test.artstor.org
```

Then clear your dns cache with: 
```bash
sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder
```

Now you're all setup! Just run:
```
yarn run sahara
```

You should now be able to open the site locally as:
[local.sahara.test.artstor.org:3000](http://local.sahara.test.artstor.org:3000)

---

# Local development on Https

Go to ssl directory under project root and execute the following steps.

Generate private key:
```bash
openssl genrsa -out private.key 4096
```

Generate a Certificate Signing Request:
```bash
openssl req -new -sha256 -out private.csr -key private.key -config ssl.conf
```

Generate the certificate:
```bash
openssl x509 -req -days 3650 -in private.csr -signkey private.key -out private.crt -extensions req_ext -extfile ssl.conf
```

Add the certificate to keychain and always trust it:
```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain private.crt
```

Create a pem file:
```bash
openssl x509 -in private.crt -out private.pem -outform PEM
```

Finally, from the project root run  `yarn dev:https`  to start local development on https

---

# Styles
All of our styles are written in Sass, and should be placed in one of three places based on our file structure:

``` 
 ├──src/                       
 │   ├──sass/                  * Sass folder
 │   │   ├──core/              * Core sass utilities, variables, and reset
 │   │   │   ├──_helpers.scss     * Core sass utilities, variables, and reset
 │   │   │   ├──_layout.scss         * Organizational classes for page layout
 │   │   │   ├──_reset.scss          * Base style resets
 │   │   │   ├──_typography.scss     * Font imports and all type styles used
 │   │   │   └──_variables.scss      * Project-wide values such as colors and sizes
 │   │   ├──libraries/         * Sass files from other resources
 │   │   │   └──bourbon/             * Library of mixins
 │   │   ├──modules/           * Elements for project-wide use and inheritance
 │   │   │   ├──_base.scss           * Base html element classes
 │   │   │   ├──_buttons.scss        * Button element classes
 │   │   │   └──_forms.scss          * Input element classes
 │   │   └──app.scss           * Imports Sass partials, and has style Inbox
 │   ├──app/                  * App root folder that holds components
 │   │   ├──component/         * Core sass utilities, variables, and reset
 │   │   │   └──component.scss       * Styles scoped/unique to individual component
 ```

Those three flavors of styles are:
* Pending/New styles  
  * Go in "Inbox" section of `/sass/app.scss`
* Component specific styles
  * Go in appropriate `component.scss` file inside component folder
* Generalized styles
  * Go in an appropriately named Sass file inside `/sass/modules`

When writing styles:
* **Reference the Style Guide** Check existing styles in the style guide, which can be generated by running `npm run styleguide` and opened from the `/styleguide` folder.
* **Use Bootstrap Elements** We don't need to write everything from scratch! When possible start off with a Bootstrap component or style ([Bootstrap 4](http://v4-alpha.getbootstrap.com/) and [ngBootstrap](https://ng-bootstrap.github.io/#/home)) and simply tweak the styles to your liking.
* **Use [BEM Naming](http://getbem.com/naming/)**  BEM makes our style names logical, consistent, and easy to interpret by other developers. The ✨magic  formula✨  is  `
.block__element--modifier` which might look like `.button__icon--large`. Don't fear the double dashes and double underscores!
* **Check out Bourbon** And find other ways to make writing Sass easier! [Bourbon](http://bourbon.io/docs/) is a super useful library of mixins that makes things such as *font includes* and *animations* much easier and cleaner.
* **Add in-line documentation for the style guide** If it is a new style, or new modifier to a style, please [add documentation](https://holidaypirates.github.io/nucleus/annotation-reference.html) so the style will be added to the style guide.

---

# TypeScript

## Quality Rules

#### 1. Variable and function should be scoped as private or public

```TypeScript
export class ExampleComponent {
  // Ugly
  term;
  
  // Scoped!
  private term;
  
  // Typed!
  private term: string;
  
  ...
}

```

#### 2. Variable should be typed and declared at the top of its relevant scope

```TypeScript
specialAlgorithm(): number {
  // Declare here
  let a: number = 2;
  
  a = a * 2;
  
  // Don't declare here!
  let b: number = 5;
  
  return a + b;
}

```


#### 3. Function should have a return type! And ‘void’ if it returns nothing!

```TypeScript
// Vague!
specialAlgorithm() {
  let a: number = 10;
  return a;
}

// Great!
specialAlgorithm(): number {
  let a: number = 10;
  return a;
}

```

#### 4. Function should, at minimum, have a description of its purpose in an inline block before it.


```TypeScript
/**
 * Special Algorithm's purpose is to give us an even number
 */
specialAlgorithm(): number {
  ...
}

```

#### 5. Function’s parameters should be typed

```TypeScript
/**
 * Special Algorithm's purpose is to give us an even number
 */
specialAlgorithm(input: number): number {
  return 2 * input;
}

```

To take full advantage of TypeScript with autocomplete you would have to install it globally and use an editor with the correct TypeScript plugins.

## Use latest TypeScript compiler
TypeScript 1.7.x includes everything you need. Make sure to upgrade, even if you installed TypeScript previously.

```
npm install --global typescript
```
TypeScript-aware editors:

* [Visual Studio Code](https://code.visualstudio.com/) *(Recommended)*
* [Webstorm 10](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)


---

# Accessibility

Improving accessibilty makes our site accessible to those who are disabled and to those who are temporarily unable to see well, hear well, or use both of their hands. These are some simple things we can do to make a big difference.


#### Add labels to buttons
```
<button class="close" aria-label="Close">
  <span aria-hidden="true">&times;</span>
</button>
```
* Note the `aria-hidden` attribute, telling screenreaders to not read the contained text


#### Add alt text to images and icons
```
<img src="/logo.png" alt="Artstor" />
<i class="icon icon-loading" alt="Loading"></i>
```


#### Enable tabbing flow
To assist in keyboard navigation, add `tabindex` attributes in an appropriate order.
For example, the login form might be tabbed first:
```
<label for="inputEmail">Email</label>
<input tabindex="1" type="text" class="form-control" id="inputEmail" placeholder="Password">

<label for="inputPassword">Password</label>
<input tabindex="1" type="password" class="form-control" id="inputPassword" placeholder="Password">
```
So each input element is given a `tabindex` of `1`, effectively grouping them together. The main navigation might be next in the tabbing sequence:
```
<nav>
  <a tabindex="2" class="nav-link" href="#">Link</a>
  <a tabindex="2" class="nav-link" href="#">Link</a>
  <a tabindex="2" class="nav-link" href="#">Link</a>
</nav>
```
Note that `tabindex='0'` is effectively the default value, and adding a `tabindex` of `0` will put that element after any elements with a `tabindex` greater than `0`. And lastly, assigning a negative `tabindex` will remove the element from the tabbing sequence entirely!


#### Focus and state styles
Elements should not rely solely on color to indicate they are focused or have changed state, leaving a color blind user clueless. Providing an additional indicator also makes interactions more obvious to other users. 

*Bonus* If you want to remove the outline of a `:focus` style, replace it with something equally clear to the user! `:focus` is how a user can see where they are when they use keyboard navigation.

#### Heading tags are for... Headings?
And not for styles! `H1`, `H2`, `H3`... are interpretted by screenreaders as indicating sections within a document. Now it's okay to style those tags, but in this project we use `.h1`, `.h2`, `.h3`... when we want the style but element is not a true heading or subheading.

#### Human centered design
We should always be considering visual clarity, hierarchy, and flow of information in this context. With a little bit of extra thought each time we implement a new feature or add content, the quality of our alt text, keyboard navigation, and ultimately the user experience, will improve 🎉 

---

# Types
> When you include a module that doesn't include Type Definitions inside of the module you can include external Type Definitions with @types

i.e, to have youtube api support, run this command in terminal: 
```shell
npm i @types/youtube @types/gapi @types/gapi.youtube
``` 
In some cases where your code editor doesn't support Typescript 2 yet or these types weren't listed in ```tsconfig.json```, add these to **"src/custom-typings.d.ts"** to make peace with the compile check: 
```es6
import '@types/gapi.youtube';
import '@types/gapi';
import '@types/youtube';
```

## Custom Type Definitions
When including 3rd party modules you also need to include the type definition for the module
if they don't provide one within the module. You can try to install it with @types

```
npm install @types/node
npm install @types/lodash
```

If you can't find the type definition in the registry we can make an ambient definition in
this file for now. For example

```typescript
declare module "my-module" {
  export function doesSomething(value: string): string;
}
```


If you're prototyping and you will fix the types later you can also declare it as type any

```typescript
declare var assert: any;
declare var _: any;
declare var $: any;
```

---

# Frequently asked questions
* Webpack says it can't find a module or loader?
  * We use the cutting-edge version of Webpack. The first thing to verify is that you are running the latest version of Node.
* Where do I write my tests?
  * You can write your tests next to your component files. See [`/src/app/home/home.spec.ts`](/src/app/home/home.spec.ts)
* How do I start the app when I get `EACCES` and `EADDRINUSE` errors?
  * The `EADDRINUSE` error means the port `3000` is currently being used and `EACCES` is lack of permission for webpack to build files to `./dist/`
* node-pre-gyp ERR in npm install (Windows)
 * install Python x86 version between 2.5 and 3.0 on windows see issue [#626](https://github.com/AngularClass/angular2-webpack-starter/issues/626)


