<template>
<div>
  <b-navbar toggleable="lg" type="primary" variant="light">
    <b-navbar-brand href="#">S4M</b-navbar-brand>
    <b-collapse id="nav-collapse" is-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item href="#">About</b-nav-item>
        <b-nav-item href="#">Datasets</b-nav-item>
        <b-nav-item href="#">Atlases</b-nav-item>
        <b-button size="sm" class="my-2 my-sm-0" type="submit">Login</b-button>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</div>
</template>

<script>
export default {
    name: "PageNavigation"
}
</script>

<style>
</style>