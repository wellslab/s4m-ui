# Stemformatics UI Server

This is the code behind the [Stemformatics](http://stemformatics.org) web application, which communicates with the API server to render the fetched data to pages and plots for data access and visualisation.

## Building the environment

```bash
# If installing in a conda env
$ conda create --prefix /mnt/miniconda3/envs/s4m-ui  # create new env to specific loation
$ conda activate s4m-ui
$ conda install nodejs
$ conda install yarn  # used to use npm but moved to yarn after repeated issues when updating packages

# Run updates if necessary
$ conda update --all

# install dependencies
$ yarn add nuxt
$ yarn add bootstrap-vue
$ yarn add sass@1.32.*  # see https://github.com/twbs/bootstrap/issues/34051
$ yarn add sass-loader@^10.1.1
$ yarn add @nuxtjs/axios
$ yarn add @nuxtjs/auth
$ yarn add @nuxtjs/dotenv
$ yarn add vue-gtag
$ sudo yarn global add pm2 --prefix /usr/local  # see https://nuxtjs.org/docs/2.x/deployment/deployment-pm2/

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
