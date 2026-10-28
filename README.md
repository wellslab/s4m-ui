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
# Use node 22.23.4+ or 24.22.1+ (both tested; earlier versions are affected by CVE-2026-111497).
# Check `node -v` afterwards, and use nvm (https://github.com/nvm-sh/nvm) instead if conda doesn't have a fixed build.
$ conda install -c conda-forge "nodejs>=22.23.4"

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
$ yarn add @nuxtjs/google-analytics
$ yarn add vuedraggable
# $ yarn add vue-shepherd

# For running a server constantly: pm2 is already in package.json, so no global install is needed.
# Run it with npx (see https://nuxtjs.org/docs/2.x/deployment/deployment-pm2/)

# $ npm install plotly.js-dist  # Not sure how to make plotly work this way - currently just loading cdn into header

# uninstalling example
$ yarn remove sass-loader

# Check package version
$ yarn info bootstrap-vue version
$ yarn list --pattern "nuxt"

```

## Running the application

A `.env` file in the project root is required, containing the API server url, e.g.
```
BASE_API_URL=https://api-prod2.stemformatics.org
```
The hostname must contain `api-<name>.` as layouts/default.vue parses `<name>` out of it. Note that this value is baked into
the client bundle at build time, so `yarn build` must be re-run after changing it.

Older nuxt versions (< 2.16) failed on node 17+ with `error:0308010C:digital envelope routines::unsupported` and needed
`NODE_OPTIONS=--openssl-legacy-provider`. The current lockfile (nuxt 2.18) builds without it, so don't set it.

```bash
# serve with hot reload at localhost (see nuxt.config.js for port number)
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# or to run forever with pm2 (better for stable prod env). ecosystem.config.js runs "nuxt start" in cluster mode.
# pm2 comes from node_modules, so run it via npx
$ yarn build
$ npx pm2 start ecosystem.config.js
$ npx pm2 stop ecosystem.config.js  # to stop the server
$ npx pm2 save && npx pm2 startup   # restart on reboot; run the command startup prints

# to redeploy on prod after new commits. pm2 only serves the compiled .nuxt/ dir, so yarn build is required
$ git pull
$ yarn install --frozen-lockfile
$ yarn build
$ npx pm2 reload ecosystem.config.js  # restarts cluster workers one at a time, so no downtime

# after changing the node version, reload isn't enough: the pm2 daemon and its workers keep the node they started with
$ rm -rf node_modules && yarn install --frozen-lockfile && yarn build
$ npx pm2 kill && npx pm2 start ecosystem.config.js  # brief downtime
$ npx pm2 show Stemformatics                          # check the node version
$ npx pm2 save && npx pm2 startup

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

pm2 logs (`npx pm2 logs`)
https://pm2.keymetrics.io/docs/usage/log-management/

Excellent write up on how reactive elements in vue work
https://michaelnthiessen.com/debugging-guide-why-your-component-isnt-updating/

https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc
```
$ sudo vi /etc/sysctl.conf
$ sudo sysctl -p
```
