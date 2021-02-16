<template>
<b-row>
    <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <b-card header="cell type">
        </b-card>
    </b-col>
    <b-col class="col-12 col-sm-12 col-md-6 col-lg-9 col-xl-9">
        <h5>Search for samples and filter</h5>
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
        perPage: 50,
        
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
