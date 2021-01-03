<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <b-tabs content-class="mt-3">
        <b-tab title="Overview" active class="text-center">
            <h5><a :href="'https://pubmed.ncbi.nlm.nih.gov/' + datasetMetadata.pubmed_id" target="_blank">
                {{datasetMetadata.displayName}}</a>
            </h5>
            <p>{{datasetMetadata.title}}</p>
            <div class="overflow-auto text-center">
                <div id="plotDiv" style="width:800px; height:600px; margin:auto"></div>
            </div>
        </b-tab>

        <b-tab title="Details">
            <h5 class="text-center">{{datasetMetadata.displayName}}: Dataset Details</h5>
            <b-table-simple hover small class="small">
                <b-tbody>
                    <b-tr v-for="row in metadataTable" :key="row.description">
                        <b-td>{{row.key}}</b-td>
                        <b-td>{{row.value}}</b-td>
                    </b-tr>
                </b-tbody>
            </b-table-simple>
        </b-tab>

        <b-tab title="Samples">
            <h5 class="text-center">{{datasetMetadata.displayName}}: Sample Table</h5>
            <b-table hover small sticky-header="500px" :items="samples" class="small"></b-table>
        </b-tab>

        <b-tab title="Tools">
            <h5 class="text-center">{{datasetMetadata.displayName}}: Tools</h5>
            <p class="text-center">Description of how this dataset was processed and key QC decisions made.</p>
            <p class="text-center">Download expression data.</p>
            <p class="text-center">(use accordion here)</p>
        </b-tab>
    </b-tabs>
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
          { text: 'Datasets', active: true },
          { text: 'View a dataset', active: true }
        ],

        // You can get url parameters this way eg: /datasets/view?id=2000
        datasetId: this.$route.query.id==null? 7283: this.$route.query.id,

        // dataset metadata
        datasetMetadata: {},
        metadataTable: [],

        // sample table
        samples: [],

        // sample groups
        sampleGroups: [],   // ["sample_type", "age", ...]
        selectedSampleGroup: "sample_type",
      }
    },

    methods: {
        plotPCA() {
            this.$axios.get("/" + this.datasetId + ".pca.json").then(res => {
                // First collect sample ids based on selectedSampleGroup
                let sampleIds = {};     // {"HSC":["GSM1977407", ...], ...}
                for (let i=0; i<this.samples.length; i++) {
                    let sampleId = this.samples[i]["sample_id"];
                    let value = this.samples[i][this.selectedSampleGroup];
                    if (!(value in sampleIds))
                        sampleIds[value] = [];
                    sampleIds[value].push(sampleId);
                }

                // Create a plotly trace for each key in sampleIds
                let traces = [];
                let groupItems = Object.keys(sampleIds);
                groupItems.sort();
                for (let i=0; i<groupItems.length; i++) {
                    let x = res.data.coords[0];
                    let y = res.data.coords[1];
                    x = x.filter((item,j) => sampleIds[groupItems[i]].indexOf(res.data.index[j])!=-1);
                    y = y.filter((item,j) => sampleIds[groupItems[i]].indexOf(res.data.index[j])!=-1);
                    let name = groupItems[i] + " (" + x.length + ")";
                    traces.push({x: x, y: y, mode: 'markers', type: 'scatter' , name:name});
                }
                let layout = {title: "PCA of log normalised values"}
                Plotly.newPlot('plotDiv', traces, layout);
            });
        }
    },

    mounted() {
        // Fetch dataset metadata and sample metada from API server and populate local variables
        this.$axios.get("/api/dataset/" + this.datasetId, {headers: {"Access-Control-Allow-Origin": "*"}}).then(res => {
            this.datasetMetadata = res.data;
            this.datasetMetadata.displayName = this.datasetMetadata.name.split("_")[0] + " (" + this.datasetMetadata.name.split("_")[1] + ")";
            this.metadataTable = [];
            let hideKeys = ["name", "displayName"]; // don't show these in the table
            for (let key in this.datasetMetadata)
                if (hideKeys.indexOf(key)==-1)
                    this.metadataTable.push({'key': key, 'value': this.datasetMetadata[key]});

            this.breadcrumb.push({text: this.datasetMetadata.displayName, active: true});
        });
        this.$axios.get("/api/samples/" + this.datasetId, {headers: {"Access-Control-Allow-Origin": "*"}}).then(res => {
            this.samples = res.data;
            this.sampleGroups = Object.keys(this.samples[0]);

            // PCA should be plotted after sample table construction
            this.plotPCA();
        })
    }
}
</script>

<style>
</style>
