<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <div class="col-md-8 text-center mx-auto">
    <h3>Discover genes based on expression</h3>
    <p class="my-3">Find genes of interest across multiple datasets here.<br/> Start from samples to find
        highly expressed genes, or start from genes to find highly expressed samples.
    </p>
    </div>

    <b-card-group deck class="col-md-8 mx-auto">
        <b-card no-body img-src="/img/Genes_SamplesToGenes.png" img-alt="Find genes from samples" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4><b-link to="/genes/sampletogenes">Sample group to genes</b-link></h4>
                <b-card-text>
                    Start from a sample group of interest (eg. 'monocyte') and find highly expressed genes. 
                </b-card-text>
                <b-form-select size="sm" :options="sampleGroups" v-model="selectedSampleGroup" @change="getSampleGroupItems"></b-form-select>
                <b-form-select size="sm" :options="sampleGroupItems" v-model="selectedSampleGroupItem" class="mt-1"></b-form-select>                
                <b-button class="float-right mt-2" @click="goToSampleGroupToGenes">search</b-button>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/Genes_GeneToSamples.png" img-alt="Find samples from gene" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4><b-link to="/genes/genetosamples">Gene to sample groups</b-link></h4>
                <b-card-text>
                    Start from a gene of interest and find highly expressed samples across datasets.
                </b-card-text>
                <br/>
                <b-form-group description="start typing then select from the list of genes">
                    <b-form-input id="geneSearchInput" placeholder="eg. GATA1" @keyup.enter="searchGenes" size="sm"></b-form-input>
                </b-form-group>
                <b-button @click="searchGenes" class="float-right align-self-end">search</b-button>
            </b-card-body>
        </b-card>

        <b-card v-if="false" no-body img-src="/img/Genes_GenesetCollection.png" img-alt="Explore gene set collections" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4><b-link to="/genes/genesetcollections">Gene set collections</b-link></h4>
                <b-card-text>
                    Explore our pre-defined gene sets for high expression in particular cell types.
                </b-card-text>
                <b-form-select v-model="selectedGeneset" :options="genesets" size="sm"></b-form-select>
                <b-button @click="showGenesets" class="float-right align-self-end mt-2">show</b-button>
            </b-card-body>
        </b-card>
    </b-card-group>
</b-container>
</div>
</template>

<script>
export default {
    data() {
        return {
            breadcrumb: [
            { text: 'Home', to: '/' },
            { text: 'Genes', active: true },
            { text: 'Discover', active: true }
            ],
            searchString:'',
            sampleGroups: ["cell_type","tissue_of_origin",],
            selectedSampleGroup: 'cell_type',
            sampleGroupItems: [],
            selectedSampleGroupItem: 'blood',
            genesets: [],
            selectedGeneset: ''
        }
    },

    methods: {
        getSampleGroupItems() {
            this.$axios.get("/api/values/samples/" + this.selectedSampleGroup + "?include_count=true").then(res => {
                let combined = Object.keys(res.data).map(item => [item, res.data[item]]);
                combined.sort((a,b) => a[1] > b[1]? -1 : 1);
                let discard = ["","in vitro","undefined"];
                this.sampleGroupItems = combined.filter((item,i) => i<20 && discard.indexOf(item[0])==-1 &&  !item[0].startsWith("Day")).map(item => item[0]);
                this.selectedSampleGroupItem = this.sampleGroupItems[0];
            });
        },

        goToSampleGroupToGenes() {
            // Go to sampletogenes page with selected params. search=true makes it run the search immediately on that page.
            // Note that boolean value doesn't seem to get passed to the page, so using string.
            this.$router.push({path: "/genes/sampletogenes", 
                               query:{selectedSampleGroup:this.selectedSampleGroup, selectedSampleGroupItem:this.selectedSampleGroupItem, search:"true"}});
        },

        searchGenes() {

        },

        showGenesets() {
            this.$router.push({path: "/genes/genesetcollections", query:{selectedGeneset: this.selectedGeneset}});
        }
    },

    mounted() {
        this.getSampleGroupItems();
    }
}
</script>

<style>
</style>
