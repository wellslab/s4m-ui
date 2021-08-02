<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <h3 class="text-center my-4">Gene to samples
        <small>
            <b-link v-b-tooltip.hover.right="'Background and more information'" v-b-toggle.sidebar class="mx-2"><b-icon-info-circle></b-icon-info-circle></b-link>
        </small>
    </h3>
    <b-form inline class="justify-content-center mt-3">
        Find highly expressed cell types for: 
        <b-form-input v-model="selectedGeneSymbol" list="possible-genes-datalist" class="ml-2"
            @keyup="getPossibleGenes" @keyup.enter="search" placeholder="[gene symbol]"></b-form-input>
        <b-form-datalist id="possible-genes-datalist">
            <option v-for="gene in genes" :key="gene.geneId">{{gene.geneSymbol}}</option>
        </b-form-datalist>
        <!-- @keyup.enter does not work unless this dummy input is added because hitting enter submits the form with just one input -->
        <b-form-input v-show="false"></b-form-input>
        <b-button variant="dark" @click="search">Search</b-button>
        <b-dropdown text="tools" class="ml-2">
            <b-dropdown-item>Download Data</b-dropdown-item>
        </b-dropdown>
        <!-- Use visibility rather than v-if for loading spinner, otherwise its occupied space changes and elements jump around -->
        <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-2"></b-spinner>
    </b-form>

    <b-row class="mt-2">
        <b-col class="px-0" md="2">
            <b-card no-body :header="'Cell types (' + celltypes.length + ')'">
                <div style="max-height:500px; overflow-y:auto">
                    <b-list-group flush>
                        <b-button squared v-for="celltype in celltypes" :key="celltype.value" :pressed="selectedCelltype==celltype"  @click="selectedCelltype=celltype"
                            class="list-group-item list-group-item-action d-flex justify-content-between" href="#" style="font-size:smaller">
                            {{celltype.value}} ({{celltype.datasetIds.length}}, {{celltype.meanRank}})
                            <b-icon-chevron-right scale="0.8" class="text-success"></b-icon-chevron-right>
                        </b-button>
                    </b-list-group>
                </div>
            </b-card>
        </b-col>
        <b-col class="px-0 ml-1" md="2">
            <b-card no-body :header="'Datasets (' + datasets.length + ')'">
                <div style="max-height:500px; overflow:auto">
                    <b-list-group flush>
                        <b-button squared v-for="dataset in datasets" :key="dataset.datasetId" :pressed="selectedDataset==dataset" 
                            class="list-group-item list-group-item-action d-flex justify-content-between" 
                            href="#" @click="selectedDataset=dataset" style="font-size:smaller">
                            {{dataset.displayName}}
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
                        {{selectedGene.geneSymbol}}</b-link> in <b-link :to="'/datasets/view?id=' + selectedDataset.datasetId" target="_blank">{{selectedDataset.displayName}}</b-link>
                </b-card-header>
                <b-card-body>
                    <GeneExpressionPlot :gene_id="selectedGene.geneId" :dataset_id="selectedDataset.datasetId"/>
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
                { text: 'Gene to sample groups', active: true }
            ],
            loading: true,

            genes: [],
            selectedGene: {},
            selectedGeneSymbol: '', // good to separate this from selectedGene, as this may be wrong

            celltypes: [],
            selectedCelltype: {},

            datasets: [],
            selectedDataset: {},
        }
    },

    methods: {

        getPossibleGenes() {
            this.loading = true;
            if (this.selectedGeneSymbol.length<=1) return;    // ignore 1 or less characters entered
            this.$axios.get('/mygene/v3/query?species=human&fields=symbol,summary,ensembl.gene&size=50&q=' + this.selectedGeneSymbol).then(res => {
                if (res.data.total>0) {
                    // Note that some genes may not have ensembl ids, so lack the ensembl field
                    const genes = res.data['hits'].filter(item => 'ensembl' in item);
                    if (genes.length>0)
                        this.genes = genes.map(item => {
                            return {geneId: item.ensembl.gene, geneSymbol: item.symbol, geneDescription: item.summary!=null? item.summary : item.query}
                        });
                }
                this.loading = false;
            });
            // .catch(error => {
            //     alert("Could not fetch matching expression values for " + this.genes.selectedGeneSymbol);
            // });
        },

        search() {
            this.loading = true;

            // Find matching gene
            let matchingGene = this.genes.filter(item => item.geneSymbol==this.selectedGeneSymbol);
            if (matchingGene.length==1)
                this.selectedGene = matchingGene[0];
            else {
                alert("No matching gene - please select from the list of suggestions.");
                return;
            }

            this.$axios.get("/api/genes/gene-to-sample-groups?gene_id=" + this.selectedGene.geneId).then(res => {
                this.celltypes = [];
                for (const [celltype,dict] of Object.entries(res.data)) {
                    const meanRank = dict.ranks.reduce((acc,v) => acc + v) / dict.ranks.length;
                    this.celltypes.push({value: celltype, datasetIds: dict.datasetIds, var: dict.var, meanRank: meanRank});
                }
                // sort by count of datasets by default
                this.sortCelltypes('datasets');

            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while performing analysis: " + error.reponse.data)
            ).then(() => {
                this.loading = false;
            })
        },

        sortCelltypes(key) {
            if (key=='datasets')
                this.celltypes.sort((a,b) => a.datasetIds.length > b.datasetIds.length? -1 : 1);
            else
                this.celltypes.sort((a,b) => a.meanRank > b.meanRank? -1 : 1);
        }
    },

    watch: {
        selectedCelltype: function() {
            this.loading = true;

            // Fetch info about datasets for this score
            this.$axios.get("/api/search/datasets?dataset_id=" + this.selectedCelltype.datasetIds.join(',')).then(res => {
                let datasetDisplayName = {};
                res.data.forEach(item => {
                    const name = item.name.split('_');
                    datasetDisplayName[item.dataset_id] = name[0] + " (" + name[1] + ")";
                });
                // Ready to populate datasets
                this.datasets = this.selectedCelltype.datasetIds.map(item => (
                    {datasetId:item, displayName:datasetDisplayName[item]}
                ));

                // If selectedCelltype does not contain selectedDataset, we need to change
                if (this.selectedCelltype.datasetIds.indexOf(this.selectedDataset.datasetId)==-1)
                    this.selectedDataset = this.datasets[0];

                this.loading = false;
            });
        }
    },

    mounted() {
        this.loading = false;
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
</style>