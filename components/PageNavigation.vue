<template>
<b-navbar toggleable="lg" type="dark" variant="dark" class="nav-fill w-100">
  <b-container>
    <b-navbar-brand to="/"><b-img src="/img/StemformaticsLogo_REV_RGB_300px.png" alt="Stemformatics Logo"></b-img></b-navbar-brand>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-form-input v-model="searchString" placeholder="quick search" @keyup.enter="search" size="sm" class="my-auto w-10"></b-form-input>
        <b-dropdown text="About" variant="dark" class="ml-4">
          <b-dropdown-item to="/about">About Stemformatics</b-dropdown-item>
          <b-dropdown-item to="/about/team">Team</b-dropdown-item>
          <b-dropdown-item to="/about/cite">How to cite us</b-dropdown-item>
          <b-dropdown-item to="/about/processing">About data processing</b-dropdown-item>
          <b-dropdown-item to="/about/privacy">Privacy and disclaimer</b-dropdown-item>
          <b-dropdown-item to="/about/funding">Funding and collaborators</b-dropdown-item>
          <b-dropdown-item to="/about/contact">Contact us</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Datasets" variant="dark" class="ml-4">
          <b-dropdown-item to="/datasets/explore">Explore data</b-dropdown-item>
          <b-dropdown-item to="/datasets/collections">View collections</b-dropdown-item>
          <b-dropdown-item to="/datasets/filter">Filter datasets</b-dropdown-item>
          <b-dropdown-item to="/datasets/view">View a dataset</b-dropdown-item>
          <b-dropdown-item to="/datasets/api">API access</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Atlases" variant="dark" class="ml-4">
          <b-dropdown-item to="/atlas/myeloid">Myeloid atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/blood">Blood atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/dc">DC atlas</b-dropdown-item>
          <b-dropdown-item to="/atlas/about">About atlases</b-dropdown-item>
        </b-dropdown>
        <b-dropdown text="Genes" variant="dark" class="ml-4">
          <b-dropdown-item to="/genes/">Discover</b-dropdown-item>
          <b-dropdown-item to="/genes/sampletogenes">From sample to genes</b-dropdown-item>
          <b-dropdown-item to="/genes/collections">Gene set collections</b-dropdown-item>
        </b-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-container>
</b-navbar>
</template>

<script>
export default {
  data() {
    return {
      searchString: '',
    }
  },

  methods: {
    // Perform general search by emitting an event on the root instance as global event hub
    search() {
      if (this.searchString=='') return;
      let params = {'title': 'Search results [' + this.searchString + ']',
                    'description': 'Results of a quick search.',
                    'include_samples_query': 'true',
                    'query_string': this.searchString};
      this.$router.push({path: "/datasets/filter", query: params});
      this.$root.$emit('show_datasets_filter', params);
    },
  }
}
</script>

<style>
</style>
