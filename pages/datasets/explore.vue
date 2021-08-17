<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4 text-center">
    <h3>Visual Data Explorer
        <small><b-link v-b-tooltip.hover title="Help and more information" v-b-toggle.sidebar><b-icon-info-circle></b-icon-info-circle></b-link></small>
    </h3>
    <b-form inline class="justify-content-center mt-3">
        <b-form-select v-model="innerSelectedSampleGroup" :options="sampleGroups">
            <template #first>
                <b-form-select-option :value="null" disabled>-- Inner circle --</b-form-select-option>
            </template>
        </b-form-select>
        <b-form-select v-model="outerSelectedSampleGroup" :options="sampleGroups" class="ml-1">
            <template #first>
                <b-form-select-option :value="null" disabled>-- Outer circle --</b-form-select-option>
            </template>
        </b-form-select>
        <b-button variant="dark" @click="showSunburst" class="ml-1">Run</b-button>
        <b-dropdown text="tools" class="ml-2">
            <b-dropdown-item @click="showMoreOptions=true">More options...</b-dropdown-item>
        </b-dropdown>
        <!-- Use visibility rather than v-if for loading spinner, otherwise its occupied space changes and elements jump around -->
        <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-2"></b-spinner>
    </b-form>
    <div id="plotDiv" style="height:500px" class="mt-2"></div>
</b-container>

<!-- Show more options (modal) -->
<b-modal v-model="showMoreOptions" title="More options" hide-footer>
    <b-card no-body class="border-0 px-1">
        <p>You can fine-tune the parameters used to construct the sunburst plot here.
            Note that number of entries returned for inner or outer circle is usually less than
            the values entered here, because futher filtering is done to remove any entries with only one sample assigned.
        </p>
        <b-form inline class="mt-3">Maximum number of entries for inner circle
            <b-form-input number v-model="innerCutoff" min="2" max="50" class="ml-2 mr-2 col-md-2" :placeholder="String(innerCutoff)"></b-form-input>
        </b-form>
        <b-form inline class="mt-3">Maximum number of entries for outer circle
            <b-form-input number v-model="outerCutoff" min="2" max="50" class="ml-2 mr-2 col-md-2" :placeholder="String(outerCutoff)"></b-form-input>
        </b-form>
        <b-form inline class="mt-4">
            <b-button @click="showSunburst" variant="dark" class="col-md-3">Run</b-button>
            <b-button @click="showMoreOptions=false" variant="secondary" class="col-md-3 ml-1">Close</b-button>
        </b-form>
    </b-card>
</b-modal>
    
<!-- Sidebar for more help -->
<b-sidebar id="sidebar" title="Help and more info" shadow>
  <div class="px-3 py-2">
    <p>Visual Data Explorer is a sunburst plot which shows a snapshot of the data in Stemformatics, where the relationship
        between two sample groups may be used to explore the data.</p>
    <p>Sunburst plot works better where there is a hierarchical relationship, such as parental_cell_type and
        final_cell_type, but the plot still works with any combination of sample groups. The algorithm 
        works by grouping the sample table first by the selected inner sample group, then getting the most commonly
        occurring items from the outer sample group.  
    </p>
    <hr/>
    <p>Click on an item in the centre to toggle expand/contract. Clicking on an item will also show details about that
        item, and you can go to other pages by clicking on these details. Note that you can also drag this info overlay.
    </p>
  </div>
</b-sidebar>

<!-- Div for showing details of a clicked item (draggable) -->
<draggable-div v-show="clickedItem.display!=''" class="border border-light bg-light" style="width:230px; opacity:0.8">
    <div slot="header" class="card-header" title="Drag me around by this area">
        <b>{{clickedItem.display}}</b>
    </div>
    <div slot="main" style="max-width: 18rem;">
        <div class="card-body">
        <ul class="pl-2">
        <li><b-link @click="gotoDatasetFilterPage()">{{clickedItem.value}} samples from {{datasetIds.length}} datasets</b-link> 
            have this value as <span v-html="clickedItem.descriptor + clickedItem.additionalDescriptor"></span>.</li>
        <li><b-link @click="gotoDatasetFilterPage('free_search')">Show all datasets</b-link> which contain this term in any of its samples.</li>
        </ul>
        </div>
    </div>
