<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <h5>Gene search</h5>
    <p>Search for a gene here
    </p>
</b-container>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Genes', active: true },
          { text: 'Search', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
