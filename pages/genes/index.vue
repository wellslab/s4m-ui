<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <h5>Gene search</h5>
    <p>Search for a gene here
    </p>
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
          { text: 'Search', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
