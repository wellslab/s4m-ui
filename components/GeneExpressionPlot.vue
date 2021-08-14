<template>
<b-row class="small justify-content-center">
    <b-col col md="9" class="overflow-auto text-center">
        <div :id="plotDivId"></div>
    </b-col>
    <b-col class="text-left">
        <!-- Legend area. -->
        colour by: 
        <b-form-select size="sm" v-model="selectedSampleGroup" :options="sampleGroups" @change="updatePlot()" class="ml-1"></b-form-select>
        <ul class="mt-3 list-unstyled p-0"><li v-for="legend in legends[selectedSampleGroup]" :key="legend.value">
            <b-link href="#" @click="updatePlot(legend);" style="font-size:13px;">
            <b-icon-circle-fill :style="{'color': legend.colour, 'opacity': visibleLegends.indexOf(legend.value)!=-1? 1:0.6}" scale="0.6"></b-icon-circle-fill>
            <span :style="{'color': visibleLegends.indexOf(legend.value)!=-1? 'black':'#a7a7a7', 'font-weight': legendToHighlight(legend)? 'bold':'normal'}">
                {{legend.value}} ({{legend.number}})</span>
            </b-link>
        </li></ul>
    </b-col>

    <!-- apply T-test (modal) -->
    <b-modal v-model="ttest_showDialog" title="Apply t-test" hide-footer>
        <p>You can apply a T-test and show the p value if you select 2 groups to compare.
            We use <b-link href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html" target="_blank">
            scipy.stats.ttest_ind</b-link> function for this, which assumes independent samples with equal variances.
        </p>
        <div v-if="gene_id!=null">
            <b-form-select size="sm" v-model="ttest_selectedSampleGroupItem1" :options="sampleGroupItems" class="mt-2"></b-form-select>
            <div class="text-center my-1">vs</div>   
            <b-form-select size="sm" v-model="ttest_selectedSampleGroupItem2" :options="sampleGroupItems" class="mb-2"></b-form-select>
            <b-button @click="addPvalueAnnotation" class="mt-2">Show</b-button>
            <b-button @click="removePvalueAnnotation" class="mt-2">Hide</b-button>
            <b-spinner v-if="loading" label="Calculating..." variant="secondary" class="ml-2" style="width:1.5rem; height:1.5rem;"></b-spinner>
        </div>
        <div v-else>
            (First select a gene and show its expression before using this function.)
        </div>
    </b-modal>

    <!-- Download plot (modal) -->
    <b-modal v-model="downloadPlot_showDialog" title="Download plot" hide-footer>
        <b-card-text>
            You can download the plot at high resolution here, rather than relying the low resolution png download
            button provided by plotly.
        </b-card-text>
        <b-form-group label="Image type" v-slot="{ ariaDescribedby }">
            <b-form-radio-group v-model="downloadPlot_selectedImageType" :options="downloadPlot_imageTypes" :aria-describedby="ariaDescribedby"></b-form-radio-group>
        </b-form-group>
        <b-form inline>
            <b-form-group label="width (pixels)"><b-form-input v-model="downloadPlot_width"></b-form-input></b-form-group>
            <b-form-group label="height (pixels)"><b-form-input v-model="downloadPlot_height"></b-form-input></b-form-group>
        </b-form>
        <b-button @click="downloadPlot" class="mt-2">Download</b-button>
    </b-modal>
   
