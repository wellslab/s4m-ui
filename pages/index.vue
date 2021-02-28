<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
  <h4>Welcome to Stemformatics</h4>
</b-container>
</div>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', active: true },
        ],
      }
    }
}
</script>

<style>
</style>
