<template>
<b-row class="small justify-content-center">
    <b-col col md="9" class="overflow-auto text-center">
        <div id="genePlotDiv"></div>
    </b-col>
    <b-col class="text-left">
        <!-- Legend area. -->
        colour by: 
        <b-form-select size="sm" v-model="selectedSampleGroup" :options="sampleGroups" @change="updatePlot()" class="ml-1"></b-form-select>
        <ul class="mt-3 list-unstyled p-0"><li v-for="legend in legends[selectedSampleGroup]" :key="legend.value">
            <b-link href="#" @click="updatePlot(legend);" style="font-size:13px;">
            <b-icon-circle-fill :style="{'color': legend.colour, 'opacity': visibleLegends.indexOf(legend.value)!=-1? 1:0.6}" scale="0.6"></b-icon-circle-fill>
            <span :style="visibleLegends.indexOf(legend.value)!=-1? 'color:black' : 'color:#a7a7a7'">{{legend.value}} ({{legend.number}})</span>
            </b-link>
        </li></ul>
    </b-col>
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

    props: {dataset_id: {}, // could be string or number
            gene_id: String,
            plot_type: {default:'box', type:String},
            show_points: {default:true, type:Boolean}},

    data() {
        return {
            datasetMetadata: {},
            samples: [],
            sampleGroups: [],
            selectedSampleGroup: '',
            expressionValues: {},
            legends: {},
            visibleLegends:[],
            //currentLegends: []
        }
    },

    computed: {
        currentLegends() {
            return this.legends[this.selectedSampleGroup];
        }
    },

    methods: {
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
                    this.selectedSampleGroup = this.sampleGroups[0];
                    this.setLegends();

                    this.$axios.get("/api/datasets/" + this.dataset_id + "/expression?orient=index&key=cpm&gene_id=" + this.gene_id).then(res3 => {
                        this.expressionValues = res3.data;
                        if (this.datasetMetadata.platform_type=='RNASeq') // apply log
                            Object.keys(this.expressionValues[this.gene_id]).forEach(sampleId => {
                                const value = this.expressionValues[this.gene_id][sampleId];
                                this.expressionValues[this.gene_id][sampleId] = Math.log2(value + 1);
                            })
                        this.updatePlot();
                    }).catch(error => {
                        alert("No expression value for this gene in this dataset");
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
                    return {y:y, type:this.plot_type, boxpoints:this.show_points? 'all':false, name:legend.value, 
                            hoverinfo:"text", hovertext:legend.value,
                            points:this.show_points? 'all':false, marker:{color: legend.colour}}
                });
                const title = this.datasetMetadata.platform_type=='RNASeq'? 'log2(cpm+1)' : 'log2';
                const layout = {yaxis: {title: title}, showlegend:false};
                Plotly.newPlot('genePlotDiv', traces, layout);
            }
            else if (selectedLegend=='restyle') {
                const params = this.plot_type=='box'? {boxpoints:this.show_points? 'all':false} : {points: this.show_points? 'all':false};
                params['type'] = this.plot_type;
                Plotly.restyle('genePlotDiv', params);
            }
            else {  // selectedLegend comes from user click - toggle visibility of the matching trace after working out its index
                const index = this.legends[this.selectedSampleGroup].map(legend => legend.value).indexOf(selectedLegend.value);
                Plotly.restyle('genePlotDiv',{visible: !selectedLegend.visible}, index);
                this.legends[this.selectedSampleGroup][index].visible = !selectedLegend.visible;
            }
            this.visibleLegends = this.legends[this.selectedSampleGroup].filter(item => item.visible).map(item => item.value);
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