<template>
<b-container>
    <p>You can project samples from another dataset onto the atlas here. 
        This is useful for visualising the transcriptional distance between samples.
        The other dataset may be from Stemformatics, or your own.
    </p>
    <p>For more details on projecting your own data, including how to project single cell RNA-Seq data,
        see this <b-link to="/AtlasVignette/Stemformatics_atlas_projection_vignette.html" target="_blank">vignette</b-link>.
    </p>
    <b-form-select v-model="selectedDataSource">
        <b-form-select-option value="null">[Select data source...]</b-form-select-option>
        <b-form-select-option value="Stemformatics">Stemformatics</b-form-select-option>
        <b-form-select-option value="User">Your own dataset</b-form-select-option>
    </b-form-select>

    <b-card v-if="selectedDataSource=='Stemformatics'" bg-variant="light" class="mt-3">
        <p>Select from the full list of datasets below. Start typing to quickly narrow down the choices.
        Go to <b-link to="/datasets/search" target="_blank">search page</b-link> and find the name if you want to
        use a more detailed search.</p>
        <label for="dataset-select-input">Select a dataset</label>
        <b-form-input list="input-list" id="dataset-select-input" v-model="selectedDataset" placeholder="[author_year_pubmed-id]"></b-form-input>
        <b-form-datalist id="input-list" :options="possibleDatasets"></b-form-datalist>
    </b-card>

    <b-card v-if="selectedDataSource=='User'" bg-variant="light" class="mt-3">
        <p>Select expression matrix and sample description files to upload. Both files need to be in
            tab separated format, with Ensembl gene ids or symbols as row ids and sample ids as column names. You can download example
            <a href="https://data.stemformatics.org/files/notta_expression.tsv">expression matrix</a> and
            <a href="https://data.stemformatics.org/files/notta_samples.tsv">sample description</a> files, if you want to
            examine the exact format.
        </p>
        <b-form-group label="name:" label-for="test-dataset-name-input" label-align-md="right" content-cols-md="8">
            <b-form-input id="test-dataset-name-input" v-model="testDatasetName"
                placeholder="[short name for dataset]" size="sm"></b-form-input>
        </b-form-group>
        <b-form-group label="expression file:" label-for="test-dataset-expression-input" label-align-md="right" content-cols-md="8">
            <b-form-file id="test-dataset-expression-input" v-model="testDatasetExpression" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="samples file:" label-for="test-dataset-samples-input" label-align-md="right" content-cols-md="8">
            <b-form-file id="test-dataset-samples-input" v-model="testDatasetSamples" size="sm"></b-form-file>
        </b-form-group>
        <b-form-group label="sample column:" label-for="test-dataset-column-input" label-align-md="right" content-cols-md="8">
            <b-form-input id="test-dataset-column-input" v-model="testDatasetColumn" placeholder="[sample column to show on plot]" size="sm"></b-form-input>
        </b-form-group>
    </b-card>

    <b-card class="border-0 text-right">
        <b-progress v-show="selectedDataSource!=null" :value="uploadProgress" :max="uploadProgressMax" class="mb-3"></b-progress>
        <b-button @click="$emit('close')" class="mx-1">close</b-button>
        <b-button @click="projectData" :disabled="showLoading">project</b-button>
    </b-card>
</b-container>
</template>

<script>
export default {
    props: ["atlasType"],

    data: function () {
        return {
            selectedDataSource: null,   // one of ["Stemformatics","User"]
            showLoading: false,
            formData: new FormData(),   // this will be emitted with an event when ready to project

            // For Stemformatics datasets
            possibleDatasets: [],   // actual list of entries in the autocomplete
            selectedDataset: null,    // name selected Stemformatics dataset "Alves_2012_22927939"

            // For user's own datasets
            testDatasetName: '',
            testDatasetExpression: null,
            testDatasetSamples: null,
            testDatasetColumn: '',

            uploadProgress: 0,
            uploadProgressMax: 100,
        }
    },

    methods: {

        // Should run when we want to project the dataset.
        projectData() {
            let self = this;
            self.formData.append("data_source", self.selectedDataSource);

            if (self.selectedDataSource==null) {
                this.$bvModal.msgBoxOk("Select data source first");
                return;
            }
            else if (self.selectedDataSource=="Stemformatics") {
                if (self.selectedDataset==null) {
                    this.$bvModal.msgBoxOk("Select a dataset first from autocomplete drop-down (even if you paste the exact name of the dataset).");
                    return;
                }
                self.formData.append("name", self.selectedDataset);
            }
            else {
                // Validate some fields
                if (self.testDatasetName==null || self.testDatasetName=="") {
                    this.$bvModal.msgBoxOk("Name must be supplied, as it is used to identify the projected samples.");
                    return;
                }
                else if (self.testDatasetExpression==null || self.testDatasetSamples==null) {
                   this.$bvModal.msgBoxOk("Expression and samples files must be supplied.");
                   return;
                }
                self.formData.append("test_name", self.testDatasetName);
                self.formData.append("test_expression", self.testDatasetExpression);
                self.formData.append("test_samples", self.testDatasetSamples);
                self.formData.append("test_sample_column", self.selectedSampleColumn);
            }

            self.showLoading = true;
            self.$axios.post('/api/atlas-projection/' + self.atlasType + '/' + self.selectedDataSource, 
                             self.formData, { headers: {'Content-Type': 'multipart/form-data'},
                                              onUploadProgress: data => { //Set the progress value to show the progress bar
                                                  // We set max at 95 instead of 100 to leave a little room for projection time
                                                  // since this just gives feedback for file upload time.
                                                  this.uploadProgress = Math.round((95 * data.loaded) / data.total)
                                              }
                    }).then(res => {
                    if (res.data.error=='') {
                        self.$emit('project-data', res.data);
                        self.$emit('close');
                    }
                    else {
                        this.$bvModal.msgBoxOk("There was an error while projecting this data: " + res.data.error);
                    }
                }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while projecting this data: " + error.reponse.data)
                ).then(() => {
                    self.showLoading = false;
                    self.uploadProgress = 0;
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
