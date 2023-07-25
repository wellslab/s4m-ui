<template>
<div>
    <b-form v-show="showCustomGeneset" inline class="justify-content-center mb-2"><b>Showing custom gene set</b>
        <b-link @click="showCustomGeneset=false" class="ml-2">(show collections instead)</b-link>
    </b-form>
    <b-form v-show="!showCustomGeneset" inline class="justify-content-center mb-2"> 
        Gene set group and name <b-form-select  size="sm" v-model="selectedGenesetCollection" @change="setGenesets(); fetchGenesetExpression();" 
            :options="Object.keys(genesetCollections)" class="ml-1"></b-form-select>
        <b-form-select  size="sm" v-model="selectedGeneset" @change="fetchGenesetExpression" class="ml-1 mr-4">
            <b-form-select-option v-for="(geneset,index) in genesets" :key="geneset" :value="geneset" v-b-tooltip.hover 
                :title="genesetDescriptions[index]">{{geneset}}</b-form-select-option>
        </b-form-select>
    </b-form>
    <b-form inline class="justify-content-center mb-2">
        Samples are averaged over <b-form-select size="sm" v-model="selectedGroupBy" @change="setSelectedGroupBy" :options="Object.keys(sampleTable)" class="mx-1">
            </b-form-select>
        and subset at <b-form-select size="sm" v-model="selectedSampleSubset" @change="setSelectedSampleSubset" class="ml-2">
        <b-form-select-option v-for="item in sampleSubsets" :key="item" :value="item" :disabled="item==selectedGroupBy" 
            :style="{color: item==selectedGroupBy? '#ddb3b3' : 'black'}">{{item}}</b-form-select-option>
        </b-form-select>
        <b-form-select v-if="selectedSampleSubset!='[no subset]'" size="sm" v-model="selectedSampleSubsetItem" @change="fetchGenesetExpression" 
            :options="sampleSubsetItems" class="ml-1"></b-form-select>
    </b-form>
    <div class="text-center mt-3" style="line-height:30px">{{genesetInfo}} <b-link @click="showGenesetCountInfo=true"><b-icon-question-circle></b-icon-question-circle></b-link>
        <b-button class="ml-4" size="sm" variant="secondary" v-b-tooltip.hover title="Click to view expression plot" 
        @click="plotGeneExpression" style="width:120px; height:30px;">{{selectedGene==null? "[selected gene]": selectedGene}}</b-button>
        <b-button size="sm" variant="dark" @click="showSelectSampleForBaseValue=true">Set scoring</b-button>
        <b-dropdown text="Tools" variant="dark" size="sm">
            <b-dropdown-item @click="showCustomGenesetModal=true">Create a custom gene set</b-dropdown-item>
            <b-dropdown-item @click="clusterColumns=!clusterColumns; fetchGenesetExpression();">Cluster columns using data
                <b-icon-check v-if="clusterColumns"></b-icon-check>
            </b-dropdown-item>
            <b-dropdown-item @click="setHeatmapHeightToFit=!setHeatmapHeightToFit; plotHeatmap();">Adjust height to fit all rows
                <b-icon-check v-if="setHeatmapHeightToFit"></b-icon-check>
            </b-dropdown-item>
            <b-dropdown-item @click="goToReactome">Show genes at Reactome</b-dropdown-item>
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item @click="showDownloadModal=true">Download plot/genes</b-dropdown-item>
            <b-dropdown-item @click="showBackgroundInfo=true">About gene sets</b-dropdown-item>
        </b-dropdown>
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
    <b-modal static v-model="showGeneExpressionPlot" size="lg" ok-only :title="selectedGene">
        <b-form inline class="justify-content-center mb-2"> 
            Trace: 
            <b-form-select  size="sm" v-model="singleExpressionSelectedTrace" :options="Object.keys(sampleTable)" 
                @change="plotGeneExpression" class="ml-2 mr-4"></b-form-select>
            X-values:
            <b-form-select  size="sm" v-model="singleExpressionSelectedX" :options="Object.keys(sampleTable)" 
                @change="plotGeneExpression" class="ml-2"></b-form-select>
        </b-form>
        <div id="geneExpressionPlotDiv"></div>
    </b-modal>

    <!-- information about number of genes shown -->
    <b-modal v-model="showGenesetCountInfo" title="Info on number of genes" ok-only>
        Gene set: <b>{{selectedGeneset}}</b><br/>
        Total number of genes: {{geneSymbols.length + unfilteredGenes.length + missingGenes.length}}<br/>
        &rarr; After removing genes not found in this atlas: {{geneSymbols.length + unfilteredGenes.length}}<br/>
        &nbsp; &rarr; After removing genes filtered out in this atlas: {{geneSymbols.length}}<br/>
        <br/>Stemformatics integrated atlas uses gene filtering to remove batch effects. Hence the filtered out genes
        are not trustworthy sources of biological signal and exlcuded from the heatmap.
        <br/><br/>Note if you entered gene symbols, the total number of genes here correspond to genes where matching id
        was found, hence may be less than the original list.
    </b-modal>

    <!-- Modal that handles set scoring function (started off as only selecting sample base value, hence the variable names here) -->
    <b-modal v-model="showSelectSampleForBaseValue" title="Select scoring method for heatmap" ok-only>
        It is often better to transform the expression values before rendering them on a heatmap,
        to highlight certain clusters. You can try different transforms here.<br/><br/>
        <b-form-select size="sm" v-model="selectedScoring" :options="possibleScores"></b-form-select>
        <b-form-select v-show="selectedScoring=='Subtract selected column'" size="sm" v-model="selectedSampleBaseItem" 
            :options="sampleGroupItems(selectedGroupBy)" class="mt-2"></b-form-select><br/><br/>
        <div v-if="selectedScoring=='Subtract row average'">
            For each row, calculate the average value and subtract this from all values.
        </div>
        <div v-if="selectedScoring=='Subtract selected column'">
            For each row, subtract the value matching the column specified (good for comparing all values against that
            column, such as control values).
        </div>
        <div v-if="selectedScoring=='Use z score'">
            For each row, transform the values using z score (not recommended for small number of columns).
        </div>
        <div v-if="selectedScoring=='Use untransformed values'">
            Do not transform values. This will cluster rows more than columns, so may be better for finding
            subsets of correlated genes.
        </div>
        <template #modal-footer>
            <b-button variant="secondary" size="sm" class="float-right" @click="showSelectSampleForBaseValue=false">Cancel</b-button>
            <b-button variant="primary" size="sm" class="float-right" @click="setScoringMethod">Go</b-button>
        </template>
    </b-modal>

    <!-- Modal where you can upload your own gene set -->
    <b-modal v-model="showCustomGenesetModal" title="Create your own gene set">
        <p>Upload your own list of genes to see their expression</p>
        <b-form-textarea v-model="customGenesetText" placeholder="list of gene symbols or Ensembl ids" rows="10"></b-form-textarea>
      <template #modal-footer>
          <b-button variant="secondary" size="sm" class="float-right" @click="showCustomGenesetModal=false">Cancel</b-button>
          <b-button variant="primary" size="sm" class="float-right" @click="showCustomGenesetExpression">Go</b-button>
      </template>
    </b-modal>

    <!-- Modal for downloading plot and data -->
    <b-modal v-model="showDownloadModal" title="Download plot/genes">
        <b-tabs card>
            <b-tab title="Plot" class="mt-3">
                <b-form-group label="Image format">
                    <b-form-radio-group v-model="downloadPlotFormat" :options="downloadPlotFormats"></b-form-radio-group>
                </b-form-group>
                <b-form inline>
                    <b-form-group label="width (pixels)"><b-form-input v-model="downloadPlotWidth" size="sm"></b-form-input></b-form-group>
                    <b-form-group label="height (pixels)"><b-form-input v-model="downloadPlotHeight" size="sm"></b-form-input></b-form-group>
                </b-form>
                <br/>Tip: try setting "Adjust height to fit all rows" from the Tools dropdown to ensure you get the full heatmap.<br/>
                <b-button variant="primary" size="sm" class="mt-3" @click="downloadPlot">Download</b-button>
            </b-tab>
            <b-tab title="Genes">
                <br/>These are the genes rendered on the heatmap in the same ordering as plotted.
                Use copy and paste to export the list.<br/>
                <b-form-textarea v-model="downloadGeneSymbols" rows="10" class="mt-2"></b-form-textarea>
            </b-tab>
        </b-tabs>
      <template #modal-footer>
          <b-button variant="secondary" size="sm" class="float-right" @click="showDownloadModal=false">Close</b-button>
      </template>
    </b-modal>

