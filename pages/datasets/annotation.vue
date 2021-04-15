<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'datasets'" :activeItem="'annotation'" />
        </b-col>

        <b-col>
            <h3>About sample annotation</h3>
            <p>All Stemformatics datasets have been curated to ensure quality. One of the most challenging aspect of curation
                process involves annotating the samples which originate from the dataset. More to come...
            </p>            
        </b-col>
    </b-row>
</b-container>
</div>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Datasets', active: true },
          { text: 'About sample annotation', active: true }
        ],
      }
    },
    methods: {
    },
}
</script>

<style>
</style>
