<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <PageSidebar :sidebarType="'about'" :activeItem="'about'" />
      </b-col>
      <b-col>
        <h3>About Stemformatics</h3>
        <p>Stemformatics has been built to provide high quality curated gene expression data to the research community.
            It evolved from the idea that an observation in one dataset is anecdotal, becomes generalisable if a pattern is seen across several datasets, 
            and predicts rules of cell behaviour if observed at sufficient scale.
            You will find a number of ways to explore the data here, as well as a suite of intuitive tools for visualising the data.
            We also host our novel <b-link to="/atlas/myeloid">integrated atlases</b-link>, which can be explored directly or used as references in determining cell identity.
        </p>
        <b>New Stemformatics website</b>
        <p class="mt-2">
            Stemformatics has been running for over 10 years now. We have recently developed a new website, leveraging the latest software technologies available.
            If you were a previous user of Stemformatics, you'll find a subset of the same data which were hosted on the previous site here,
            accessible with a new set of visualisation tools. The integrated atlas pages do function similarly to previous versions. 
        </p>
        <b>Website prototype</b>
        <p class="mt-2">
            This is a prototype version of the new Stemformatics website. As such, many of the pages haven't been added yet, while some functionality are still missing.
            The atlas pages should mostly work, and <b-link to="/datasets/explore">Explore Data</b-link> and <b-link to="datasets/search">Search and filter</b-link> pages 
            under the Datasets menu should also mostly work. Some datasets may not render PCA - this is due to the dataset requiring more clean up. 
            Feel free to try another dataset.
        </p>
      </b-col>
    </b-row>
</b-container>
</div>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'About', active: true },
          { text: 'About Stemformatics', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
