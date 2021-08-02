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
        <p>Stemformatics aims to provide high quality curated gene expression data to the research community.
            It evolved from the idea that an observation in one dataset is anecdotal, becomes generalisable if a pattern 
            is seen across several datasets, and predicts rules of cell behaviour if observed at sufficient scale.
            You will find a number of ways to <b-link to="/datasets/explore">explore the data</b-link> here, 
            as well as a suite of intuitive tools for visualising the data.
            We also host our novel <b-link to="/atlas/myeloid">integrated atlases</b-link>, which can be explored directly or 
            used as references in determining cell identity.
        </p>
        <div class='text-center'><b-img src="/img/StemformaticsSchematic.png"></b-img></div>
        <h5>Data types in Stemformatics</h5>
        <p class="mt-2">Stemformatics was originally developed for the stem cell community, hence it has a major focus on pluripotency, 
          tissue stem cells, and staged differentiation - especially on haematopoietic cell types. It has since expanded its repertoire
          to include many other cell types, including neurons and disease samples such as leukaemic cells. More details can 
          be found in our most recent <b-link href="https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gky1064/5165343" target="_blank">publication</b-link>.
        </p>
        <b-card-group>
          <b-card>
            <p>Datasets by platform type</p>
            <b-table-lite small :items="summaryTable1" bordered></b-table-lite>
          </b-card>
          <b-card>
            <p>Examples of common sample entities</p>
            <b-table-lite small :items="summaryTable2" bordered></b-table-lite>
          </b-card>
        </b-card-group>
        <h5 class="mt-3">New Stemformatics website</h5>
        <p class="mt-2">
            Stemformatics has been running for over 10 years now. We have recently developed a new website, 
            leveraging the latest software technologies available.
            If you were a previous user of Stemformatics, you'll find a subset of the same data which were hosted on the previous site,
            accessible with a new set of visualisation tools (the main difference is that we're not currently hosting the mouse datasets
            we used to host). The integrated atlas pages do function similarly to previous versions. 
        </p>
        <h5>Website prototype</h5>
        <p class="mt-2">
            This is a prototype version of the new Stemformatics website. As such, many of the pages haven't been added yet, 
            while some functionality are still missing. The atlas pages should mostly work, and 
            <b-link to="/datasets/explore">Explore Data</b-link> and <b-link to="datasets/search">Search and filter</b-link> pages 
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
        // Data here come from output of models/datasets.py:sampleSummaryTable() from the api server - using copy and paste. 
        // Code is still in progress. I also just manually substituted some words here.
        summaryTable1: [
          {platform_type:"Microarray", number_of_datasets:377},
          {platform_type:"RNASeq", number_of_datasets:77},
          {platform_type:"other", number_of_datasets:9},
          {platform_type:"scRNASeq", number_of_datasets:4}
        ],
        summaryTable2: [
          {sample:'monocyte', number_of_samples:2144},
          {sample:'iPSC', number_of_samples:1323},
          {sample:'ESC', number_of_samples:948},
          {sample:'fibroblast', number_of_samples:812},
          {sample:'AML', number_of_samples:728},
          {sample:'PBMC', number_of_samples:683},
          {sample:'MSC', number_of_samples:678},
          {sample:'macrophage', number_of_samples:568},
          {sample:'mononuclear cell of bone marrow', number_of_samples:343},
          {sample:'hematopoietic multipotent progenitor', number_of_samples:321},
          {sample:'T cell', number_of_samples:315},
          {sample:'dendritic cell', number_of_samples:190}
        ]
      }
    }
}
</script>

<style>
</style>
