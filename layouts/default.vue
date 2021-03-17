<template>
<div class="h-100">
  <PageNavigation />
  <Nuxt />
  <footer class="footer fixed-bottom bg-dark">
    <b-container class="text-muted p-1">
      <b-row align-h="between">
        <b-col cols="4">
          <span>&copy; 2021 Stemformatics</span>
          <b-link href="#" v-b-modal.release-notes class="text-white ml-3">{{versionNumber}}</b-link>
        </b-col>
        <b-col cols="4" class="text-right">
          Website hosted by <b-link href="https://nectar.org.au/" target="_blank">
            <b-img src="/img/nectardirectorate-logo.png" height="18"></b-img></b-link>
        </b-col>
      </b-row>
    </b-container>
  </footer>

  <b-modal id='release-notes' title="Release Notes" ok-only scrollable>
    <ul class="list-unstyled">
        <li v-for="item in releaseNotes" :key="item.version">{{item.version}}
          <ul><li v-for="note in item.notes" :key="note">{{note}}</li></ul>
        </li>
    </ul>  
  </b-modal>
</div>
</template>

<script>
export default {
  data() {
    return {
      showReleaseNotes: false,
      versionNumber: '',
      releaseNotes:[]
    }
  },

  methods: {
  },

  mounted() {
    // parse the release notes
    this.$axios.get("/ReleaseNotes.json").then(res => {
        this.releaseNotes = res.data;
        this.versionNumber = this.releaseNotes[0].version;
    });
  }
}
</script>

<style lang="scss">
  @import 'assets/custom.scss';
  @import '~bootstrap/scss/bootstrap.scss';
  @import '~bootstrap-vue/src/index.scss';
</style>


