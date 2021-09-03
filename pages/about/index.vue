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
            <div class='text-center'><b-img src="/img/StemformaticsSchematic.png" fluid></b-img></div>
        
            <h5 class="mt-4">Data types in Stemformatics</h5>
            <p class="mt-2">Stemformatics was originally developed for the stem cell community, hence it has a major focus on pluripotency, 
                tissue stem cells, and staged differentiation - especially on haematopoietic cell types. It has since expanded its repertoire
                to include many other cell types, including neurons and disease samples such as leukaemic cells. More details can 
                be found in our most recent <b-link href="https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gky1064/5165343" target="_blank">publication</b-link>.
            </p>
            <b-card-group>
                <b-card>
                    <p>Datasets by platform type</p>
                    <b-table-lite small :items="summaryTable1" bordered></b-table-lite>
                    <p>(Above are publicly available datasets. We also host additional datasets which remain
                        private to collaborators until publication.)</p>
                </b-card>
                <b-card>
                    <p>Examples of common cell types</p>
                    <b-table-lite small :items="summaryTable2" bordered></b-table-lite>
                </b-card>
            </b-card-group>
            <h5 class="mt-4">New Stemformatics website</h5>
            <p class="mt-2">
                Stemformatics has been running for over 10 years now. We have recently developed a new website, 
                leveraging the latest software technologies available.
                If you were a previous user of Stemformatics, you'll mostly find a subset of the same data which were hosted on the previous site,
                with improved annotations and accessible with a new set of visualisation tools. Mouse datasets are still accessible through 
                individual dataset ids, but are omitted from various searches.
                Looking for a private dataset you used to access? Please <b-link href="mailto:info@stemformatics.org">contact us</b-link>.
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
            summaryTable1: [],
            summaryTable2: []
      }
    },

    mounted() {
        this.$axios.get("/api/values/datasets/platform_type?include_count=true").then(res => {
            for (const [key,val] of Object.entries(res.data)) {
                this.summaryTable1.push({platform_type: key, number_of_datasets: val})
            }
        })
        this.$axios.get("/api/values/samples/cell_type?include_count=true").then(res => {
            let count = 0;
            let valuesToIgnore = [''];
            for (const [key,val] of Object.entries(res.data)) {
                if (valuesToIgnore.indexOf(key)==-1 && !key.startsWith('Day')) {
                    this.summaryTable2.push({cell_type: key, number_of_samples: val});
                    count++;
                }
                if (count>10) break;
            }
        })
    }
}
</script>

<style>
h3,h4,h5 {
  color: #EE255F
}
</style>
