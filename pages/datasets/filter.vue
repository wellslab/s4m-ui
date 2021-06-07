<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <b-row>
        <!-- Filter area -->
        <b-col class="col-12 col-sm-12 col-md-3 bg-secondary mx-3">
            <div class="sticky-top pt-4 pl-2">
                <h4>Filter datasets
                    <b-link v-b-tooltip.hover.right title="More information" v-b-toggle.sidebar class="ml-2"><b-icon-info-circle></b-icon-info-circle></b-link>
                </h4>
                <div v-for="item in filters" :key="item.key" class="mt-2">
                    <b>{{item.key}}</b>
                    <div v-if="item.key=='Platform Type'">
                        <b-form-radio v-model="item.selectedRadio" value="null" @change="applyFilter">All platform types</b-form-radio>
                        <b-form-radio v-for="(value,i) in item.values.slice(0,7)" :key="value" v-model="item.selectedRadio" :value="value" @change="applyFilter">
                            {{value}} ({{item.counts[i]}})
                        </b-form-radio>
                    </div>
                    <div v-else>
                        <b-form-checkbox v-for="(value,i) in item.values.slice(0,7)" :key="value" v-model="item.selected[i]" @change="applyFilter">
                            {{value}} ({{item.counts[i]}})
                        </b-form-checkbox>
                    </div>
                    <b-link v-if="item.values.length>7" @click="showFilterValues(item)" class="ml-3">{{item.values.length-7}} more...</b-link>
                </div>
            </div>
        </b-col>

        <b-col class="overflow-auto mt-4">
            <h3 class="text-center">{{collectionName}} ({{filteredTotal}} of {{totalRecords}})
                <small>
                <b-spinner v-if="loading" label="Loading..." variant="secondary" class="ml-2" style="width:1.5rem; height:1.5rem;"></b-spinner>
                </small>
            </h3>
            
            <!-- control area -->
            <b-form inline class="justify-content-between mt-3 mb-2">
                <div>
                <b-link v-if="paginationStart>0" @click="movePage('previous')">&#x2039; Prev</b-link>
                <span class="mx-1">[{{paginationStart+1}} of {{Math.ceil(filteredTotal/9)}} pages]</span>
                <b-link v-if="(paginationStart+1)*9<filteredTotal" @click="movePage('next')">Next &#x203A;</b-link>
                </div>
                <div>
                <b-form-select v-model="selectedSortField" :options="sortFields" @change="sortDatasets" class="bg-light small-select ml-2"></b-form-select>
                <b-dropdown text="tools" class="ml-1 text-right">
                    <b-dropdown-item @click="viewAsTable">View as table</b-dropdown-item>
                    <b-dropdown-item @click="viewAsTable">Export all API</b-dropdown-item>
                </b-dropdown>
                </div>
            </b-form>

            <!-- grid area -->
            <b-card-group deck v-for="(row,rowIndex) in numberOfRows" :key="row">
                <b-card v-for="(col,colIndex) in 3" :key="col" no-body
                    :class="datasetFromGrid(rowIndex,colIndex)!=null? 'my-1' : 'my-1 border-0'">
                    <!-- Trick to avoid continuously referencing datasetFromGrid function here. This way dataset holds the result of 
                    the function inside a one-time loop (https://stackoverflow.com/questions/54446108/how-to-define-variable-in-vue-template). -->
                    <template v-for="dataset in [datasetFromGrid(rowIndex,colIndex)]">
                        <b-card-body v-if="dataset!=null" :key="dataset.dataset_id" class="d-flex flex-column">
                            <b-card-title><b-link :to="'/datasets/view?id='+dataset.dataset_id">{{dataset.display_name}}</b-link></b-card-title>
                            <b-card-text>
                                <ul>
                                <li>{{dataset.samples}} samples</li>
                                <li>{{dataset.cell_type.split(',').length}} cell types</li>
                                <li>{{dataset.platform_type}}</li>
                                </ul>
                                <b-button v-for="item in parsedCelltypes(dataset.cell_type)" :key="item" pill class="celltype" size="sm">
                                    {{item}}
                                </b-button>
                            </b-card-text>
                        </b-card-body>
                    </template>
                </b-card>
            </b-card-group>
        </b-col>
    </b-row>
</b-container>

<!-- Show filter values (modal) -->
<b-modal v-model="showFilterValuesModal" :title="'Filter by ' + selectedFilter.key" hide-footer>
    <b-card no-body class="border-0">
        <p>Note that one dataset usually contains many cell types or tissues, so selecting multiple values here is equivalent
            to selecting all datasets which contain at least one of the selected values.</p>
        <div class="overflow-auto" style="max-height:500px">
        <b-form-checkbox v-for="(value,i) in selectedFilter.values" :key="value" v-model="selectedFilter.selected[i]">
            {{value}} ({{selectedFilter.counts[i]}})
        </b-form-checkbox>
        </div>
        <b-button-group>
            <b-button @click="applyFilter" class="mt-2">Apply</b-button>
            <b-button @click="showFilterValuesModal=false" class="mt-2 ml-2">Cancel</b-button>
        </b-button-group>
    </b-card>
</b-modal>

<b-sidebar id="sidebar" title="More info on filtering" shadow>
    <div class="px-3 py-2">
        <p>Selecting multiple filter values here selects all datasets which contain at least one of the selected values.
            For example, selecting cell types "hESC" and "iPSC" will show datasets containing at least one sample of
            "hESC" OR "iPSC".
        </p>
        <p>Platform type is simpler, as there is a one-to-one relationship with datasets rather than 
            many-to-one.
        </p>
        <p>
            Remove all filters to show the original unfiltered dataset collection. 
        </p>
  </div>
</b-sidebar>

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
                { text: 'Filter datasets', active: true }
            ],
            loading: true,
            searchString: null,

            datasets: [],   // array of dataset objects returned by api query
            totalRecords: 0,    // total number of datasets available through query, including those not returned in this pagination
            filteredTotal: 0,   // total number of datasets returned after applying filters, including those not returned in this pagination
            counts:{}, // for filtering

            collectionName: 'All datasets',
            collectionDescription: 'All publicly available datasets in Stemformatics',
            apiQuery: {},

            sortFields: ['name: a-z','name: z-a','number of samples: low-high','number of samples: high-low','year: low-high','year: high-low'],
            queryFromSortField: [['display_name','true'],
                                 ['display_name','false'],
                                 ['samples','true'],
                                 ['samples','false'],
                                 ['year','true'],
                                 ['year','false']],
            selectedSortField: 'name: a-z',

            filters: ['Project','Platform Type','cell_type','tissue_of_origin'].map(item => {
                return {key:item, values:[], counts:[], selected:[], selectedRadio:null}
            }),
            showFilterValuesModal: false,
            selectedFilter: {},

            paginationStart: 0,
        }
    },

    computed: {
        numberOfRows() {
            return Math.ceil(this.datasets.length/3);
        }
    },

    methods: {
        // gridElementIsDataset(rowIndex,colIndex) {
        //     return rowIndex<this.numberOfRows-1 || (this.datasets.length % 3)==0 || colIndex<(this.datasets.length % 3); 
        // },

        // shortenedText(text, length) {
        //     return text.length>length? text.substring(0, length) + '...' : text;
        // },

        // Given an object with values, eg {'a':10, 'b':15, 'c':3}, return an array which has been sorted
        // according to values from highest to lowest: eg. [['b','a','c'],[15,10,3]]
        _sortedValues(values) {
            let combined = Object.keys(values).map(item => [item,values[item]]);
            combined.sort((a,b) => a[1] > b[1]? -1 : 1);
            return[combined.map(item => item[0]), combined.map(item => item[1])];
        },

        // Return the dataset object inside datasets array, given rowIndex,colIndex of the grid.
        datasetFromGrid(rowIndex, colIndex) {
            const index = rowIndex*3+colIndex;
            return index<this.datasets.length? this.datasets[index]: null;
        },

        // With cell types being shown as buttons, if the words are too long it doesn't work,
        // so parse the entire cell types string (eg.'ESC,iPSC,...') and return a sensible array
        // eg ['ESC','iPSC',...]
        parsedCelltypes(celltypes) {
            const maxSize = 3; // how many entries to return
            const maxChars = 20;    // max size of the word in each entry
            let elements = celltypes.split(',').filter(item => item!='');   // 'ESC,,iPSC' >> ['ESC','iPSC']
            elements = elements.map(item => item.length>maxChars? item.split(' ')[0]: item);    // take first word only if word is too long
            elements = elements.filter(item => item.length<=maxChars); // remove item if first word is still too long
            return Array.from(new Set(elements)).splice(0, maxSize);   // unique values only
        },

        // Main method to call api to fetch datasets based on the query.
        // query should be an object, which has title, description and other params, and these will all be 
        // converted into get parameters for the api call. Note that title and description will be used by
        // this page, rather than by the api, so this assumes that api call we're making does not contain
        // title or description as keys.
        getDatasets(query) {
            // Convert query into URLSearchParams object, which can handle duplicate keys.
            // Note that /datasets/filter?dataset_id=6167&dataset_id=6218 will look like {dataset_id:[6167,6218]}
            // inside query. We can use append method in URLSearchParams object to handle this.
            if (Object.keys(query).length==0) { // we try to get it from localStorage
                let queryFromStorage = JSON.parse(localStorage.getItem('s4m:datasets_filter.apiQuery'));
                if (queryFromStorage!=null) {
                    query = queryFromStorage;
                }
            } 
            query['pagination_limit'] = 9;  // default params to the api call - fetches all datasets
            if (!('pagination_start' in query)) // unspecified starting point from query, so get from UI
                query['pagination_start'] = this.paginationStart;

            this.collectionName = query.title;
            this.collectionDescription = query.description;
            
            let params = new URLSearchParams();
            for (const [key, value] of Object.entries(query)) {
                if (Array.isArray(value)) {
                    for (const val of value) {
                        params.append(key, val);
                    }
                } else {
                    params.append(key, value);
                }
            }

            this.$axios.get("/api/search/datasets",{params: params}).then(res => {
                this.datasets = res.data.results;
                this.counts = res.data.counts;
                this.totalRecords = res.data.total;
                this.filteredTotal = res.data.filtered_total;
                
                // Some modifications to values used filters and sorting
                this.datasets.forEach(item => {
                    item['year'] = item.name.split('_')[1];
                    // item['Project'] = item['projects'].length==0? '[unassigned]': item['projects'].join(',');
                    // item['Platform Type'] = item.platform_type;
                    // item['cell_type'] = item['cell_type'].split(',').map(value => value==''? '[unknown]':value).join(',');
                    // item['tissue_of_origin'] = item['tissue_of_origin'].split(',').map(value => value==''? '[unknown]':value).join(',');
                });

                // Set filters
                this.filters.forEach(filterItem => {
                    [filterItem.values, filterItem.counts] = this._sortedValues(this.counts[filterItem.key]);
                });

                // Save all states to localStorage
                localStorage.setItem('s4m:datasets_filter.apiQuery', JSON.stringify(query));

                // this.$router.push("/datasets/filter?" + params.toString());

            }).catch({}).then(res => {
                this.loading=false;
                this.apiQuery = query;
            });
        },

        // For filters with too many values to show immediately, use this to show all values in a modal
        showFilterValues(filter) {
            this.selectedFilter = filter;
            this.showFilterValuesModal = true;
        },

        // Apply a filter to the page - do this by modifying this.apiQuery object appropriately based on filterItem properties.
        applyFilter() {
            // Loop through all filters and create a query using all positively selected filters.
            this.filters.forEach(filterItem => {
                if (filterItem.key=='Platform Type') {  // has different structure for query value since it uses radio buttons
                    if (filterItem.selectedRadio==null || filterItem.selectedRadio=="null")
                        delete this.apiQuery['filter_platform_type'];
                    else
                        this.apiQuery['filter_platform_type'] = filterItem.selectedRadio;
                } else {
                    this.apiQuery['filter_' + filterItem.key] = filterItem.values.filter((item,i) => filterItem.selected[i]);
                }
            });
            // Reset paginationStart
            this.paginationStart = 0;
            this.getDatasets(this.apiQuery);
            this.showFilterValuesModal = false;
        },

        // Pagination. direction may be 'next' or 'previous'.
        movePage(direction) {
            if (direction=="next") 
                this.paginationStart += 1;
            else
                this.paginationStart -= 1;
            let query = this.apiQuery;
            query['pagination_start'] = this.paginationStart;
            this.getDatasets(query);
        },

        // Sorting
        sortDatasets() {
            let query = this.apiQuery;
            const sortQuery = this.queryFromSortField[this.sortFields.indexOf(this.selectedSortField)];
            query['sort_field'] = sortQuery[0];
            query['sort_ascending'] = sortQuery[1];
            this.getDatasets(query);
        },

        viewAsTable() {
            alert("Coming soon!");
        }
    },
  
    mounted() {
        this.getDatasets(this.$route.query);
    }
}
</script>

<style>
.celltype {
    background-color: #584e51;
    color: white;
    margin: 2px;
}
</style>
