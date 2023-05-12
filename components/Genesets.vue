<template>
<div>
    <b-form inline class="justify-content-center mb-2"> 
        Gene set group <b-form-select  size="sm" v-model="selectedGenesetGroup" @change="fetchGenesetExpression('reset')" :options="genesetGroups" class="ml-1 mr-4"></b-form-select>
        Gene set <b-form-select  size="sm" v-model="selectedGeneset" @change="fetchGenesetExpression" class="ml-1 mr-4">
            <b-form-select-option v-for="(geneset,index) in genesets" :key="geneset" :value="geneset" v-b-tooltip.hover 
                :title="genesetDescriptions[index]">{{geneset}}</b-form-select-option>
        </b-form-select>
        Samples at time <b-form-select  size="sm" v-model="selectedTimepoint" @change="fetchGenesetExpression" :options="timepoints" class="ml-1"></b-form-select>
        <b-dropdown text="Tools" variant="dark" class="ml-4" size="sm">
            <b-dropdown-item @click="clusterColumns=!clusterColumns; fetchGenesetExpression();">Cluster columns using data
                <b-icon-check v-if="clusterColumns"></b-icon-check>
            </b-dropdown-item>
            <b-dropdown-item @click="goToReactome">Show genes at Reactome</b-dropdown-item>
            <b-dropdown-item @click="downloadGenes">Download genes</b-dropdown-item>
            <b-dropdown-item @click="showBackgroundInfo=true">About gene sets</b-dropdown-item>
            <!-- <b-dropdown-item @click="plotHeatmap(adjustHeight=true)">Adjust height to fit all rows</b-dropdown-item> -->
        </b-dropdown>
    </b-form>
    <div class="text-center mt-3" style="line-height:30px">{{genesetInfo}} 
        <b-button class="ml-4" size="sm" variant="secondary" v-b-tooltip.hover title="Click to view expression plot" 
        @click="fetchGeneExpression" style="width:90px; height:30px;">{{selectedGene==null? "[gene]": selectedGene}}</b-button>
    </div>
    <div id="heatmapDiv"></div>

    <!-- background info (modal) -->
    <b-modal v-model="showBackgroundInfo" title="About gene sets" ok-only>
        <p>There are 2 groups of gene sets: DE genes have been obtained by 
            <a href="http://bioconductor.org/packages/release/bioc/html/limma.html" target="_blank">limma</a> analysis, 
            and show differentially expressed genes between one treatment at one time point against control samples at the same time point.
            Pathway genes have been obtained either by <a href="https://doi.org/10.1186/1471-2105-9-55" target="_blank">WGCNA</a> 
            analysis (Module_xx) or from <a href="https://www.gsea-msigdb.org/gsea/msigdb/human/collections.jsp" target="_blank">MSigDB</a> 
            (Hallmark genes).
        </p>
        <p>Since there are so many treatments and time points, only one time point can be chosen and mean value
            for replicates within each treatment is shown. The values are scaled so that for each row, the control value
            is subtracted. Note that heatmap automatically scales its size so not all gene symbols may be shown if there are too
            many to show. All genes in the selected gene set are still rendered in the heatmap.
        </p> 
    </b-modal>

    <!-- gene expression plot (modal) -->
    <b-modal static v-model="showGeneExpressionPlot" size="lg" ok-only>
        <b-form inline class="justify-content-center mb-2"> 
            Gene: <b class="ml-2 mr-4">{{selectedGene}}</b> Treatment type: <b-form-select  size="sm" v-model="selectedTreatmentType" :options="treatmentTypes" 
                                @change="plotGeneExpression" class="ml-2"></b-form-select>
        </b-form>
        <div id="geneExpressionPlotDiv"></div>
    </b-modal>

    <!-- <b-row v-if="false">
        <b-col>
            <b-table-lite :items="genesets" outlined>
                <template #cell(2h)="row">
                    <b-button size="sm" @click="showDetails(row.index,'2h')" variant="warning" style="width:50px">{{row.value.length}}</b-button>
                </template>
                <template #cell(6h)="row">
                    <b-button size="sm" @click="showDetails(row.index,'6h')" variant="warning" style="width:50px">{{row.value.length}}</b-button>
                </template>
                <template #cell(16h)="row">
                    <b-button size="sm" @click="showDetails(row.index,'16h')" variant="warning" style="width:50px">{{row.value.length}}</b-button>
                </template>
            </b-table-lite>
        </b-col>
        <b-col>
        </b-col>
    </b-row> -->
