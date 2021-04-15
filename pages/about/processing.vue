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
            <p>Stemformatics processes all data hosted from raw files, rather than hosting post-processed files 
                available from online repositories such as <b-link href="https://www.ncbi.nlm.nih.gov/geo/" target="_blank">GEO</b-link> or 
                <b-link href="https://www.ebi.ac.uk/arrayexpress/" target="_blank">ArrayExpress</b-link>. This is done to ensure we
                can apply uniform quality control metrics across all datasets and reject those which do not meet these requirements.</p>
            <p>more to come...</p>
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
