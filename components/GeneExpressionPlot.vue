Component for plotting gene expression, which happens often in the application in different pages.
Main input data are dataset and gene ids. When one of these changes, this component will fetch
matching expression data and plot using plotly.

<template>
<b-row class="small justify-content-center">
    <b-col col md="9" class="overflow-auto text-center">
        <div :id="plotDivId"></div>
    </b-col>
    <b-col class="text-left">
        <PlotLegend :legends="legends" :initial-sample-group="selectedSampleGroup" :items-to-highlight="highlightSampleGroupItems"
            @legend-clicked="updateTrace" @sample-group-changed="newPlot"></PlotLegend>
    </b-col>

    <!-- apply T-test (modal) -->
    <b-modal v-model="ttest_showDialog" title="Apply t-test" hide-footer>
        <p>You can apply a T-test and show the p value if you select 2 groups to compare here.</p>
        <p class="text-warning"><b>Note:</b> this is a <b>very basic T-test</b>, which uses 
            <b-link href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_ind.html" target="_blank">
            scipy.stats.ttest_ind</b-link> function, which assumes independent samples with equal variances. 
            Covariates are also not taken into account here. The result would be more reliable for larger numbers of samples in each group.</p>
        <p>If you want to perform a proper, more in-depth statistical analysis, you should extract the data and run a suitable package such as
            <b-link href="https://bioconductor.org/packages/release/bioc/html/limma.html" target="_blank">limma</b-link>.
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
        highlightSampleGroupItems: Object,  // highlight these items
        plotTitle: {default:'', type:String},  // show plot title if this is specified
        sampleGroupItemsReordered: Array,    // eg. ['fibroblast','T cell',...]
    },

    data() {
        return {
            loading:false,

            datasetMetadata: {},
            selectedSampleGroup: '',
            expressionValues: {},
            legends: {},

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
        sampleGroupItems() {
            return this.legends[this.selectedSampleGroup]!=null? this.legends[this.selectedSampleGroup].map(item => item.value): [];
        },
    },

    methods: {
        plotExpression() {
            //this.loading = true;
            if (this.dataset_id==null || this.gene_id==null) return;

            this.$axios.get("/api/datasets/" + this.dataset_id + "/metadata").then(res1 => {
                this.datasetMetadata = res1.data;            
                this.$axios.get("/api/datasets/" + this.dataset_id + "/samples").then(res2 => {
                    let samples = res2.data;
                    let sampleGroups = this._sampleGroupsForPlotlyTrace(samples);
                    this.legends = this._legendsFromSampleTable(samples, {datasetId: this.dataset_id});

                    this.selectedSampleGroup = (this.selected_sample_group && sampleGroups.indexOf(this.selected_sample_group)!=-1)? 
                        this.selected_sample_group : sampleGroups[0];                    

                    this.$axios.get("/api/datasets/" + this.dataset_id + "/expression?orient=index&key=cpm&log2=true&gene_id=" + this.gene_id).then(res3 => {
                        this.expressionValues = res3.data;
                        this.newPlot();
                    }).catch(error => {
                        this.$bvModal.msgBoxOk("No expression value for this gene in this dataset");
                    }).then(() => {
                        //this.loading = false;
                    });

                });
            });
        },

        // Make a new plot (from expression values changed or from sample group changed)
        newPlot(params) {
            if (params && 'selectedSampleGroup' in params)
                this.selectedSampleGroup = params.selectedSampleGroup;

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
            if (this.plotTitle)
                layout['title'] = this.plotTitle;
            Plotly.newPlot(this.plotDivId, traces, layout);
            this.ttest_selectedSampleGroupItem1 = this.sampleGroupItems[0];
            this.ttest_selectedSampleGroupItem2 = this.sampleGroupItems.length>1? this.sampleGroupItems[1]: this.sampleGroupItems[0];                
        },

        // For plot type change or show/hide points
        restylePlot() {
            const params = this.plot_type=='box'? {boxpoints:this.show_points? 'all':false} : {points: this.show_points? 'all':false};
            params['type'] = this.plot_type;
            Plotly.restyle(this.plotDivId, params);
        },

        // For show/hide trace when legend is clicked
        updateTrace(selectedLegend) {
            const index = this.legends[this.selectedSampleGroup].map(legend => legend.value).indexOf(selectedLegend.value);
            Plotly.restyle(this.plotDivId,{visible: !selectedLegend.visible}, index);
            this.legends[this.selectedSampleGroup][index].visible = !selectedLegend.visible;
        },

        // Calculate p-value for groups to contrast and show on the plot.
        // Inspired by https://stackoverflow.com/questions/67505252/plotly-box-p-value-significant-annotation.
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
            this.restylePlot();
        },
        show_points: function() {
            this.restylePlot();
        },
        sampleGroupItemsReordered: function() {
            let traces = document.getElementById(this.plotDivId).data; //
            if (traces && traces.length>0) {
                this.plotExpression();
            }
        }
    },

    mounted() {
        if (this.plot_type==null) this.plot_type = 'box';
    }

}
</script>

<style>
</style>