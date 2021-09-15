GeneSearch component is mainly a text input element that handles user input for gene searches.

<template>
<b-form-group :description="formGroupDescription">
    <b-form-input v-model="selectedGeneSymbol" list="possible-genes-datalist" @input="setSelectedGene"
        @keyup="getPossibleGenes" @keyup.enter="setSelectedGene" placeholder="eg. MYB" :size="size"></b-form-input>
    <b-button v-if="showButton" variant="dark" @click="setSelectedGene" size="sm">{{buttonText}}</b-button>
    <b-form-datalist id="possible-genes-datalist">
        <option v-for="gene in possibleGenes" :key="gene.geneId">{{gene.geneSymbol}}</option>
    </b-form-datalist>
    <!-- @keyup.enter does not work unless this dummy input is added because hitting enter submits the form with just one input -->
    <b-form-input v-show="false"></b-form-input>
</b-form-group>
</template>

<script>
export default {
    props: {
        formGroupDescription: {default:'start typing then select from the list of genes', type:String},
        size: {default:'md', type:String},
        species: {default:'human', type:String},
        showButton: {default:true, type:Boolean},
        buttonText: {default:'show', type:String}
    },

    data() {
        return {
            possibleGenes:[],
            selectedGene:{},    // matching entry from possible genes
            selectedGeneSymbol:'',  // what user entered
        }
    },

    methods: {
        // Fetch a list of possible gene objects by querying mygene api. Should run when user types into the input field.
        getPossibleGenes() {
            if (this.selectedGeneSymbol.length<=1) return;    // ignore 1 or less characters entered
            // Search for human genes only, returning 
            this.$axios.get('/mygene/v3/query?species=' + this.species + '&fields=symbol,summary,ensembl.gene&size=50&q=' + this.selectedGeneSymbol).then(res => {
                if (res.data.total>0) {
                    // Note that some genes may not have ensembl ids, so lack the ensembl field - filter these out
                    const genes = res.data['hits'].filter(item => 'ensembl' in item);

                    if (genes.length>0)  { // Note that some entries have multiple ensemble ids - can't resolve just on info from mygene
                        this.possibleGenes = [];
                        genes.forEach(gene => {
                            if (Array.isArray(gene.ensembl)) {  // create multiple matches
                                gene.ensembl.forEach(item => {
                                    this.possibleGenes.push({geneId: item.gene, geneSymbol: gene.symbol + ' (' + item.gene + ')', geneDescription: gene.summary})
                                })
                            } else
                                this.possibleGenes.push({geneId: gene.ensembl.gene, geneSymbol: gene.symbol, geneDescription: gene.summary})
                        });
                    }
                }
            }).catch().then(() => {
            });
        },

        // Should run when user makes a selection from a list of options - this could be a mouse selection or enter key
        setSelectedGene() {
            this.selectedGeneSymbol = this.selectedGeneSymbol.trim();
            if (this.selectedGeneSymbol.startsWith('ENSG')) {   // user entered ensembl id, which we support
                this.possibleGenes = [{geneId: this.selectedGeneSymbol, geneSymbol: this.selectedGeneSymbol, geneDescription: this.selectedGeneSymbol}];
            }
            const genes = this.possibleGenes.filter(item => item.geneSymbol==this.selectedGeneSymbol);
            if (genes.length>0) {
                this.selectedGene = genes[0];
                console.log("emitting gene-selected", JSON.stringify(this.selectedGene));
                this.$emit('gene-selected', this.selectedGene);
            }
        },
    },

}
</script>

<style>
</style>