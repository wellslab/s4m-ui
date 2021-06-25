<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4 text-center">
  <h3>Visual Data Explorer
    <small><b-link v-b-tooltip.hover title="Help and more information" v-b-toggle.sidebar><b-icon-info-circle></b-icon-info-circle></b-link></small>
  </h3>
  <b-form-select v-model="selectedDataType" class="col-md-3 bg-light mt-3 mb-3" @change="showSunburst">
      <b-form-select-option value="samples">parental to final cell type</b-form-select-option>
      <b-form-select-option value="datasets">tissue to cell type</b-form-select-option>
  </b-form-select>
  <div id="plotDiv" style="height:500px"></div>
</b-container>

<b-sidebar id="sidebar" title="Help and more info" shadow>
  <div class="px-3 py-2">
    <p>Visual Data Explorer is a sunburst plot which shows a snapshot of a subset of the data in Stemformatics, 
        where a hierarchical relationship may exist.</p>
    <p>For "parental to final cell type", the cell types in the centre represent samples from the atlases which 
      were differentiated into the cell types in the outer ring.</p>
    <p>For "tissue to cell type", tissue of origin is in the centre, while cell type is in the outer ring.</p>
    <hr/>
    <p>Click on an item in the centre to toggle expand/contract. Clicking on an item will also show details about that
        item, and you can go to other pages by clicking on these details. Note that you can also drag this info overlay.
    </p>
  </div>
</b-sidebar>

<draggable-div v-show="clickedItem.display!=''" class="border border-light bg-light" style="width:230px; opacity:0.8">
  <div slot="header" class="card-header" title="Drag me around by this area">
    <b>{{clickedItem.display}}</b>
  </div>
  <div slot="main" style="max-width: 18rem;">
    <div class="card-body">
      <ul class="pl-2">
      <li><b-link @click="gotoDatasetFilterPage()">{{clickedItem.value}} samples from {{datasetIds.length}} datasets</b-link> 
        have this value as {{clickedItem.descriptor}}.</li>
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
        selectedDataType: 'samples',
        sunburst: {},
        clickedItem: {'display':'', 'value':'', 'descriptor':'', 'ids':[]},
        acronym: {'induced pluripotent stem cell':'iPSC',
                  'hematopoietic multipotent progenitor':'HMP',
                  'chronic myeloid leukemia':'CML',
                  'embryonic stem cell':'ESC',
                  'peripheral blood mononuclear cell':'PBMC',
                  'cord blood CD34+ haematopoietic progenitor cells':'CD34+ HPC'},
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
      plot() {
        let traces = [{ids:this.sunburst.ids, labels:this.sunburst.labels, parents:this.sunburst.parents, 
                      values:this.sunburst.values.map(item => item.length), 
                      type:'sunburst', name:'click for more information',
                      branchvalues:'total',
                      hovertemplate: '<b>%{label}</b>'
                      }];
        let layout = {margin: {t:0, l:0, r:0, b:0},};
        Plotly.newPlot('plotDiv', traces, layout);
      },

      showSunburst() {
        let self = this;
        let query = self.selectedDataType=='samples'? 'format=sunburst1&projects=atlas' : 'format=sunburst2&projects=atlas';
        self.$axios.get("/api/search/datasets?" + query).then(res => {
            self.sunburst = res.data;
            // substitute acronyms for labels wherever possible
            self.sunburst.labels = self.sunburst.labels.map(item => {
              return (item in self.acronym)? self.acronym[item] : item;
            });

            self.plot();
            let plotDiv = document.getElementById("plotDiv");
            document.getElementById("draggable-container").style.left = plotDiv.getBoundingClientRect().left + (plotDiv.offsetWidth *0.85) + 'px';
            document.getElementById("draggable-container").style.top = plotDiv.getBoundingClientRect().top + 150 + 'px';

            plotDiv.on('plotly_click', function(data) { self.setClickedItem(data) });

        });
      },

      setClickedItem(dataFromClick) {
        let trace = dataFromClick.points[0].data;  // basically plotly trace
        let index = dataFromClick.points[0].pointNumber; // index of clicked point
        this.clickedItem.display = trace.labels[index];
        this.clickedItem.value = trace.values[index];
        if (this.selectedDataType=='samples')
          this.clickedItem.descriptor = trace.parents[index]==''? 'parent_cell_type' : 'final_cell_type';
        else if (this.selectedDataType=='samples')
          this.clickedItem.descriptor = trace.parents[index]==''? 'tissue_of_origin' : 'cell_type';
        this.clickedItem.ids = this.sunburst.values[index];
      },

      //
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
