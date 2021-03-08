<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
  <b-tabs content-class="mt-3" v-model="tabIndex">
      <b-tab title="Search">
        <h3 class="text-center">Search datasets and samples</h3>
        <b-form-group class="mt-3" label-cols-md="5" content-cols-md="4" label-align-md="right" label="Search for a term or select from a pre-defined list below">
          <b-input-group>
            <b-form-input id="quickSearchInput" v-model="searchString" placeholder="eg. iPSC" @keyup.enter="search"></b-form-input>
            <b-input-group-append>
              <b-button variant="dark" @click="search">search</b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>

        <b-card-group deck>
          <b-card title="Atlas Datasets" img-src="/img/AtlasScreenshot2.png" img-alt="Image" img-top>
            <b-card-text>
              Explore the datasets which have been used to contruct our integrated atlases. 
            </b-card-text>
            <template #footer class="border-top-0">
              <b-button href="#" @click="showDataset('atlas')">Show</b-button>
            </template>
          </b-card>

          <b-card title="iPSC Derived Samples" img-src="/img/AtlasScreenshot2.png" img-alt="Image" img-top>
            <b-card-text>
              Show datasets containing samples whose parental cell type has been designated as iPSC. 
            </b-card-text>
            <template #footer>
              <b-button href="#" @click="showDataset('iPSC')">Show</b-button>
            </template>
          </b-card>

          <b-card title="DC Datasets" img-src="/img/AtlasScreenshot2.png" img-alt="Image" img-top>
            <b-card-text>
              Explore the datasets which contain dendritic cells.
            </b-card-text>
            <template #footer>
              <b-button href="#">Show</b-button>
            </template>
          </b-card>
        </b-card-group>
      </b-tab>

      <b-tab title="Advanced search" class="text-center">
      </b-tab>
      
      <b-tab title="Search results" class="text-center">
        <h3>{{datasetName}}</h3>
        <b-row>
          <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3" v-if="false">
              <b-card v-for="filter in filters" :key="filter.name" :header="filter.display" class="mt-2">
                  <b-list-group v-if="filter.selected==null">
                      <b-list-group-item v-for="(item,i) in filter.values" :key="item" class="d-flex justify-content-between border-0 py-1 px-0">
                          <b-link href="#" @click="filterTable(filter.name, item)">{{item}}</b-link>
                          <span class="badge badge-primary">{{filter.counts[i]}}</span>
                      </b-list-group-item>
                  </b-list-group>
                  <b-list-group v-else>
                      <b-list-group-item class="d-flex justify-content-between">{{filter.selected}}
                          <b-link href="#" @click="setFilter(filter.name)" class="badge badge-primary">clear</b-link>
                      </b-list-group-item>
                  </b-list-group>
              </b-card>
          </b-col>

          <b-col>
              <b-row class="my-2">
                  <b-col class="col-md-9">
                      showing {{currentPage*perPage - perPage + 1}} - {{currentPage*perPage>table.length? table.length : currentPage*perPage}} of {{table.length}} entries
                  </b-col>
              <b-col class="col-md-3">
              <b-form-input v-model="searchString" type="search" placeholder="refine search"></b-form-input>
              </b-col>
              </b-row>
              <div style="height:700px; overflow:auto;">
              <b-table id="mainTable" hover small sticky-header head-variant="light" :items="filteredRows" :fields="tableColumns"
              :per-page="perPage" :current-page="currentPage" :filter-included-fields="tableColumnsForFilter" 
              class="border-left">
                    <template v-slot:head(platform_type)="">
                        <b-form-select size="sm" v-model="selectedColumnValue.platform_type">
                            <option :value="undefined">[Platform Type]</option>
                            <option :value="option" v-for="option in columnValues.platform_type" :key="option">{{option}}</option>
                        </b-form-select>
                    </template>
                    <template v-slot:head(project)="">
                        <b-form-select size="sm" v-model="selectedColumnValue.project">
                            <option :value="undefined">[Project]</option>
                            <option :value="option" v-for="option in columnValues.project" :key="option">{{option}}</option>
                        </b-form-select>
                    </template>
                    <template #cell(display_name)="row">
                        <b-link :to="'/datasets/view?id=' + row.item.dataset_id" v-b-tooltip.hover title="Go to the page showing details for this dataset">{{row.value}}</b-link>
                    </template>
                    <template #cell(more)="row">
                        <b-link v-if="row.item.pubmed_id!=''" :href="'https://pubmed.ncbi.nlm.nih.gov/' + row.item.pubmed_id" target="_blank"
                                v-b-tooltip.hover title="Go to pubmed entry">pubmed</b-link>
                    </template>
                    <template #cell()="row">
                        <span v-b-tooltip.hover :title="row.value">{{row.value}}</span>
                    </template>
              </b-table>
              <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage" aria-controls="mainTable" 
                            first-text="First" last-text="Last" align="center" size="sm"></b-pagination>
              </div>
          </b-col>
        </b-row>    
      </b-tab>
    </b-tabs>
</b-container>
</div>
</template>

<script>
import storage_functions from "~/mixins/storage_functions.js"

