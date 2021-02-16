<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <PageSidebar :sidebarType="'atlas'" :activeItem="'about'" />
      </b-col>
      <b-col>
        <h3>About the Stemformatics integrated atlases</h3>
        <p>Describe info about the atlas here.
        </p>
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
          { text: 'Atlases', to: '/atlas' },
          { text: 'About', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
