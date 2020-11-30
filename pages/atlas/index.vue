<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <div class="text-center h4">
        <b-form-select v-model="atlasType" class="col-md-3">
            <b-form-select-option value="blood">Blood Atlas</b-form-select-option>
            <b-form-select-option value="myeloid">Myeloid Atlas</b-form-select-option>
        </b-form-select>
        <b-link v-b-tooltip.hover title="Background and more information" @click="showInfo=true"><b-icon-info-circle></b-icon-info-circle></b-link>
    </div>
    <div class="text-center mt-3">
        <b-form-select v-model="selectedPlotBy" class="col-md-2 bg-light small-select">
            <b-form-select-option value="sample type">plot by sample type</b-form-select-option>
            <b-form-select-option value="gene expression">plot by gene expression</b-form-select-option>
        </b-form-select>
        <b-form-select v-model="selectedPlotFunction" @change="selectPlotFunction" class="col-md-2 bg-light small-select">
            <b-form-select-option value="" selected>plot functions</b-form-select-option>
            <b-form-select-option value="toggle 3d/2d">toggle 3d/2d</b-form-select-option>
            <b-form-select-option value="show sample colour plot">show sample colour plot</b-form-select-option>
        </b-form-select>
        <b-form-select v-model="selectedTool" @change="selectTool" class="col-md-2 bg-light small-select">
            <b-form-select-option value="" selected>tools</b-form-select-option>
            <b-form-select-option value="download data/plots">download data/plots</b-form-select-option>
            <b-form-select-option value="find dataset">find dataset</b-form-select-option>
        </b-form-select>
    </div>
    <b-row class="small">
        <b-col class="col-md-9">
            <div class="overflow-auto text-center">
                <div v-if="loading" class="pl-5 pt-5"><b-spinner label="Loading..." variant="secondary"></b-spinner></div>
                <div id="mainPlotDiv" style="margin:auto"></div>
            </div>
        </b-col>
        <b-col>
            <p>colour by:<b-form-select v-model="selectedColourBy" :options="colourBy" class="small-select"></b-form-select></p>
            <b-list-group class="mt-3">
                <b-list-group-item v-for="item in legends" :key="item.value" class="borderless">{{item.value}}</b-list-group-item>
            </b-list-group>
        </b-col>
    </b-row>
    <b-modal v-model="showInfo" ok-only>
        <PageSidebar :sidebarType="'datasets'" :activeItem="'api'" />
    </b-modal>

</b-container>
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

    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Atlas', active: true },
        ],
        
        atlasType: this.$route.query.type==null? "blood": this.$route.query.type,  // default type if none specified
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

        // default camera angle for a 3d plot in plotly
        camera: {up: {x:0, y:0, z:1}, center: {x:0, y:0, z:0}, eye: {x:1.25, y:1.25, z:1.25}},
        showTwoPlots: false,

        legends: [],
        loading: true,
        showInfo: false,
      }
    },

    methods: {
        // Run before sample group plot to populate the legends array, and when a legend is clicked to show/hide a trace
        updateLegends(clickedLegendIndex) {
            var self = this;

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
                    trace.marker.color = legend.sampleIds.map(item => 
                        legend.colour);
                        //self.datasetInfo.sampleIdsMatchingDatasets.indexOf(item)!=-1? "black": legend.colour);
                    trace.marker.symbol = legend.sampleIds.map(item =>
                        "circle");
                        //self.uploadData.projectedSampleIds.indexOf(item)==-1? "circle" : "diamond-open");
                    trace.sampleIds = legend.sampleIds;
                    traces.push(trace);
                }
            } else {    // gene expression plot - one trace only
                var trace = traceTemplate();
                trace.x = self.sampleIds.map(function(item) { return self.coords['x'][item]});
                trace.y = self.sampleIds.map(function(item) { return self.coords['y'][item]});
                trace.z = self.sampleIds.map(function(item) { return self.coords['z'][item]});
                trace.text = self.sampleIds.map(function(item) { return hovertext[item]});
                // If 
                trace.marker.color = self.geneExpression.map(function(item,i) { 
                    return self.datasetInfo.sampleIdsMatchingDatasets.indexOf(self.sampleIds[i])!=-1? "black": item});
                trace.marker.colorbar = { title: self.selectedGene };
                if (self.showTwoPlots) {    
                    // It's possible that some traces are hidden from rightPlotDiv, in which case we want to match that here.
                    // For each sampleId, set marker size to zero if it belongs to the hidden legend.
                    // Note that there's a bug in plotly where size specified as an array in marker is rendered differently to
                    // when specified as a number, even for the same size.
                    var defaultSize = self.is3d? 11 : 6;
                    var visibleLegends = self.legends.filter(function(item) { return item.visible; }).map(function(item) { return item.value; });
                    trace.marker.size = self.sampleIds.map(function(item,i) { 
                        return visibleLegends.indexOf(self.sampleTable[self.selectedColourBy][self.sampleIds[i]])==-1? 0 : defaultSize;
                    });
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

        selectPlotFunction() {
            if (this.selectedPlotFunction=="toggle 3d/2d") {    // choose the other 
                this.is3d = !this.is3d;
                this.mainPlot();
            }
            this.selectedPlotFunction = "";
        },

        selectTool() {
            console.log(this.selectedTool);
            this.selectedTool = "";
        },

        // Used this function to just convert tsv files into {col: {rowId: val, ...}, ...} format
        _dataConverter(tsvFile) {
            this.$axios.get(tsvFile).then(res => {
                let lines = res.data.split("\n");
                let table = {};
                let columns = lines[0].split("\t")
                columns.shift();   // ["Cell Type", "Sample Source", ...]

                for (let i=1; i<lines.length; i++) {
                    let cols = lines[i].split("\t");
                    for (let j=0; j<columns.length; j++) {
                        if (!(columns[j] in table))
                            table[columns[j]] = {};
                        table[columns[j]][cols[0]] = cols[j+1];
                    }
                }
                console.log(JSON.stringify(table));
            })
        },
    },

    mounted() {
        // Fetch sample table
        this.$axios.get("/blood_atlas_annotations.json").then(res => {
            this.sampleTable = res.data;
            this.colourBy = Object.keys(this.sampleTable);   // ["Cell Type", "Sample Source", ...]

            // Fetch colours and ordering
            this.$axios.get("/blood_atlas_colours.tsv").then(res2 => {
                this.sampleTypeColoursOriginal = res2.data.colours;
                this.sampleTypeColours = res2.data.colours;
                this.sampleTypeOrdering = res2.data.ordering;

                // Fetch coordinates
                this.$axios.get("/blood_atlas_coordinates.json").then(res3 => {
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
.small-select {
    font-size: 0.8rem;
    padding: 0.2rem 1.0rem 0.2rem 1.0rem;
}

.borderless {
    border: none !important;
    padding: 0 !important;
}
</style>
