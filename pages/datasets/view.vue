<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <div class="text-center">
    <h3 class="my-3">
        <b-link to="/datasets/search" v-b-tooltip.hover.bottom title="Use the search page under Datasets menu to change dataset">
            {{datasetMetadata.displayName}}
        </b-link>
    </h3>
    </div>

    <b-card no-body>
    <b-tabs card pills align="center">
        <b-tab title="Overview" active>
            <div class="col-md-7 m-auto text-center">
                <p>{{datasetMetadata.title}}</p>
                <h5>PCA of log normalised expression
                    <small><b-link v-b-tooltip.hover title="show scree plot" @click="pca.showScreePlot=true; plotPCAScree()">
                        <b-icon-bar-chart-fill flip-h class='ml-2'></b-icon-bar-chart-fill></b-link>
                    </small>
                </h5>
            </div>
            <b-row class="small justify-content-center">
                <b-col col md="9" class="overflow-auto text-center">
                    <div id="pcaPlotDiv"></div>
                </b-col>
                <b-col>
                    <!-- Legend area. -->
                    colour by: 
                    <b-form-select size="sm" v-model="pca.selectedSampleGroup" :options="sampleGroups" @change="plotPCA()" class="ml-1"></b-form-select>
                    <ul class="mt-3 list-unstyled p-0"><li v-for="(legend,i) in pca.currentLegends" :key="legend.value">
                        <b-link href="#" @click="plotPCA(i);" style="font-size:13px;">
                        <b-icon-circle-fill :style="{'color': legend.colour}" scale="0.6"></b-icon-circle-fill>
                        <span :style="legend.visible? 'color:black' : 'color:#a7a7a7'">{{legend.value}} ({{legend.number}})</span>
                        </b-link>
                    </li></ul>
                </b-col>
            </b-row>
            <draggable-div v-show="pca.showScreePlot" class="border border-light bg-light shadow">
                <div slot="header" class="card-header bg-dark" title="Drag me around by this area">
                    <span class="text-white">Scree plot for the PCA</span>
                    <b-link href="#" @click="pca.showScreePlot=false" class="float-right font-weight-bold text-white">X</b-link>
                </div>
                <div slot="main" class="card-body text-center bg-white">
                    <h4></h4>
                    <div id="pcaScreePlotDiv" class="mt-2"></div>
                </div>
            </draggable-div>
        </b-tab>

        <b-tab title="Details">
            <b-table-simple hover small>
                <b-tbody>
                    <b-tr v-for="row in metadataTable" :key="row.description">
                        <b-td>{{row.key}}</b-td>
                        <b-td>
                            <b-link v-if="row.key=='pubmed_id'" :href="'https://pubmed.ncbi.nlm.nih.gov/' + row.value" target="_blank">{{row.value}}</b-link>
                            <span v-else-if="row.key=='accession'" v-for="accession in accessions" :key="accession.value">
                                <b-link :href="accession.html" target="_blank" class="mr-2">{{accession.value}}</b-link>
                            </span>
                            <span v-else>{{row.value}}</span>
                        </b-td>
                    </b-tr>
                </b-tbody>
            </b-table-simple>
        </b-tab>

        <b-tab title="Samples" class="text-center m-auto">
                {{samples.length}} samples
                <b-dropdown text="project onto">
                    <b-dropdown-item @click="projectData('myeloid')">Myeloid atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('blood')">Blood atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('dc')">DC atlas</b-dropdown-item>
                </b-dropdown>
            <b-table hover sticky-header="500px" :items="samples" class="small mt-2"></b-table>
        </b-tab>

        <b-tab title="Genes" class="text-center">
            [Coming soon: Show interesting genes for this dataset - most variable genes across cell types, markers genes for cell types, etc.]
            <b-form inline class="justify-content-center mt-3">
                Show expression for gene: <b-form-input v-model="genes.selectedGeneSymbol" list="possible-genes-datalist" 
                    @keyup="getPossibleGenes" @keyup.enter="plotGene" placeholder="[gene symbol]"></b-form-input>
                <b-form-datalist id="possible-genes-datalist">
                    <option v-for="gene in genes.possibleGenes" :key="gene.gene_id">{{gene.gene_name}}</option>
                </b-form-datalist>
                <!-- @keyup.enter does not work unless this dummy input is added because hitting enter submits the form with just one input -->
                <b-form-input v-show="false"></b-form-input>
                <b-button variant="dark" @click="plotGene">show</b-button>
            </b-form>
            <b-form v-if="genes.selectedGene.gene_id!=null" inline class="justify-content-center mt-3">
                group by: <b-form-select v-model="genes.selectedSampleGroup" :options="sampleGroups" @change="updateGenePlot" class="col-md-2 small-select"></b-form-select>
                <b-form-select v-model="genes.selectedPlotType" @change="updateGenePlot" class="col-md-2 bg-light small-select">
                    <b-form-select-option value="box">box plot</b-form-select-option>
                    <b-form-select-option value="violin">violin plot</b-form-select-option>
                </b-form-select>
                <b-form-checkbox v-model="genes.showPoints" @change="updateGenePlot" class="ml-1">show points</b-form-checkbox>
            </b-form>
            <div id="genePlotDiv"></div>
        </b-tab>

        <b-tab title="Download">
            <p>Download files for this dataset in tab-separated text format here.</p>
            <p><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetId + '/samples?as_file=true'">Sample table</b-link></p>
            Expression files
            <ul v-if="datasetMetadata.platform_type=='RNASeq'">
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetId + '/expression?as_file=true'">
                    raw counts file summarised at Ensembl gene id (unnormalised)</b-link></li>
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetId + '/expression?as_file=true&key=cpm'">
                    cpm (counts per million) file with Ensembl gene ids</b-link></li>
            </ul>
            <ul v-if="datasetMetadata.platform_type=='Microarray'">
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetId + '/expression?as_file=true'">
                    normalised expression values at probe id (background corrected)</b-link></li>
                <li><b-link :href="'http://127.0.0.1:5000/datasets/' + datasetId + '/expression?as_file=true&key=genes'">
                    log normalised expression values at gene id (highest value of probe used for each gene)</b-link></li>
            </ul>
        </b-tab>

        <b-tab title="History">
            <p>Description of how this dataset was processed and key QC decisions made: coming soon...</p>
        </b-tab>
    </b-tabs>
    </b-card>
