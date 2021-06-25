<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <div class="col-md-8 text-center mx-auto">
    <h3>Discover genes and pathways</h3>
    <p class="my-3">Find genes and pathways of interest here. Start from samples to find
        highly expressed genes, or start from genes to find highly expressed samples, or explore our pre-defined
        collection of gene sets.
    </p>
    </div>

    <b-card-group deck>
        <b-card no-body img-src="/img/Genes_SamplesToGenes.png" img-alt="Find genes from samples" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4 class="red">Sample group to genes</h4>
                <b-card-text>
                    Start from a sample group of interest (eg. 'monocyte') and find highly expressed genes. 
                </b-card-text>
                <b-form-select size="sm" :options="sampleGroups" v-model="selectedSampleGroup"></b-form-select>
                <b-form-select size="sm" :options="sampleGroupItems" v-model="selectedSampleGroupItem" class="mt-1"></b-form-select>                
                <b-button class="float-right mt-2">search</b-button>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/Genes_GeneToSamples.png" img-alt="Find samples from gene" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4 class="red">Genes to sample groups</h4>
                <b-card-text>
                    Start from a gene interest and find highly expressed samples. 
                </b-card-text>
                <b-form-group description="start typing then select from the list of genes">
                    <b-form-input id="geneSearchInput" placeholder="eg. Myb" @keyup.enter="searchGenes" size="sm"></b-form-input>
                </b-form-group>
                <b-button @click="searchGenes" class="float-right align-self-end">search</b-button>
            </b-card-body>
        </b-card>

        <b-card no-body img-src="/img/Genes_GenesetCollection.png" img-alt="Explore gene set collections" img-top>
            <b-card-body class="border-top border-gray-200">
                <h4 class="red">Gene set collections</h4>
                <b-card-text>
                    <p>Explore our pre-defined gene sets for high expression in particular cell types.</p>
                    <ul>
                        <li><b-link to="/genes/topgenes">Genes highly expressed in monocytes</b-link></li>
                    </ul>
                </b-card-text>
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
            sampleGroups: ["cell_type","tissue_of_origin"],
            selectedSampleGroup: 'cell_type',
            sampleGroupItems: ["blood","monocyte"],
            selectedSampleGroupItem: 'blood'
        }
    },

    methods: {
      searchGenes() {

      }
    }
}
</script>

<style>
.red {
    color: #EE255F;
    font-weight: 450;
}
</style>
