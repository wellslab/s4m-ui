<template>
<b-navbar toggleable="lg" type="light" style="background-color:#FEEFEF;">
  <b-container>
    <b-navbar-brand href="#" style="color:#EB4A0D; font-weight:600;">Stemformatics</b-navbar-brand>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item to="/about/team">About</b-nav-item>
        <b-nav-item to="/datasets/api" class="ml-4">Datasets</b-nav-item>
        <b-nav-item to="/atlas" class="ml-4">Atlases</b-nav-item>
        <b-nav-item href="#" class="ml-4">Genes</b-nav-item>
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
.login-button {
  background-color:#EB4A0D !important;
  border-color: transparent !important;
}

</style>
