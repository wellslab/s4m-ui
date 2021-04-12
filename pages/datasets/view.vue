<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <div class="text-center">
    <h3 class="my-3">
        <b-link to="/datasets/search" v-b-tooltip.hover.bottom title="Use the search page under Datasets menu to change dataset">
            {{datasetMetadata.displayName}}
        </b-link>
    </h3>
    </div>
    <b-card no-body>
    <b-tabs card pills align="center">
        <b-tab title="Overview" active>
            <div class="col-md-7 m-auto text-center">
                <p>{{datasetMetadata.title}}</p>
                <b-form inline class="justify-content-center mt-4">
                    PCA of log normalised expression, coloured by 
                    <b-form-select size="sm" v-model="selectedSampleGroup" :options="sampleGroups" @change="plotPCA()" class="ml-1"></b-form-select>
                </b-form>
            </div>
            <div id="pcaPlotDiv" class="text-center"></div>
        </b-tab>

        <b-tab title="Details">
            <b-table-simple hover small>
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
            <p class="text-center">
                {{samples.length}} samples
                <b-dropdown text="project onto">
                    <b-dropdown-item @click="projectData('myeloid')">Myeloid atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('blood')">Blood atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('dc')">DC atlas</b-dropdown-item>
                </b-dropdown>
            </p>
            <b-table hover sticky-header="500px" :items="samples" class="small mt-2"></b-table>
        </b-tab>

        <b-tab title="Genes">
            Coming soon: Show interesting genes for this dataset - most variable genes across cell types, markers genes for cell types, etc.
        </b-tab>

        <b-tab title="Download">
            <p>Download files for this dataset in tab-separated text format here.</p>
            <p><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetMetadata.dataset_id + '/samples?as_file=true'">Sample table</b-link></p>
            Expression files
            <ul v-if="datasetMetadata.platform_type=='RNASeq'">
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetMetadata.dataset_id + '/expression?as_file=true'">
                    raw counts file summarised at Ensembl gene id (unnormalised)</b-link></li>
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetMetadata.dataset_id + '/expression?as_file=true&key=cpm'">
                    cpm (counts per million) file with Ensembl gene ids</b-link></li>
            </ul>
            <ul v-if="datasetMetadata.platform_type=='Microarray'">
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetMetadata.dataset_id + '/expression?as_file=true'">
                    normalised expression values at probe id (background corrected)</b-link></li>
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetMetadata.dataset_id + '/expression?as_file=true&key=genes'">
                    log normalised expression values at gene id (highest value of probe used for each gene)</b-link></li>
            </ul>
        </b-tab>

        <b-tab title="History">
            <p>Description of how this dataset was processed and key QC decisions made: coming soon...</p>
        </b-tab>
    </b-tabs>
    </b-card>
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
        },
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
                let z = sampleIds[groupItems[i]].map(item => self.pcaCoords['2'][item]);
                let name = groupItems[i] + " (" + x.length + ")";
                traces.push({x:x, y:y, z:z, mode:'markers', type:'scatter3d' , name:name});
            }
            let layout = {margin: {t:20, l:0, r:0, b:0}, scene:{xaxis:{title:'PC1'}, yaxis:{title:'PC2'}, zaxis:{title:'PC3'}}};
            Plotly.newPlot('pcaPlotDiv', traces, layout);
        },

        projectData(atlasType) {
            alert("Coming soon!");
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
            
            // Create a shorter version of authors
            let authors = this.datasetMetadata.authors.split(', ');
            if (authors.length>3) {
                authors = authors.splice(0,3);
                authors.push('et.al.');
                this.datasetMetadata.authorsShort = authors.join(', ');
            } else
                this.datasetMetadata.authorsShort = this.datasetMetadata.authors;

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
            // don't include these in sample groups
            const hideKeys = ["sample_description","external_source_id"];
            this.sampleGroups = this._sampleGroupsForPlotlyTrace(this.samples).filter(item => hideKeys.indexOf(item)==-1);
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
.nav-pills .nav-link.active, .nav-pills .show > .nav-link {
    color: #000;
    background-color: #dee2e6;
}
</style>
