<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <h3 class="text-center my-4">Sample groups to genes
        <small>
            <b-link v-b-tooltip.hover.right="'Background and more information'" v-b-toggle.sidebar class="mx-2"><b-icon-info-circle></b-icon-info-circle></b-link>
        </small>
    </h3>
    <b-form inline class="justify-content-center mt-3">
        Find highly expressed genes in: 
        <b-form-select v-model="selectedSampleGroup" :options="sampleGroups" @change="getSampleGroupItems" class="ml-2"></b-form-select>
        <b-form-select v-model="selectedSampleGroupItem" :options="sampleGroupItems" class="mx-2"></b-form-select>
        <b-button variant="dark" @click="search">Search</b-button>
        <b-dropdown text="tools" class="ml-2">
            <b-dropdown-item @click="gotoReactome">Go to Reactome</b-dropdown-item>
            <b-dropdown-item>Download Data</b-dropdown-item>
        </b-dropdown>
        <b-spinner v-if="loading" label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;" class="ml-2"></b-spinner>
    </b-form>

    <b-row class="mt-2">
        <b-col class="px-0" md="2">
            <b-card no-body :header="'Genes (' + genes.length + ')'">
                <div style="max-height:500px; overflow-y:auto">
                    <b-list-group flush>
                        <b-button squared v-for="gene in genes" :key="gene.geneId" :pressed="selectedGene.geneId==gene.geneId"  @click="selectedGene=gene"
                            class="list-group-item list-group-item-action d-flex justify-content-between" href="#" style="font-size:smaller">
                            {{gene.geneSymbol}} ({{gene.count}})
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1" md="2">
            <b-card no-body :header="'Datasets (' + selectedGene.datasetIds.length + ' of ' + totalDatasets + ')'">
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
                    Expression of <b-link :href="'https://ensembl.org/Gene/Summary?g=' + selectedGene.geneId" target="_blank" v-b-tooltip.hover 
                                    :title="selectedGene.geneDescription + ' (Click to go to Ensembl site)'">
                        {{selectedGene.geneSymbol}}</b-link> in <b-link :to="'/datasets/view?id=' + selectedDatasetId" target="_blank">{{datasetDisplayName[selectedDatasetId]}}</b-link>
                </b-card-header>
                <b-card-body>
                    <GeneExpressionPlot :gene_id="selectedGene.geneId" :dataset_id="selectedDatasetId"/>
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
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Genes', to: '/genes' },
                { text: 'Gene set collections', active: true }
            ],
            sampleGroups: ["cell_type","tissue_of_origin",],
            selectedSampleGroup: 'cell_type',
            sampleGroupItems: [],
            selectedSampleGroupItem: 'blood',
            loading: true,
            genes: [],
            selectedGene: {geneId:null, geneSymbol:'', datasetIds:[]},
            selectedDatasetId: null,
            datasetDisplayName: {},
            totalDatasets:0,    // total number of datasets where the sample group item was found
        }
    },

    methods: {
        // Fetch all available sample group items (eg 'monocyte','fibroblast') when sample group changes (eg 'cell_type')
        getSampleGroupItems(query) {
            if (Object.keys(query).indexOf('selectedSampleGroup')!=-1)
                this.selectedSampleGroup = query.selectedSampleGroup;

            this.$axios.get("/api/values/samples/" + this.selectedSampleGroup + "?include_count=true").then(res => {
                let combined = Object.keys(res.data).map(item => [item, res.data[item]]);
                combined.sort((a,b) => a[1] > b[1]? -1 : 1);
                let discard = ["","in vitro","undefined"];
                this.sampleGroupItems = combined.filter((item,i) => i<20 && discard.indexOf(item[0])==-1 &&  !item[0].startsWith("Day")).map(item => item[0]);
                this.selectedSampleGroupItem = Object.keys(query).indexOf('selectedSampleGroupItem')!=-1? query.selectedSampleGroupItem : this.sampleGroupItems[0];
                if (query.search=="true")
                    this.search();
            });
        },

        gotoReactome() {
            this.loading = true;
            let geneIds = this.genes.map(item => item.geneId);
            this.$axios.post("/reactome/AnalysisService/identifiers/?interactors=false&pageSize=20&page=1&sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL&pValue=1&includeDisease=true", 
                             geneIds.join(','), {'headers': {'Content-Type':'text/plain'}}
            ).then(res => {
                const token = res.data.summary.token;
                window.open("https://reactome.org/PathwayBrowser/#DTAB=AN&ANALYSIS=" + token, "_blank");
            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while opening Reactome: " + error.reponse.data)
            ).then(() => {
                this.loading = false;
            });
        },

        search() {
            this.loading = true;
            this.$axios.get("/api/genes/sample-group-to-genes?sample_group=" + this.selectedSampleGroup + "&sample_group_item=" + this.selectedSampleGroupItem
            ).then(res => {
                // First get gene symbols from gene ids and get symbols from mygene
                let geneIds = res.data.rankScore.map(item => item.geneId);
                if (geneIds.length==0) {
                    this.$bvModal.msgBoxOk("No genes found.");
                    return;
                }
                this.totalDatasets = res.data.totalDatasets;

                this.$axios.post("/mygene/v3/gene", 'fields=symbol,summary,ensembl.gene&ids=' + geneIds.join(','), {'headers': {'Content-Type':'application/x-www-form-urlencoded'}}
                ).then(result => {
                    let geneSymbolFromGeneId = {};
                    let geneDescriptionFromGeneId = {};
                    result.data.forEach(item => {
                        geneSymbolFromGeneId[item['query']] = 'symbol' in item? item['symbol'] : item['query'];
                        geneDescriptionFromGeneId[item['query']] = 'summary' in item? item['summary'] : item['query'];
                        });

                    // Often get multiple gene ids mapped to the same symbol.
                    // Since we're presenting the genes to the users using symbols, deal with this to avoid
                    // confusion. Just take the symbol with highest score (note that res.data is already sorted
                    // from highest to lowest scores). 
                    // Also split dataset ids into array and get dataset display names.
                    let genes = [];
                    let geneSymbols = new Set();    // unique values only
                    let datasetIds = new Set(res.data.rankScore.map(item => item.datasetIds).join(',').split(','));
                    res.data.rankScore.forEach(element => {
                        if (!geneSymbols.has(geneSymbolFromGeneId[element.geneId])) {
                            element.datasetIds = element.datasetIds.split(',');
                            element.geneSymbol = geneSymbolFromGeneId[element.geneId];
                            element.geneDescription = geneDescriptionFromGeneId[element.geneId];
                            genes.push(element);
                            geneSymbols.add(element.geneSymbol);
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
            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while performing analysis: " + error.reponse.data)
            ).then(() => {
                this.loading = false;
            })
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
        this.getSampleGroupItems(this.$route.query);
        this.loading = false;
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
</style>