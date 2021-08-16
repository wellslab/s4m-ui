# Page list

## Genes
- Gene search (table)
- Gene expression profile
- Gene vs gene plot?
- Expression across samples/datasets (similar to yugene)? Atlas page does this in its own domain but something outside the atlas could be good.


# Build Setup

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

#$ npm install sass-loader 
#$ npm install node-sass
# $ npm install plotly.js-dist  # Not sure how to make plotly work this way - currently just loading cdn into header

# uninstalling
$ npm uninstall argon-dashboard

# audit for finding vulnerabilities
$ npm audit

# After a major update of node, there can be incompatibilties between the various dependencies.
# This happened after nodejs upgrade. Eventually this helped: https://stackoverflow.com/questions/66082397/typeerror-this-getoptions-is-not-a-function
$ npm uninstall sass-loader
$ npm install sass-loader@^10.1.1
# (note that package.json automatically updates when you install a package)

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# or to run forever (better for stable prod env)
$ npm run build
$ pm2 start
$ pm2 stop ecosystem.config.js

# generate static project (see scripts section under package.json - running npm run generate is equivalent to nuxt generate for example)
$ npm run generate
$ npm start
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).

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

## Temporary clipboard

To get query parameters that was used to call the page:
```
atlasType: this.$route.query.type==null? "myeloid": this.$route.query.type,  // default type if none specified
```

To go to a particular url/route, use $router.push. Can pass query parameters using query. Can pass arrays there using JSON.stringify
```
let datasetIds = [...]  // some array
this.$router.push({path: "/datasets/search", query: {datasetId: JSON.stringify(datasetIds)}});
```

Used this function to just convert tsv files into {col: {rowId: val, ...}, ...} format
```
_dataConverter(tsvFile) {
    this.$axios.get(tsvFile).then(res => {
        let lines = res.data.split("\n");
        let table = {};
        let columns = lines[0].split("\t")
        columns.shift();   // ["Cell Type", "Sample Source", ...]

        for (let i=1; i<lines.length; i++) {
            let cols = lines[i].split("\t");
            for (let j=0; j<columns.length; j++) {
                if (!(columns[j] in table))
                    table[columns[j]] = {};
                table[columns[j]][cols[0]] = cols[j+1];
            }
        }
        console.log(JSON.stringify(table));
    })
},
```

This is one way to redirect one page to another. However note that if the redirect is to the same page with different parameters, it doesn't reload the page (ie. mounted() does not run again)
```
export default {
    middleware: [
         function({ redirect }) {
             redirect('/atlas?type=blood');
         },
    ],
};
```

Local resource in static/ can be accessed this way using axios:
```
this.$axios.get("/7283.pca.json").then(res => {
    console.log(res);
});
```

https://code.visualstudio.com/docs/setup/linux#_visual-studio-code-is-unable-to-watch-for-file-changes-in-this-large-workspace-error-enospc
```
$ sudo vi /etc/sysctl.conf
$ sudo sysctl -p
```

How to fetch html from axios get request and turn it into a file download
```
this.$axios.get('/api/governance/' + datasetId + '/qchtml?type=multiqc', {responseType:'blob'}).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'file.html');
    document.body.appendChild(link);
    link.click();
})
```

In page filtering
```
    // Set datasetFilters
    this.datasetFilters.forEach(filterItem => {
        // values holds unique values for this filter, counts holds how many items in datasets have matching values
        filterItem.values = Array.from(new Set(this.datasets.map(item => item[filterItem.key])));
        filterItem.counts = filterItem.values.map(value => this.datasets.filter(item => item[filterItem.key]==value).length);
    });

    // Set sampleFilters - trickier since multiple samples exist for each dataset
    this.sampleFilters.forEach(filterItem => {
        // unique values are across all datasets
        let values = Array.from(new Set(this.datasets.map(item => item[filterItem.key]).join(',').split(',')));
        let counts = values.map(value => this.datasets.filter(item => item[filterItem.key].indexOf(value)!=-1).length);
        // sort by highest counts to lowest
        let combined = values.map((item,i) => [item,counts[i]]);
        combined.sort((a,b) => a[1] > b[1]? -1 : 1);
        filterItem.values = combined.map(item => item[0]);
        filterItem.counts = combined.map(item => item[1]);
    });
```

Using URLSearchParams, which can handle duplicate keys:
```
let params = new URLSearchParams();
params.append('title', 'this is title');
params.append('value', 'val1');
params.append('value', 'val2');
```

Inter-component communication via global events:
https://stackoverflow.com/questions/38616167/communication-between-sibling-components-in-vue-js-2-0