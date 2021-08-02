<template>
<!-- Note that plotly div isn't reactive, so v-if or v-show on the div which wraps ploty div doesn't show/hide it.
    -->
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <h3 class="text-center my-4">Gene set collections
        <small>
            <b-link v-b-tooltip.hover.right="'Background and more information'" v-b-toggle.sidebar class="mx-2">
                <b-icon-info-circle></b-icon-info-circle></b-link>
        </small>
    </h3>
    <b-form inline class="justify-content-center mt-3">
        <b-form-select v-model="selectedGeneset" :options="genesets" @change="bubblePlot" class="ml-2" size="sm"></b-form-select>
        <b-button size="sm" class="ml-1">show details</b-button>
        <b-spinner v-if="loading" label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;" class="ml-2"></b-spinner>
    </b-form>

    <b-row class="mt-2">
        <b-col v-if="currentPlot=='bubble'" class="px-0 ml-1">
            <b-card no-body>
                <b-card-header class="text-center">
                    Cell types with <b>high mean</b> expression (larger circle = more datasets)
                </b-card-header>
                <b-card-body>
                    <div id="bubblePlotDiv"></div>
                </b-card-body>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1" md="3">
            <b-card no-body>
                <b-card-header class="text-center">
                    <span v-if="selectedScore.sampleGroupItem==null">Click on a bubble to see details here</span>
                    <span v-else>
                        <b-link @click="currentPlot='bubble'"><b-icon-chevron-double-left></b-icon-chevron-double-left></b-link>
                        <span class="highlight">{{selectedScore.sampleGroupItem}}</span> ({{selectedScore.datasetIds.length}} datasets)
                    </span>
                </b-card-header>
                <div style="max-height:500px; overflow:auto">
                    <b-list-group flush>
                        <b-button squared v-for="(dataset,i) in datasets" :key="dataset.datasetId" :pressed="selectedDataset==dataset" 
                            class="list-group-item list-group-item-action d-flex justify-content-between" 
                            href="#" @click="showBoxplot(dataset)" style="font-size:smaller">
                            {{dataset.displayName}} ({{Math.round(selectedScore.diff[i]*100)/100}})
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
                <b-card-footer v-if="selectedScore.sampleGroupItem!=null" class="text-center">
                    click on dataset for details
                </b-card-footer>
            </b-card>
        </b-col>
        <b-col v-if="currentPlot=='boxplot'" class="px-0 ml-1">
            <b-card no-body>
                <b-card-header class="text-center">
                    Expression of <b-link :href="'https://www.gsea-msigdb.org/gsea/msigdb/cards/' + selectedGeneset + '.html'" target="_blank">
                    {{selectedGeneset}}</b-link> in <b-link :to="'/datasets/view?id=' + selectedDataset.datasetId" target="_blank">{{selectedDataset.displayName}}</b-link>
                </b-card-header>
                <b-card-body>
                    <div id="boxPlotDiv"></div>
                </b-card-body>
            </b-card>
        </b-col>
    </b-row>
    
    <b-sidebar id="sidebar" title="Help and more info" shadow>
        <div class="px-3 py-2">
            <p>This page is designed to highlight interesting expression patterns for sets of genes
                in datasets where these genes produce varied expression across different cell types.
                Simply select the geneset, which will show a list of datasets which have been scored
                and select a dataset to see a heatmap of that geneset in that dataset.
            </p>
            <p>The score for each dataset is shown and datasets are sorted on this score. 
                It is equal to the variance of the mean of the samples in cell types, after
                the mean of the gene set is first calculated.
            </p>
        </div>
    </b-sidebar>
</b-container>
</div>  
</template>

<script>
// Include BootstrapVueIcons - including this in nuxt.config.js or layouts/default.vue doesn't seem to work
import Vue from 'vue'
import { BootstrapVueIcons } from 'bootstrap-vue'
Vue.use(BootstrapVueIcons)

