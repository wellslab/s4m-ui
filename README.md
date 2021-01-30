# Page list

## Home
- Landing page to show some data at the high level, to appeal to biologists and to show the kind of data we have

## About
- Description of site
- Team
- How to cite
- Description of data processing
- Privacy Notice, Disclaimer
- Funding + Collaborators
- Contact

## Datasets
- Explore samples and datasets with interactive visualisation
- Table with filter options (similar to shopping cart)
- View each dataset in detail, with interactive PCA available
- How to use API to access data
- Details on sample annotation, ontologies used

## Atlas
- Toggle different atlases types, similar to current page
- Description of methods behind the atlas
- Projection vignette

## Genes
- Gene search (table)
- Gene expression profile
- Gene vs gene plot?
- Expression across samples/datasets (similar to yugene)? Atlas page does this in its own domain but something outside the atlas could be good.


# Build Setup

```bash
# If installing in a conda env
$ conda create --prefix /mnt/data/miniconda3/envs/s4m  # create new env to specific loation
$ conda activate s4m
$ conda install nodejs

# install dependencies
$ npm install nuxt
$ npm install bootstrap-vue
#$ npm install sass-loader 
#$ npm install node-sass
$ npm add @nuxtjs/axios 
# $ npm install plotly.js-dist  # Not sure how to make plotly work this way - currently just loading cdn into header

$ npm uninstall argon-dashboard
$ npm audit

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project (see scripts section under package.json - running npm run generate is equivalent to nuxt generate for example)
$ npm run generate
$ npm start
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

Open source svg icons:
https://remixicon.com/

