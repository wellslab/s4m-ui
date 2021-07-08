<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <h3 class="text-center">Discover genes and pathways</h3>
    <b-form-group class="mt-3" label-cols-md="5" content-cols-md="4" label-align-md="right" 
        label="Start from a gene collection below">
        <b-input-group>
        <b-form-input v-model="searchString" placeholder="eg. NANOG" @keyup.enter="search"></b-form-input>
        <b-input-group-append>
            <b-button variant="dark" @click="search">search</b-button>
        </b-input-group-append>
        </b-input-group>
    </b-form-group>

    <b-card-group deck v-for="(row,rowIndex) in numberOfRows" :key="row">
        <b-card v-for="(col,colIndex) in 3" :key="col" no-body
            :class="genesetFromGrid(rowIndex,colIndex)!=null? 'my-1' : 'my-1 border-0'">
            <!-- Trick to avoid continuously referencing genesetFromGrid function here. This way geneset holds the result of 
            the function inside a one-time loop (https://stackoverflow.com/questions/54446108/how-to-define-variable-in-vue-template). -->
            <template v-for="geneset in [genesetFromGrid(rowIndex,colIndex)]">
                <b-card-body v-if="geneset!=null" :key="geneset.name" class="d-flex flex-column">
                    <b-card-title><b-link>{{geneset.displayName}}</b-link></b-card-title>
                    <b-card-text>
                        test
                    </b-card-text>
                </b-card-body>
            </template>
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
                { text: 'Geneset collections', active: true }
            ],
            searchString:'',
            genesets: [],   // array of geneset objects
        }
    },

    computed: {
        numberOfRows() {
            return Math.ceil(this.genesets.length/3);
        }
    },

    methods: {
        search() {
        },

        // Return the geneset object inside genesets array, given rowIndex,colIndex of the grid.
        genesetFromGrid(rowIndex, colIndex) {
            const index = rowIndex*3+colIndex;
            return index<this.genesets.length? this.genesets[index]: null;
        },

    },

    mounted() {
        this.genesets = [{name:'cell_type_monocyte', displayName:'Monocyte genes'},
                         {name:'cell_type_monocyte', displayName:'Dendritic cell genes'},
                         {name:'cell_type_monocyte', displayName:'iPSC genes'}];
    }
}
</script>

<style>
</style>