</div>
</template>

<script>
export default {
    props: {
        atlasType: String  // name of the atlas, eg. myeloid
    },

    data() {
        return {
            // For gene sets
            genesetCollections: {}, // {'Hallmark':[{'name':'HALLMARK_ADIPOGENESIS', 'description':...}, ...], ...}
            selectedGenesetCollection: null,    // 'Hallmark'
            genesets: [],   // ['HALLMARK_ADIPOGENESIS',...]
            genesetDescriptions: [], // ['HALLMARK_ADIPOGENESIS from MSigDB', ...]
            selectedGeneset: null,  // 'HALLMARK_ADIPOGENESIS'

            // Scoring options
            possibleScores: ['Subtract row average', 'Subtract selected column', 'Use z score', 'Use untransformed values'],
            selectedScoring: 'Subtract row average',

            // sample table and groupings, subsets
            sampleTable: {}, // {col: {sampleId: value}}
            selectedGroupBy: null,  // 'treatment' (column of sample table to take mean values of)
            selectedSampleSubset: null, // 'time' (column of sample table to select a subset of samples)
            selectedSampleSubsetItem: null, // '2h' (one value from selectedSampleSubset)
            selectedSampleBaseItem: null, // 'Control' (one value from unique items of selectedGroupBy)

            // gene set expression data (for the heatmap)
            expression: [],
            columns: [],
            geneIdFromSymbol: {},
            geneSymbols: [],
            unfilteredGenes: [],
            missingGenes: [],

            // modals and menu options
            showBackgroundInfo: false,
            showGenesetCountInfo: false,
            showSelectSampleForBaseValue: false,
            showCustomGenesetModal: false,
            clusterColumns: true,
            setHeatmapHeightToFit: false,
            showDownloadModal: false,

            // For single gene expression plot
            showGeneExpressionPlot: false,
            selectedGene: null,
            updateSelectedGene: true,
            geneExpressionValues: {},
            singleExpressionSelectedTrace: null, // 'treatment'
            singleExpressionSelectedX: null,  // 'time'

            // custom geneset
            showCustomGeneset: false,
            customGenesetText: '',

            // downloading
            downloadPlotFormats: ['jpeg','svg','webp'],
            downloadPlotFormat: 'jpeg',
            downloadPlotWidth: 1000,
            downloadPlotHeight:1500,
        }
    },

    computed: {
        genesetInfo() {
            let totalGenes = this.geneSymbols.length + this.unfilteredGenes.length + this.missingGenes.length;
            return this.selectedGeneset + ": " + this.geneSymbols.length + " genes (out of total " + totalGenes + ")";
        },

        sampleSubsets() {
            let items = ["[no subset]"];
            Object.keys(this.sampleTable).forEach(item => items.push(item));
            return items;
        },

        sampleSubsetItems() {
            return this.selectedSampleSubset in this.sampleTable? this.sampleGroupItems(this.selectedSampleSubset): [];
        },
        
        downloadGeneSymbols() {
            return this.geneSymbols? this.geneSymbols.slice().reverse().join("\n") : ''; // need slice to make a copy otherwise original array is reversed too!
        },
    },

    methods: {
        // Return an array of unique items in the sample group (eg. sampleGroupItems('time') may return ['0hr','2hr',...])
        sampleGroupItems(sampleGroup) {
            return sampleGroup!=null? Array.from(new Set(Object.values(this.sampleTable[sampleGroup]))) : [];
        },

        // Should run whenever selectedGenesetCollection changes to set genesets and other variables
        setGenesets() {
            this.genesets = this.genesetCollections[this.selectedGenesetCollection].map(item => item.name);
            this.genesetDescriptions = this.genesetCollections[this.selectedGenesetCollection].map(item => item.description);
            this.selectedGeneset = this.genesets[0];
        },

        // Should run when the group by changes (= averaged over)
        setSelectedGroupBy() {
            if (this.selectedGroupBy==this.selectedSampleSubset) { // can't have both the same, so change selectedSampleSubset
                this.selectedSampleSubset = "[no subset]";
            }
            this.fetchGenesetExpression();
        },

        // Should run when the sample subset selection changes
        setSelectedSampleSubset() {
            if (this.selectedSampleSubset!="[no subset]") { // select first item from possible items
                if (this.atlasType=="ma" && this.selectedSampleSubset=="time")   // first item, 0h, is bad
                    this.selectedSampleSubsetItem = '2h';
                else
                    this.selectedSampleSubsetItem = this.sampleSubsetItems[0];
            }      
            this.fetchGenesetExpression();
        },

        // Set geneIds to user specified and fetch heatmap data
        showCustomGenesetExpression() {
            this.geneIds = this.customGenesetText.split("\n");
            this.fetchHeatmapData();
            this.showCustomGenesetModal = false;
            this.showCustomGeneset = true;
        },

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
        plotHeatmap() {
            let traces = [{type: 'heatmap', z:this.expression, x:this.columns, y:this.geneSymbols,
                           //colorbar: {title: 'log FC'}, colorscale:[[0,'blue'],[0.5,'#fcf6f6'],[1,'red']],
                           colorscale:'RdBu',
                           hovertemplate:"gene: %{y}<br>sample: %{x}<br>value: %{z}<br><extra>click<br>to select<br>gene</extra>", 
                           zmid:0, bordercolor:'grey', borderwidth:1}];
            let layout = {
                          modebar:{orientation:'h'}, margin:{t:30},
                          yaxis: {ticktext:"<a href='https://google.com'>A</a>"}};
            if (this.setHeatmapHeightToFit) {
                layout.yaxis.autotick = false;
                layout.yaxis_nticks = this.geneSymbols.length;
                layout.height = Math.max(20*this.geneSymbols.length, 100); // Don't make it too small for small number of genes
            }
            Plotly.purge("heatmapDiv"); // otherwise it remembers the previous div height
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

        setScoringMethod() {
            if (this.selectedScoring=='Subtract selected column' && this.selectedSampleBaseItem==null) {
                alert("Choose a column to use as base value");
                return;
            }
            this.showSelectSampleForBaseValue = false;
            this.fetchHeatmapData();
        },

        fetchHeatmapData() {
            // Work out the parameters for the api call
            let formData = new FormData();
            formData.append('gene_id', this.geneIds.join(','));
            formData.append('cluster_columns', this.clusterColumns? 't':'f');
            formData.append('groupby', this.selectedGroupBy);
            if (this.selectedSampleSubset!='[no subset]') {
                formData.append('subsetby', this.selectedSampleSubset);
                formData.append('subsetby_item', this.selectedSampleSubsetItem);
            }

            if (this.selectedScoring=='Subtract row average')
                formData.append('relative_value','rowAverage');
            else if (this.selectedScoring=='Use z score')
                formData.append('relative_value','zscore');
            else if (this.selectedScoring=='Use untransformed values')
                formData.append('relative_value','none');
            else if (this.selectedScoring=='Subtract selected column') {
                if (this.selectedSampleBaseItem==null) {
                    this.showSelectSampleForBaseValue = true;
                    alert("Choose a column to use as base value");
                    return;
                }
                formData.append('relative_value',this.selectedSampleBaseItem);
            }
            
            this.$axios.post("/api/atlas-heatmap/" + this.atlasType, formData, {headers: {'Content-Type': 'multipart/form-data'}}).then(res2 => {
                // res2.data looks like {'index':[], 'columns':[], 'data':[[]]}. It also contains geneSymbol as the first column
                // So extract data from res2.data and assign them to variables
                if ('error' in res2.data) {
                    alert(res2.data.error);
                    return;
                }
                this.geneSymbols = res2.data.geneSymbols;
                this.geneSymbols.forEach((item,i) => {
                    this.geneIdFromSymbol[item] = res2.data.dataframe.index[i];
                });
                this.columns = res2.data.dataframe.columns;
                this.expression = res2.data.dataframe.data; 
                this.unfilteredGenes = res2.data.unfiltered;
                this.missingGenes = res2.data.notFound;
                this.selectedGene = null;
                this.updateSelectedGene = true;
                if (this.showCustomGeneset)
                    this.selectedGeneset = "[custom gene set]";
                this.plotHeatmap();
            });
        },

        // Fetch the expression values for selected geneset and run plotHeatmap function
        fetchGenesetExpression() {
            if (this.showCustomGeneset)
                this.fetchHeatmapData();
            else {
                this.$axios.get("/api/genes/geneset-collections?collection_name=" + this.selectedGenesetCollection + "&geneset_name=" + this.selectedGeneset).then(res => {
                    this.geneIds = res.data;
                    this.fetchHeatmapData();
                });
            }
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
            if (this.selectedGene==null) return;
            this.$emit('show-gene-expression', this.selectedGene);
            return;
            const exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                    '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                    '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];
            let traces = [];
            let traceItems = this.sampleGroupItems(this.singleExpressionSelectedTrace);
            let xvalues = this.sampleGroupItems(this.singleExpressionSelectedX);
            
            // Get sample ids from sampleTable so that it looks like {'treatment1':{'time1':['sampleId1',...]}},
            // where singleExpressionSelectedTrace is 'treament' in this example, and singleExpressionSelectX is 'time'.
            let sampleIds = {};
            for (const [keyOuter,valOuter] of Object.entries(this.sampleTable[this.singleExpressionSelectedTrace])) {
                for (const [keyInner,valInner] of Object.entries(this.sampleTable[this.singleExpressionSelectedX])) {
                    if (!(valOuter in sampleIds)) sampleIds[valOuter] = {};
                    if (!(valInner in sampleIds[valOuter])) sampleIds[valOuter][valInner] = [];
                    if (keyOuter==keyInner) sampleIds[valOuter][valInner].push(keyInner);
                }
            }

            // Define traces
            for (let traceItem of traceItems) {
                let x=[], y=[];
                let sumValue = {}; // sum of y values for each x - used for joining the lines at the mean of these values
                for (let xvalue of xvalues) {
                    sumValue[xvalue] = 0;
                    for (let sampleId of sampleIds[traceItem][xvalue]) {
                        x.push(xvalue);
                        y.push(this.geneExpressionValues[sampleId]);
                        sumValue[xvalue] += this.geneExpressionValues[sampleId];
                    }
                }
                traces.push({type:'scatter', x:x, y:y, name:traceItem, mode:'markers', 
                                marker:{color:exampleColours[traceItems.indexOf(traceItem)]}});
                traces.push({type:'scatter', x:xvalues, 
                                y:xvalues.map(item => sumValue[item]/sampleIds[traceItem][item].length), 
                                showlegend:false, mode:'lines', 
                                marker:{color:exampleColours[traceItems.indexOf(traceItem)]}});
            }
            let layout = {};
            Plotly.newPlot("geneExpressionPlotDiv", traces, layout);

        },

        // Fetch single gene expression values and run plotGeneExpression
        fetchGeneExpression() {
            this.showGeneExpressionPlot = true;
            this.$axios.get("/api/atlases/" + this.atlasType + "/expression-values?gene_id=" + this.geneIdFromSymbol[this.selectedGene]).then(res => {
                let result = res.data;
                if (result.length==0) {
                    alert("Could not find this gene in the atlas.");
                    this.showGeneExpressionPlot = false;
                    return;
                }
                let values = result[0]; // {sampleId -> value}
                delete values.index;    // don't need gene id key
                this.geneExpressionValues = values;
                this.singleExpressionSelectedTrace = this.selectedGroupBy;
                this.singleExpressionSelectedX = this.selectedSampleSubset=='[no subset]'? 
                    Object.keys(this.sampleTable).filter(item => item!=this.selectedGroupBy)[0] : this.selectedSampleSubset;
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

        // Download  plot
        downloadPlot() {
            let name = "Heatmap";
            Plotly.downloadImage(document.getElementById("heatmapDiv"), {
                format: this.downloadPlotFormat,
                height: parseInt(this.downloadPlotHeight),
                width: parseInt(this.downloadPlotWidth),
                filename: 'Stemformatics_' + this.atlasType + '_atlas_' + name,
            });
        },

    },

    mounted() {
        // Fetch available gene set collections
        this.$axios.get("/api/genes/geneset-collections").then(res => {
            this.genesetCollections = res.data;
            this.selectedGenesetCollection = this.atlasType + '_atlas' in this.genesetCollections? this.atlasType + '_atlas' : Oject.keys(this.genesetCollections)[0];
            this.$axios.get("/api/atlases/" + this.atlasType + "/samples?orient=dict").then(res2 => {
                this.sampleTable = res2.data;
                this.selectedGroupBy = Object.keys(this.sampleTable)[0];
                this.selectedSampleSubset = "[no subset]";
                if (this.atlasType=='ma') {
                    this.selectedGroupBy = 'treatment'; // set default groupby for some atlases
                    this.selectedSampleSubset = 'time';
                    this.selectedSampleSubsetItem = '2h';
                }
                this.setGenesets();
                this.fetchGenesetExpression();
            });
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