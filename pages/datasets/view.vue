<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-tabs content-class="mt-3">
        <b-tab title="Overview" active class="text-center">
            <h4>
                <b-link to="/datasets/search" v-b-tooltip.hover title="Use the search page under Datasets menu to change dataset">
                    {{datasetMetadata.displayName}}:
                </b-link>
                <small>PCA of log normalised values</small>
            </h4>
            <div class="col-md-3" style="display:inline-table">
                <label for="sampleGroupSelect" style="display:table-cell">colour by:</label>
                <b-form-select id="sampleGroupSelect" size="sm" v-model="selectedSampleGroup" :options="sampleGroups" @change="plotPCA()"></b-form-select>
            </div>
            <div class="overflow-auto text-center">
                <div id="pcaPlotDiv" style="width:800px; height:600px; margin:auto"></div>
            </div>
        </b-tab>

        <b-tab title="Details">
            <h4 class="text-center">
                <b-link to="/datasets/search" v-b-tooltip.hover title="Use the search page under Datasets menu to change dataset">
                    {{datasetMetadata.displayName}}:
                </b-link>
                <small>Dataset Details</small>
            </h4>
            <b-table-simple hover small class="small">
                <b-tbody>
                    <b-tr v-for="row in metadataTable" :key="row.description">
                        <b-td>{{row.key}}</b-td>
                        <b-td>
                            <b-link v-if="row.key=='pubmed_id'" :href="'https://pubmed.ncbi.nlm.nih.gov/' + row.value" target="_blank">{{row.value}}</b-link>
                            <b-link v-else-if="row.key=='accession' && row.value.startsWith('GSE')" :href="'https://www.ncbi.nlm.nih.gov/gds/?term=' + row.value + '[Accession]'" target="_blank">{{row.value}}</b-link>
                            <b-link v-else-if="row.key=='accession' && row.value.startsWith('E-MTAB')" :href="'https://www.ebi.ac.uk/arrayexpress/experiments/' + row.value" target="_blank">{{row.value}}</b-link>
                            <span v-else>{{row.value}}</span>
                        </b-td>
                    </b-tr>
                </b-tbody>
            </b-table-simple>
        </b-tab>

        <b-tab title="Samples">
            <h4 class="text-center">
                <b-link to="/datasets/search" v-b-tooltip.hover title="Use the search page under Datasets menu to change dataset">
                    {{datasetMetadata.displayName}}:
                </b-link>
                <small>Sample Table</small>
            </h4>
            <b-table hover small sticky-header="500px" :items="samples" class="small"></b-table>
        </b-tab>

        <b-tab title="Tools">
            <h4 class="text-center">
                <b-link to="/datasets/search" v-b-tooltip.hover title="Use the search page under Datasets menu to change dataset">
                    {{datasetMetadata.displayName}}:
                </b-link>
                <small>Tools</small>
            </h4>
            <p class="text-center">Description of how this dataset was processed and key QC decisions made.</p>
            <p class="text-center">Download expression data.</p>
            <p class="text-center">(use accordion here)</p>
        </b-tab>
    </b-tabs>
</b-container>
</div>
</template>

<script>
import data_functions from "~/mixins/data_functions.js"

export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },
    mixins: [data_functions],

    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Datasets', active: true },
                { text: 'View a dataset', active: true }
            ],

            // pca plot
            sampleGroups: [],   // ["sample_type", "age", ...]
            selectedSampleGroup: "",
            pcaCoords: {},
            pcaAttributes: {},

            // dataset metadata
            datasetMetadata: {},
            metadataTable: [],

            // sample table
            samples: [],    // [{'sample_id':'7283_GSM1977399', 'cell_type':'', ...}, ...]
        }
    },

    computed: {
        // Values in store (auto sync)
        datasetId: {    // try to get it from url first, then try the store
            get () { return this.$store.getters['datasets_view/getDatasetId'] },
            set (value) { this.$store.commit('datasets_view/setDatasetId', value) }
        }
    },

    methods: {
        plotPCA() {
            // First collect sample ids based on selectedSampleGroup
            // sample id coming from samples table is in datasetId_sampleId format, and pca features don't have the datasetId
            // component, so we remove this part.
            let self = this;
            let sampleIds = self._sampleIdsFromSampleGroup(self.samples, self.selectedSampleGroup);
            
            // Create a plotly trace for each key in sampleIds
            let traces = [];
            let groupItems = Object.keys(sampleIds);
            groupItems.sort();
            for (let i=0; i<groupItems.length; i++) {
                let x = sampleIds[groupItems[i]].map(item => self.pcaCoords['0'][item]);
                let y = sampleIds[groupItems[i]].map(item => self.pcaCoords['1'][item]);
                let name = groupItems[i] + " (" + x.length + ")";
                traces.push({x: x, y: y, mode: 'markers', type: 'scatter' , name:name});
            }
            let layout = {margin: {t:20, l:0, r:0, b:0},};
            Plotly.newPlot('pcaPlotDiv', traces, layout);
        }
    },

    mounted() {
        // Set datasetId if coming from query
        if (this.$route.query.id!=null)
            this.datasetId = this.$route.query.id;
            
        // Fetch dataset metadata and sample metada from API server and populate local variables
        this.$axios.get("/api/datasets/" + this.datasetId + "/metadata").then(res => {
            this.datasetMetadata = res.data;
            this.datasetMetadata.displayName = this.datasetMetadata.name.split("_")[0] + " (" + this.datasetMetadata.name.split("_")[1] + ")";

            // construct metadataTable, leaving out some fields we don't need to show
            this.metadataTable = [];
            let hideKeys = ["name", "displayName","private","status"];
            for (let key in this.datasetMetadata)
                if (hideKeys.indexOf(key)==-1)
                    this.metadataTable.push({'key': key, 'value': this.datasetMetadata[key]});

            this.breadcrumb.push({text: this.datasetMetadata.displayName, active: true});
        });
        this.$axios.get("/api/datasets/" + this.datasetId + "/samples").then(res => {
            this.samples = res.data;
            this.sampleGroups = this._sampleGroupsForPlotlyTrace(this.samples);
            this.selectedSampleGroup = this.sampleGroups[0];

            // PCA should be plotted after sample table construction
            this.$axios.get("/api/datasets/" + this.datasetId + "/pca?orient=dict").then(res => {
                this.pcaCoords = res.data["coordinates"];
                this.plotPCA();
            });
        })
    }
}
</script>

<style>
</style>
