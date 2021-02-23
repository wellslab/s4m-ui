<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-tabs content-class="mt-3">
        <b-tab title="Dataset search" active class="text-center">
            <DatasetSearch />
        </b-tab>
        <b-tab title="Sample search" class="text-center">
            <SampleSearch />
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
          { text: 'Datasets', active: true },
          { text: 'Search and filter', active: true }
        ],
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
