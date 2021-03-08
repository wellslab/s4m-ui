<template>
<div>
    <!-- Area for controls. -->
    <div class="text-center mt-3">
        <h3 class="mb-2">Integrated Atlas: {{atlasType}}
            <small><b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar><b-icon-info-circle></b-icon-info-circle></b-link></small>
        </h3>
        <b-container class="text-center">
        <b-form inline class="mt-3 justify-content-center">
            <b-form-select v-model="selectedPlotBy" class="col-md-2 bg-light" @change="changePlotBy">
                <b-form-select-option value="sample type">plot by sample type</b-form-select-option>
                <b-form-select-option value="gene expression">plot by gene expression</b-form-select-option>
            </b-form-select>
            <b-form-input v-if="selectedPlotBy=='gene expression'" v-model="selectedGene" list="possible-genes-datalist" @keyup="getPossibleGenes" @keyup.enter="showGeneExpression(selectedGene)"
                placeholder="[gene symbol]" v-b-tooltip.hover title="tooltip.selectedGene" class="ml-2"></b-form-input>
            <b-form-datalist id="possible-genes-datalist">
                <option v-for="gene in possibleGenes" :key="gene.ensembl">{{gene.symbol}}</option>
            </b-form-datalist>
            <b-button v-if="selectedPlotBy=='gene expression'" @click="showGeneExpression(selectedGene)" class="mr-2">go</b-button>
            <b-form-select v-model="selectedPlotFunction" @change="selectPlotFunction" class="col-md-2 bg-light">
                <b-form-select-option value="" selected>plot functions</b-form-select-option>
                <b-form-select-option value="toggle 3d/2d">toggle 3d/2d</b-form-select-option>
                <b-form-select-option value="show sample colour plot">show sample colour plot</b-form-select-option>
            </b-form-select>
            <b-form-select v-model="selectedTool" @change="selectTool" class="col-md-2 bg-light">
                <b-form-select-option value="" selected>tools</b-form-select-option>
                <b-form-select-option value="download data/plots">download data/plots</b-form-select-option>
                <b-form-select-option value="find dataset">find dataset</b-form-select-option>
            </b-form-select>
        </b-form>
        </b-container>
    </div>

    <b-row class="small">
        <b-col col md="9">
            <div class="overflow-auto text-center">
                <div v-if="loading" class="pl-5 pt-5"><b-spinner label="Loading..." variant="secondary"></b-spinner></div>
                <div id="mainPlotDiv" style="overflow:auto; display:inline-block;"></div>
                <div id="rightPlotDiv" style="overflow:auto; display:inline-block;"></div>
            </div>
        </b-col>
        <b-col>
            <!-- Legend area, only shown if selectedPlot is sample type. -->
            <div v-if="showTwoPlots || selectedPlotBy=='sample type'">
                colour by: 
                <b-form-select v-model="selectedColourBy" :options="colourBy" @change="updateLegends(); updatePlot()" 
                    data-step="1" data-intro="Colour each sample by a sample group here.">
                </b-form-select>
                <ul class="mt-3" data-step="2" data-intro="Click on a legend to show/hide samples in the plot." style="list-style-type:none; padding:0">
                    <li v-for="(legend,i) in legends" :style="sampleTypeBreakPoint[selectedColourBy].indexOf(legend.value)!=-1? 'margin-top:10px' : ''" :key="legend.value">
                    <b-link href="#" @click="updateLegends(i); updatePlot();" style="font-size:13px;">
                    <b-icon-circle-fill :style="{'color': legend.colour}" scale="0.6"></b-icon-circle-fill>
                    <span :style="legend.visible? 'color:black' : 'color:#a7a7a7'">{{legend.value}} ({{legend.number}})</span>
                    </b-link>
                </li></ul>
            </div>
        </b-col>
    </b-row>
    
<b-sidebar id="sidebar" title="Help and more info" shadow>
  <div class="px-3 py-2">
      <p>Stemformatics integrated atlas provides a way to visualise multiple datasets together on a single PCA plot.
          Read more about it at our <b-link to='/atlas/about'>about atlas</b-link> page. Each atlas page is full of
          features:
      </p>
      <p>feature 1...
      </p>
  </div>
