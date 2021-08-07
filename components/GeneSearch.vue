<template>
<b-form-group :description="formGroupDescription">
    <b-form-input v-model="selectedGeneSymbol" list="possible-genes-datalist" @input="setSelectedGene"
        @keyup="getPossibleGenes" @keyup.enter="emitSelectedGene" placeholder="eg. MYB" :size="size"></b-form-input>
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
    },

    data() {
        return {
            possibleGenes:[],
            selectedGene:{},    // matching entry from possible genes
            selectedGeneSymbol:'',  // what user entered
        }
    },

    methods: {
        getPossibleGenes() {
            if (this.selectedGeneSymbol.length<=1) return;    // ignore 1 or less characters entered
            // Search for human genes only, returning 
            this.$axios.get('/mygene/v3/query?species=human&fields=symbol,summary,ensembl.gene&size=50&q=' + this.selectedGeneSymbol).then(res => {
                if (res.data.total>0) {
                    // Note that some genes may not have ensembl ids, so lack the ensembl field
                    const genes = res.data['hits'].filter(item => 'ensembl' in item);
                    if (genes.length>0)
                        this.possibleGenes = genes.map(item => {
                            return {geneId: item.ensembl.gene, geneSymbol: item.symbol, geneDescription: item.summary}
                        });
                }
            }).catch().then(() => {
            });
        },

        setSelectedGene() {
            this.selectedGeneSymbol = this.selectedGeneSymbol.trim();
            if (this.selectedGeneSymbol.startsWith('ENSG')) {   // user entered ensembl id, which we support
                this.possibleGenes = [{geneId: this.selectedGeneSymbol, geneSymbol: this.selectedGeneSymbol, geneDescription: this.selectedGeneSymbol}];
            }
            const genes = this.possibleGenes.filter(item => item.geneSymbol==this.selectedGeneSymbol);
            if (genes.length>0) {
                this.selectedGene = genes[0];
                this.$emit('gene-selected', this.selectedGene);
            }
        },

        // should run on user pressing enter after gene selection
        emitSelectedGene() {
            if (Object.keys(this.selectedGene).length==0)
                this.$bvModal.msgBoxOk("No matching gene - please select from the list of suggestions.");
            else
                this.$emit('keyup-enter', this.selectedGene);
        }
    },

}
</script>

<style>
</style>