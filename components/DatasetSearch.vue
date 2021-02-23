<template>
<b-row>
    <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <b-card header="Platform type">
            <b-list-group v-if="selectedPlatformType==null">
            <b-list-group-item v-for="item in platformTypes" :key="item.value" class="d-flex justify-content-between border-0 p-2">
                <b-link href="#" @click="setFilter('platform_type',item.value)">{{item.value}}</b-link>
                <span class="badge badge-primary">{{item.count}}</span>
            </b-list-group-item>
            </b-list-group>

            <b-list-group v-else>
                <b-list-group-item class="d-flex justify-content-between">{{selectedPlatformType}}
                    <b-link href="#" @click="clearFilter('platform_type')" class="badge badge-primary">clear</b-link>
                </b-list-group-item>
            </b-list-group>
        </b-card>
    </b-col>

    <b-col class="col-12 col-sm-12 col-md-6 col-lg-9 col-xl-9">
        <h5>Search for datasets and filter</h5>
        <p>showing {{currentPage*perPage - perPage + 1}} - {{currentPage*perPage>table.length? table.length : currentPage*perPage}} of {{table.length}} entries</p>
        <div style="height:700px; overflow:auto;">
        <b-table id="mainTable" hover small sticky-header head-variant="light" :items="table" :fields="tableColumns"
         :per-page="perPage" :current-page="currentPage">
            <template #cell(display_name)="row">
                <b-link :to="'/datasets/view?id=' + row.item.dataset_id" v-b-tooltip.hover title="Go to the page showing details for this dataset">{{row.value}}</b-link>
            </template>
            <template #cell(more)="row">
                <b-link v-if="row.item.pubmed_id!=''" :href="'https://pubmed.ncbi.nlm.nih.gov/' + row.item.pubmed_id" target="_blank"
                        v-b-tooltip.hover title="Go to pubmed entry">pubmed</b-link>
            </template>
            <template #cell()="row">
                <span>{{row.value}}</span>
            </template>
        </b-table>
        <b-pagination v-model="currentPage" :total-rows="rows" :per-page="perPage" aria-controls="mainTable" 
         first-text="First" last-text="Last" align="center" size="sm"></b-pagination>
        </div>
    </b-col>
</b-row>
</template>

<script>
export default {
    data() {
      return {
        table: [],
        tableColumns: [{key:"display_name", label:"Name", sortable:true},
                       {key:"title", sortable:true, class:"truncate"},
                       "more",
                       {key:"platform", sortable:true},],
        currentPage: 1,
        perPage: 19,
        
        platformTypes: [],
        selectedPlatformType: null,

      }
    },

    computed: {
        rows() {
            return this.table.length
        }
    },

    methods: {
        setupDatasetTable(group, groupItem) {

            // Build query params based on filters
            this.selectedPlatformType = groupItem;
            //let selectedPlatformType = this.$route.query.platform_type;
            let queryString = "";
            if (this.selectedPlatformType!=undefined) {  // apply selection to the api query
                queryString = 'platform_type=' + this.selectedPlatformType;
            }
            this.table = [];
            this.$axios.get("/api/search/datasets?" + queryString, {headers: {"Access-Control-Allow-Origin": "*"}}).then(res => {
                this.table = res.data;
                if (this.selectedPlatformType==undefined) {  // Work out number of items under each group
                    let count = {};
                    this.platformTypes.forEach(function(item) { count[item.value] = 0; });
                    this.table.forEach(function(item) { count[item["platform_type"]] += 1; });
                    this.platformTypes = Object.keys(count).map(function(item) { return {"value":item, "count":count[item]}});
                }
            });
        },

        setFilter(group, groupItem) {
            //let query = Object.keys(this.filters).map(item => item + "=" + this.filters[item]);
            this.$router.push({path: "/datasets/search", query: {'platform_type': groupItem}}, this.setupDatasetTable(group, groupItem));
        },

        clearFilter(group) {
            this.$router.push('/datasets/search', this.setupDatasetTable());
        }
    },
    
    mounted() {
        this.$axios.get("/api/values/datasets/platform_type", {headers: {"Access-Control-Allow-Origin": "*"}}).then(res => {
            this.platformTypes = res.data.map(item => ({'value': item}));
            this.setupDatasetTable();
        });
    }
}
</script>

<style>
.truncate {
    max-width: 350px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
