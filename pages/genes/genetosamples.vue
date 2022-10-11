<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <h3 class="text-center my-4">Gene to sample groups
        <small>
            <b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar class="mx-2"><b-icon-info-circle></b-icon-info-circle></b-link>
        </small>
    </h3>
    <b-form inline class="justify-content-center mt-3">
        Find highly expressed {{selectedSampleGroup}} for gene: 
        <GeneSearch form-group-description="" :show-button="false" @gene-selected="updateSelectedGene" @keyup-enter="search" class="mx-1"></GeneSearch>
        <b-button variant="dark" @click="search">Search</b-button>
        <b-dropdown text="tools" class="ml-2">
            <b-dropdown-item @click="showMoreOptions=true">More options...</b-dropdown-item>
        </b-dropdown>
        <!-- Use visibility rather than v-if for loading spinner, otherwise its occupied space changes and elements jump around -->
        <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-2"></b-spinner>
        <span :style="{visibility: loading ? 'visible' : 'hidden', color:'#ced4da'}" class="ml-1"
            v-b-tooltip.hover title="It may take up to a minute for this analysis to complete">{{loadingTime}}s</span>
    </b-form>

    <b-container v-if="sampleGroupItems.length==0" class="text-center mt-4">
        <b-img src="/img/Genes_GeneToSamples.png" alt="Find samples from genes"></b-img>
        <p>You can search for highly expressed cell types (or tissues) here, starting from a gene of interest.</p>
    </b-container>

    <b-row v-show="sampleGroupItems.length>0" class="mt-2">
        <b-col class="px-0" md="2">
            <b-card no-body :header="selectedSampleGroup + ' (' + sampleGroupItems.length + ')'">
                <div style="max-height:500px; overflow-y:auto">
                    <b-list-group flush>
                        <b-button squared v-for="sampleGroup in sampleGroupItems" :key="sampleGroup.value" :pressed="selectedSampleGroupItem==sampleGroup"  @click="selectedSampleGroupItem=sampleGroup"
                            class="list-group-item list-group-item-action d-flex justify-content-between" href="#" style="font-size:smaller">
                            {{sampleGroup.value}} ({{Math.round(sampleGroup.score*10)/10}})
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
                    <GeneExpressionPlot :gene_id="selectedGene.geneId" :dataset_id="selectedDataset.datasetId" :selected_sample_group="selectedSampleGroup"
                        :highlight-sample-group-items="itemsToHighlight"/>
                </b-card-body>
            </b-card>
        </b-col>
    </b-row>

    <!-- Show more options (modal) -->
    <b-modal v-model="showMoreOptions" title="More options" hide-footer>
        <b-card no-body class="border-0 px-1">
            <p>You can fine-tune the search here.</p>
            <b-form inline class="mt-3">sample group to find
                <b-form-select v-model="selectedSampleGroup" :options="sampleGroups" class="ml-2"></b-form-select>
            </b-form>
            <b-button @click="showMoreOptions=false" variant="dark" class="mt-3 col-md-4">Close</b-button>
        </b-card>
    </b-modal>

    <!-- Sidebar for help text -->
    <b-sidebar id="sidebar" title="Help and more info" shadow>
        <div class="px-3 py-2">
            <p>This page shows cell types (or tissues) with high expression for a selected gene. 
            The results are displayed in a hierarchical manner, with cell types on the far left, followed by datasets in which that
            cell type was found to have high expression.
            </p>
            <p>The number in the bracket after the cell type is the score given to that cell type for high expression. This score
                is higher if the mean value of all samples in that cell type is higher in the dataset. It is also higher if there
                are more datasets where the same cell type had high mean values.
            </p>
            <p>Use tools > more options function to apply the calculation to tissue_of_origin field instead of cell_type.</p>
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
            loadingTime: 0,
            interval: null,
            showMoreOptions: false,

            selectedGene: {},
            sampleGroups: ['cell_type','tissue_of_origin'],
            selectedSampleGroup: 'cell_type',

            sampleGroupItems: [],
            selectedSampleGroupItem: {},

            datasets: [],
            selectedDataset: {},
        }
    },

    computed: {
        itemsToHighlight() {
            let items = {};
            items[this.selectedSampleGroup] = [this.selectedSampleGroupItem.value];
            return items;
        },
    },

    methods: {

        // Should run when gene-selected event is triggered from GeneSearch component.
        updateSelectedGene(selectedGene) {
            this.selectedGene = selectedGene;
        },

        // Peform search for sample groups by going to api
        search(query) {
            if ('geneId' in query)
                this.updateSelectedGene(query);
            if (Object.keys(this.selectedGene).length==0) {
                console.log("No gene selected.");
                return;
            }
            
            this.loading = true;
            this.loadingTime = 0;
            this.interval = setInterval(() => { this.loadingTime += 1; }, 1000)

            this.$axios.get("/api/genes/gene-to-sample-groups?gene_id=" + this.selectedGene.geneId + "&sample_group=" + this.selectedSampleGroup).then(res => {
                this.sampleGroupItems = [];
                for (const [sampleGroup,dict] of Object.entries(res.data)) {
                    // Score is the mean of score values across datasets for each sampleGroupItem
                    const score = dict.score.reduce((acc,v) => acc + v) / dict.score.length * dict.count;
                    //const maxRank = Math.max(...dict['ranks'])
                    this.sampleGroupItems.push({value: sampleGroup, datasetIds: dict.datasetIds, count: dict.count, score: score});
                }
                // sort by score
                this.sampleGroupItems.sort((a,b) => a.score > b.score? -1 : 1);
                this.selectedSampleGroupItem = this.sampleGroupItems[0];

            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while performing analysis: " + error.reponse.data)
            ).then(() => {
                this.loading = false;
                clearInterval(this.interval);
                this.loadingTime = 0;
            })
        },

        // sortsampleGroupItems(key) {
        //     if (key=='datasets')
        //         this.sampleGroupItems.sort((a,b) => a.datasetIds.length > b.datasetIds.length? -1 : 1);
        //     else
        //         this.sampleGroupItems.sort((a,b) => a[key] > b[key]? -1 : 1);
        // }
    },

    watch: {
        selectedSampleGroupItem: function() {
            this.loading = true;

            // Fetch info about datasets for this score
            this.$axios.get("/api/search/datasets?dataset_id=" + this.selectedSampleGroupItem.datasetIds.join(',')).then(res => {
                let datasetDisplayName = {};
                res.data.forEach(item => {
                    const name = item.name.split('_');
                    datasetDisplayName[item.dataset_id] = name[0] + " (" + name[1] + ")";
                });
                // Ready to populate datasets
                this.datasets = this.selectedSampleGroupItem.datasetIds.map(item => (
                    {datasetId:item, displayName:datasetDisplayName[item]}
                ));

                // If selectedSampleGroupItem does not contain selectedDataset, we need to change
                if (this.selectedSampleGroupItem.datasetIds.indexOf(this.selectedDataset.datasetId)==-1)
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