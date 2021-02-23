<template>
<b-navbar toggleable="lg" variant="dark" class="w-100 pb-0">
  <b-container>
    <b-breadcrumb :items="breadcrumb" class="col-12 mb-0 border border-white border-bottom-0 rounded-top"></b-breadcrumb>
  </b-container>
</b-navbar>
</template>

<script>
export default {
    name: "Breadcrumb",
    props: ['breadcrumb'],
}
</script>

<style>
.breadcrumb {
    background-color: #212529;
}
.breadcrumb a {
    color: white;
}
.breadcrumb-item + .breadcrumb-item::before {
    content: ">";
}
</style>
