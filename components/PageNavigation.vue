<template>
<b-navbar toggleable="lg" type="dark" variant="dark" class="nav-fill w-100">
  <b-container>
    <b-navbar-brand to="/"><b-img src="/img/StemformaticsLogo_REV_RGB_300px.png" alt="Stemformatics Logo"></b-img></b-navbar-brand>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-dropdown text="About" variant="dark" class="ml-4">
          <b-dropdown-item to="/about/team">About Stemformatics</b-dropdown-item>
          <b-dropdown-item to="/about/team">Team</b-dropdown-item>
          <b-dropdown-item to="/about/team">How to cite us</b-dropdown-item>
          <b-dropdown-item to="/about/team">About data processing</b-dropdown-item>
          <b-dropdown-item to="/about/team">Privacy and disclaimer</b-dropdown-item>
          <b-dropdown-item to="/about/team">Funding and collaborators</b-dropdown-item>
          <b-dropdown-item to="/about/team">Contact us</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Datasets" variant="dark" class="ml-4">
          <b-dropdown-item to="/datasets/explore">Explore data</b-dropdown-item>
          <b-dropdown-item to="/datasets/search">Search and filter</b-dropdown-item>
          <b-dropdown-item to="/datasets/view">View a dataset</b-dropdown-item>
          <b-dropdown-item to="/datasets/api">API access</b-dropdown-item>
          <b-dropdown-item to="/datasets/api">About sample annotation</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Atlases" variant="dark" class="ml-4">
          <b-dropdown-item to="/atlas/myeloid">Myeloid atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/blood">Blood atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/dc">DC atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/about">About atlases</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Genes" variant="dark" class="ml-4">
          <b-dropdown-item to="/genes/">Search</b-dropdown-item>
          <b-dropdown-item to="/genes/expression">Expression profile</b-dropdown-item>
          <b-dropdown-item to="/genes/expression">Gene vs gene</b-dropdown-item>
        </b-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-container>
</b-navbar>
</template>

<script>
export default {
    name: "PageNavigation"
}
</script>

<style>
</style>