</b-sidebar>

</div>
</template>

<script>
// Include BootstrapVueIcons - including this in nuxt.config.js or layouts/default.vue doesn't seem to work
import Vue from 'vue'
import { BootstrapVueIcons } from 'bootstrap-vue'
Vue.use(BootstrapVueIcons)

export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },

    // loading: {
    //     color: 'blue',
    //     height: '5px',
    //     throttle: 0,
    // },

    props: ["atlasType"],

    data() {
      return {
        
        coords: {},         // {col: {row: val, ...}}
        sampleIds: [],      // ['sample1', ...]
        sampleTable: {},    // {'celltype':{'sample1':'HPC', ...}, ...}

        selectedPlotBy: "sample type",  // one of ["sample type", "gene expression"]
        is3d: true, // whether plot is in 3d or 2d
        selectedPlotFunction: "",   // chosen from dropdown - see html
        selectedTool: "",   // chosen from dropdown - see html

        colourBy: [],   // ["Cell Type", "Sample Source", ...]
        selectedColourBy: "Cell Type",

        sampleTypeColoursOriginal: {},    // colours may change, so we keep original colours stored here
        sampleTypeColours: {},    // note this may be empty - then use default plotly colours
        sampleTypeOrdering: {},  // may be empty - then use alphabetical ordering

        // gene expression related
        selectedGene: "",
        possibleGenes: [],  // gene ids and symbols used to populate the autocomplete field
        geneExpression: [], // flat list of values, in same order as sampleIds, to be fetched when requested

        sampleIdsMatchingDatasets: [],    // sample ids returned by the search

        // plotly requires id of div where it will plot, so set them as vars here
        mainPlotDiv: "mainPlotDiv",
        rightPlotDiv: "rightPlotDiv",

        // default camera angle for a 3d plot in plotly
        camera: {up: {x:0, y:0, z:1}, center: {x:0, y:0, z:0}, eye: {x:1.25, y:1.25, z:1.25}},
        showTwoPlots: false,

        legends: [],
        loading: true,
        showInfo: false,
        
        // tooltip texts
        tooltip: {atlasType: "<p class='tooltiptext'>show information about this page</p>",
                  atlasToggle: "<p class='tooltiptext'>toggle atlas</p>",
                  selectedGene: "<div class='tooltiptext'><p>Select a gene from suggestions and press go to show its expression.</p>" +
                                "<p>The genes with grey font colours were filtered out before creating this PCA.</p></div>",
                  geneExpressionPlot: "<p class='tooltiptext'>This plot shows rank normalised values of the gene in the atlas as "+
                                      "either a violin or a box plot. The values are in the range [0,1].</p>" +
                                      "<p class='tooltiptext'>You can drag this plot overlay by grabbing it near the title.</p>",
                  close: "<p class='tooltiptext'>close dialog</p>",
                  editLegend: "<p class='tooltiptext'>Edit colours of points</p>",
                  showProjectionFunctions: "<p class='tooltiptext'>Show nearest neighbours of projected points.</p>",
                  projectionFunctions: "<p class='tooltiptext'>You can drag this plot overlay by grabbing it near the title..</p>",
                  customSampleGroup: "<p class='tooltiptext'>You can drag this dialog overlay by grabbing it near the title..</p>",
                  },
      }
    },

    computed: {
        plotFunctions() {
            if (this.showTwoPlots)
                return ["toggle 3d/2d", "hide sample colour plot", "gene expression box plot"];
            else
                return ["toggle 3d/2d", "show sample colour plot", "gene expression box plot"];
        },

        // For a long list of sample types, it's good to place a gap between groups of them as a visual aid.
        // This returns the items where breaks should occur.
        sampleTypeBreakPoint() {
            let itemsWithBreaks = {}
            for (let i=0; i<this.colourBy.length; i++) {
                let key = this.colourBy[i];
                itemsWithBreaks[key] = [];
                if (!(key in this.sampleTypeOrdering)) continue;
                for (let j=1; j<this.sampleTypeOrdering[key].length; j++) {
                    if (this.sampleTypeOrdering[key][j-1]=="")
                        itemsWithBreaks[key].push(this.sampleTypeOrdering[key][j]);
                }
            }
            return itemsWithBreaks;
        },
    },

    methods: {
        // Run before sample group plot to populate the legends array, and when a legend is clicked to show/hide a trace
        updateLegends(clickedLegendIndex) {
            let self = this;

            // Work out what values are available for selected colour by:
            let column = self.sampleTable[self.selectedColourBy]; // dict of selected column from sampleTable
            let availableValues = [];  // will store the unique values in this column
            let sampleIds = {}; // dict to store list of matching sample ids for each item of availableValues
            for (let sampleId in column) {
                if (column[sampleId]=="") continue; // skip null valued rows
                if (availableValues.indexOf(column[sampleId])==-1) {    // first time seen
                    availableValues.push(column[sampleId]);
                    sampleIds[column[sampleId]] = [];
                }
                sampleIds[column[sampleId]].push(sampleId);
            }

            // Now we order these based on sampleTypeOrdering if this is available
            let ordering = self.selectedColourBy in self.sampleTypeOrdering? self.sampleTypeOrdering[self.selectedColourBy] : null;
            availableValues.sort(function(a, b) {
                return ordering==null? a>b : ordering.indexOf(a) - ordering.indexOf(b);
            });

            let legends = [];
            for (let i=0; i<availableValues.length; i++) {
                // Work out the colour for this trace. This is either from sampleTypeColours or from following list
                let exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];
                let colour = (self.selectedColourBy in self.sampleTypeColours && availableValues[i] in self.sampleTypeColours[self.selectedColourBy])?
                        self.sampleTypeColours[self.selectedColourBy][availableValues[i]] : exampleColours[i % exampleColours.length];
                let legend  = {'value': availableValues[i], 
                               'number': sampleIds[availableValues[i]].length,
                               'sampleIds': sampleIds[availableValues[i]],
                               'colour': colour};
                legend.visible = (self.legends.length==availableValues.length && self.legends[i].value==availableValues[i])? self.legends[i].visible : true;
                if (clickedLegendIndex==i)
                    legend.visible = !legend.visible;
                legends.push(legend);
            }
            self.legends = legends;
        },
        
        // Layout dict used by plotly - can control size, camera, etc.
        // type should be either "sample type" or "gene expression" (null defaults to sample type) 
        // - this changes the title of the plot
        layout(type) {
            if (type==null) type = "sample type";

            // work out title based on type
            var title = "Coloured by " + this.selectedColourBy;
            if (type=="gene expression")
                title = "Rank normalised expression of " + this.selectedGene;
            if (this.showTwoPlots)  // title interferes with hover icons and too busy anyway
                title = "";

            return { 
                showlegend: false,
                height: 500,   // height of the plot in pixels
                width: this.showTwoPlots? 500 : 800,
                margin: {t:20, l:0, r:0, b:0},
                xaxis: {title: "PC1"},
                yaxis: {title: "PC2"},
                uirevision: true,
                hovermode: 'closest',
                scene: {camera: this.camera,
                        up: { x: 1, y: 0, z: 0 }, 
                        xaxis: {title: "PC1"},
                        yaxis: {title: "PC2"},
                        zaxis: {title: "PC3"}}
            };
        },
        
        // Return a list of traces to use for plots.
        traces: function(type="sample type") {
            let self = this;	// this refers to the Vue instance, and it's safer to map it to another variable

            // Define elements common to all traces and return them - if we simply define a variable here, it will
            // only be referenced when I try to use it below. Using {...template} or Array.from(template) will clone
            // the array instead of referencing, but won't do a deep copy so have to deal with template.markers
            // separately, for example. So it's easier to define a function that will return a new object.
            function traceTemplate() {
                let template = {
                    marker: {},
                    mode: "markers",
                    hoverinfo: "text",
                };

                if (self.is3d) {  // specify parameters specific to 3d plot
                    template.type = "scatter3d";
                    template.marker.size = 5;
                } else {
                    template.type = "scatter";
                }
                return template;
            }

            // What hover text do we want to show
            let hovertext = {};
            for (let i=0; i<self.sampleIds.length; i++) {
                // show currently selected value + help text
                let values = [self.sampleTable[self.selectedColourBy][self.sampleIds[i]], "(double-click for more info)"];
                // also add sample and dataset ids
                //values.push("(" + self.sampleIds[i] + ")");
                hovertext[self.sampleIds[i]] = values.map(item => "<span style='font-size:14px'>" + item + "</span>").join(" ");
            }

            // create traces
            let traces = [];
            if (type=="sample type") {
                // one trace per item of availableValues
                for (let i=0; i<self.legends.length; i++) {
                    let legend = self.legends[i];
                    if (!legend.visible) continue;

                    let trace = traceTemplate();
                    trace.x = legend.sampleIds.map(item => self.coords['0'][item]);
                    trace.y = legend.sampleIds.map(item => self.coords['1'][item]);
                    trace.z = legend.sampleIds.map(item => self.coords['2'][item]);
                    trace.text = legend.sampleIds.map(item => hovertext[item]);
                    trace.name = legend.value;
                    trace.marker.color = legend.sampleIds.map(item => legend.colour);
                    trace.marker.symbol = legend.sampleIds.map(item => "circle");
                    trace.sampleIds = legend.sampleIds;
                    traces.push(trace);
                }
            } else {    // gene expression plot - one trace only
                var trace = traceTemplate();
                trace.x = self.sampleIds.map(item => self.coords['0'][item]);
                trace.y = self.sampleIds.map(item => self.coords['1'][item]);
                trace.z = self.sampleIds.map(item => self.coords['2'][item]);
                trace.text = self.sampleIds.map(item => hovertext[item]);
                // If 
                trace.marker.color = self.geneExpression.map((item,i) => 
                     self.sampleIdsMatchingDatasets.indexOf(self.sampleIds[i])!=-1? "black": item);
                trace.marker.colorbar = { title: self.selectedGene };
                if (self.showTwoPlots) {    
                    // It's possible that some traces are hidden from rightPlotDiv, in which case we want to match that here.
                    // For each sampleId, set marker size to zero if it belongs to the hidden legend.
                    // Note that there's a bug in plotly where size specified as an array in marker is rendered differently to
                    // when specified as a number, even for the same size.
                    var defaultSize = self.is3d? 11 : 6;
                    var visibleLegends = self.legends.filter(item => item.visible).map(item => item.value);
                    trace.marker.size = self.sampleIds.map((item,i) =>
                        visibleLegends.indexOf(self.sampleTable[self.selectedColourBy][self.sampleIds[i]])==-1? 0 : defaultSize
                    );
                    trace.marker.line = {width: 0}; // plotly also seems to add stroke after array is specified as size
                }
                trace.sampleIds = self.sampleIds;
                traces.push(trace);
            }
            return traces;
        },
        
        mainPlot() {
            var div = document.getElementById('mainPlotDiv');
            Plotly.newPlot(div, this.traces(), this.layout(this.selectedPlotBy));
        },

        // Function to update the plot
        updatePlot: function() {
            let self = this;
            let div = document.getElementById(self.rightPlotDiv);

            if (self.selectedPlotBy=="sample type") // always show one plot for sample type
                self.showTwoPlots = false;

            if (self.showTwoPlots) {
                if (div.layout==null) {    // no plot yet - we plot both and set up sync
                    self.mainPlot();
                    Plotly.newPlot(div, self.traces(), self.layout());
                    div.on('plotly_relayout',
                        function(eventdata){ 
                            self.camera = eventdata["scene.camera"];    // update camera values with this
                            if (self.showTwoPlots)
                                Plotly.react(self.mainPlotDiv, self.traces(self.selectedPlotBy), self.layout());
                    });
                    div.on('plotly_click', function(data) { self.handlePlotlyClick(data, "sample type") });
                } else  // there's already a plot in rightPlotDiv, so just update it
                    Plotly.react(div, self.traces(), self.layout());
            } else {
                if (div.layout!=null)   // showing only one plot but rightPlotDiv contains a plot, so purge it
                    Plotly.purge(div);
            }
            // always update mainPlotDiv
            Plotly.react(self.mainPlotDiv, self.traces(self.selectedPlotBy), self.layout(self.selectedPlotBy));

        },
        
        // ------------ Gene expression related methods ---------------
        // Show autocomplete on gene expression by fetching all possible entries
        getPossibleGenes: function() {
            let self = this;
            if (self.selectedGene.length<=1) return;    // ignore 1 or less characters entered
            self.$axios.get('/api/atlases/' + self.atlasType + '/possible-genes?query_string=' + self.selectedGene)
                .then(function (response) {
                    if (response.data.length>0)
                        self.possibleGenes = response.data;
            });
        },
        
        // Show gene expression - fetch values from server and save them, then run updatePlot
        showGeneExpression: function(geneSymbol) {
            let self = this;
            if (geneSymbol!=null)
                self.selectedGene = geneSymbol;
            let matchingGenes = self.possibleGenes.filter(item => item.symbol==self.selectedGene);
            if (matchingGenes.length>0) {
                console.log(matchingGenes);
                let geneId = matchingGenes[0].ensembl;
                self.loading = true;
                self.$axios.get('/api/atlases/' + self.atlasType + '/expression-values?orient=records&gene_id=' + geneId)
                    .then(function (response) {
                        if (response.data.length>0) {
                            // response.data would looke like [{column:value, ...}]
                            self.geneExpression = self.sampleIds.map(item => response.data[0][item]);
                            self.updatePlot();
                        } else {
                            alert("Could not find expression values for this gene");
                        }
                        self.loading = false;
                });
            } else
                alert("No expression values exist in this atlas for the specified gene");
        },

        // Run when plotBy changes between "sample type" and "gene expression"
        changePlotBy: function() {
            if (this.selectedPlotBy=="sample type") // going back to sample type after showing expression
                this.updatePlot();
            else    // going to gene expression after showing sample type - update only if previously an expression was shown
                if (this.selectedGene!="") this.updatePlot();
        },

        selectPlotFunction() {
            if (this.selectedPlotFunction=="toggle 3d/2d") {    // choose the other 
                this.is3d = !this.is3d;
                this.mainPlot();
            }
            this.selectedPlotFunction = "";
        },

        selectTool() {
            this.selectedTool = "";
        },

    },

    mounted() {
        // Fetch sample table
        this.$axios.get("/api/atlases/" + this.atlasType + "/samples?orient=dict").then(res => {
            this.sampleTable = res.data;
            this.colourBy = Object.keys(this.sampleTable);   // ["Cell Type", "Sample Source", ...]
            if (this.atlasType=='dc')
                this.colourBy = ['cell_type', 'activation_status', 'sample_source', 'platform_category', 'tissue_of_origin'];
            this.selectedColourBy = this.colourBy[0];

            // Fetch colours and ordering
            this.$axios.get("/api/atlases/" + this.atlasType + "/colours-and-ordering").then(res2 => {
                this.sampleTypeColoursOriginal = res2.data.colours;
                this.sampleTypeColours = res2.data.colours;
                this.sampleTypeOrdering = res2.data.ordering;

                // Fetch coordinates
                this.$axios.get("/api/atlases/" + this.atlasType + "/coordinates?orient=dict").then(res3 => {
                    this.coords = res3.data;
                    this.sampleIds = Object.keys(this.coords[Object.keys(this.coords)[0]]);
                    this.loading = false;
                    this.updateLegends();
                    this.mainPlot();
                });
            });
        });
    }
}
</script>

<style>
.js-plotly-plot .plotly .modebar {
    left: 40%;
    transform: translateX(-40%);
}
</style>
