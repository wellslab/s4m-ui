<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <h5 class="text-center"><b-link href="#">
        {{dataset.displayName}} : {{gene.displayName}}</b-link>
    </h5>
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
</template>

<script>
export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },

    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Genes', active: true },
          { text: 'Expression', active: true }
        ],

        datasetId: this.$route.query.datasetid==null? 7283: this.$route.query.datasetid,
        geneId: this.$route.query.geneid==null? "ENSG00000102145": this.$route.query.geneid,

        dataset: {},    // {id:"7238", ...}
        samples: {},
        sampleGroups: [],
        selectedSampleGroup: null,
        gene: {},
        expression: [],

        selectedPlotType: "box",
        showPoints: "showPoints",
      }
    },

    methods: {
        plot() {
            this.$axios.get("/expression_example.json").then(res => {
                let lines = res.data.split("\n");
                let sampleIds = lines[0].split("\t");
                sampleIds.shift();
                let values = lines[1].split("\t");
                values.shift();
                values = values.map(item => parseFloat(item));

                // First collect sample ids based on selectedSampleGroup
                let sampleIdsFromSampleGroup = {};     // {"HSC":["GSM1977407", ...], ...}
                for (let sampleId in this.samples[this.selectedSampleGroup]) {
                    let value = this.samples[this.selectedSampleGroup][sampleId];
                    if (!(value in sampleIdsFromSampleGroup))
                        sampleIdsFromSampleGroup[value] = [];
                    sampleIdsFromSampleGroup[value].push(sampleId);
                }

                // Create a plotly trace for each key in sampleIds
                let traces = [];
                let groupItems = Object.keys(sampleIdsFromSampleGroup);
                groupItems.sort();
                for (let i=0; i<groupItems.length; i++) {
                    let y = values.filter((item,j) => sampleIdsFromSampleGroup[groupItems[i]].indexOf(sampleIds[j])!=-1);
                    let name = groupItems[i] + " (" + y.length + ")";
                    traces.push({y:y, type:this.selectedPlotType , name:name, 
                                 boxpoints:this.showPoints=="showPoints"? 'all':'false'});
                }
                let layout = {yaxis: {title: "log2 (cpm + 1)"}};
                Plotly.newPlot('plotDiv', traces, layout);
            });
        },

    },

    mounted() {
        // Fetch dataset metadata and sample table
        this.$axios.get("/api/samples / metadata/" + this.datasetId + "/metadata", {headers: {"Access-Control-Allow-Origin": "*"}}).then(res => {
            this.dataset = JSON.parse(res.data)[0];
            this.dataset.displayName = this.dataset.name.split("_")[0] + " (" + this.dataset.name.split("_")[1] + ")";

            this.$axios.get("/api/samples / metadata/" + this.datasetId + "/samples", {headers: {"Access-Control-Allow-Origin": "*"}}).then(res2 => {
                // result is a comma separated string version of the table
                let lines = res2.data.split("\n");
                
                this.sampleGroups = lines[0].split(",");
                this.sampleGroups.shift();  // remove sample_id column
                this.selectedSampleGroup = "sample_type"; //this.sampleGroups[0];

                for (let i=1; i<lines.length; i++) {
                    let cols = lines[i].split(",");
                    for (let j=0; j<this.sampleGroups.length; j++) {
                        let item = this.sampleGroups[j];
                        if (!(item in this.samples))
                            this.samples[item] = {};
                        this.samples[item][cols[0]] = cols[j+1];
                    }
                }

                // Fetch gene info
                this.gene = {"geneId":this.geneId, "displayName":"GATA1"};
                this.plot();
            })
        });
    }
}
</script>

<style>
</style>
