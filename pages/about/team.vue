<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <PageSidebar :sidebarType="'about'" :activeItem="'team'" />
      </b-col>
      <b-col>
        <h3>The Stemformatics Team</h3>
        <p>Stemformatics team is based at the 
          <b-link href="https://biomedicalsciences.unimelb.edu.au/departments/anatomy-and-neuroscience/engage/cscs" target="_blank">
          Centre for Stem Cell Systems</b-link> at the University of Melbourne.
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
          { text: 'About', active: true },
          { text: 'Team', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