</b-container>
</div>
</template>

<script>
// Include BootstrapVueIcons - including this in nuxt.config.js or layouts/default.vue doesn't seem to work
import Vue from 'vue'
import { BootstrapVueIcons } from 'bootstrap-vue'
Vue.use(BootstrapVueIcons)

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
                { text: 'Datasets', active: true },
                { text: 'View a dataset', active: true }
            ],

            // pca plot
            // Note currentLegends is same as legends[pca.selectedSampleGroup], 
            // because vue doesn't seem to like updating the dom for changes inside legends object, we make a copy here
            pca: {selectedSampleGroup: "",
                  coords: {},
                  attributes: {},
                  legends: {},
                  currentLegends:[],
                  showScreePlot: false,
                  },

            // dataset metadata
            datasetMetadata: {},
            metadataTable: [],
            accessions: {},   // useful for rendering accession html more easily

            // sample table
            samples: [],    // [{'sample_id':'7283_GSM1977399', 'cell_type':'', ...}, ...]
            sampleGroups: [],   // ["sample_type", "age", ...]

            // genes
            genes: {selectedGene:{gene_id: null, gene_name:''},
                    selectedSampleGroup:'cell_type',
                    selectedPlotType:'box',
                    showPoints:false,
                    possibleGenes:[],
                    expressionValues:{},
                    },
        }
    },

    computed: {
        // Values in store (auto sync)
        datasetId: {    // try to get it from url first, then try the store
            get () { return this.$store.getters['datasets_view/getDatasetId'] },
            set (value) { this.$store.commit('datasets_view/setDatasetId', value) }
        },
    },

    methods: {
        // Return a more useful version of trace name if it's too long, using elipses
        traceName(name) {
            return name.length>15? '<b-link v-b-tooltip.hover title="test">' + name.substring(0,15) + '...</b-link>' : name;
        },
        
        // ------------ Overview tab ---------------
        // Set up legends object for use in PCA plot. This object contains all the info needed to render the plot for all sample groups
        setPCALegends() {
            const exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                  '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                  '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];

            this.sampleGroups.forEach(sampleGroup => {
                // First collect sample ids based on sampleGroup
                let sampleIds = this._sampleIdsFromSampleGroup(this.samples, sampleGroup);
                let groupItems = Object.keys(sampleIds);
                groupItems.sort();

                // Keys of sampleIds form sample group items. Create a legend per sample group item
                this.pca.legends[sampleGroup] = groupItems.map((value,i) => {
                    return {'value': value, 'number': sampleIds[value].length, 'sampleIds': sampleIds[value],
                            'colour': exampleColours[i % exampleColours.length], 'visible': true,
                            'x': sampleIds[value].map(item => this.pca.coords['0'][item]),
                            'y': sampleIds[value].map(item => this.pca.coords['1'][item]),
                            'z': sampleIds[value].map(item => this.pca.coords['2'][item])};
                });
            })
        },

        // Create or update the PCA plot. If legendIndex is undefined, create a new plot,
        // otherwise assume it's the index of clicked legend, and its corresponding trace will be toggled.
        plotPCA(legendIndex) {
            this.pca.currentLegends = this.pca.legends[this.pca.selectedSampleGroup];

            // Different action depending on legendIndex
            if (legendIndex==undefined) { // new plot or user changed sample group, so create a new plot by showing all traces under the selected sample group
                const traces = this.pca.legends[this.pca.selectedSampleGroup].map(legend => {
                    return {x:legend.x, y:legend.y, z:legend.z, mode:'markers', type:'scatter3d', text:legend.sampleIds, hoverinfo:'text', 
                            marker:{color:legend.colour, size:5}}
                });
                const layout = {showlegend:false, margin: {t:20, l:0, r:0, b:0}, scene:{xaxis:{title:'PC1'}, yaxis:{title:'PC2'}, zaxis:{title:'PC3'}}};
                Plotly.newPlot('pcaPlotDiv', traces, layout);
            }
            else {  // legendIndex is a selected index - work out if we're adding or removing a trace
                let legend = this.pca.currentLegends[legendIndex];
                if (legend.visible) {   // currently visible, so hide
                    Plotly.deleteTraces('pcaPlotDiv', legendIndex);
                } else {
                    let trace = {x:legend.x, y:legend.y, z:legend.z, mode:'markers', type:'scatter3d', text:legend.sampleIds, hoverinfo:'text', 
                                 marker:{color:legend.colour, size:5}};
                    Plotly.addTraces('pcaPlotDiv', trace, legendIndex);
                }
                legend.visible = !legend.visible;
            }
        },

        plotPCAScree() {
            // Read explained variance and convert to percentages
            let expVar = Object.values(this.pca.attributes.explained_variance_);
            const sum = expVar.reduce((a, b) => a + b, 0);
            expVar = expVar.map(item => item/sum);
            const x = expVar.map((item,i) => 'PC' + (i + 1));
            const traces = [{x:x, y:expVar, mode:'markers', type:'bar'}];
            const layout = {title:"Percentage of variance explained for each PC component"};
            Plotly.newPlot('pcaScreePlotDiv', traces, layout);
        },

        // ------------ Genes tab ---------------
        plotGene() {
            if (this.genes.selectedGeneSymbol.length==0) return;

            // First find matching gene id
            let gene = this.genes.possibleGenes.filter(item => item.gene_name==this.genes.selectedGeneSymbol);
            // If there's no matching gene here, assume that user copied and pasted a gene id instead of
            // selecting from the dropdown. We'll still support fetching the expression for this.
            if (gene.length>0)
                this.genes.selectedGene = gene[0];
            else {
                this.genes.selectedGene.gene_id = this.genes.selectedGeneSymbol;
                this.genes.selectedGene.gene_name = this.genes.selectedGeneSymbol;
            }

            const key = this.datasetMetadata.platform_type=='Microarray'? 'genes' : 'cpm';
            this.$axios.get("/api/datasets/" + this.datasetId + "/expression?orient=index&gene_id=" + this.genes.selectedGene.gene_id + "&key=" + key).then(res => {
                this.genes.expressionValues = res.data;
                this.updateGenePlot('new');
            });
        },

        updateGenePlot(newPlot) {
            let sampleIds = this._sampleIdsFromSampleGroup(this.samples, this.genes.selectedSampleGroup);

            // Create a plotly trace for each key in sampleIds
            let traces = [];
            let groupItems = Object.keys(sampleIds);
            groupItems.sort();
            groupItems.forEach(groupItem => {
                let y = sampleIds[groupItem].map(item => this.genes.expressionValues[this.genes.selectedGene.gene_id][item]);
                let name = groupItem + " (" + y.length + ")";
                traces.push({y:y, type:this.genes.selectedPlotType , name:name, 
                            boxpoints:this.genes.showPoints? 'all':false,
                            points:this.genes.showPoints? 'all':false});
            });
            let layout = {yaxis: {title: "log2"}};
            if (newPlot)
                Plotly.newPlot('genePlotDiv', traces, layout);
            else
                Plotly.react('genePlotDiv', traces, layout);
        },

        getPossibleGenes() {
            if (this.genes.selectedGeneSymbol.length<=1) return;    // ignore 1 or less characters entered
            this.$axios.get('/geneinfo/v3/query?species=human&fields=symbol,ensembl.gene&size=50&q=' + this.genes.selectedGeneSymbol).then(res => {
                if (res.data.total>0) {
                    // Note that some genes may not have ensembl ids, so lack the ensembl field
                    const genes = res.data['hits'].filter(item => 'ensembl' in item);
                    if (genes.length>0)
                        this.genes.possibleGenes = genes.map(item => {
                            return {gene_id: item.ensembl.gene, gene_name: item.symbol}
                        });
                }
            });
            // .catch(error => {
            //     alert("Could not fetch matching expression values for " + this.genes.selectedGeneSymbol);
            // });
        },

        // ------------ Samples tab ---------------
        projectData(atlasType) {
            alert("Coming soon!");
        }
    },

    mounted() {
        // Set datasetId if coming from query
        if (this.$route.query.id!=null)
            this.datasetId = this.$route.query.id;
            
        // Fetch dataset metadata and sample metada from API server and populate local variables
        this.$axios.get("/api/datasets/" + this.datasetId + "/metadata").then(res => {
            this.datasetMetadata = res.data;
            this.datasetMetadata.displayName = this.datasetMetadata.name.split("_")[0] + " (" + this.datasetMetadata.name.split("_")[1] + ")";
            
            // Parse accession number to make it helpful for rendering dom
            const accessions = this.datasetMetadata.accession.indexOf('|')==-1? [this.datasetMetadata.accession] : this.datasetMetadata.accession.split('|');
                // both accession types may be specified eg: "GSE42519|E-GEOD-42519"
            this.accessions = accessions.map(item => {
                const html = item.startsWith('GSE')? 'https://www.ncbi.nlm.nih.gov/gds/?term=' + item + '[Accession]' : 'https://www.ebi.ac.uk/arrayexpress/experiments/' + item;
                return { html: html, value: item }
            });

            // Create a shorter version of authors
            // let authors = this.datasetMetadata.authors.split(', ');
            // if (authors.length>3) {
            //     authors = authors.splice(0,3);
            //     authors.push('et.al.');
            //     this.datasetMetadata.authorsShort = authors.join(', ');
            // } else
            //     this.datasetMetadata.authorsShort = this.datasetMetadata.authors;

            // construct metadataTable, leaving out some fields we don't need to show
            this.metadataTable = [];
            let hideKeys = ["name", "displayName","private","status"];
            for (let key in this.datasetMetadata)
                if (hideKeys.indexOf(key)==-1)
                    this.metadataTable.push({'key': key, 'value': this.datasetMetadata[key]});

            this.breadcrumb.push({text: this.datasetMetadata.displayName, active: true});
        });
        this.$axios.get("/api/datasets/" + this.datasetId + "/samples").then(res => {
            // PCA should be plotted after sample table construction
            this.$axios.get("/api/datasets/" + this.datasetId + "/pca?orient=dict").then(res2 => {
                this.samples = res.data;
                
                // Extract sample groups to use, but don't include these
                const hideKeys = ["sample_description","external_source_id"];
                this.sampleGroups = this._sampleGroupsForPlotlyTrace(this.samples).filter(item => hideKeys.indexOf(item)==-1);

                // Sort sample group with some preferences to certain fields 
                // (from https://stackoverflow.com/questions/13304543/javascript-sort-array-based-on-another-array)
                const sorted = ['cell_type','sample_type']; // remember that not all sampleGroups will have all these values
                this.sampleGroups.sort((a,b) => {
                    const index1 = sorted.indexOf(a);
                    const index2 = sorted.indexOf(b);
                    return (index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity);
                });

                this.pca.selectedSampleGroup = this.sampleGroups[0];
                this.genes.selectedSampleGroup = this.sampleGroups[0];
                this.pca.coords = res2.data["coordinates"];
                this.pca.attributes = res2.data["attributes"];
                this.setPCALegends();
                this.plotPCA();
            });
        })
    }
}
</script>

<style>
.nav-pills .nav-link.active, .nav-pills .show > .nav-link {
    color: #000;
    background-color: #dee2e6;
}
</style>
