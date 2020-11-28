<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <b-row>
      <b-col class="col-md-3">
        <PageSidebar :sidebarType="'datasets'" :activeItem="'api'" />
      </b-col>
      <b-col>
        <h5>API access</h5>
        <p>All Stemformatics data can be accessed via API.</p>
      </b-col>
    </b-row>
</b-container>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Datasets', active: true },
          { text: 'API access', active: true }
        ],
        // You can get url parameters this way eg: /datasets/view?id=2000
        datasetId: this.$route.query.id==null? 1000: this.$route.query.id,

      }
    },

    methods: {
    },

    mounted() {
    }
}
</script>

<style>
</style>
