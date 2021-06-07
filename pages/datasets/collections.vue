<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <h3 class="text-center">View dataset collections</h3>
    <b-form-group class="mt-3" label-cols-md="5" content-cols-md="4" label-align-md="right" 
        label="Search for a term or select a pre-defined collection below">
        <b-input-group>
        <b-form-input v-model="searchString" placeholder="eg. iPSC" @keyup.enter="search"></b-form-input>
        <b-input-group-append>
            <b-button variant="dark" @click="search">search</b-button>
        </b-input-group-append>
        </b-input-group>
    </b-form-group>

    <b-card-group deck>
        <b-card no-body img-src="/img/StemCells.png" img-alt="Stem cells image" img-top>
            <b-card-body>
                <b-link @click="showDatasetCollection('iPSC')"><h4>iPSC Derived Samples</h4></b-link>
                <b-card-text>
                    Show datasets containing the term 'induced pluripotent'. 
                </b-card-text>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/AtlasScreenshot2.png" img-alt="Atlas image" img-top>
            <b-card-body class="border-top border-gray-200">
                <b-link @click="showDatasetCollection('atlas')"><h4>Atlas Datasets</h4></b-link>
                <b-card-text>
                    Explore the datasets which have been used to contruct our integrated atlases. 
                </b-card-text>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/DendriticCell.png" img-alt="Image" img-top>
            <b-card-body>
                <b-link @click="showDatasetCollection('dc_cell_types')"><h4>DC Datasets</h4></b-link>
                <b-card-text>
                    Explore the datasets which contain dendritic cells. 
                </b-card-text>
            </b-card-body>
        </b-card>
    </b-card-group>
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
                { text: 'Datasets', to: '/datasets/explore' },
                { text: 'collections', active: true }
            ],
            searchString: null,
            datasetCollection: {
                "iPSC": {title: "iPSC datasets",
                        description: "All datasets containing the term 'induced pluripotent'.",
                        apiParams: {'query_string':'induced pluripotent'}},
                "atlas": {title: "All atlas datasets",
                        description: "Datasets which have been used to contruct any of our integrated atlases.",
                        apiParams: {'projects':'atlas'}},
                "dc_cell_types": {title: "DC datasets",
                        description: "All datasets containing the term 'dendritic'.",
                        apiParams: {'query_string':'dendritic'}},
            },
        }
    },

    computed: {
    },

    methods: {
        // Free text search - use URLSearchParams and toString method for more robust transfer of query parameters
        search() {
            let params = new URLSearchParams();
            params.append('title', 'Search results [' + this.searchString + ']');
            params.append('description', 'Results of a free text search.');
            params.append('include_samples_query', 'true');
            params.append('query_string', this.searchString);
            this.$router.push("/datasets/filter?" + params.toString());
        },

        // Go to /datasets/filter page, with search parameters for the collection, which will be passed onto the page.
        // Currently both dc and iPSC tables are just making a simple query for text search - hence not very precise.
        // Atlas table is a bit better as it looks for datasets with project field.
        showDatasetCollection(name) {
            let collection = this.datasetCollection[name];
            // Build query parameters using URLSearchParams
            let params = new URLSearchParams();
            params.append('title', collection.title);
            params.append('description', collection.description);
            for (const [key, value] of Object.entries(collection.apiParams)) {
                params.append(key, value);
            }
            this.$router.push("/datasets/filter?" + params.toString());
        },

    },
  
    mounted() {
    }
}
</script>

<style>
fieldset div.form-row {
  justify-content: center;
}
div.card-header {
  padding: 0.5rem;
}
.truncate {
    max-width: 250px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
