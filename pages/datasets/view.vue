<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container>
    <div class="text-center">
    <h3 class="my-3">
        <b-link to="/datasets/collections" v-b-tooltip.hover.bottom title="Use the search function from Dataset collections menu to change dataset">
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
                        <b-spinner v-if="pca.loading" label="Loading..." variant="secondary" class="ml-2" style="width:1.5rem; height:1.5rem;"></b-spinner>
                    </small>
                </h5>
            </div>
            <b-row class="small justify-content-center">
                <b-col col md="9" class="overflow-auto text-center">
                    <div id="pcaPlotDiv"></div>
                </b-col>
                <b-col>
                    <PlotLegend :legends="pca_legends" :sample-groups-ordered="sampleGroups"
                        @legend-clicked="updatePCA" @sample-group-changed="plotPCA"></PlotLegend>
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
                <b-dropdown v-if="false" text="project onto">
                    <b-dropdown-item @click="projectData('myeloid')">Myeloid atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('blood')">Blood atlas</b-dropdown-item>
                    <b-dropdown-item @click="projectData('dc')">DC atlas</b-dropdown-item>
                </b-dropdown>
            <b-table hover sticky-header="500px" :items="samples" class="small mt-2"></b-table>
        </b-tab>

        <b-tab title="Genes" class="text-center">
            Look up expression profile for a gene in this dataset. You can also copy and paste Ensembl gene id here.
            <b-form inline class="justify-content-center mt-3">
                <div v-if="genes_loading"><b-spinner label="Loading..." variant="secondary" style="width:1.5rem; height:1.5rem;"></b-spinner></div>
                <div v-else>gene:</div>
                <GeneSearch form-group-description="" @gene-selected="genes_updateSelectedGene" @keyup-enter="genes_updateSelectedGene" size="sm" class="ml-1"></GeneSearch>
                <b-button variant="dark" @click="genes_updateSelectedGene" size="sm">show</b-button>
                <b-dropdown right text="tools" class="col-md-2 px-0 m-1 text-left" variant="secondary" size="sm">
                    <b-dropdown-item v-if="genes_selectedPlotType=='violin'" @click="genes_selectedPlotType='box'">change to box plot</b-dropdown-item>
                    <b-dropdown-item v-if="genes_selectedPlotType=='box'" @click="genes_selectedPlotType='violin'">change to violin plot</b-dropdown-item>
                    <b-dropdown-item v-if="!genes_showPoints" @click="genes_showPoints=true">show data points</b-dropdown-item>
                    <b-dropdown-item v-if="genes_showPoints" @click="genes_showPoints=false">hide data points</b-dropdown-item>
                    <b-dropdown-item @click="genes_showSimilarGenesDialog=true">find similar genes...</b-dropdown-item>
                    <b-dropdown-item @click="$refs.geneExpressionPlot.ttest_showDialog=true">apply T-test...</b-dropdown-item>
                    <b-dropdown-item @click="$refs.geneExpressionPlot.downloadPlot_showDialog=true">download plot...</b-dropdown-item>
                </b-dropdown>
                <b-link v-b-tooltip.hover.right title="More info and tips" v-b-toggle.sidebar class="ml-2"><b-icon-info-circle></b-icon-info-circle></b-link>
            </b-form>
            <GeneExpressionPlot v-show="'geneId' in genes_selectedGene" ref="geneExpressionPlot" :gene_id="genes_selectedGene.geneId" :dataset_id="datasetId" 
                :plot_type="genes_selectedPlotType" :show_points="genes_showPoints"/>

            <!-- similar genes (modal), shown first before correlation calculation is done -->
            <b-modal v-model="genes_showSimilarGenesDialog" title="Find similar genes" hide-footer>
                <p>You can search for genes with similar expression profile as this gene in this dataset.
                    Pearson correlation will be used as the score, a list of genes will be shown where you can 
                    view expression profile for each gene.
                </p>
                <p>Selected gene: <b>{{genes_selectedGene.geneSymbol}}</b></p>
                <b-button @click="genes_FindSimilarGenes" class="mt-2">Start</b-button>
                <b-button v-if="genes_correlatedGenes.length>0" @click="genes_showSimilarGenesDialog=false; genes_showCorrelatedGenes=true" class="mt-2">Show previous result</b-button>
                <b-spinner v-if="genes_loading" label="Calculating..." variant="secondary" class="ml-2" style="width:1.5rem; height:1.5rem;"></b-spinner>
            </b-modal>

            <!-- correlated genes (draggable), shows results of correlated genes calculation -->
            <draggable-div v-show="genes_showCorrelatedGenes" class="border border-dark bg-light" style="width:900px; opacity:0.95;">
                <div slot="header" class="card-header bg-dark" title="Drag me around by this area">
                    <span class="text-white">Top 30 most correlated genes to <b>{{genes_selectedGeneNameInCorrelated}}</b></span>
                    <b-link href="#" @click="genes_showCorrelatedGenes=false" class="float-right font-weight-bold text-white">X</b-link>
                </div>
                <div slot="main">
                    <div class="card-body py-0">
                        <b-row class="mt-2">
                            <b-col class="px-0" md="3">
                                <b-card no-body :header="'Genes (' + genes_correlatedGenes.length + ')'">
                                    <div style="max-height:500px; overflow-y:auto">
                                        <b-list-group flush>
                                            <b-button squared v-for="gene in genes_correlatedGenes" :key="gene.geneId" 
                                                :pressed="genes_selectedCorrelatedGene.geneId==gene.geneId"  @click="genes_selectedCorrelatedGene=gene"
                                                class="list-group-item list-group-item-action d-flex justify-content-between" href="#" 
                                                style="font-size:smaller">
                                                {{gene.geneSymbol}} ({{Math.round(100*gene.score)/100}})
                                                <b-icon-chevron-right scale="0.8"></b-icon-chevron-right>
                                            </b-button>
                                        </b-list-group>
                                    </div>
                                </b-card>
                            </b-col>
                            <b-col class="px-0 ml-1">
                                <b-card no-body>
                                    <b-card-header class="text-center">
                                        Expression of <b-link :href="'https://ensembl.org/Gene/Summary?g=' + genes_selectedCorrelatedGene.geneId" 
                                            target="_blank" v-b-tooltip.hover :title="genes_selectedCorrelatedGene.geneDescription + ' (Click to go to Ensembl site)'">
                                            {{genes_selectedCorrelatedGene.geneSymbol}}</b-link>
                                    </b-card-header>
                                    <b-card-body>
                                        <GeneExpressionPlot :gene_id="genes_selectedCorrelatedGene.geneId" :dataset_id="datasetId" plot-div-id="genePlotDiv2"/>
                                    </b-card-body>
                                </b-card>
                            </b-col>
                        </b-row>
                    </div>
                </div>
            </draggable-div>

            <b-sidebar id="sidebar" title="More info and tips" shadow class="text-left">
                <div class="px-3 py-2">
                    <h4>Tips on gene searches</h4> 
                    <p>Stemformatics uses Ensembl gene ids as the main gene identifier in the system.
                        When you search for a gene using a basic text search, it's possible that multiple gene ids are matched,
                        in which case these are shown in the list of suggestions. If there are too many to
                        choose from there, it may be easier to search at <b-link href='http://ensembl.org' target="_blank">ensembl.org</b-link>
                        and copy and paste the Ensembl id into the search box.
                    </p>
            </div>
            </b-sidebar>

        </b-tab>

        <b-tab title="Download">
            <p>Download files for this dataset in tab-separated text format here.</p>
            <p><b-link :href="apiUrl + '/datasets/' + datasetId + '/samples?as_file=true'">Sample table</b-link></p>
            Expression files
            <ul v-if="datasetMetadata.platform_type=='RNASeq'">
                <li><b-link :href="apiUrl + '/datasets/' + datasetId + '/expression?as_file=true'">
                    raw counts file summarised at Ensembl gene id (unnormalised)</b-link></li>
                <li><b-link :href="apiUrl + '/datasets/' + datasetId + '/expression?as_file=true&key=cpm'">
                    cpm (counts per million) file with Ensembl gene ids</b-link></li>
            </ul>
            <ul v-if="datasetMetadata.platform_type=='Microarray'">
                <li><b-link :href="apiUrl + '/datasets/' + datasetId + '/expression?as_file=true'">
                    normalised expression values at probe id (background corrected)</b-link></li>
                <li><b-link :href="apiUrl + '/datasets/' + datasetId + '/expression?as_file=true&key=genes'">
                    log normalised expression values at gene id (highest value of probe used for each gene)</b-link></li>
            </ul>
        </b-tab>

        <b-tab v-if="false" title="History">
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
            
            apiUrl: 'http://127.0.0.1:5000', // set to process.env.BASE_URL when mounted
            datasetId: 6277,

            // pca plot
            pca: {selectedSampleGroup: "",
                  coords: {},
                  attributes: {},
                  showScreePlot: false,
                  loading: false,
            },
            pca_legends:{},

            // dataset metadata
            datasetMetadata: {},
            metadataTable: [],
            accessions: {},   // useful for rendering accession html more easily

            // sample table
            samples: [],    // [{'sample_id':'7283_GSM1977399', 'cell_type':'', ...}, ...]
            sampleGroups: [],   // ["sample_type", "age", ...]

            // genes - most of these fields need to be reactive, in which case best to not be inside other objects
            genes_selectedGene: {},
            genes_selectedPlotType: 'box',
            genes_showPoints: true,

            genes_showSimilarGenesDialog: false,
            genes_correlatedGenes: [],
            genes_showCorrelatedGenes: false,
            genes_selectedCorrelatedGene:{},
            genes_selectedGeneNameInCorrelated: '',

            genes_loading:false,
        }
    },

    methods: {
        // Return a more useful version of trace name if it's too long, using elipses
        // traceName(name) {
        //     return name.length>15? '<b-link v-b-tooltip.hover title="test">' + name.substring(0,15) + '...</b-link>' : name;
        // },
        
        // ------------ Overview tab ---------------
        // Create a new PCA plot. legend may also be a new selectedSampleGroup, which also creates a new plot
        plotPCA(legend) {
            if (legend && 'selectedSampleGroup' in legend)    // specified sample group
                this.pca.selectedSampleGroup = legend.selectedSampleGroup;
            
            const traces = this.pca_legends[this.pca.selectedSampleGroup].map(legend => (
                {x:legend.sampleIds.map(item => this.pca.coords['0'][item]), 
                    y:legend.sampleIds.map(item => this.pca.coords['1'][item]),
                    z:legend.sampleIds.map(item => this.pca.coords['2'][item]),
                    mode:'markers', type:'scatter3d', text:legend.sampleIds, hoverinfo:'text', 
                    marker:{color:legend.colour, size:5}, visible:legend.visible}
            ));
            const layout = {showlegend:false, margin: {t:20, l:0, r:0, b:0}, 
                scene:{xaxis:{title:'PC1'}, yaxis:{title:'PC2'}, zaxis:{title:'PC3'}}};
            Plotly.newPlot('pcaPlotDiv', traces, layout);
        },

        // Should run when a legend is clicked, so that its corresponding trace can be toggled.
        updatePCA(legend) {
            let legendIndex = this.pca_legends[this.pca.selectedSampleGroup].map(item => item.value).indexOf(legend.value);
            if (legendIndex!=-1) {
                Plotly.restyle('pcaPlotDiv',{visible: !legend.visible}, legendIndex);
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
        // Should run when gene-selected event is triggered from GeneSearch component.
        // Note that this automatically triggers expression plot, as GeneExpressionPlot has a watcher on selectedGene.geneId
        genes_updateSelectedGene(selectedGene) {
            this.genes_selectedGene = selectedGene;
        },

        genes_FindSimilarGenes() {
            if (!('geneId' in this.genes_selectedGene)) {
                this.$bvModal.msgBoxOk("Select a gene first");
                return;
            }
            this.genes_loading = true;
            this.$axios.get('/api/datasets/' + this.datasetId + '/correlated-genes?gene_id=' + this.genes_selectedGene.geneId).then(res => {
                let geneIds = Object.keys(res.data);
                // Get gene symbols and descriptions from mygene
                this.$axios.post("/mygene/v3/gene", 'fields=symbol,summary,ensembl.gene&ids=' + geneIds.join(','), {'headers': {'Content-Type':'application/x-www-form-urlencoded'}}
                ).then(result => {
                    let geneSymbolFromGeneId = {};
                    let geneDescriptionFromGeneId = {};
                    result.data.forEach(item => {
                        geneSymbolFromGeneId[item['query']] = 'symbol' in item? item['symbol'] : item['query'];
                        geneDescriptionFromGeneId[item['query']] = 'summary' in item? item['summary'] : item['query'];
                        });
                    this.genes_correlatedGenes = geneIds.map(item => (
                        {geneId: item, geneSymbol: geneSymbolFromGeneId[item], geneDescription: geneDescriptionFromGeneId[item], score: res.data[item]}
                    ));
                    this.genes_selectedGeneNameInCorrelated = this.genes_selectedGene.geneSymbol;
                    this.genes_selectedCorrelatedGene = this.genes_correlatedGenes[0];
                    this.genes_showCorrelatedGenes = true;
                });
            })
            .catch().then(() => {
                this.genes_loading = false;
                this.genes_showSimilarGenesDialog = false;
            });
        },

        // ------------ Samples tab ---------------
        projectData(atlasType) {
            alert("Coming soon!");
        }
    },

    mounted() {
        // Set datasetId if coming from query
        if (this.$route.query.id!=null) {
            this.datasetId = parseInt(this.$route.query.id);
            localStorage.setItem('s4m:datasets_view.selectedDatasetId', this.datasetId);   
        }
        else // try localStorage
            this.datasetId = parseInt(localStorage.getItem('s4m:datasets_view.selectedDatasetId')) || 6277;

        this.pca.loading = true;
        this.apiUrl = process.env.BASE_API_URL;

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
                this.sampleGroups = this._sampleGroupsForPlotlyTrace(this.samples);
                this.pca.selectedSampleGroup = this.sampleGroups[0];
                this.pca.coords = res2.data["coordinates"];
                this.pca.attributes = res2.data["attributes"];
                this.pca_legends = this._legendsFromSampleTable(this.samples);
                this.plotPCA();
            }).catch().then(() => {
                this.pca.loading = false;
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
