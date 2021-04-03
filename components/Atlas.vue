<template>
<div>
    <!-- Area for controls. -->
    <div class="text-center mt-3">
        <h3 class="mb-2">Integrated Atlas: {{atlasType}}
            <small><b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar><b-icon-info-circle></b-icon-info-circle></b-link></small>
        </h3>

        <b-form inline class="justify-content-center mt-3">
            <b-form-select v-model="selectedPlotBy" class="col-md-2 bg-light m-1" @change="changePlotBy">
                <b-form-select-option value="sample type">plot by sample type</b-form-select-option>
                <b-form-select-option value="gene expression">plot by gene expression</b-form-select-option>
            </b-form-select>
            <b-form-input v-if="selectedPlotBy=='gene expression'" v-model="selectedGene" list="possible-genes-datalist" 
                @keyup="getPossibleGenes" @keyup.enter="showGeneExpression(selectedGene)"
                placeholder="[gene symbol]" v-b-tooltip.hover :title="tooltip.selectedGene" class="col-md-2 m-1"></b-form-input>
            <b-form-datalist id="possible-genes-datalist">
                <option v-for="gene in possibleGenes" :key="gene.ensembl">{{gene.symbol}}</option>
            </b-form-datalist>
            <b-button v-if="selectedPlotBy=='gene expression'" @click="showGeneExpression(selectedGene)" variant="dark" class="m-1">go</b-button>
            <b-dropdown right text="plot functions" class="col-md-2 px-0 m-1" variant="secondary">
                <b-dropdown-item @click="selectPlotFunction('toggle')">toggle 3d/2d</b-dropdown-item>
                <b-dropdown-item v-if="showTwoPlots">hide sample colour plot</b-dropdown-item>
                <b-dropdown-item v-else>show sample colour plot</b-dropdown-item>
            </b-dropdown>
            <b-dropdown right text="tools" class="col-md-2 px-0 m-1">
                <b-dropdown-item>download data/plots</b-dropdown-item>
                <b-dropdown-item @click="datasetInfo.show=true">find dataset</b-dropdown-item>
                <b-dropdown-item v-b-modal.projectDataModal>project other data</b-dropdown-item>
            </b-dropdown>
        </b-form>
    </div>

    <!-- Plot and legend area -->
    <b-row class="small" @mousemove="updateMousePosition">
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
                <ul class="mt-3 list-unstyled p-0" data-step="2" data-intro="Click on a legend to show/hide samples in the plot.">
                    <li v-for="(legend,i) in legends" :style="sampleTypeBreakPoint[selectedColourBy].indexOf(legend.value)!=-1? 'margin-top:10px' : ''" :key="legend.value">
                    <b-link href="#" @click="updateLegends(i); updatePlot();" style="font-size:13px;">
                    <b-icon-circle-fill v-if="uploadData.projectedSampleIds.indexOf(legend.sampleIds[0])==-1" :style="{'color': legend.colour}" scale="0.6"></b-icon-circle-fill>
                    <b-icon-diamond v-if="uploadData.projectedSampleIds.indexOf(legend.sampleIds[0])!=-1" :style="{'color': legend.colour}" scale="0.6"></b-icon-diamond>
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

<!-- Projecting data (draggable) -->
<b-modal id="projectDataModal" title="Project other data" hide-footer>
    <AtlasDataUpload :atlas-type="atlasType" @project-data="projectData" @close="$bvModal.hide('projectDataModal')"></AtlasDataUpload>
</b-modal>

<!-- Find dataset div (draggable) -->
<draggable-div v-show="datasetInfo.show" class="border border-light bg-light" style="width:350px; opacity:0.95">
    <div slot="header" class="card-header bg-dark" title="Drag me around by this area">
        <span class="text-white">Find dataset</span>
        <b-link href="#" @click="datasetInfo.show=false" class="float-right font-weight-bold text-white">X</b-link>
    </div>
    <div slot="main">
        <div class="card-body">
            <p>All the datasets which were used for the construction of this atlas are shown below. 
            Hover over the name to highlight matching samples in the plot. You can drag this box by its top area.</p>
            <div style="height:300px; overflow:auto;">
                <ul class="list-unstyled">
                    <li v-for="item in datasetInfo.allData" :key="item.dataset_id">
                        <b-link href="#" @mouseover="highlightDatasets(item.dataset_id)" @mouseleave="clearHighlight">{{item.display_name}}</b-link>
                        ({{item.sampleIds.length}} samples)
                    </li>
                </ul>
            </div>
        </div>
    </div>
