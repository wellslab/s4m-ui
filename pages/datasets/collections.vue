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
        <b-card no-body img-src="/img/AtlasScreenshot2.png" img-alt="Atlas image" img-top>
            <b-card-body class="border-top border-gray-200">
                <b-link @click="showDatasetCollection('atlas')"><h4>Atlas Datasets</h4></b-link>
                <b-card-text>
                    Explore the datasets which have been used to contruct our integrated atlases. 
                </b-card-text>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/DendriticCell.png" img-alt="Dendritic cell image" img-top>
            <b-card-body>
                <b-link @click="showDatasetCollection('all')"><h4>All datasets</h4></b-link>
                <b-card-text>
                    Show all publicly available human datasets. 
                </b-card-text>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/Leukemia.png" img-alt="Leukemia mage" img-top>
            <b-card-body class="border-top border-gray-200">
                <b-link @click="showDatasetCollection('leukaemia')"><h4>Leukemia Datasets</h4></b-link>
                <b-card-text>
                    Explore the datasets which contain the term 'leukemia'. 
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
                "all": {title: "All datasets",
                        description: "All public datasets (human).",
                        apiParams: {}},
                "atlas": {title: "All atlas datasets",
                        description: "Datasets which have been used to contruct any of our integrated atlases.",
                        apiParams: {'projects':'atlas'}},
                "leukaemia": {title: "Leukemia datasets",
                        description: "All datasets containing the term 'leukemia'.",
                        apiParams: {'query_string':'leukemia'}},
            },
        }
    },

    computed: {
    },

    methods: {
        // Free text search 
        search() {
            let params = {'title': 'Search results [' + this.searchString + ']',
                          'description': 'Results of a free text search.',
                          'include_samples_query': 'true',
                          'query_string': this.searchString};
            this.$router.push({path: "/datasets/filter", query:params});
        },

        // Go to /datasets/filter page, with search parameters for the collection, which will be passed onto the page.
        // Currently both dc and iPSC tables are just making a simple query for text search - hence not very precise.
        // Atlas table is a bit better as it looks for datasets with project field.
        showDatasetCollection(name) {
            let collection = this.datasetCollection[name];
            let params = {'title': collection.title,
                          'description': collection.description};
            for (const [key, value] of Object.entries(collection.apiParams)) {
                params[key] = value;
            }
            this.$router.push({path: "/datasets/filter", query:params});
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