export default {
    head: {
        script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },
    
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Genes', to: '/genes' },
                { text: 'Gene set collections', active: true }
            ],
            loading: true,
            currentPlot: 'bubble',

            genesets: [],
            selectedGeneset: '',
            genes: {},  // {geneSymbol:[geneId,...], ...}
            
            scores: [],
            selectedScore: {},

            datasets: [],
            allDatasets: {},
            selectedDataset: {},
            totalDatasets: 400,
        }
    },

    methods: {
        bubblePlot() {
            this.loading = true;
            this.currentPlot = 'bubble';

            // Fetch dataset scores for selected geneset
            this.$axios.get("/api/genes/geneset-collection?name=" + this.selectedGeneset).then(res => {
                this.genes = res.data.geneIdsFromSymbol;
                let scores = res.data.scores; // [{datasetId:6623, var:1.3, diff:3.2, high:'fibroblast', low:'dendritic cell'},...]

                // First filter scores on diff>1 only
                scores = scores.filter(item => item.diff>1);

                // Reorganise scores to look like [{sampleGroupItem:'fibroblast', datasetIds:[6623,...], diff:[2.1,...], var:[1.3,...]}, ...]
                // where sampleGroupItem corresponds to values found under 'high' key.
                // So this groups all the entries where high='fibroblast'
                this.scores = [];

                let sampleGroupItems = Array.from(new Set(scores.map(item => item.high)));   // unique values only
                sampleGroupItems.forEach(sampleGroupItem => {
                    // Find all matching entries from scores
                    let subset = scores.filter(item => item.high==sampleGroupItem);
                    this.scores.push({'sampleGroupItem': sampleGroupItem, 'datasetIds':subset.map(item => item.datasetId),
                                      'diff':subset.map(item => item.diff), 'var':subset.map(item => item.var)});
                })

                // Sort by number of datasetIds (highest to lowest)
                this.scores.sort((a,b) => a.datasetIds.length < b.datasetIds.length? -1 : 1);

                // Construct variables for the plot
                let x=[],y=[],size=[];
                this.scores.forEach(item => {
                    y.push(item.sampleGroupItem);
                    x.push(item.diff.reduce((acc,v) => acc + v) / item.diff.length);    // arithmatic mean of item.diff
                    size.push(item.datasetIds.length);
                });

                let boxPlotDiv = document.getElementsByClassName('plot-container');
                if (boxPlotDiv[0]!=null)  {
                    console.log(boxPlotDiv[0]);
                    Plotly.purge(boxPlotDiv[0]);
                }

                let div = document.getElementById('bubblePlotDiv');
                let traces = [{x:x, y:y, mode:'markers', marker:{size:size, sizeref:2.0 * Math.max(...size) / (15**2)}}];
                let layout = {height:800, margin: {t:10, l:300, r:20, b:20},}
                Plotly.newPlot(div, traces, layout);

                // Set up hover event
                let self = this;    // plotly uses its own 'this' inside this call
                div.on('plotly_click', function(data){
                    self.showDatasets(data);
                });

                this.loading = false;

            });
        },

        showDatasets(data) {
            this.loading = true;
            this.selectedScore = this.scores[data.points[0].pointNumber];
            // Fetch info about datasets for this score
            this.$axios.get("/api/search/datasets?dataset_id=" + this.selectedScore.datasetIds.join(',')).then(res => {
                let datasetDisplayName = {};
                res.data.forEach(item => {
                    const name = item.name.split('_');
                    datasetDisplayName[item.dataset_id] = name[0] + " (" + name[1] + ")";
                });
                // Ready to populate datasets
                this.datasets = this.selectedScore.datasetIds.map(item => (
                    {datasetId:item, displayName:datasetDisplayName[item], diff:item.diff}
                ));

                // Sort by diff score
                this.datasets.sort((a,b) => a.diff < b.diff? -1 : 1);

                this.loading = false;
            });
        },

        showBoxplot(dataset) {
            this.loading = true;
            this.selectedDataset = dataset;
            this.currentPlot = 'boxplot';

            // Fetch expression for gene ids + selected dataset
            let geneIds = [];   // first get all gene ids
            Object.values(this.genes).forEach(item => {
                item.forEach(geneId => {
                    if (geneIds.indexOf(geneId)==-1)
                        geneIds.push(geneId);
                });
            });

            this.$axios.get("/api/datasets/" + this.selectedDataset.datasetId + "/expression?orient=list&key=cpm&log2=true&gene_id=" + geneIds.join(',')).then(res => {
                let exp = res.data; // looks like {'sampleId':[values,...], ...}
                this.$axios.get("/api/datasets/" + this.selectedDataset.datasetId + "/samples?orient=dict").then(res2 => {
                    let sampleGroupItems = {};
                    for (const [key,val] of Object.entries(res2.data["cell_type"])) { // {"6322_GSM1070375": "HPC", ...}
                        if (sampleGroupItems[val]==null)
                            sampleGroupItems[val] = [];
                        sampleGroupItems[val].push(key);
                    }
                    let traces=[];
                    for (const [key,sampleIds] of Object.entries(sampleGroupItems)) {
                        // sampleIds is an array of sample ids - for each sample id, calculate the mean across all genes in the geneset
                        // and add this value to y
                        let y = sampleIds.map(sampleId => exp[sampleId].reduce((acc,v) => acc + v) / exp[sampleId].length);
                        traces.push({type:'box', name:key, y:y, boxpoints:'all'});
                    }

                    let div = document.getElementById('boxPlotDiv');
                    let layout = {height:400};
                    Plotly.newPlot(div, traces, layout);
                    this.loading = false;
                });
            });
        },

        showHeatmap() {
            this.$axios.get("/api/genes/geneset-collection?name=" + this.selectedGeneset + '&dataset_id=' + datasetId).then(res => {
                let div = document.getElementById('heatmapPlotDiv');
                let traces = [{type:'heatmap', z:res.data.data, y:res.data.index, x:res.data.columns}];
                let layout = {height:1200, margin: {t:50, l:100, r:50, b:400},}
                Plotly.newPlot(div, traces, layout);
                this.loading = false;
            });
        }
    },

    watch: {
        selectedDataset: function() {
            return;
            this.loading = true;
            this.$axios.get("/api/genes/geneset-collection?name=" + this.selectedGeneset + '&dataset_id=' + this.selectedDataset.datasetId).then(res => {
                let div = document.getElementById('mainPlotDiv');
                let traces = [{type:'heatmap', z:res.data.data, y:res.data.index, x:res.data.columns}];
                // let x=[], y=[], colour=[];
                // for (let i=0; i<res.data.columns.length; i++) {
                //     for (let j=0; j<res.data.index.length; j++) {
                //         x.push(res.data.columns[i]);
                //         y.push(res.data.index[j]);
                //         colour.push(res.data.data[j][i]);
                //     }
                // }
                // let traces = [{type:'scatter', mode:'markers', marker:{symbol:'square', size:50, color:colour}, x:x, y:y}];
                let layout = {height:1200, margin: {t:50, l:100, r:50, b:400},}
                Plotly.newPlot(div, traces, layout);
                this.loading = false;
            });
        }
    },

    mounted() {
        this.$axios.get("/api/genes/geneset-collection").then(res => {
            this.genesets = res.data;
            this.selectedGeneset = 'selectedGeneset' in this.$route.query? this.$route.query.selectedGeneset : this.genesets[0];
            this.bubblePlot();
        });
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
.highlight {
    color: #EE255F;
}
</style>