</draggable-div>

<!-- Sample info div -->
<div v-if="sampleInfo.show" class="sampleInfo" :style="{top:sampleInfoDivPosition('y'), left:sampleInfoDivPosition('x')}">
    <div style="background-color:#EE255F;" class="p-2">
        <span v-b-tooltip.hover title="Details of last double-clicked sample" class="text-white">Sample Info</span>
        <b-link href="#" @click="sampleInfo.show=false" class="float-right font-weight-bold text-white">X</b-link>
    </div>
    <ul class="list-unstyled p-2"><li v-for="item in sampleInfo.shownData" :key="item.key">
        <span class="font-weight-bold">{{item.key}}</span><br/>
        <span class="ml-1">
            <b-link v-if="item.key=='dataset' && ('datasetId' in item)" :href="'/datasets/view?id='+item.datasetId" target="_blank">{{item.value}}</b-link>
            <span v-else>{{item.value}}</span>
        </span>
    </li></ul>
</div>

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

    props: ["atlasType"],

    data() {
      return {
        
        coords: {},         // {"0":{"6638_GSM868879":5.72,"6638_GSM868880":5.511, ...}, ...}
        sampleIds: [],      // ["6638_GSM868879","6638_GSM868880", ...]
        sampleTable: {},    // {'celltype':{'6638_GSM868879':'HPC', ...}, ...}

        selectedPlotBy: "sample type",  // one of ["sample type", "gene expression"]
        is3d: true, // whether plot is in 3d or 2d

        colourBy: [],   // ["Cell Type", "Sample Source", ...]
        selectedColourBy: "Cell Type",  // overwrite at mounted()

        sampleTypeColoursOriginal: {},    // colours may change, so we keep original colours stored here
        sampleTypeColours: {},    // {"Sample Source":{"in vivo":"#8b8b00",...}, ...}
        sampleTypeOrdering: {},  // {"Sample Source":["in vivo","ex vivo",...], ...}

        // gene expression related
        selectedGene: "",
        possibleGenes: [],  // gene ids and symbols used to populate the autocomplete field
        geneExpression: [], // flat list of values, in same order as sampleIds, to be fetched when requested

        // plotly requires id of div where it will plot, so set them as vars here
        mainPlotDiv: "mainPlotDiv",
        rightPlotDiv: "rightPlotDiv",

        // default camera angle for a 3d plot in plotly
        camera: {up: {x:0, y:0, z:1}, center: {x:0, y:0, z:0}, eye: {x:1.25, y:1.25, z:1.25}},
        showTwoPlots: false,

        legends: [],
        loading: true,
        showInfo: false,

        // variables used by the find dataset div which can be used to show a table of datasets
        datasetInfo: {
            allData: [], // [{"dataset_id":7268,"author":"Abud","pubmed_id":"28426964","platform":"RNAseq",...},...]
            show: false,
            selectedDatasetInfo: "",
        },

        // variables used by the sample info div which is shown when a sample is double-clicked
        sampleInfo: {
            allData: {}, // {'6731_GSM2064216': {'Cell Type': 'Clec4e-/- microglia I/R', 'FACS profile': '', ...}, ...}
            show: false,
            shownData: [],
            sampleId: null,
            lastClickTime: 0,
            mouseX: 0,
            mouseY: 0,
            divX: 0,
            divY: 0
        },

         // upload data modal
        uploadData: {
            projectedSampleIds: [],  // record sample ids which have been projected
            name: null, // name of the dataset used for projection - will be the prefix for projected samples
        },
       
        // tooltip texts
        tooltip: {atlasType: "show information about this page",
                  atlasToggle: "toggle atlas",
                  selectedGene: "Select a gene from suggestions and press go to show its expression." +
                                "The genes with grey font colours were filtered out before creating this PCA.",
                  geneExpressionPlot: "This plot shows rank normalised values of the gene in the atlas as "+
                                      "either a violin or a box plot. The values are in the range [0,1]." +
                                      "You can drag this plot overlay by grabbing it near the title.",
                  editLegend: "Edit colours of points",
                  showProjectionFunctions: "Show nearest neighbours of projected points.",
                  projectionFunctions: "You can drag this plot overlay by grabbing it near the title.",
                  customSampleGroup: "You can drag this dialog overlay by grabbing it near the title.",
                  },
      }
    },

    computed: {
        // For a long list of sample types, it's good to place a gap between groups of them as a visual aid.
        // This returns the items where breaks should occur.
        sampleTypeBreakPoint() {
            let itemsWithBreaks = {};
            this.colourBy.forEach(key => {
                itemsWithBreaks[key] = [];
                if (key in this.sampleTypeOrdering) {
                    for (let j=1; j<this.sampleTypeOrdering[key].length; j++) {
                        if (this.sampleTypeOrdering[key][j-1]=="")
                            itemsWithBreaks[key].push(this.sampleTypeOrdering[key][j]);
                    }
                }
            });
            return itemsWithBreaks;
        },
    },

    methods: {
        // Colours for sample groups may not be pre-defined, and samples groups also may be created dynamically (eg. custom sample group).
        // Hence run this function to ensure all sample group colours have been populated.
        updateSampleTypeColours: function() {
            let self = this;

            // If colours weren't specified we set them here from this list
            let exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                    '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                    '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];
            for (let i=0; i<self.colourBy.length; i++) {
                if (!(self.colourBy[i] in self.sampleTypeColours)) {
                    self.sampleTypeColours[self.colourBy[i]] = {}

                    let column = self.sampleTable[self.colourBy[i]]; // dict of selected column from sampleTable
                    let availableValues = [];  // will store the unique values in this column
                    for (let sampleId in column) {
                        if (column[sampleId]=="") continue; // skip null valued rows
                        if (availableValues.indexOf(column[sampleId])==-1) {    // first time seen
                            availableValues.push(column[sampleId]);
                        }
                    }

                    for (let j=0; j<availableValues.length; j++)
                        self.sampleTypeColours[self.colourBy[i]][availableValues[j]] = exampleColours[j % exampleColours.length];
                }
            }
        },

        // Some sample groups may come without sample type ordering, but this is used throughout
        // the page, so this function will define this based on alphabetical ordering.
        updateSampleTypeOrdering: function() {
            let self = this;
            for (let i=0; i<self.colourBy.length; i++) {
                if (!(self.colourBy[i] in self.sampleTypeOrdering)) {
                    self.sampleTypeOrdering[self.colourBy[i]] = {}

                    let column = self.sampleTable[self.colourBy[i]]; // dict of selected column from sampleTable
                    let availableValues = [];  // will store the unique values in this column
                    for (let sampleId in column) {
                        if (column[sampleId]=="") continue; // skip null valued rows
                        if (availableValues.indexOf(column[sampleId])==-1) {    // first time seen
                            availableValues.push(column[sampleId]);
                        }
                    }

                    for (let j=0; j<availableValues.length; j++)
                        self.sampleTypeOrdering[self.colourBy[i]] = availableValues;
                }
            }
        },
        
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
            availableValues.forEach((value,i) => {
                let legend  = {'value': value, 
                               'number': sampleIds[value].length,
                               'sampleIds': sampleIds[value],
                               'colour': self.sampleTypeColours[self.selectedColourBy][value]};
                legend.visible = (self.legends.length==availableValues.length && self.legends[i].value==value)? self.legends[i].visible : true;
                if (clickedLegendIndex==i)
                    legend.visible = !legend.visible;
                legends.push(legend);
            });
            self.legends = legends;
        },
        
        // Layout dict used by plotly - can control size, camera, etc.
        layout() {
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
        traces(type="sample type") {
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
                    // For colours, use array instead of single value so we can control them individually later if needed
                    trace.marker.color = legend.sampleIds.map(item => legend.colour);  
                    trace.marker.symbol = legend.sampleIds.map(item => 
                        self.uploadData.projectedSampleIds.indexOf(item)==-1? "circle" : "diamond-open");
                    trace.sampleIds = legend.sampleIds;
                    traces.push(trace);
                }
            } else {    // gene expression plot - one trace only
                var trace = traceTemplate();
                trace.x = self.sampleIds.map(item => self.coords['0'][item]);
                trace.y = self.sampleIds.map(item => self.coords['1'][item]);
                trace.z = self.sampleIds.map(item => self.coords['2'][item]);
                trace.text = self.sampleIds.map(item => hovertext[item]);
                trace.marker.color = self.geneExpression;
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
            let self = this;
            let div = document.getElementById(self.mainPlotDiv);
            Plotly.newPlot(div, this.traces(), this.layout(this.selectedPlotBy));
        
            // Set up double click event, where sampleInfo.shownData is populated with info about the sample double clicked.
            // Note that plotly doesn't really have double click event detection, so we're going to measure the interval between
            // two single clicks if it's on the sample id.
            div.on('plotly_click', function(data) { self.handlePlotlyClick(data); });
        },

        // Function to update the plot
        updatePlot() {
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
        
        // ------------ sampleInfo methods ---------------
        // Should run when user clicks on a point in the plot. Since there's no double-click event detection in plotly
        // we measure the time interval between clicks to define double click.
        handlePlotlyClick(data, plotBy) {
            let self = this;
            if (plotBy==null) plotBy = self.selectedPlotBy;
            // Fetch sampleId of clicked point
            let sampleId = plotBy=="sample type"? self.traces()[data.points[0].curveNumber].sampleIds[data.points[0].pointNumber] : self.sampleIds[data.points[0].pointNumber];
            
            if (self.sampleInfo.sampleId==sampleId && performance.now() - self.sampleInfo.lastClickTime < 600) {   
                // same sample id clicked and its internval since last click is short enough to define as double-click

                // Useful to know if this is a projected sample or not
                let isProjectedSample = self.uploadData.projectedSampleIds.indexOf(sampleId)!=-1;

                // Update sampleInfo.shownData, which is used to render the content of sample info for the clicked point.
                if (isProjectedSample) {  // provide a simpler set of info
                    self.sampleInfo.shownData = [{key:'Projected Sample', value:sampleId},
                                                 {key:'dataset', value:self.uploadData.name}];
                } else {
                    // First populate the info coming from sampleTable (these are atlas specific sample annotations)
                    self.sampleInfo.shownData = [];
                    self.colourBy.forEach(item => {
                        self.sampleInfo.shownData.push({'key':item, 'value':self.sampleTable[item][sampleId]});
                    });
                    // Now populate the info coming from sample metadata
                    for (let key in self.sampleInfo.allData[sampleId])
                        if (self.sampleInfo.allData[sampleId][key]!="")
                            self.sampleInfo.shownData.push({'key':key, 'value':self.sampleInfo.allData[sampleId][key]});
                    // Last key is 'dataset', which will have dataset id as value. We can get datasetId from sampleId
                    // but have to get its display name from datasetInfo.allData.
                    let datasetId = sampleId.split("_")[0];
                    let matchingDataset = self.datasetInfo.allData.filter(item => parseInt(item.dataset_id)==parseInt(datasetId));
                    self.sampleInfo.shownData.push({'key':'dataset', 
                                                    'value':matchingDataset[0].display_name, 
                                                    'datasetId':datasetId});
                }

                self.sampleInfo.divX = self.sampleInfo.mouseX;
                self.sampleInfo.divY = self.sampleInfo.mouseY;
                self.sampleInfo.show = true;
            } else {   // set this as last sampleId clicked, and record time
                self.sampleInfo.sampleId = sampleId;
                self.sampleInfo.lastClickTime = performance.now();
                self.sampleInfo.shownData = [];
                self.sampleInfo.show = false;
            }
        },

        // In order to know where to show the sampleInfoDiv on double-click, we need to keep track
        // of mouse position and save this.
        updateMousePosition(event) {
            this.sampleInfo.mouseX = event.clientX;
            this.sampleInfo.mouseY = event.clientY;
        },

        // Return the position where the sample info div should appear - just a wrapper for sampleInfo.divX and divY
        sampleInfoDivPosition(axis) {            
            return axis=='x'? this.sampleInfo.divX + 20 + "px" : this.sampleInfo.divY + "px";
        },

        // ------------ datasetInfo methods ---------------
        // Should run when user hovers on the dataset in datasetInfo dialog, to highlight samples with matching dataset id
        highlightDatasets(datasetId) {            
            // Find samples with matching datasetId and hightlight these in the plot
            let sampleIds = this.datasetInfo.allData.filter(item => String(item.dataset_id)==String(datasetId))[0].sampleIds;
            
            // Each trace has sampleIds property, which holds sampleIds, so we can use this
            let traces = document.getElementById(this.mainPlotDiv).data; // we could also use self.traces()
            traces.forEach((trace,index) => {
                let update = {'marker': trace.marker};
                update['marker']['color'] = trace.marker.color.map((item,i) => 
                    sampleIds.indexOf(trace.sampleIds[i])==-1? item: 'black');
                Plotly.restyle(this.mainPlotDiv, update, [index]);
            })
        },

        // Clear the highlighted datasets
        clearHighlight() {
            this.traces().forEach((trace,index) => {
                Plotly.restyle(this.mainPlotDiv, {'marker': trace.marker}, [index]);
            })
        },

        // ------------ Gene expression related methods ---------------
        // Show autocomplete on gene expression by fetching all possible entries
        getPossibleGenes() {
            let self = this;
            if (self.selectedGene.length<=1) return;    // ignore 1 or less characters entered
            self.$axios.get('/api/atlases/' + self.atlasType + '/possible-genes?query_string=' + self.selectedGene)
                .then(function (response) {
                    if (response.data.length>0)
                        self.possibleGenes = response.data;
            });
        },
        
        // Show gene expression - fetch values from server and save them, then run updatePlot
        showGeneExpression(geneSymbol) {
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
        changePlotBy() {
            if (this.selectedPlotBy=="sample type") // going back to sample type after showing expression
                this.updatePlot();
            else    // going to gene expression after showing sample type - update only if previously an expression was shown
                if (this.selectedGene!="") this.updatePlot();
        },

        selectPlotFunction(selected) {
            if (selected=="toggle") {    // choose the other 
                this.is3d = !this.is3d;
                this.mainPlot();
            }
        },

        // ------------ Data projection methods ---------------
        projectData(projectionData) {
            // Map a particular sample field from test data to all of the sample fields in the atlas.
            // projectionData needs to have following objects (examples)
            // name: "notta"
            // samples: [{"Sample Type":"CMP_71+_BAH+","Parental cell type":"CMP"}, ...]
            // coords: [{'x':8.03,'y':0,'z':1.2}, ...]
            // combinedCoords: {'index':[], 'columns':[], 'data':[]}
            // sampleIds: ['notta_GSM1977399',...]
            // column: 'Sample Type'
            let column = projectionData.column;

            // This is a list of projected items that will be displayed in the legend. ["Ang_iPSC","Ang_HSC","Ang_iPSC",...]
            // Note that this list is same length as projected sample ids. Also these don't change when colour by changes.
            let sampleTypes = projectionData.samples.map(item => projectionData.name + "_" + item[column]);

            // Create some dataset attributes needed
            var datasetAttributes = {"dataset_id":'0000', "display_name":"[Projected Data]", "sampleIds":projectionData.sampleIds};
            
            // Now add projected points to all relevant data variables. Note that we should be able to
            // remove these points later - for now, reload page.
            //this.addProjectedPoints(projectionData.name, projectionData.coords, projectionData.sampleIds, sampleTypes, datasetAttributes);
            let self = this;
            self.uploadData.name = projectionData.name;
            for (let item in self.coords) { // update coordinates to include projected coordinates
                for (let i=0; i<projectionData.coords.length; i++)
                    self.coords[item][projectionData.sampleIds[i]] = projectionData.coords[i][item];
            }
            self.colourBy.forEach(item => {   // add a breakpoint in sampleTypeOrdering
                if (item in self.sampleTypeOrdering)
                    self.sampleTypeOrdering[item].push("");
            });

            // update sampleInfo.allData, sampleTable, sampleTypeColours and sampleTypeOrdering
            for (let i=0; i<sampleTypes.length; i++) {  
                let sampleId = projectionData.sampleIds[i];
                self.sampleInfo.allData[sampleId] = {};
                self.uploadData.projectedSampleIds.push(sampleId);
                for (let item in self.sampleTable) {
                    self.sampleTable[item][sampleId] = sampleTypes[i];
                    self.sampleTypeColours[item][sampleTypes[i]] = "green";
                    self.sampleTypeOrdering[item].push(sampleTypes[i]);
                    self.sampleInfo.allData[sampleId][item] = sampleTypes[i];
                }
            }
            for (var i=0; i<projectionData.sampleIds.length; i++)
                self.sampleIds.push(projectionData.sampleIds[i]);

            self.datasetInfo.allData.push(datasetAttributes);            
            self.updateLegends();
            self.updatePlot();
        }
    },

    mounted() {
        // Fetch sample table
        this.$axios.get("/api/atlases/" + this.atlasType + "/samples?orient=dict").then(res => {
            this.sampleTable = res.data;    // {col: {row:val}}
            this.colourBy = Object.keys(this.sampleTable);   // ["Cell Type", "Sample Source", ...]
            this.selectedColourBy = this.colourBy[0];

            // Fetch colours and ordering
            this.$axios.get("/api/atlases/" + this.atlasType + "/colours-and-ordering").then(res2 => {
                this.sampleTypeColoursOriginal = res2.data.colours;
                this.sampleTypeColours = res2.data.colours;
                this.sampleTypeOrdering = res2.data.ordering;
                this.updateSampleTypeColours();
                this.updateSampleTypeOrdering();

                // Fetch coordinates
                this.$axios.get("/api/atlases/" + this.atlasType + "/coordinates?orient=dict").then(res3 => {
                    this.coords = res3.data;
                    this.sampleIds = Object.keys(this.coords[Object.keys(this.coords)[0]]);

                    // Construct sampleInfo.allData - can't construct just from sampleTable, since we want to include
                    // other sample metadata fields, not available from atlas sample table.
                    let datasetIds = this.sampleIds.map(item => item.split("_")[0]);
                    datasetIds = Array.from(new Set(datasetIds));   // unique values only
                    datasetIds = datasetIds.map(item => "dataset_id=" + item);  // create query string
                    this.$axios.get("/api/search/samples?orient=index&field=cell_type&field=facs_profile&limit=1200&" + datasetIds.join("&")).then(res4 => {
                        this.sampleIds.forEach(sampleId => {
                            this.sampleInfo.allData[sampleId] = res4.data[sampleId];
                        });
                    });

                    // Construct datasetInfo.allData by fetching from api
                    this.$axios.get("/api/search/datasets?projects=" + this.atlasType + "_atlas").then(res5 => {
                        // We only need some keys (trick from https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties)
                        this.datasetInfo.allData = res5.data.map(item => 
                            (({ dataset_id, display_name, name}) => ({ dataset_id, display_name, name }))(item)
                        );
                        
                        // Might as well sort on display name
                        this.datasetInfo.allData.sort((a,b) => a.display_name < b.display_name? -1 : 1);
                        
                        // Add sampleIds used for each dataset
                        this.datasetInfo.allData.forEach(item => {
                            item.sampleIds = this.sampleIds.filter(sampleId => sampleId.split("_")[0]==String(item.dataset_id))
                        });
                    });

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
.btn-dark:hover, .open>.dropdown-toggle.btn-dark {
  background-color: #EE255F;
}
div.sampleInfo {
    position: absolute;
    background:#f0f0f0; 
    font-size: 14px;
    opacity: 0.9;
    max-width: 300px;
}
div.sampleInfo li {
    margin-top: 5px;
}
</style>
