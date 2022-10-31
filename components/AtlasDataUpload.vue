<template>
<b-container>
    <!-- Stemformatics Data -->
    <b-card v-if="this.selectedDataSource=='Stemformatics'" border-variant="light">
        <h5 class="text-center">Project Stemformatics data</h5>
        <p>You can project any Stemformatics dataset onto this atlas.
            Select from the full list of datasets below. Start typing to quickly narrow down the choices.
            Go to <b-link to="/datasets/collections" target="_blank">search page</b-link> and find the 
            name if you want to use a more detailed search.</p>
        <b-form inline>
            <label for="dataset-select-input" class="mr-2">Select a dataset</label>
            <b-form-input size="sm" list="input-list" id="dataset-select-input" v-model="selectedDataset" placeholder="[author_year_pubmed-id]"></b-form-input>
            <b-form-datalist id="input-list" :options="possibleDatasets"></b-form-datalist>
        </b-form>
    </b-card>

    <!-- Bulk data -->
    <b-card v-if="this.selectedDataSource=='User'" border-variant="light">
        <h5 class="text-center">Project bulk data</h5>
        <p>You can project your own bulk RNA-seq or microarray data. Select expression matrix and 
            sample description files to upload. Both files need to be in
            tab separated format, with Ensembl gene ids or symbols as row ids and sample ids as column names. 
            You can download example
            <a href="https://data.stemformatics.org/files/notta_expression.tsv">expression matrix</a> and
            <a href="https://data.stemformatics.org/files/notta_samples.tsv">sample description</a> files, 
            if you want to examine the exact format.
        </p>

        <b-row>
            <b-col>Name:</b-col> 
            <b-col cols="4"><b-form-input v-model="testDatasetName" placeholder="[name for dataset]" size="sm" class="ml-1"></b-form-input></b-col>
            <b-col cols="6">Short name used to identify query samples on the plot</b-col> 
        </b-row>
        <b-row class="mt-2">
            <b-col>Expression file:</b-col>
            <b-col cols="4"><b-form-file v-model="testDatasetExpression" size="sm" class="ml-1"></b-form-file></b-col>
            <b-col cols="6">Expression matrix file</b-col> 
        </b-row>
        <b-row class="mt-2">
            <b-col>Sample file:</b-col>
            <b-col cols="4"><b-form-file v-model="testDatasetSamples" size="sm" class="ml-1"></b-form-file></b-col>
            <b-col cols="6">Sample table file</b-col> 
        </b-row>
        <b-row class="mt-2">
            <b-col>Sample column:</b-col>
            <b-col cols="4"><b-form-input v-model="testDatasetColumn" placeholder="[sample column]" size="sm"></b-form-input></b-col>
            <b-col cols="6">Column from the sample table used to group samples (optional)</b-col> 
        </b-row>
    </b-card>

    <div class="mt-4 ml-2">
        <b-button size="sm" @click="projectData" variant="primary" :disabled="showLoading">Project</b-button>
        <b-spinner label="Loading..." variant="secondary" :style="{visibility: showLoading ? 'visible' : 'hidden'}" class="ml-2 align-middle"></b-spinner>
        <span :style="{visibility: showLoading ? 'visible' : 'hidden', color:'#ced4da'}" class="ml-1 align-middle"
            v-b-tooltip.hover title="It may take up to a minute for this analysis to complete">{{loadingTime}}s</span>
    </div>
</b-container>
</template>

<script>
export default {
    props: ["atlasType", "selectedDataSource"], 

    data: function () {
        return {
            showLoading: false,
            loadingTime: 0,
            interval: null,

            // For Stemformatics datasets
            possibleDatasets: [],   // actual list of entries in the autocomplete
            selectedDataset: null,    // name selected Stemformatics dataset "Alves_2012_22927939"

            // For user's own datasets
            testDatasetName: '',
            testDatasetExpression: null,
            testDatasetSamples: null,
            testDatasetColumn: '',
        }
    },

    methods: {

        // Should run when we want to project the dataset.
        // Changed from global formData variable to local formData variable to remove ReferenceError
        projectData() {
            let formData = new FormData(); 
            formData.append("data_source", this.selectedDataSource);
            
            // Change from this.selectedDataSource to this.type
            if (this.selectedDataSource=="Stemformatics") {
                if (this.selectedDataset==null) {
                    this.$bvModal.msgBoxOk("Select a dataset first from autocomplete drop-down (even if you paste the exact name of the dataset).");
                    return;
                }
                formData.append("name", this.selectedDataset);
            }
            else {
                // Validate some fields
                if (this.testDatasetName==null || this.testDatasetName=="") {
                    this.$bvModal.msgBoxOk("Name must be supplied, as it is used to identify the projected samples.");
                    return;
                }
                else if (this.testDatasetExpression==null || this.testDatasetSamples==null) {
                   this.$bvModal.msgBoxOk("Expression and samples files must be supplied.");
                   return;
                }
                formData.append("test_name", this.testDatasetName);
                formData.append("test_expression", this.testDatasetExpression);
                formData.append("test_samples", this.testDatasetSamples);
                formData.append("test_sample_column", this.testDatasetColumn);
            }

            this.showLoading = true;
            this.interval = setInterval(() => { this.loadingTime += 1; }, 1000);
            this.$axios.post('/api/atlas-projection/' + this.atlasType + '/' + this.selectedDataSource, 
                             formData, { headers: {'Content-Type': 'multipart/form-data'},
                }).then(res => {
                    if ('data' in res && res.data.error=='') {
                        this.$emit('project-data', res.data);
                        this.$emit('close');
                    }
                    else {
                        this.$bvModal.msgBoxOk("There was an error while projecting this data: " + res.data.error);
                    }
                }).catch(error => {
                    this.showLoading = false;
                    // Not sure why but $bvModal.msgBoxOk does not work inside catch
                    alert(error.response.data.message); 
                    //this.$bvModal.msgBoxOk("Unexpected error while projecting this data: " + error.reponse.data)
                }).then(() => {
                    this.showLoading = false;
                    clearInterval(this.interval);
                    this.loadingTime = 0;
                });
        },
        
    },

    mounted() {
        // Fetch names of possible stemformatics datasets from api
        this.$axios.get('/api/values/datasets/name').then(res => {
            this.possibleDatasets = res.data;
        });
    }
}
</script>

<style>
</style>
