<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <h4 class="text-center"><b-link href="#">
        {{dataset.displayName}} : {{gene.geneSymbol}}</b-link>
    </h4>
    <div class="text-center mt-3">
        group by: <b-form-select v-model="selectedSampleGroup" :options="sampleGroups" @change="plot" class="col-md-2 small-select"></b-form-select>
        <b-form-select v-model="selectedPlotType" @change="plot" class="col-md-2 bg-light small-select">
            <b-form-select-option value="box">box plot</b-form-select-option>
            <b-form-select-option value="violin">violin plot</b-form-select-option>
        </b-form-select>
        <b-form-select v-model="showPoints" @change="plot" class="col-md-2 bg-light small-select">
            <b-form-select-option value="showPoints">show points</b-form-select-option>
            <b-form-select-option value="hidePoints">hide points</b-form-select-option>
        </b-form-select>
    </div>
    <div class="overflow-auto text-center">
        <div id="plotDiv" style="width:800px; height:600px; margin:auto"></div>
    </div>
</b-container>
</div>
</template>

<script>
import data_functions from "~/mixins/data_functions.js"

export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },
    mixins: [data_functions],
    
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Genes', to: '/genes' },
          { text: 'Expression', active: true }
        ],

        dataset: {dataset_id: this.$route.query.dataset_id==null? 7283: this.$route.query.dataset_id},
        gene: {geneId: this.$route.query.gene_id==null? "ENSG00000102145": this.$route.query.gene_id, 
               geneSymbol: this.$route.query.gene_symbol==null? "ENSG00000102145": this.$route.query.gene_symbol},

        samples: [],    //  [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]
        sampleGroups: [],
        selectedSampleGroup: null,
        expression: {},

        selectedPlotType: "box",
        showPoints: "showPoints",
      }
    },

    methods: {
        plot() {
            let self = this;
            let sampleIds = self._sampleIdsFromSampleGroup(self.samples, self.selectedSampleGroup);

            // Create a plotly trace for each key in sampleIds
            let traces = [];
            let groupItems = Object.keys(sampleIds);
            groupItems.sort();
            for (let i=0; i<groupItems.length; i++) {
                let y = sampleIds[groupItems[i]].map(item => self.expression[self.gene.geneId][item]);
                let name = groupItems[i] + " (" + y.length + ")";
                traces.push({y:y, type:this.selectedPlotType , name:name, 
                                boxpoints:this.showPoints=="showPoints"? 'all':'false'});
            }
            let layout = {yaxis: {title: "log2 (cpm + 1)"}};
            Plotly.newPlot('plotDiv', traces, layout);
        },

    },

    mounted() {
        // Fetch dataset metadata and table
        this.$axios.get("/api/datasets/" + this.dataset.dataset_id + "/metadata").then(res => {
            this.dataset = res.data;
            this.dataset.displayName = this.dataset.name.split("_")[0] + " (" + this.dataset.name.split("_")[1] + ")";

            this.$axios.get("/api/datasets/" + this.dataset.dataset_id + "/samples").then(res2 => {
                this.samples = res2.data;
                this.sampleGroups = this._sampleGroupsForPlotlyTrace(this.samples);
                this.selectedSampleGroup = this.sampleGroups[0];
                
                this.$axios.get("/api/datasets/" + this.dataset.dataset_id + "/expression?orient=index&gene_id=" + this.gene.geneId).then(res3 => {
                   this.expression = res3.data;
                   this.plot();
                });
            });
        });
    }
}
</script>

<style>
</style>
