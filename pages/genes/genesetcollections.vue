<template>
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
        <b-form-select v-model="selectedGeneset" :options="genesets" class="ml-2" size="sm"></b-form-select>
        <b-spinner v-if="loading" label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;" class="ml-2"></b-spinner>
    </b-form>

    <b-row class="mt-2">
        <b-col class="px-0 ml-1" md="3">
            <b-card no-body :header="'Datasets (' + datasets.length + ' of ' + totalDatasets + ')'">
                <div style="max-height:500px; overflow:auto">
                    <b-list-group flush>
                        <b-button squared v-for="dataset in datasets" :key="dataset.datasetId" :pressed="selectedDataset==dataset" 
                            class="list-group-item list-group-item-action d-flex justify-content-between" 
                            href="#" @click="selectedDataset=dataset" style="font-size:smaller">
                            {{dataset.displayName}} ({{dataset.score}})
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1">
            <b-card no-body>
                <b-card-header class="text-center">
                    Expression of {{selectedGeneset}} in <b-link :to="'/datasets/view?id=' + selectedDataset.datasetId" target="_blank">{{selectedDataset.displayName}}</b-link>
                </b-card-header>
                <b-card-body>
                    <div id="mainPlotDiv"></div>
                </b-card-body>
            </b-card>
        </b-col>
    </b-row>

    <b-sidebar id="sidebar" title="Help and more info" shadow>
        <div class="px-3 py-2">
            <p>This page shows genes with high expression in selected sample group, such as cell_type=monocyte. 
            On the far left is the list of genes with this high expression pattern. The number in the brackets shows the number of
                datasets in which this gene was found to have high expression in this sample group. Higher number here implies that 
                this gene is found to have high expression in the selected sample group consistently across more datasets.
            </p>
            <p>The second column from the left is the list of datasets in which the selected gene show high expression. Simply select gene-dataset
                combination to show the expression profile of that gene in that dataset.
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
            genesets: [],
            selectedGeneset:'',
            datasets: [],
            selectedDataset: '',
            totalDatasets: 400,
        }
    },

    methods: {
        plot() {
            this.$axios.get("/api/genes/geneset-collection?name=" + 'NABA_COLLAGENS&dataset_id=' + this.selectedDataset.datasetId).then(res => {
                let div = document.getElementById('mainPlotDiv');
                let traces = [{type:'heatmap', z:res.data.data, y:res.data.index, x:res.data.columns}];
                Plotly.newPlot(div, traces);
            });
        }

    },

    watch: {
        // when selectedGeneset changes we change datasets
        selectedGeneset: function() {
            this.loading = true;
            this.$axios.get("/api/genes/geneset-collection?name=" + this.selectedGeneset).then(res => {
                // First we create an array from dataset ids and scores so that we can sort
                let scores = [];
                for (let [key, value] of Object.entries(res.data.vars)) {
                    if (value!=null)
                        scores.push([key,value]);
                }
                scores.sort((a,b) => b[1] < a[1]? -1 : 1);

                // Round scores and drop those below some cutoff
                scores = scores.map(item => [item[0], Math.round(item[1]*100)/100]);
                scores = scores.filter(item => item[1]>0.3);

                // Fetch dataset info for all remaining datasets
                let datasetIds = scores.map(item => item[0]);
                this.$axios.get("/api/search/datasets?dataset_id=" + datasetIds.join(',')).then(res2 => {
                    let datasetDisplayName = {};
                    res2.data.forEach(item => {
                        const name = item.name.split('_');
                        datasetDisplayName[item.dataset_id] = name[0] + " (" + name[1] + ")";
                    });
                    // Ready to populate datasets
                    this.datasets = scores.map(item => (
                        {datasetId:item[0], displayName:datasetDisplayName[item[0]], score:item[1]}
                    ));
                    this.selectedDataset = this.datasets[0];
                    this.loading = false;
                });
            });
            // If selectedGeneset does not contain selectedDataset, we need to change
            //if (this.selectedGeneset.datasetIds.indexOf(this.selectedDatasetId)==-1)
            //    this.selectedDatasetId = this.selectedGeneset.datasetIds[0];
        },

        selectedDataset: function() {
            this.loading = true;
            this.$axios.get("/api/genes/geneset-collection?name=" + 'NABA_COLLAGENS&dataset_id=' + this.selectedDataset.datasetId).then(res => {
                let div = document.getElementById('mainPlotDiv');
                let traces = [{type:'heatmap', z:res.data.data, y:res.data.index, x:res.data.columns}];
                Plotly.newPlot(div, traces);
                this.loading = false;
            });
        }
    },

    mounted() {
        this.$axios.get("/api/genes/geneset-collection").then(res => {
            this.genesets = res.data;
            this.selectedGeneset = 'selectedGeneset' in this.$route.query? this.$route.query.selectedGeneset : this.genesets[0];
            this.loading = false;
        });
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
</style>