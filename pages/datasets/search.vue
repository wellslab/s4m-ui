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
          <b-card title="iPSC Derived Samples" img-src="/img/StemCells.png" img-alt="Image" img-top>
            <b-card-text>
              Show datasets containing samples whose parental cell type has been designated as iPSC. 
            </b-card-text>
            <template #footer>
              <b-button href="#" @click="showDataset('iPSC')">Show</b-button>
            </template>
          </b-card>

          <b-card title="Atlas Datasets" img-src="/img/AtlasScreenshot2.png" img-alt="Image" img-top>
            <b-card-text>
              Explore the datasets which have been used to contruct our integrated atlases. 
            </b-card-text>
            <template #footer class="border-top-0">
              <b-button href="#" @click="showDataset('atlas')">Show</b-button>
            </template>
          </b-card>

          <b-card title="DC Datasets" img-src="/img/DendriticCell.png" img-alt="Image" img-top>
            <b-card-text>
              Explore the datasets which contain dendritic cells.
            </b-card-text>
            <template #footer>
              <b-button href="#" @click="showDataset('dc')">Show</b-button>
            </template>
          </b-card>
        </b-card-group>
      </b-tab>

      <b-tab title="Advanced search" class="text-center">
      </b-tab>
      
      <b-tab title="Search results" class="text-center">
        <h3 v-b-tooltip.hover :title="datasetDescription">{{datasetName}}</h3>
        <b-row class="my-2">
            <b-col class="col-md-9">
                showing {{currentPage*perPage - perPage + 1}} - {{currentPage*perPage>filteredRows.length? filteredRows.length : currentPage*perPage}} of {{filteredRows.length}} entries
            </b-col>
        <b-col class="col-md-3">
        <b-form-input v-model="refineSearchString" type="search" placeholder="refine search"></b-form-input>
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
        <b-pagination v-model="currentPage" :total-rows="filteredRows.length" :per-page="perPage" aria-controls="mainTable" 
                    first-text="First" last-text="Last" align="center" size="sm"></b-pagination>
        </div>
      </b-tab>
    </b-tabs>
</b-container>
</div>
</template>

<script>
export default {

    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Datasets', to: '/datasets/explore' },
                { text: 'Search and filter', active: true }
            ],
            searchString: null,
            refineSearchString: null,

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
        // Free text search
        search() {
            this.$axios.get("/api/search?query_string=" + this.searchString).then(res => {
                this.datasetName = 'Search Results [' + this.searchString + ']';
                this.datasetDescription = 'Results of a free text search.';
                this.datasetIds = res.data.map(item => item.dataset_id);
                this.setupTable();
                this.tabIndex = 2;
            });
        },

        // Show the dataset given by name (eg. atlas)
        showDataset(name) {
            let queryString = "";
            let dsName = "";
            let description = "";
            if (name=="atlas") {
                queryString = "projects=atlas";
                dsName = "Atlas Datasets";
                description = "Datasets from all atlases"
            }
            else if (name=="dc") {
                queryString = encodeURI("query_string=dendritic");
                dsName = "Dendritic Cell Datasets";
                description = "All datasets containing term 'dendritic'"
            }
            else if (name=="iPSC") {
                queryString = encodeURI("query_string=induced pluripotent");
                dsName = "iPSC Datasets";
                description = "All datasets containing term 'induced pluripotent'"
            }

            this.$axios.get("/api/search?" + queryString).then(res => {
                this.datasetName = dsName;
                this.datasetDescription = description;
                this.datasetIds = res.data.map(item => item.dataset_id);
                this.setupTable();
                this.tabIndex = 2;
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