</div>
</template>

<script>
export default {
    data() {
        return {
            showBackgroundInfo: false,
            clusterColumns: false,

            // For single gene expression plot
            showGeneExpressionPlot: false,
            selectedGene: null,
            updateSelectedGene: true,
            geneExpressionValues: {},
            treatmentTypes: [], // ['PRR_other',...]
            treatmentFromType: {}, // {'PRR_other':['Pam3CSK4',...]}
            selectedTreatmentType: null,
            orderedSamples: {},

            expression: [],
            columns: [],
            geneIdFromSymbol: {},
            geneSymbols: [],
            genesetGroups: ['DE genes','Hallmark'],
            selectedGenesetGroup: 'DE genes',
            genesets: [],
            selectedGeneset: null,
            genesetDescriptions: [],
            timepoints: ['2h','6h','16h'],
            selectedTimepoint: '2h',
        }
    },

    computed: {
        genesetInfo() {
            return this.selectedGeneset + " (" + this.geneSymbols.length + " genes), at " + this.selectedTimepoint
        },
    },

    methods: {
        downloadGenes() {
            alert("Coming soon");
        },

        // When user hovers on the heatmap, this function runs to update the selectedGene
        handlePlotlyHover(data) {
            if (this.updateSelectedGene)
                this.selectedGene = data.points[0].y;
        },

        // When user click on the heatmap, this function runs to update the selectedGene
        handlePlotlyClick(data) {
            if (!this.updateSelectedGene)
                this.selectedGene = data.points[0].y;
            this.updateSelectedGene = false;
        },

        // Plot heatmap once all required data variables have been populated
        plotHeatmap(adjustHeight=null) {
            let traces = [{type: 'heatmap', z:this.expression, x:this.columns, y:this.geneSymbols, 
                           //colorbar: {title: 'log FC'}, colorscale:[[0,'blue'],[0.5,'#fcf6f6'],[1,'red']],
                           colorscale:'RdBu',
                           hovertemplate:"gene: %{y}<br>sample: %{x}<br>value: %{z}<br><extra>click<br>to select<br>gene</extra>", 
                           zmid:0, bordercolor:'grey', borderwidth:1}];
            let layout = {
                          modebar:{orientation:'h'}, margin:{t:30},
                          yaxis: {ticktext:"<a href='https://google.com'>A</a>"}};
            if (adjustHeight!=null) {
                layout.yaxis.autotick = false;
                // layout.yaxis_nticks = this.geneSymbols.lengths;
            }
            Plotly.newPlot("heatmapDiv", traces, layout);
            let div = document.getElementById('heatmapDiv');
            let self = this;
            div.on('plotly_hover', function(data) {
                // data.points is an Array of length 1. Use this trick to get all its keys
                // console.log(Object.keys(data.points[0]));
                self.handlePlotlyHover(data); // 'this' means something different here
            });
            div.on('plotly_click', function(data) {
                self.handlePlotlyClick(data);
            });
        },

        // Fetch the expression values and run plotHeatmap function
        // selection is used to reset the selectedGeneset, which is useful when the geneset group changes.
        fetchGenesetExpression(selection) {
            if (selection=='reset')
                this.selectedGeneset = null;
            // Work out the parameters for the api call
            let params = [];
            params.push('geneset_group=' + this.selectedGenesetGroup);
            params.push('timepoint=' + this.selectedTimepoint);
            params.push('cluster_columns=' + (this.clusterColumns? 't':'f'));
            if (this.selectedGeneset!=null)
                params.push('geneset=' + this.selectedGeneset);
            this.$axios.get("/api/genes/geneset-table?" + params.join('&')).then(res => {
                this.genesets = res.data.genesets.map(item => item.name);
                if (this.selectedGeneset==null)
                    this.selectedGeneset = this.genesets[0];
                this.genesetDescriptions = res.data.genesets.map(item => item.description);
                this.geneSymbols = res.data.geneSymbols;
                for (let i=0; i<res.data.expression.index.length; i++)
                    this.geneIdFromSymbol[this.geneSymbols[i]] = res.data.expression.index[i];
                this.columns = res.data.expression.columns;
                this.expression = res.data.expression.data;
                this.selectedGene = null;
                this.updateSelectedGene = true;
                this.plotHeatmap();
            });
        },

        // From the sample table fetched by api call, [{columm -> value},...] format,
        // set variables which can be used for gene expression plot
        setOrderedSamples(data) {
            // Get all treatment types, excluding control
            this.treatmentTypes = Array.from(new Set(data.map(item => item['type'])));   // unique values only
            this.treatmentTypes = this.treatmentTypes.filter(item => item!='control');
            this.selectedTreatmentType = this.treatmentTypes[0];

            // Group treatments under each treatment type, and work out sample ids for each time point
            let times = ['2h','6h','16h'];
            for (let treatmentType of this.treatmentTypes) {
                let treatments = data.filter(item => item['type']==treatmentType).map(item => item['treatment']);
                this.treatmentFromType[treatmentType] = Array.from(new Set(treatments));
                for (let treatment of this.treatmentFromType[treatmentType]) {
                    this.orderedSamples[treatment] = {};
                    for (let timevalue of times) {
                        // Find all sample ids which match this timevalue and treatment
                        let matchingRows = data.filter(item => item['treatment']==treatment && item['time']==timevalue);
                        this.orderedSamples[treatment][timevalue] = matchingRows.map(item => item.index);
                    }
                }
            }            
        },

        // Plot single gene expression once all required variables have been set
        plotGeneExpression() {
            const exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                    '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                    '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];
            let traces = [];
            let times = ['2h','6h','16h'];
            let treatments = this.treatmentFromType[this.selectedTreatmentType];
            for (let treatment of treatments) {
                let x=[], y=[];
                let sumValue = {}; // sum of y values for each time
                for (let timevalue of times) {
                    sumValue[timevalue] = 0;
                    for (let sampleId of this.orderedSamples[treatment][timevalue]) {
                        x.push(timevalue);
                        y.push(this.geneExpressionValues[sampleId]);
                        sumValue[timevalue] += this.geneExpressionValues[sampleId];
                    }
                }
                traces.push({type:'scatter', x:x, y:y, name:treatment, mode:'markers', 
                                marker:{color:exampleColours[treatments.indexOf(treatment)]}});
                traces.push({type:'scatter', x:times, 
                                y:times.map(item => sumValue[item]/this.orderedSamples[treatment][item].length), 
                                showlegend:false, mode:'lines', 
                                marker:{color:exampleColours[treatments.indexOf(treatment)]}});
            }
            let layout = {};
            Plotly.newPlot("geneExpressionPlotDiv", traces, layout);
        },

        // Fetch single gene expression values and run plotGeneExpression
        fetchGeneExpression() {
            this.$axios.get("/api/atlases/ma/expression-values?gene_id=" + this.geneIdFromSymbol[this.selectedGene]).then(res => {
                let result = res.data;
                if (result.length==0) {
                    alert("Could not find this gene in the atlas.");
                    return;
                }
                this.showGeneExpressionPlot = true;
                let values = result[0]; // {sampleId -> value}
                delete values.index;    // don't need gene id key
                this.geneExpressionValues = values;
                this.plotGeneExpression();
            });
        },

        // Open up reactome with current gene set
        goToReactome() {
            this.$axios.post("/reactome/AnalysisService/identifiers/?interactors=false&pageSize=20&page=1&sortBy=ENTITIES_PVALUE&order=ASC&resource=TOTAL&pValue=1&includeDisease=true", 
                             this.geneSymbols.join(','), {'headers': {'Content-Type':'text/plain'}}
            ).then(res => {
                const token = res.data.summary.token;
                window.open("https://reactome.org/PathwayBrowser/#DTAB=AN&ANALYSIS=" + token, "_blank");
            }).catch(error => this.$bvModal.msgBoxOk("Unexpected error while opening Reactome: " + error.reponse.data)
            ).then(() => {
            });

        },
    },

    mounted() {
        this.$axios.get("/api/atlases/ma/samples?orient=records").then(res => {
            this.setOrderedSamples(res.data);
            this.fetchGenesetExpression();
        });
    }
}
</script>

<style>
.dot {
    height: 50px;
    width: 50px;
    background-color: #b80000;
    border-radius: 50%;
    display: inline-block;
    line-height: 50px;
    text-align: center;
}
.dot a {
    color: white;
}
.table th,td {
    text-align: center;
    vertical-align: middle !important;
} 
</style>