# Stemformatics UI Server

This is the code behind the [Stemformatics](http://stemformatics.org) web application, which communicates with the API server to render the fetched data to pages and plots for data access and visualisation.

## Building the environment

```bash
# If installing in a conda env
$ conda create --prefix /mnt/miniconda3/envs/s4m-ui  # create new env to specific loation
$ conda activate s4m-ui
$ conda install nodejs

# Run updates if necessary
$ conda update --all
$ npm install npm   # updating npm

# install dependencies
$ npm install nuxt
$ npm install bootstrap-vue
$ npm add @nuxtjs/axios
$ npm add @nuxtjs/auth
$ npm add vue-gtag
$ npm install pm2  # see https://nuxtjs.org/docs/2.x/deployment/deployment-pm2/
$ npm install @nuxtjs/dotenv

# $ npm install plotly.js-dist  # Not sure how to make plotly work this way - currently just loading cdn into header

# uninstalling example
$ npm uninstall argon-dashboard

# audit for finding vulnerabilities
$ npm audit

# After a major update of node, there can be incompatibilties between the various dependencies.
# This happened after nodejs upgrade. Eventually this helped: https://stackoverflow.com/questions/66082397/typeerror-this-getoptions-is-not-a-function
$ npm uninstall sass-loader
$ npm install sass-loader@^10.1.1
# (note that package.json automatically updates when you install a package)
```

## Running the application

```bash
# serve with hot reload at localhost (see nuxt.config.js for port number)
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# or to run forever (better for stable prod env)
$ npm run build
$ pm2 start
$ pm2 stop ecosystem.config.js

# generate static project - doesn't seem to work for this project (see scripts section under package.json - running npm run generate is equivalent to nuxt generate for example)
$ npm run generate
$ npm start
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
