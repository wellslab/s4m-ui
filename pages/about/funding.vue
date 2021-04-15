<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'funding'" />
        </b-col>
        <b-col>
            <h3>Funding sources</h3>
            Our current list of funders include:
            <ul>
                <li>NHMRC Synergy grant 1186371</li>
                <li>ARC Future Fellowship (FT150100330)</li>
                <li>JEM Research Foundation philanthropic funding</li>
                <li>University of Melbourne Centre for Stem Cell Systems</li>
            </ul>

            Past funders include:
            <ul>
                <li>Stemformatics was established as part of the ARC Special Research Initiative to Stem Cells Australia (SR1101002)</li>
                <li>QLD Government Smart Futures Fellowship</li>
            </ul>
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
          { text: 'Funding and collaborators', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