</b-row>  
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

    // Note: sometimes this component may be used multiple times on the same page, in which case the parent should pass on different
    // plotDivId, otherwise updating the plot in one component will simply overwrite the div in another component.
    props: {
        dataset_id: {}, // could be string or number
        gene_id: String,
        selected_sample_group: String,  // eg. 'cell_type' to specify what to select on load
        plot_type: {default:'box', type:String},
        show_points: {default:true, type:Boolean},
        plotDivId: {default:'genePlotDiv', type:String},
        highlightSampleGroupItems: [],  // highlight these items
    },

    data() {
        return {
            loading:false,

            datasetMetadata: {},
            samples: [],
            sampleGroups: [],
            selectedSampleGroup: '',
            expressionValues: {},
            legends: {},
            visibleLegends:[],
            //currentLegends: []

            ttest_showDialog: false,
            ttest_selectedSampleGroupItem1: null,
            ttest_selectedSampleGroupItem2: null,

            downloadPlot_showDialog: false,
            downloadPlot_imageTypes: ['svg','jpeg','webp'],
            downloadPlot_selectedImageType: "svg",
            downloadPlot_width: 1200,
            downloadPlot_height: 900,
        }
    },

    computed: {
        currentLegends() {
            return this.legends[this.selectedSampleGroup];
        },
        sampleGroupItems() {
            return this.legends[this.selectedSampleGroup]!=null? this.legends[this.selectedSampleGroup].map(item => item.value): [];
        },
    },

    methods: {
        // Set legends object, which can hold all the information about each sample group item
        setLegends() {
            const exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                  '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                  '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];

            this.sampleGroups.forEach(sampleGroup => {
                // First collect sample ids based on sampleGroup
                let sampleIds = this._sampleIdsFromSampleGroup(this.samples, sampleGroup);
                let groupItems = Object.keys(sampleIds);
                groupItems.sort();

                // Keys of sampleIds form sample group items. Create a legend per sample group item
                this.legends[sampleGroup] = groupItems.map((value,i) => {
                    return {'value': value, 'number': sampleIds[value].length, 'sampleIds': sampleIds[value],
                            'colour': exampleColours[i % exampleColours.length], 'visible': true,};
                });
            });
        },

        // Return true legend item matches highlightSampleGroupItems
        legendToHighlight(legend) {
            if (this.highlightSampleGroupItems && this.highlightSampleGroupItems.length>0) {
                return this.highlightSampleGroupItems[0]==legend.value || this.highlightSampleGroupItems.length>1 && this.highlightSampleGroupItems[1]==legend.value;
            }
            return false;
        },

        plotExpression() {
            //this.loading = true;
            if (this.dataset_id==null || this.gene_id==null) return;

            this.$axios.get("/api/datasets/" + this.dataset_id + "/metadata").then(res1 => {
                this.datasetMetadata = res1.data;            
                this.$axios.get("/api/datasets/" + this.dataset_id + "/samples").then(res2 => {
                    this.samples = res2.data;
                    
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
                    this.selectedSampleGroup = (this.selected_sample_group && this.sampleGroups.indexOf(this.selected_sample_group)!=-1)? 
                        this.selected_sample_group : this.sampleGroups[0];
                    this.setLegends();

                    this.$axios.get("/api/datasets/" + this.dataset_id + "/expression?orient=index&key=cpm&log2=true&gene_id=" + this.gene_id).then(res3 => {
                        this.expressionValues = res3.data;
                        this.updatePlot();
                    }).catch(error => {
                        this.$bvModal.msgBoxOk("No expression value for this gene in this dataset");
                    }).then(() => {
                        //this.loading = false;
                    });

                });
            });
        },
        
        updatePlot(selectedLegend) {
            // Different action depending on legendIndex
            if (selectedLegend==undefined) { // new plot or user changed sample group, so create a new plot by showing all traces under the selected sample group
                const traces = this.legends[this.selectedSampleGroup].map(legend => {
                    const y = legend.sampleIds.map(item => this.expressionValues[this.gene_id][item]);
                    return {y:y, type:this.plot_type, boxpoints:this.show_points? 'all':false, 
                            //name:legendToHighlight(legend)? '<b>' + legend.value + '</b>' : legend.value, 
                            name:legend.value, 
                            hoverinfo:"text", hovertext:legend.value,
                            points:this.show_points? 'all':false, marker:{color: legend.colour}}
                });
                const title = this.datasetMetadata.platform_type=='RNASeq'? 'log2(cpm+1)' : 'log2';
                const layout = {yaxis: {title: title}, showlegend:false};
                Plotly.newPlot(this.plotDivId, traces, layout);
                this.ttest_selectedSampleGroupItem1 = this.sampleGroupItems[0];
                this.ttest_selectedSampleGroupItem2 = this.sampleGroupItems.length>1? this.sampleGroupItems[1]: this.sampleGroupItems[0];                
            }
            else if (selectedLegend=='restyle') {   // change plot type or show/hide points
                const params = this.plot_type=='box'? {boxpoints:this.show_points? 'all':false} : {points: this.show_points? 'all':false};
                params['type'] = this.plot_type;
                Plotly.restyle(this.plotDivId, params);
            }
            else {  // selectedLegend comes from user click - toggle visibility of the matching trace after working out its index
                const index = this.legends[this.selectedSampleGroup].map(legend => legend.value).indexOf(selectedLegend.value);
                Plotly.restyle(this.plotDivId,{visible: !selectedLegend.visible}, index);
                this.legends[this.selectedSampleGroup][index].visible = !selectedLegend.visible;
            }
            this.visibleLegends = this.legends[this.selectedSampleGroup].filter(item => item.visible).map(item => item.value);

            // Emit event to parent, if interested in updated plot
            //this.$emit('gene-expression-plot-updated', {selectedSampleGroup: this.selectedSampleGroup});
        },

        // Inspired by https://stackoverflow.com/questions/67505252/plotly-box-p-value-significant-annotation
        addPvalueAnnotation() {
            const sampleGroupItem1 = this.ttest_selectedSampleGroupItem1;
            const sampleGroupItem2 = this.ttest_selectedSampleGroupItem2;
            if (sampleGroupItem1==sampleGroupItem2) {
                this.$bvModal.msgBoxOk("Chosen groups are the same.");
                return;
            }
            this.$axios.get('/api/datasets/' + this.dataset_id + '/ttest?gene_id=' + this.gene_id + '&sample_group=' + 
                            this.selectedSampleGroup + '&sample_group_item1=' + encodeURIComponent(sampleGroupItem1) +
                            '&sample_group_item2=' + encodeURIComponent(sampleGroupItem2)).then(res => {
                const pvalue = res.data.pvalue;

                // Find mathcing columns
                let traces = document.getElementById(this.plotDivId).data;
                const names = traces.map(item => item.name.replace("<b>","").replace("</b>",""));
                const columns = [names.indexOf(sampleGroupItem1), names.indexOf(sampleGroupItem2)];
                
                // get max y of both columns
                //const maxY = Math.max(...columns.map(item => Math.max(...traces[item].y)));
                const maxY = Math.max(...traces.map(item => Math.max(...item.y)));
                const maxYOffset = 1.03*maxY;   // how much offset used by vertical lines

                let shapes = [{type:"line", x0:columns[0], y0:1.01*maxY, x1:columns[0], y1:maxYOffset, line:{color:"#212529"}},
                              {type:"line", x0:columns[1], y0:1.01*maxY, x1:columns[1], y1:maxYOffset, line:{color:"#212529"}},
                              {type:"line", x0:columns[0], y0:maxYOffset, x1:columns[1], y1:maxYOffset, line:{color:"#212529"}},
                ];

                const hovertext =  "p=" + Math.round(10000*pvalue)/10000;
                let symbol = '';
                if (pvalue > 0.05) symbol = 'ns'
                else if (pvalue > 0.01) symbol = '*'
                else if (pvalue > 0.001) symbol = '**'
                else symbol = '***';

                let annotations = [{text:symbol, x:(columns[0]+columns[1])/2, y:1.035*maxYOffset, showarrow:false, hovertext:hovertext}];
                Plotly.relayout(this.plotDivId, {annotations:annotations, shapes:shapes});
            })
            .catch().then(() => {
                this.ttest_showDialog = false;
            });
        },

        removePvalueAnnotation() {
            Plotly.relayout(this.plotDivId, {annotations:[], shapes:[]});
            this.ttest_showDialog = false;
        },

        downloadPlot() {
            if (this.dataset_id==null || this.gene_id==null) return;
            Plotly.downloadImage(document.getElementById(this.plotDivId), {
                format: this.downloadData_selectedImageType,
                height: parseInt(this.downloadData_height),
                width: parseInt(this.downloadData_width),
                filename: 'Stemformatics_GeneExpression_' + this.dataset_id + '_' + this.gene_id
            });
        },

    },

    watch: {
        gene_id: function() {
            this.plotExpression();
        },
        dataset_id: function() {
            this.plotExpression();
        },
        plot_type: function() {
            this.updatePlot('restyle');
        },
        show_points: function() {
            this.updatePlot('restyle');
        }
    },

    mounted() {
        if (this.plot_type==null) this.plot_type = 'box';
    }

}
</script>

<style>
</style>