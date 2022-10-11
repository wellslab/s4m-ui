<template>
<b-container>
    <!-- <p>You can project samples from another dataset onto the atlas here. 
        This is useful for visualising the transcriptional distance between samples.
        The other dataset may be from Stemformatics, or your own.
    </p>
    <p>For more details on projecting your own data, including how to project single cell RNA-Seq data,
        see this <b-link to="/AtlasVignette/Stemformatics_atlas_projection_vignette.html" target="_blank">vignette</b-link>.
    </p> -->
    <!-- <b-form-select size="sm" v-model="selectedDataSource">
        <b-form-select-option value="null">[Select data source...]</b-form-select-option>
        <b-form-select-option value="Stemformatics">Stemformatics</b-form-select-option>
        <b-form-select-option value="User">Your own dataset</b-form-select-option>
    </b-form-select> -->

    <b-card v-if="this.selectedDataSource=='Stemformatics'" bg-variant="light" class="mt-3">
        <p>Select from the full list of datasets below. Start typing to quickly narrow down the choices.
        Go to <b-link to="/datasets/collections" target="_blank">search page</b-link> and find the name if you want to
        use a more detailed search.</p>
        <label for="dataset-select-input">Select a dataset</label>
        <b-form-input size="sm" list="input-list" id="dataset-select-input" v-model="selectedDataset" placeholder="[author_year_pubmed-id]"></b-form-input>
        <b-form-datalist id="input-list" :options="possibleDatasets"></b-form-datalist>
    </b-card>

    <!-- selectedDataSource -->
    <b-card v-if="this.selectedDataSource=='User'" bg-variant="light" class="mt-3">
        <p>Select expression matrix and sample description files to upload. Both files need to be in
            tab separated format, with Ensembl gene ids or symbols as row ids and sample ids as column names. You can download example
            <a href="https://data.stemformatics.org/files/notta_expression.tsv">expression matrix</a> and
            <a href="https://data.stemformatics.org/files/notta_samples.tsv">sample description</a> files, if you want to
            examine the exact format.
        </p>
        <!-- <b-form-group label="Name:" label-for="test-dataset-name-input" label-align-md="right" content-cols-md="8">
            <b-input-group size="sm" style="width: 360px">
            <b-form-input id="test-dataset-name-input" v-model="testDatasetName"
                placeholder="[short name for dataset]" size="sm"></b-form-input>
            </b-input-group>
        </b-form-group>
        <b-form-group label="Expression file:" label-for="test-dataset-expression-input" label-align-md="right" content-cols-md="8">
            <b-form-file id="test-dataset-expression-input" v-model="testDatasetExpression" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="Samples file:" label-for="test-dataset-samples-input" label-align-md="right" content-cols-md="8">
            <b-form-file id="test-dataset-samples-input" v-model="testDatasetSamples" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="Sample column:" label-for="test-dataset-column-input" label-align-md="right" content-cols-md="8">
            <b-form-input id="test-dataset-column-input" v-model="testDatasetColumn" placeholder="[sample column to show on plot]" size="sm"></b-form-input>
        </b-form-group> -->

        <b-form-group label="Name:" label-for="test-dataset-name-input">
            <b-input-group size="sm" style="width: 360px">
            <b-form-input id="test-dataset-name-input" v-model="testDatasetName"
                placeholder="[short name for dataset]" size="sm"></b-form-input>
            </b-input-group>
        </b-form-group>
        <b-form-group label="Expression file:" label-for="test-dataset-expression-input">
            <b-form-file id="test-dataset-expression-input" v-model="testDatasetExpression" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="Samples file:" label-for="test-dataset-samples-input">
            <b-form-file id="test-dataset-samples-input" v-model="testDatasetSamples" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="Sample column:" label-for="test-dataset-column-input" style="width: 360px">
            <b-form-input id="test-dataset-column-input" v-model="testDatasetColumn" placeholder="[sample column to show on plot]" size="sm"></b-form-input>
        </b-form-group>
    </b-card>

    <div class="mt-3">
        <b-button size="sm" @click="projectData" :disabled="showLoading">Project</b-button>
        <!-- <b-button @click="errorMessage=null; showError=false; $emit('close')" class="mx-1">close</b-button> -->
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
            // selectedDataSource: null,   // one of ["Stemformatics","User"]
            showLoading: false,
            loadingTime: 0,
            interval: null,
            // formData: new FormData(),   // this will be emitted with an event when ready to project

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
            // this.formData.append("data_source", this.selectedDataSource);
            formData.append("data_source", this.selectedDataSource);
            // console.log(this.type);

            // if (this.selectedDataSource==null) {
            //     this.$bvModal.msgBoxOk("Select data source first");
            //     return;
            // }
            
            // Change from this.selectedDataSource to this.type
            if (this.selectedDataSource=="Stemformatics") {
                if (this.selectedDataset==null) {
                    this.$bvModal.msgBoxOk("Select a dataset first from autocomplete drop-down (even if you paste the exact name of the dataset).");
                    return;
                }
                // this.formData.append("name", this.selectedDataset);
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
                // this.formData.append("test_name", this.testDatasetName);
                // this.formData.append("test_expression", this.testDatasetExpression);
                // this.formData.append("test_samples", this.testDatasetSamples);
                // this.formData.append("test_sample_column", this.testDatasetColumn);
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
        // console.log(this.formData);
    }
}
</script>

<style>
</style>
