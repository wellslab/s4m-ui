<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <div class="text-center">
    <h3 class="my-3">
        "{{sampleGroupItem}}" top genes
        <small>
            <b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar class="ml-2"><b-icon-info-circle></b-icon-info-circle></b-link>
            <b-spinner v-if="loading" label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;"></b-spinner>
            <b-link @click="gotoReactome">reactome</b-link>
        </small>
    </h3>
    </div>

    <b-row>
        <b-col class="px-0" md="2">
            <b-card no-body :header="'Genes (' + genes.length + ')'">
                <div style="max-height:500px; overflow-y:auto">
                    <b-list-group flush>
                        <b-button squared v-for="gene in genes" :key="gene.geneId" :pressed="selectedGene.geneId==gene.geneId"  @click="selectedGene=gene"
                            class="list-group-item list-group-item-action d-flex justify-content-between" href="#" style="font-size:smaller">
                            {{gene.symbol}} ({{gene.count}})
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1" md="2">
            <b-card no-body header="Datasets">
                <div style="max-height:500px; overflow:auto">
                    <b-list-group flush>
                        <b-button squared v-for="datasetId in selectedGene.datasetIds" :key="datasetId" :pressed="selectedDatasetId==datasetId" 
                            class="list-group-item list-group-item-action d-flex justify-content-between" 
                            href="#" @click="selectedDatasetId=datasetId" style="font-size:smaller">
                            {{datasetDisplayName[datasetId]}}
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1">
            <b-card no-body>
                <b-card-header class="text-center">
                    Expression of <b-link>{{selectedGene.symbol}}</b-link> in 
                    <b-link>{{datasetDisplayName[selectedDatasetId]}}</b-link>
                </b-card-header>
                <b-card-body>
                    <GeneExpressionPlot :gene_id="selectedGene.geneId" :dataset_id="selectedDatasetId"/>
                </b-card-body>
            </b-card>
        </b-col>
    </b-row>

    <b-sidebar id="sidebar" title="Help and more info" shadow>
        <div class="px-3 py-2">
            <p>This page shows genes with high expression in "{{sampleGroupItem}}" from "{{sampleGroup}}". You can search for highly expressed
                genes in other cell types or sample categories from our <b-link to="/genes/discover">genes &#62; discover page</b-link>.
            </p>
            <p>On the far left is the list of genes with this high expression pattern. The number in the brackets shows the number of
                datasets in which this gene was found to have high expression in this sample category. Higher number here implies that 
                this gene is found to have high expression in "{{sampleGroupItem}}" consistently across more datasets.
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
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Genes', active: true },
                { text: 'Top Genes', active: true }
            ],
            loading: true,
            sampleGroup: 'cell_type',
            sampleGroupItem: 'monocyte',
            genes: [],
            selectedGene: {geneId:null, symbol:'', datasetIds:[]},
            selectedDatasetId: null,
            datasetDisplayName: {},
            selectedGeneId: null,
        }
    },

    methods: {
        gotoReactome() {
            //console.log(this.genes.map(item => item.geneId));
            // this.$axios.post("/mygene/v3/gene", 'ids=1017,695&fields=name,symbol,refseq.rna', {'headers': {'Content-Type':'application/x-www-form-urlencoded'}}).then(res => {
            //     console.log(res.data);
            // });
            this.$axios.post("/reactome/AnalysisService/", 'KIT\nGATA1', {'headers': {'Content-Type':'application/x-www-form-urlencoded'}}).then(res => {
                console.log(res.data);
            });
        }
    },

    watch: {
        selectedGene: function() {
            // If selectedGene does not contain selectedDatasetId, we need to change
            if (this.selectedGene.datasetIds.indexOf(this.selectedDatasetId)==-1)
                this.selectedDatasetId = this.selectedGene.datasetIds[0];
        }
    },

    mounted() {
        this.$axios.get("/api/geneset").then(res => {
            // Often get multiple gene ids mapped to the same symbol.
            // Since we're presenting the genes to the users using symbols, deal with this to avoid
            // confusion. Just take the symbol with highest score (note that res.data is already sorted
            // from highest to lowest scores). 
            // Also split dataset ids into array and get dataset display names.
            let genes = [];
            let geneSymbols = new Set();    // unique values only
            let datasetIds = new Set(res.data.map(item => item.datasetIds).join(',').split(','));
            res.data.forEach(element => {
                if (!geneSymbols.has(element.symbol)) {
                    element.datasetIds = element.datasetIds.split(',');
                    genes.push(element);
                    geneSymbols.add(element.symbol);
                }
            });
            let query = datasetIds.map(item => 'dataset_id=' + item);
            this.$axios.get("/api/search/datasets?" + query.join('&')).then(res2 => {
                res2.data.forEach(item => {
                    const name = item.name.split('_');
                    this.datasetDisplayName[item.dataset_id] = name[0] + " (" + name[1] + ")";
                });
                this.genes = genes;
                this.selectedGene = this.genes[0];
                this.selectedDatasetId = this.selectedGene.datasetIds[0];
                this.loading = false;
            });
        });
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
</style>