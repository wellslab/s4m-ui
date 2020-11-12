<template>
  <div>
    <PageNavigation />
    <div class="container-fluid">
        <div class="row">
            <PageSidebar />
            <Nuxt />
        </div>
    </div>
  </div>
</template>

<script>
import PageNavigation from "../components/PageNavigation";
import PageSidebar from "../components/PageSidebar";

export default {
  components: {
    PageNavigation,
    PageSidebar
  }
}
</script>

<style lang="scss">
@import 'assets/custom.scss';
</style>
