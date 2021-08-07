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
        Find highly expressed cell types for gene: 
        <GeneSearch form-group-description="" @gene-selected="updateSelectedGene" @keyup-enter="search" class="mx-1"></GeneSearch>
        <b-button variant="dark" @click="search">Search</b-button>
        <b-dropdown text="tools" class="ml-2">
            <b-dropdown-item>Download Data</b-dropdown-item>
        </b-dropdown>
        <!-- Use visibility rather than v-if for loading spinner, otherwise its occupied space changes and elements jump around -->
        <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-2"></b-spinner>
    </b-form>

    <b-row v-show="celltypes.length>0" class="mt-2">
        <b-col class="px-0" md="2">
            <b-card no-body :header="'Cell types (' + celltypes.length + ')'">
                <div style="max-height:500px; overflow-y:auto">
                    <b-list-group flush>
                        <b-button squared v-for="celltype in celltypes" :key="celltype.value" :pressed="selectedCelltype==celltype"  @click="selectedCelltype=celltype"
                            class="list-group-item list-group-item-action d-flex justify-content-between" href="#" style="font-size:smaller">
                            {{celltype.value}} ({{Math.round(celltype.score*10)/10}})
                            <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
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
            <p>This page shows cell types with high expression for a selected gene. 
            The results are displayed in a hierarchical manner, with cell types on the far left, followed by datasets in which that
            cell type was found to have high expression.
            </p>
            <p>The number in the bracket after the cell type is the score given to that cell type for high expression. This score
                is higher if the mean value of all samples in that cell type is higher in the dataset. It is also higher if there
                are more datasets where the same cell type had high mean values.
            </p>
            <p>Note that as the calculation requires looping through hundreds of datasets in the system, it may take up to a minute
                to return the results,
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
            loading: false,

            selectedGene: {},

            celltypes: [],
            selectedCelltype: {},

            datasets: [],
            selectedDataset: {},
        }
    },

    methods: {

        // Should run when gene-selected event is triggered from GeneSearch component.
        updateSelectedGene(selectedGene) {
            this.selectedGene = selectedGene;
        },

        // Peform search for sample groups by going to api
        search(query) {
            if (Object.keys(this.selectedGene).length==0) {
                return;
            }

            this.loading = true;
            if ('geneId' in query)
                this.updateSelectedGene(query);

            this.$axios.get("/api/genes/gene-to-sample-groups?gene_id=" + this.selectedGene.geneId).then(res => {
                this.celltypes = [];
                for (const [celltype,dict] of Object.entries(res.data)) {
                    const score = dict.score.reduce((acc,v) => acc + v) / dict.score.length * dict.count;
                    //const maxRank = Math.max(...dict['ranks'])
                    this.celltypes.push({value: celltype, datasetIds: dict.datasetIds, count: dict.count, score: score});
                }
                // sort by score
                this.celltypes.sort((a,b) => a.score > b.score? -1 : 1);

            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while performing analysis: " + error.reponse.data)
            ).then(() => {
                this.loading = false;
            })
        },

        // sortCelltypes(key) {
        //     if (key=='datasets')
        //         this.celltypes.sort((a,b) => a.datasetIds.length > b.datasetIds.length? -1 : 1);
        //     else
        //         this.celltypes.sort((a,b) => a[key] > b[key]? -1 : 1);
        // }
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
        this.search(this.$route.query);
    }
}
</script>

<style>
.list-group-item {
    border: 0;
}
</style>