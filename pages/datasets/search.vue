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
            <b-card no-body img-src="/img/StemCells.png" img-alt="Stem cells image" img-top>
                <b-card-body>
                    <b-link @click="showTable('iPSC')"><h4>iPSC Derived Samples</h4></b-link>
                    <b-card-text>
                        Show datasets containing samples whose parental cell type has been designated as iPSC. 
                    </b-card-text>
                </b-card-body>
            </b-card>

            <b-card no-body img-src="/img/AtlasScreenshot2.png" img-alt="Atlas image" img-top>
                <b-card-body class="border-top border-gray-200">
                    <b-link @click="showTable('atlas')"><h4>Atlas Datasets</h4></b-link>
                    <b-card-text>
                        Explore the datasets which have been used to contruct our integrated atlases. 
                    </b-card-text>
                </b-card-body>
            </b-card>

            <b-card no-body img-src="/img/DendriticCell.png" img-alt="Image" img-top>
                <b-card-body>
                    <b-link @click="showTable('dc')"><h4>DC Datasets</h4></b-link>
                    <b-card-text>
                        Explore the datasets which contain dendritic cells. 
                    </b-card-text>
                </b-card-body>
            </b-card>
        </b-card-group>
    </b-tab>

    <b-tab title="Advanced search" class="text-center">
        <h4>Coming soon</h4>
    </b-tab>
      
    <b-tab title="Search results" class="text-center">
        <h3 v-b-tooltip.hover :title="tableDescription">{{tableName}}</h3>
        <b-row class="my-2" align-h="between">
            <b-col class="col-md-7">
                showing {{currentPage*perPage - perPage + 1}} - {{currentPage*perPage>filteredRows.length? filteredRows.length : currentPage*perPage}} of {{filteredRows.length}} entries
            </b-col>
            <b-col class="col-md-2 text-right pr-0">
                <b-button size="sm" class="h-100" variant="dark" v-b-modal.column-selector>columns</b-button>
            </b-col>
            <b-col class="col-md-3 pl-1">
                <b-form-input v-model="refineSearchString" type="search" placeholder="refine search (coming soon)"></b-form-input>
            </b-col>
        </b-row>
        <b-modal id="column-selector" title="Select columns to show in the table (max 7)" @ok="setColumnsToShow(1)" @cancel="setColumnsToShow(0)">
            <b-form-group>
                <b-form-checkbox-group v-model="selectedTableColumns" :options="allTableColumns" name="selectedColumns" value-field="key" text-field="label" stacked>
                </b-form-checkbox-group>
            </b-form-group>
        </b-modal>

        <div style="height:700px; overflow:auto;">
            <b-table id="mainTable" hover small sticky-header head-variant="light" :items="filteredRows" :fields="tableColumns"
            :per-page="perPage" :current-page="currentPage" :filter-included-fields="tableColumnsForFilter" class="border-left">
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
                    <b-link :to="'/datasets/view?id=' + row.item.dataset_id" 
                            v-b-tooltip.hover.right title="Go to the page showing details for this dataset">{{row.value}}</b-link>
                </template>
                <template #cell(more)="row">
                    <b-link v-if="row.item.pubmed_id!=''" :href="'https://pubmed.ncbi.nlm.nih.gov/' + row.item.pubmed_id" target="_blank"
                            v-b-tooltip.hover.left title="Go to pubmed entry">pubmed</b-link>
                </template>
                <template #cell()="row">
                    <span v-b-tooltip.hover.right :title="row.value">{{row.value}}</span>
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
            // These are not actually all table columns fetched from API but these are available for user to choose from
            allTableColumns: [{key:"display_name", label:"Name", sortable:true},
                              {key:"title", label:"Title", sortable:true, class:"truncate"},
                              {key:"authors", label:"Authors", sortable:true, class:"truncate"},
                              {key:"description", label:"Description", class:"truncate"},
                              {key:"dataset_id", label:"Dataset Id", sortable:true},
                              {key:"name", label:"Short Name", sortable:true, class:"truncate"},
                              {key:"accession", label:"Accession", sortable:true, class:"truncate"},
                              {key:"samples", label:"Samples", sortable:true},
                              {key:"cell_type", label:"Cell Types", sortable:true, class:"truncate"},
                              {key:"project", label:"Project", sortable:true},
                              {key:"platform", label:"Platform", sortable:true, class:"truncate"},
                              {key:"platform_type", label:"Platform Type", sortable:true},
                              {key:"version", label:"Dataset Version", sortable:true},
                              {key:"more", label:"more"}],
            // selectedTableColumns supports user-selection via dialog OK/Cancel, hence is different from computed tableColumns 
            selectedTableColumns: ['display_name','title','samples','cell_type','project','platform_type','more'],   
            tableColumnsForFilter: ["display_name", "title", "cell_type"],
            currentPage: 1,
            perPage: 20,
            
            // column based filters
            filters: [{'name':'platform_type','display':'Platform type', 'values':[], 'counts':[], 'selected':null},
                      {'name':'projects', 'display':'Project', 'values':[], 'counts':[], 'selected':null}],
            selectedColumnValue: {project:undefined, platform_type:undefined},
        }
    },

    computed: {
        // Values in store (auto sync)
        tabIndex: {
            get () { return this.$store.getters['datasets_search/getTabIndex'] },
            set (value) { this.$store.commit('datasets_search/setTabIndex', value) }
        },

        tableName: {
            get () { return this.$store.getters['datasets_search/getTableName'] },
            set (value) { this.$store.commit('datasets_search/setTableName', value) }
        },

        tableDescription: {
            get () { return this.$store.getters['datasets_search/getTableDescription'] },
            set (value) { this.$store.commit('datasets_search/setTableDescription', value) }
        },

        datasetIds: {
            get () { return this.$store.getters['datasets_search/getDatasetIds'] },
            set (value) { this.$store.commit('datasets_search/setDatasetIds', value) }
        },

        // This is a subset of allTableColumns, and defines which columns are currently shown
        tableColumns: {
            get () { return this.$store.getters['datasets_search/getTableColumns'] },
            set (value) { this.$store.commit('datasets_search/setTableColumns', value) }
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

        // Array of table rows to use after filtering has been applied
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
        // Searching or selecting a pre-defined dataset will query the API server for matching dataset info
        // which will be used to popluate the table. The dataset ids from this query are also stored persistently
        // (see computed values that interact with store), so that we can come back to this page from elsewhere
        // and see the same table.

        // Free text search
        search() {
            this.$axios.get("/api/search/datasets?query_string=" + this.searchString).then(res => {
                this.tableName = 'Search Results [' + this.searchString + ']';
                this.tableDescription = 'Results of a free text search.';
                this.setupTable(res.data);
                this.tabIndex = 2;
            });
        },

        // Show the table given by name (eg. atlas). Makes a query to api and returns data to use in the table.
        // Currently both dc and iPSC tables are just making a simple query for text search - hence not very precise.
        // Atlas table is a bit better as it looks for datasets with project field.
        showTable(name) {
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

            this.$axios.get("/api/search/datasets?" + queryString).then(res => {
                this.tableName = dsName;
                this.tableDescription = description;
                this.setupTable(res.data);
                this.tabIndex = 2;
            });
        },

        // Main function to set up the table of datasets, given table data. Also sets datasetIds.
        setupTable(tableData) {
            this.datasetIds = tableData.map(item => item.dataset_id);
            this.table = tableData;
            this.table.forEach(row => {
                row['project'] = row.projects.join(',');
            })
        },

        setColumnsToShow(state) {
            let change = false;
            if (state==1) {
                if (this.selectedTableColumns.length<2) 
                    this.$bvModal.msgBoxOk('Select at least 2 columns');
                else if (this.selectedTableColumns.length>7)
                    this.$bvModal.msgBoxOk('Select at most 7 columns');
                else
                    change = true;
            }
            if (change)
                this.tableColumns = this.allTableColumns.filter(item => this.selectedTableColumns.indexOf(item.key)!=-1);
            else // return selectedTableColumns to previous state
                this.selectedTableColumns = this.tableColumns.map(item => item.key);
        }
    },
  
    mounted() {
        if (this.tableColumns==null || this.tableColumns.length==0) { // set initial set of table columns to show
            this.tableColumns = this.selectedTableColumns.map(col => this.allTableColumns.filter(item => item.key==col)[0]);
        }

        // Fetch any stored dataset ids and use these to query API to get table data
        let query = this.datasetIds.map(item => 'dataset_id=' + item);
        if (query.length==0) return;
        this.$axios.get("/api/search/datasets?" + query.join('&')).then(res => {
            this.setupTable(res.data);
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
