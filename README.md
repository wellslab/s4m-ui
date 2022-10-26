# Stemformatics UI Server

This is the code behind the [Stemformatics](http://stemformatics.org) web application, which communicates with the API server to render the fetched data to pages and plots for data access and visualisation.

## Building the environment

```bash
# If installing in a conda env
$ conda create --prefix /mnt/miniconda3/envs/s4m-ui  # create new env to specific loation
$ conda activate s4m-ui

# Installing yarn also installs nodejs. conda-forge has much later version of yarn.
# Switched to yarn from npm for node package installation after repeated issues when updating packages with npm.
# If there are issues with the latest version of node, it may be worthwhile downgrading it.
# Use conda search -f nodejs to see what versions are availabe first and choose one.
$ conda install -c conda-forge yarn  
$ conda install nodejs=14.8.0   # otherwise had issues
# For node version 17, may get error:0308010C:digital envelope routines::unsupported when trying to run "yarn dev"
# The solution here is to add this in the environment vars (https://github.com/webpack/webpack/issues/14532) 
$ export NODE_OPTIONS=--openssl-legacy-provider

# Run updates if necessary
$ conda update --all

# install dependencies or just run "yarn install" if package.json has all these specified already
$ yarn add nuxt
$ yarn add bootstrap-vue
$ yarn add sass@1.32.*  # see https://github.com/twbs/bootstrap/issues/34051
$ yarn add sass-loader@^10.1.1
$ yarn add @nuxtjs/axios
$ yarn add @nuxtjs/auth
$ yarn add @nuxtjs/dotenv
$ yarn add --dev @nuxtjs/google-analytics
$ yarn add vuedraggable
$ yarn add vue-shepherd

# For running a server constantly
$ yarn global add pm2  # see https://nuxtjs.org/docs/2.x/deployment/deployment-pm2/

# $ npm install plotly.js-dist  # Not sure how to make plotly work this way - currently just loading cdn into header

# uninstalling example
$ yarn remove sass-loader

```

## Running the application

```bash
# serve with hot reload at localhost (see nuxt.config.js for port number)
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# or to run forever (better for stable prod env)
$ yarn build
$ pm2 start
$ pm2 stop ecosystem.config.js

# generate static project - doesn't seem to work for this project (see scripts section under package.json - running npm run generate is equivalent to nuxt generate for example)
$ yarn generate
$ yarn start
```

## Notes
Open source svg icons:
https://remixicon.com/

Google analytics
https://stackoverflow.com/questions/64612031/setup-google-analytics-4-in-nuxt-js
https://matteo-gabriele.gitbook.io/vue-gtag/

Vue timeline
https://github.com/x10sv/bs-vue-timeline
https://codesandbox.io/s/github/AngelinCalu/bs-vue-timeline-demo?file=/src/components/Experience.vue

pm2 logs
https://pm2.keymetrics.io/docs/usage/log-management/

Excellent write up on how reactive elements in vue work
https://michaelnthiessen.com/debugging-guide-why-your-component-isnt-updating/

https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc
```
$ sudo vi /etc/sysctl.conf
$ sudo sysctl -p
```
