# An area to keep code and tips temporarily.

## Single cell data projection UI (in Atlas.vue) - prototype not implemented
<!-- Project single-cell data -->
<b-container v-show="projection_selectedView=='singlecell'">
    <b-card border-variant="light">
        <h5 class="text-center">Project single cell data (Coming soon)</h5>
        <p>You can project your own single cell data here. </p>
        <!-- Email -->
        <b-form-group id="input-group-1" label="Email address:" label-for="project-email-input" description="We'll send the results to your email.">
            <b-input-group size="sm" style="width: 360px">
            <b-input-group-prepend is-text>
                <b-icon icon="envelope"></b-icon>
            </b-input-group-prepend>
            <b-form-input :state="isEmailValid" disabled debounce="1000" style="width: 220px" id="project-email-input" v-model.lazy="singleCellData.email" placeholder="Enter email" required size="sm" class="project-email-input"></b-form-input>
            <b-form-invalid-feedback id="input-live-feedback">Enter a valid email.</b-form-invalid-feedback>
            </b-input-group>
        </b-form-group>
        <!-- Upload files -->
        <!-- Desired format can be found here. -->
        <b-form-group label="Single-cell data file:" label-for="project-data-input" description="Only .tsv files are accepted for online analysis.">
            <b-form-file disabled accept=".tsv" size="sm" v-model="singleCellData.data" drop-placeholder="Drop file here" placeholder="Choose a file or drop it here" id="project-data-input"></b-form-file>
        </b-form-group>
        <!-- Upload button -->
        <div class="form-group text-center">
            <b-button :disabled="singleCellData.email=='' || singleCellData.data==null" size="sm" variant="primary" class="upload-button text-center mt-1 rounded" @click="uploadSingleCell(); disableUploadButton()"> <b-icon icon="cloud-upload-fill"></b-icon>  Upload data</b-button>
            <b-spinner label="Loading..." variant="secondary" :style="{visibility: showLoading ? 'visible' : 'hidden'}" class="ml-2 align-middle"></b-spinner>
            <span :style="{visibility: showLoading ? 'visible' : 'hidden', color:'#ced4da'}" class="ml-1 align-middle"
                v-b-tooltip.hover title="It may take up to a minute for your data to be uploaded.">{{loadingTime}}s</span>
        </div>
    </b-card>
</b-container>

// Upload single-cell data projection
uploadSingleCell() {
    // Return if any of the data fields are empty
    if(this.singleCellData.email == "" || this.singleCellData.data == null) {
        return;
    }

    // Check file type - checking for .csv or .tsv at the moment.
    if(this.singleCellData.data.name.split('.').pop() != "tsv" && this.singleCellData.data.name.split('.').pop() != "csv") {
        alert("Wrong data type. Single-cell data file must be .tsv or .csv.");
        this.singleCellData.data = null;
        return;
    }

    // Check file size - if it is greater than 1 GB, then reset data file and return
    let GB = 1;
    if(this.singleCellData.data.size > GB * Math.pow(1024, 3)) {
        alert("Data file is too big. Ensure file size is less than 1 GB.");
        this.singleCellData.data = null;
        return;
    }

    let formData = new FormData();
    this.projection_selectedDataSource = "User-Single";

    formData.append("data_source", this.projection_selectedDataSource);
    formData.append("email", this.singleCellData.email);
    formData.append("data", this.singleCellData.data);  

    this.showLoading = true;
    this.interval = setInterval(() => { this.loadingTime += 1; }, 1000);
    this.$axios.post('/api/atlas-projection/' + this.atlasType + '/' + this.projection_selectedDataSource, 
        formData, { headers: {'Content-Type': 'multipart/form-data'},}).then(response => {
            this.showLoading = false;
            clearInterval(this.interval);
            this.loadingTime = 0;
        }).catch(error => {
            alert(error.response.data.message); 
        })
},

// Disable projection upload button for 15s after each upload
disableUploadButton() {
    const button = document.querySelector(".upload-button");
    button.disabled = true;

    // Set a timeout of 15s
    setTimeout(()=>{
        button.disabled = false;
    }, 15000);
},

// Check validity of email format using Regex
emailState() {
    const emailRegexp = new RegExp(/^[a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1}([a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1})*[a-zA-Z0-9]@[a-zA-Z0-9][-\.]{0,1}([a-zA-Z][-\.]{0,1})*[a-zA-Z0-9]\.[a-zA-Z0-9]{1,}([\.\-]{0,1}[a-zA-Z]){0,}[a-zA-Z0-9]{0,}$/i);
    return emailRegexp.test(this.singleCellData.email);
},


## URLs and routes
To get query parameters that was used to call a page, use this.$route.query on the page (typically in mounted()), which will be an object passed to the url as params.

To go to a particular url/route, use $router.push. Can pass query parameters using query. Can also pass arrays there using JSON.stringify
```
let datasetIds = [...]  // some array
this.$router.push({path: "/datasets/search", query: {datasetId: JSON.stringify(datasetIds)}});
```

Using URLSearchParams, duplicate keys can be handled (alternative to using comma separated values):
```
let params = new URLSearchParams();
params.append('title', 'this is title');
params.append('value', 'val1');
params.append('value', 'val2');
```

This is one way to redirect one page to another. However note that if the redirect is to the same page with different parameters, it doesn't reload the page (ie. mounted() does not run again)
```
export default {
    middleware: [
         function({ redirect }) {
             redirect('/atlas?type=blood');
         },
    ],
};
```

## axios
Local resource in static/ can be accessed this way using axios:
```
this.$axios.get("/7283.pca.json").then(res => {
    console.log(res);
});
```

