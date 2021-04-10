<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'cite'" />
        </b-col>
        <b-col>
            <h3>How to cite us</h3>
                <p>Please ensure that you cite the original publications describing the datasets hosted by Stemformatics.</p>
                <p>To cite Stemformatics, please use:</p>
                <p><b>Stemformatics: visualize and download curated stem cell data</b><br/>
                    Jarny Choi, Chris M Pacheco, Rowland Mosbergen, Othmar Korn, Tyrone Chen, Isha Nagpal, 
                    Steve Englart, Paul W Angel, Christine A Wells<br/>
                    <i>Nucleic Acids Research 2018,</i> 
                    <b-link href="https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gky1064/5165343" target="_blank">doi: 10.1093/nar/gky1064</b-link>
                </p>
                <p><b>Stemformatics: Visualisation and sharing of stem cell gene expression</b><br/>
                Christine A Wells, Rowland Mosbergen, Othmar Korn, Jarny Choi, Nick Seidenman, Nicholas A Matigian, 
                Alejandra M Vitale, Jill Shepherd<br/>
                <i>Stem Cell Research 2013,</i>
                <b-link href="https://doi.org/10.1016/j.scr.2012.12.003" target="_blank">doi: 10.1016/j.scr.2012.12.003</b-link>
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
          { text: 'How to cite us', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
