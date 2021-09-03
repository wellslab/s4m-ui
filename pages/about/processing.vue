<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'processing'" />
        </b-col>
        <b-col>
            <h3>About data processing</h3>
            <p>Stemformatics processes all data hosted from raw files, rather than hosting post-processed files. 
              This is done to ensure we can apply uniform quality control metrics across all datasets and reject 
              those which do not meet these requirements. Most of the published data come from online repositories 
              such as <b-link href="https://www.ncbi.nlm.nih.gov/geo/" target="_blank">GEO</b-link> or 
                <b-link href="https://www.ebi.ac.uk/arrayexpress/" target="_blank">ArrayExpress</b-link>.</p>
            <figure class="text-center">
              <b-img class="my-2" src="/img/StemformaticsPipelineSchematic.png" fluid 
                alt="Flowchart showing the data processing pipeline in Stemformatics"></b-img>
              <figcaption class="mt-2">Stemformatics data processing workflow and failure points</figcaption>
            </figure>
            <p>We have found over the years that about 30% of all datasets we process fail our quality control
              metrics. Common issues include poor experimental design (such as batch effect confounding biological classes of interest or 
              insufficient sample class replication), or misannotation of samples, or missing parts of primary data.
            </p>

            <h3>About sample annotations</h3>
            <p>All Stemformatics datasets have been curated to ensure quality. One of the most challenging aspects of curation
                process involves annotating the samples, and we do a lot of this work manually applying domain specific knowledge.
                This allows us to highlight key similarities and differences in the context of the biological questions being asked.
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
          { text: 'About', to: '/about' },
          { text: 'About data processing', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
