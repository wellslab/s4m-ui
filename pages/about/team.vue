<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <b-row>
      <b-col class="col-md-3">
        <PageSidebar :sidebarType="'about'" :activeItem="'team'" />
      </b-col>
      <b-col>
        <h5>The Stemformatics Team</h5>
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