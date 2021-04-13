<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <h4>Coming soon: Discover interesting genes across datasets and samples.</h4>
</b-container>
</div>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Genes', active: true },
          { text: 'Discover', active: true }
        ],
      }
    },

    methods: {
    }
}
</script>

<style>
</style>