</draggable-div>

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

    data() {
        return {
        breadcrumb: [
            { text: 'Home', to: '/' },
            { text: 'Datasets', active: true },
            { text: 'Explore', active: true },
        ],
        loading: false,
        showMoreOptions: false,

        sampleGroups: ['parental_cell_type', 'final_cell_type', 'tissue_of_origin', 'cell_type'],
        innerSelectedSampleGroup: 'parental_cell_type',
        outerSelectedSampleGroup: 'final_cell_type',
        innerCutoff: 12,
        outerCutoff: 8,

        sunburst: {},
        clickedItem: {'display':'', 'value':'', 'descriptor':'', 'ids':[]},
        acronym: {
            'acute myeloid leukemia cell':'AML',
            'angioblastic mesenchymal cell':'AMC',
            'astrocyte transitioning to induced pluripotent stem cell':'ast-iPSC',
            'CD14-positive monocyte':'CD14+ monocyte',
            'CD34-positive hematopoietic progenitor cell':'CD34+ HPP',
            'CD4-positive T lymphocyte':'CD4+ T cell',
            'CD8-positive T lymphocyte':'CD8+ T cell',
            'CA1 field of hippocampus':'CA1',
            'CA3 field of hippocampus':'CA3',
            'cerebral cortex':'cerebral CTX',
            'chronic myeloid leukemia':'CML',
            'chronic myeloid leukemia cell':'CML cell',
            'common myeloid progenitor':'CMP',
            'common lymphoid progenitor':'CLP',
            'conventional dendritic cell':'cDC',
            'conventional dendritic cell type one':'cDC1',
            'conventional dendritic cell type two':'cDC2',
            'cord blood CD34+ haematopoietic progenitor cell':'CD34+ HPC',
            'dendritic cell':'DC',
            'dendritic cell precursor':'DC precursor',
            'early embryonic cell':'EEC',
            'embryonic stem cell':'ESC',
            'endodermal cell':'endodermal',
            'endothelial cell':'endothelial',
            'entorhinal cortex':'entorhinal CTX',
            'epithelial cell':'epithelial',
            'epithelial cell transitioning to induced pluripotent stem cell':'ec-IPSC',
            'fibroblast transitioning to induced pluripotent stem cell':'fib-iPSC',
            'frontal cortex':'frontal CTX',
            'granulocyte monocyte progenitor cell':'GM-progenitor',
            'hematopoietic multipotent progenitor':'HMP',
            'hematopoietic precursor cell':'HPC',
            'induced pluripotent stem cell':'iPSC',
            'induced pluripotent stem cell intermediate':'iPSC-intermediate',
            'inner cell mass':'ICM',
            'inner cell mass cell':'ICM',
            'labial salivary gland':'LSG',
            'lamina propria of small intestine':'sml intestine LP',
            'megakaryocyte-erythroid progenitor':'ME-progenitor',
            'mesenchymal stromal cell':'MSC',
            'mesenchymal stromal cell transitioning to induced pluripotent stem cell':'MSC-iPSC',
            'mesodermal cell':'mesodermal',
            'microglial cell':'microglial',
            'middle temporal gyrus':'mid TG',
            'monocyte-derived dendritic cell':'MoDC',
            'mononuclear cell':'mononuclear',
            'mucosa of oral region':'oral mucosa',
            'natural killer cell':'NK-cell',
            'neural crest cell':'NCC',
            'neural progenitor cell':'NPC',
            'neuroectodermal cell':'neuroectodermal',
            'olfactory lamina propria-derived progenitor':'OLP progenitor',
            'peripheral blood mononuclear cell':'PBMC',
            'plasmacytoid dendritic cell':'pDC',
            'posterior cingulate cortex':'post-cingulate CTX',
            'respiratory system lamina propria':'RSLP',
            'small cell lung cancer':'SCLC',
            'subcutaneous adipose tissue':'adipose',
            'superior frontal gyrus':'superior FG',
            'temporal cortex':'temporal CTX',
            'trophoectodermal cell':'trophoectodermal',
            'umbilical cord blood':'cord blood'
            },
        }
    },

    computed: {
        datasetIds() {
            // Separate dataset ids from sample ids
            let ids = this.clickedItem.ids.map(item => item.split("_")[0]);
            return Array.from(new Set(ids));
        }
    },

    methods: {
        // Function to perform plotly plot - separated from showSunburst in case we need to make updates to the plot later
        // without going back to the server.
        plot() {
            let traces = [{ids:this.sunburst.ids, labels:this.sunburst.labelDisplay, parents:this.sunburst.parents, 
                        values:this.sunburst.values.map(item => item.length), 
                        type:'sunburst', name:'click for more information',
                        branchvalues:'total',
                        hovertemplate: '<b>%{hovertext}</b>',
                        hovertext:this.sunburst.labels,
                        hoverinfo:'text'
                        }];
            let layout = {margin: {t:0, l:0, r:0, b:0},};
            Plotly.newPlot('plotDiv', traces, layout);
        },

        // Main function to fetch the sunburst data from the server
        showSunburst() {
            if (this.innerSelectedSampleGroup==this.outerSelectedSampleGroup) {
                this.$bvModal.msgBoxOk("Select different sample groups for inner and outer circles");
                return;
            }
            this.loading = true;
            this.$axios.get("/api/search/datasets?sunburst_inner=" + this.innerSelectedSampleGroup + "&sunburst_outer=" + this.outerSelectedSampleGroup + 
                "&sunburst_inner_cutoff=" + this.innerCutoff + "&sunburst_outer_cutoff=" + this.outerCutoff).then(res => {
                this.sunburst = res.data;
                // substitute acronyms for labels wherever possible
                this.sunburst.labelDisplay = this.sunburst.labels.map(item => (item in this.acronym)? this.acronym[item] : item);

                this.plot();
                this.loading = false;
                this.showMoreOptions = false;
                let plotDiv = document.getElementById("plotDiv");
                document.getElementById("draggable-container").style.left = plotDiv.getBoundingClientRect().left + (plotDiv.offsetWidth *0.85) + 'px';
                document.getElementById("draggable-container").style.top = plotDiv.getBoundingClientRect().top + 150 + 'px';

                const self = this;
                plotDiv.on('plotly_click', function(data) { self.setClickedItem(data) });
            });
        },

        // What should happen when user clicks on an item in the sunburst plot
        setClickedItem(dataFromClick) {
            let trace = dataFromClick.points[0].data;  // basically plotly trace
            let index = dataFromClick.points[0].pointNumber; // index of clicked point
            this.clickedItem.display = trace.labels[index];
            this.clickedItem.value = trace.values[index];
            this.clickedItem.descriptor = trace.parents[index]==''? this.innerSelectedSampleGroup : this.outerSelectedSampleGroup;
            this.clickedItem.additionalDescriptor = trace.parents[index]==''? '' : ' and <b>' + 
                (trace.parents[index] in this.acronym? this.acronym[trace.parents[index]] : trace.parents[index]) + 
                '</b> as ' + this.innerSelectedSampleGroup;
            this.clickedItem.ids = this.sunburst.values[index];
        },

        // Should run when user clicks on the samples or datasets, to redirect to /datasets/filter page with appropriate dataset ids
        gotoDatasetFilterPage(searchType) {
            let params = {};
            let name = this.clickedItem.display;
            if (searchType=='free_search') {
                params['title'] = 'Datasets from search of ' + name;
                params['description'] = 'Datasets containing ' + name + ' in any of sample fields or dataset metadata.';
                params['include_samples_query'] = 'true';
                params['query_string'] = name;
            } 
            else {
                params['title'] = 'Datasets with ' + name + ' [Visual Data Explorer]';
                params['description'] = 'Datasets containing ' + name + ' coming from Visual Data Explorer';
                params['dataset_id'] = this.datasetIds.join(',');
            }
            this.$router.push({path: "/datasets/filter", query: params});
        },

    },

    mounted() {
        this.showSunburst();
    }
}
</script>

<style>
</style>