export default {
    mixins: [storage_functions],

    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Datasets', active: true },
                { text: 'Search and filter', active: true }
            ],
            searchString: null,

            table: [],
            tableColumns: [{key:"display_name", label:"Name", sortable:true},
                           {key:"title", sortable:true, class:"truncate"},
                           {key:"samples", sortable:true},
                           {key:"cell_type", label:"Cell Types", sortable:true, class:"truncate"},
                           {key:"project", sortable:true},
                           {key:"platform_type", sortable:true},
                           "more",],
            tableColumnsForFilter: ["display_name", "title", "cell_type"],
            selectedColumnValue: {project:undefined, platform_type:undefined},
            currentPage: 1,
            perPage: 20,
            
            filters: [{'name':'platform_type','display':'Platform type', 'values':[], 'counts':[], 'selected':null},
                      {'name':'projects', 'display':'Project', 'values':['myeloid_atlas','blood_atlas','dc_atlas'], 'counts':[], 'selected':null}],
            // should really get this dynamically rather than hard code here
        }
    },

    computed: {
        // Values in store
        tabIndex: {
            get () { return this.$store.getters['datasets_search/getTabIndex'] },
            set (value) { this.$store.commit('datasets_search/setTabIndex', value) }
        },

        datasetName: {
            get () { return this.$store.getters['datasets_search/getDatasetName'] },
            set (value) { this.$store.commit('datasets_search/setDatasetName', value) }
        },

        datasetDescription: {
            get () { return this.$store.getters['datasets_search/getDatasetDescription'] },
            set (value) { this.$store.commit('datasets_search/setDatasetDescription', value) }
        },

        datasetIds: {
            get () { return this.$store.getters['datasets_search/getDatasetIds'] },
            set (value) { this.$store.commit('datasets_search/setDatasetIds', value) }
        },

        rows() {
            return this.table.length
        },

        // Return a list of unique values in each column which will be used for filtering
        columnValues() {
            const options = {};
            Object.keys(this.selectedColumnValue).forEach(column => {
                const values = this.table.map(row => row[column]);
                // Cheap and efficient way to get unique set of values
                options[column] = Array.from(new Set(values));
            });
            return options;
        },

        filteredRows() {
            return this.table.filter(row => {
                let keep = true;
                Object.keys(this.selectedColumnValue).forEach(key => {
                    keep = keep && (this.selectedColumnValue[key]===undefined || row[key]===this.selectedColumnValue[key]);
                })
                return keep;
            });
        },  
    },

    methods: {
        search() {

        },

        // Show the dataset given by name (eg. atlas)
        showDataset(name) {
            this.$axios.get("/api/search?projects=atlas").then(res => {
                this.datasetName = 'Atlas Datasets';
                this.datasetDescription = 'Datasets from all atlases';
                this.datasetIds = res.data.map(item => item.dataset_id);
                this.setupTable();
                this.tabIndex = 2;
            });

        },

        setFilterCounts() {
            let self = this;
            // Count number of items in a filter if no selection is made for that filter
            self.filters.filter(item => item.selected==undefined).forEach(function(filterObject) {
                filterObject.values.forEach(function(item,i) {    // count the number of rows of table matching this value
                    filterObject.counts[i] = self.table.filter(row => 
                        filterObject.name=='projects'? row[filterObject.name].indexOf(item)!=-1 : row[filterObject.name]==item
                    ).length;
                })
            });
        },

        // Function to set up the table of datasets based on filter selection, and calculates the counts of each item in the filter.
        // There are 2 ways to call this function - both ways makes a query to the api server:
        // - filterItem is defined: A selection has been made for filterName and filterItem (eg. platform_type=Microarray)
        // - filterName is defined but filterItem is undefined: Clearing selection on filterName.
        setFilter(filterName, filterItem) {
            let self = this;
            if (filterName!=undefined) // Set selected attribute to filterItem for matching filter
                self.filters.filter(item => item.name==filterName)[0].selected = filterItem;

            // Build query params based on selected eg ['platform_type=Microarray',..]
            let query = self.filters.filter(item => item.selected!=undefined).map(item => item.name + '=' + item.selected);

            // Add on any currently showing dataset ids
            self.table.forEach(item => query.push('dataset_id=' + item.dataset_id));

            self.$axios.get("/api/search?limit=50&" + query.join('&')).then(res => {
                self.table = res.data;
                self.setFilterCounts();

                // Save these dataset ids for later
                self.datasetName = self.datasetName + "[modified]";
                self.datasetIds = self.table.map(item => item.dataset_id);
            });

        },

        // Main function to set up the table of datasets.
        setupTable() {
            let self = this;
            let query = self.datasetIds.map(item => 'dataset_id=' + item);

            self.$axios.get("/api/search?" + query.join('&')).then(res => {
                self.table = res.data;
                self.table.forEach(row => {
                    row['project'] = row.projects.join(',');
                })
                //self.setFilterCounts();
            });
        },
    },
  
    mounted() {
        this.$axios.get("/api/values/datasets/platform_type").then(res => {
            this.filters[0].values = res.data;
            this.setupTable();
        });
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
