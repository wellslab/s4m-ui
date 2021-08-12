<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <h3 class="text-center my-4">Sample groups to genes
        <small>
            <b-link v-b-tooltip.hover.right="'Background and more information'" v-b-toggle.sidebar class="mx-2"><b-icon-info-circle></b-icon-info-circle></b-link>
        </small>
    </h3>

    <b-row class="mt-3" align-v="start" no-gutters>
        <b-col md="5" class="d-flex justify-content-end">
            <b-form inline>
                Find highly expressed genes in: 
                <b-form-select v-model="selectedSampleGroup" :options="sampleGroups" @change="getSampleGroupItems" class="ml-1"></b-form-select>
            </b-form>
        </b-col>
        <b-col md="4" class="pl-2">
            <b-form-select v-model="selectedSampleGroupItem">
                <b-form-select-option v-for="item in sampleGroupItems" :key="item.text" :value="item.text">{{item.text}} ({{item.count}})</b-form-select-option>
            </b-form-select>
            <span class="my-2 ml-4">vs</span>
            <b-form-select v-model="selectedSampleGroupItem2" class="mt-1">
                <template #first>
                    <b-form-select-option :value="null">--any other in the dataset--</b-form-select-option>
                </template>
                <b-form-select-option v-for="item in sampleGroupItems" :key="item.text" :value="item.text">{{item.text}} ({{item.count}})</b-form-select-option>
            </b-form-select>
        </b-col>
        <b-col md="3" class="mt-n2">
            <b-button variant="dark" @click="search" class="ml-2">Search</b-button>
            <b-dropdown text="tools">
                <b-dropdown-item @click="sortSampleGroupItems('number')">Sort by number</b-dropdown-item>
                <b-dropdown-item @click="sortSampleGroupItems('az')">Sort by A-Z</b-dropdown-item>
                <b-dropdown-item @click="showMoreOptions=true">More options...</b-dropdown-item>
            </b-dropdown>
            <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-2 pt-2"></b-spinner>
        </b-col>
    </b-row>

    <b-container v-if="genes.length==0" class="text-center mt-4">
        <b-img src="/img/Genes_SamplesToGenes.png" alt="Find genes from samples"></b-img>
        <p>You can search for highly expressed genes here, starting from a cell type or a tissue of interest.</p>
    </b-container>

    <b-row v-show="genes.length>0" class="mt-2">
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
                    <GeneExpressionPlot :gene_id="selectedGene.geneId" :dataset_id="selectedDatasetId" :selected_sample_group="selectedSampleGroup"
                        :highlight-sample-group-items="[selectedSampleGroupItem, selectedSampleGroupItem2]"/>
                </b-card-body>
            </b-card>
        </b-col>
    </b-row>

    <!-- Show more options (modal) -->
    <b-modal v-model="showMoreOptions" title="More options" hide-footer>
        <b-card no-body class="border-0">
            <p>You can fine-tune the search here.
            </p>
            <b-form inline>Maximum number of genes returned
                <b-form-input number v-model="cutoff" min="10" max="500" class="ml-2" :placeholder="String(cutoff)"></b-form-input>
            </b-form>
            <b-button @click="showMoreOptions=false" variant="dark" class="mt-3 col-md-4">Close</b-button>
        </b-card>
    </b-modal>

    <!-- Sidebar for help text -->
    <b-sidebar id="sidebar" title="Help and more info" shadow>
        <div class="px-3 py-2">
            <p>This page shows genes with high expression for a selected sample group, such as cell_type=monocyte. 
            The results are displayed in a hierarchical manner, with genes on the far left, followed by datasets in which that
            gene was found to have high expression.
            </p>
            <p>The number in the bracket after the gene is the number of datasets in which this gene was found to be
                highly expressed for this search, and the list of genes is sorted on this number.
            </p>
            <p>You can get a preview on the gene description by hovering over the gene symbol just above the plot.
                Clicking on it will open up the <b-link href="http://ensembl.org" target="_blank">Ensembl</b-link> site for this gene.
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
                { text: 'Sample group to genes', active: true }
            ],
            sampleGroups: ["cell_type","tissue_of_origin"],
            selectedSampleGroup: 'cell_type',
            sampleGroupItems: [],
            selectedSampleGroupItem: 'blood',
            selectedSampleGroupItem2: null,
            cutoff: 20,

            loading: true,
            showMoreOptions: false,
            selectedSortKey: 'number',

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
                // res.data looks like {'monocyte':1587, ...}

                // Construct sampleGroupItems while discarding some items
                let discard = ["","in vitro","undefined"];
                this.sampleGroupItems = Object.keys(res.data).filter(item => discard.indexOf(item)==-1 && !item.startsWith("Day")).map(
                    item => ({text: item, count: res.data[item]})
                );
                this.sortSampleGroupItems('number');
                this.selectedSampleGroupItem = Object.keys(query).indexOf('selectedSampleGroupItem')!=-1? 
                    query.selectedSampleGroupItem : this.sampleGroupItems[0].text;

                if (query.search=="true")
                    this.search();
            });
        },

        sortSampleGroupItems(key) {
            if (key=='number') 
                this.sampleGroupItems.sort((a,b) => a.count > b.count? -1 : 1);
            else
                this.sampleGroupItems.sort((a,b) => a.text < b.text? -1 : 1);            
        },
        
        gotoReactome() {
            if (this.genes.length==0) return;
            
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
            let sampleGroupItem2 = this.selectedSampleGroupItem2 || '';
            this.$axios.get("/api/genes/sample-group-to-genes?cutoff=" + this.cutoff + "&sample_group=" + this.selectedSampleGroup + "&sample_group_item=" + this.selectedSampleGroupItem +
                "&sample_group_item2=" + sampleGroupItem2
            ).then(res => {
                // First get gene symbols from gene ids and get symbols from mygene
                let geneIds = res.data.rankScore.map(item => item.geneId);
                if (geneIds.length==0) {
                    this.$bvModal.msgBoxOk("No genes found for this query. This can happen when there are no datasets " + 
                        "where at least two or more groups exist for the comparison to be made. Try a different item.");
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
                this.showMoreOptions = false;
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