How to fetch html from axios get request and turn it into a file download
```
this.$axios.get('/api/governance/' + datasetId + '/qchtml?type=multiqc', {responseType:'blob'}).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'file.html');
    document.body.appendChild(link);
    link.click();
})
```

## Functions not currently used but perhaps useful later
Function to just convert tsv files into {col: {rowId: val, ...}, ...} format
```
_dataConverter(tsvFile) {
    this.$axios.get(tsvFile).then(res => {
        let lines = res.data.split("\n");
        let table = {};
        let columns = lines[0].split("\t")
        columns.shift();   // ["Cell Type", "Sample Source", ...]

        for (let i=1; i<lines.length; i++) {
            let cols = lines[i].split("\t");
            for (let j=0; j<columns.length; j++) {
                if (!(columns[j] in table))
                    table[columns[j]] = {};
                table[columns[j]][cols[0]] = cols[j+1];
            }
        }
        console.log(JSON.stringify(table));
    })
},
```

Code for in-page filtering
```
    // Set datasetFilters
    this.datasetFilters.forEach(filterItem => {
        // values holds unique values for this filter, counts holds how many items in datasets have matching values
        filterItem.values = Array.from(new Set(this.datasets.map(item => item[filterItem.key])));
        filterItem.counts = filterItem.values.map(value => this.datasets.filter(item => item[filterItem.key]==value).length);
    });

    // Set sampleFilters - trickier since multiple samples exist for each dataset
    this.sampleFilters.forEach(filterItem => {
        // unique values are across all datasets
        let values = Array.from(new Set(this.datasets.map(item => item[filterItem.key]).join(',').split(',')));
        let counts = values.map(value => this.datasets.filter(item => item[filterItem.key].indexOf(value)!=-1).length);
        // sort by highest counts to lowest
        let combined = values.map((item,i) => [item,counts[i]]);
        combined.sort((a,b) => a[1] > b[1]? -1 : 1);
        filterItem.values = combined.map(item => item[0]);
        filterItem.counts = combined.map(item => item[1]);
    });
```

## Miscellaneous

Inter-component communication via global events:
https://stackoverflow.com/questions/38616167/communication-between-sibling-components-in-vue-js-2-0


Using b-progress on file upload
```
this.$axios.post('/api/atlas-projection/' + this.atlasType + '/' + this.selectedDataSource, 
                this.formData, { headers: {'Content-Type': 'multipart/form-data'},
                                onUploadProgress: data => { //Set the progress value to show the progress bar
                                    this.uploadProgress = Math.round((95 * data.loaded) / data.total)
                                }
```

## Old code for searching datasets and samples page
```
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
```

# datasets/search page, currently not used
```
<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
<b-tabs content-class="mt-3" v-model="tabIndex">
    <b-tab title="Search">
        <h3 class="text-center">Search datasets and samples</h3>
        <b-form-group class="mt-3" label-cols-md="5" content-cols-md="4" label-align-md="right" label="Search for a term or select from a pre-defined list below">
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
        <h3>Advanced search
            <small>
                <b-link v-b-tooltip.hover.right title="More information" v-b-toggle.advanced-search-sidebar class="ml-2"><b-icon-info-circle></b-icon-info-circle></b-link>
            </small>
        </h3>
        <b-form inline v-for="(item,index) in advancedSearch" :key="item.key" class="justify-content-center mt-3">
          <b-input-group prepend="search string">
            <b-form-input v-model="item.searchString" placeholder="eg. iPSC"></b-form-input>
            <b-dropdown right text="in dataset fields" class="ml-1" variant="secondary">
                <b-dropdown-item>name</b-dropdown-item>
                <b-dropdown-item>description</b-dropdown-item>
            </b-dropdown>
            <b-dropdown right text="in sample fields" class="ml-1" variant="secondary">
                <b-dropdown-item>name</b-dropdown-item>
                <b-dropdown-item>description</b-dropdown-item>
            </b-dropdown>
            <b-link @click="addAdvancedSearch"><b-icon-plus-circle font-scale="1.5" class="ml-2 align-middle" shift-v="-2"></b-icon-plus-circle></b-link>
            <b-icon-dash-circle v-if="index==0" font-scale="1.5" class="ml-1 align-middle text-white"></b-icon-dash-circle>
            <b-link v-if="index>0" @click="removeAdvancedSearch(index)"><b-icon-dash-circle font-scale="1.5" class="ml-1 align-middle" shift-v="-2"></b-icon-dash-circle></b-link>
          </b-input-group>
        </b-form>

        <b-sidebar id="advanced-search-sidebar" title="Help and more info" class="text-left" shadow>
            <div class="px-3 py-2">
                <p>You can build your query here to find datasets. For example, you can search for datasets where
                    platform="RNA-Seq" and cell_type="Macrophage". 
                </p>
        </div>
        </b-sidebar>
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
                { text: 'Search and filter', active: true }
            ],
            searchString: null,
            refineSearchString: null,

            advancedSearch: [{searchString:"", datasetScope:"", sampleScope:"", operand:"and", key:0}
                            ],

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
            this.$axios.get("/api/search/datasets?include_samples_query=true&query_string=" + this.searchString).then(res => {
                this.tableName = 'Search results [' + this.searchString + ']';
                this.tableDescription = 'Results of a free text search.';
                this.setupTable(res.data);
                this.tabIndex = 2;
            });
        },

        addAdvancedSearch() {
            let newItem = { ...this.advancedSearch[0]};
            newItem.key = this.advancedSearch.length;
            this.advancedSearch.push(newItem);
        },

        removeAdvancedSearch(index) {
            this.advancedSearch.splice(index,1);
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
```