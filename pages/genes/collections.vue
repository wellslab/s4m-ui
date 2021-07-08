<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <b-form inline class="justify-content-center mt-3">
        <h4 class="my-auto">Gene set collections</h4>
        <b-form-select v-model="selectedCollection" :options="collections" class="mx-2"></b-form-select>
        <b-dropdown text="tools">
            <b-dropdown-item @click="gotoReactome">Go to Reactome</b-dropdown-item>
            <b-dropdown-item @click="gotoReactome">Go to Reactome</b-dropdown-item>
        </b-dropdown>
        <b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar class="mx-2"><b-icon-info-circle scale="1.3"></b-icon-info-circle></b-link>
        <b-spinner v-if="loading" label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;"></b-spinner>
    </b-form>

    <b-row class="mt-2">
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
            <p> <b-link to="/genes/discover">genes &#62; discover page</b-link>.
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
                { text: 'Genes', to: '/genes' },
                { text: 'Gene set collections', active: true }
            ],
            collections: ["Monocyte","Broad c2"],
            selectedCollection: "Monocyte",
            loading: true,
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
            this.$axios.post("/reactome/AnalysisService/identifiers/?interactors=false&pageSize=20&page=1&sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL&pValue=1&includeDisease=true", 'KIT\nGATA1', {'headers': {'Content-Type':'text/plain'}}).then(res => {
                const token = res.data.summary.token;
                window.open("https://reactome.org/PathwayBrowser/#DTAB=AN&ANALYSIS=" + token, "_blank");
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
        this.$axios.get("/api/genes/geneset-collection").then(res => {
            // Often get multiple gene ids mapped to the same symbol.
            // Since we're presenting the genes to the users using symbols, deal with this to avoid
            // confusion. Just take the symbol with highest score (note that res.data is already sorted
            // from highest to lowest scores). 
            // Also split dataset ids into array and get dataset display names.
            console.log(JSON.stringify(res.data));
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
            this.$axios.get("/api/search/datasets?dataset_id=" + datasetIds.join(',')).then(res2 => {
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