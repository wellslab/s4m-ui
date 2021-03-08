<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4 text-center">
  <h3>Visual Data Explorer
    <small><b-link v-b-tooltip.hover title="Help and more information" v-b-toggle.sidebar><b-icon-info-circle></b-icon-info-circle></b-link></small>
  </h3>
  <b-form-select v-model="selectedDataType" class="col-md-2 bg-light mt-3 mb-3">
      <b-form-select-option value="samples">atlas samples</b-form-select-option>
      <b-form-select-option value="datasets">dataset metadata</b-form-select-option>
  </b-form-select>
  <div id="plotDiv" style="height:500px"></div>
</b-container>

<b-sidebar id="sidebar" title="Help and more info" shadow>
  <div class="px-3 py-2">
      <p>Visual Data Explorer is a sunburst plot which shows a snapshot of a subset of the data in Stemformatics, 
        where a hierarchical relationship may exist. For sample data, the cell types in the centre represent samples 
        which were differentiated into the cell types in the outer ring. For dataset metadata, various platforms are
        grouped into platform types.</p>
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
      <b-link @click="gotoDatasetSearchPage(clickedItem.ids)">{{clickedItem.value}} samples</b-link> have this value as {{clickedItem.descriptor}}.
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

import storage_functions from "~/mixins/storage_functions.js"

export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },
    mixins: [storage_functions],

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

      setClickedItem(dataFromClick) {
        let trace = dataFromClick.points[0].data;  // basically plotly trace
        let index = dataFromClick.points[0].pointNumber; // index of clicked point
        this.clickedItem.display = trace.labels[index];
        this.clickedItem.value = trace.values[index];
        if (this.selectedDataType=='samples')
          this.clickedItem.descriptor = trace.parents[index]==''? 'parent_cell_type' : 'final_cell_type';
        this.clickedItem.ids = this.sunburst.values[index];
      },

      // Go to the results section of dataset search page, based on the sample ids clicked
      gotoDatasetSearchPage(sampleIds) {
        // Separate dataset ids from sample ids, save this in storage, then call search results page
        let datasetIds = sampleIds.map(item => item.split("_")[0]);
        datasetIds = datasetIds.filter((value, index, self) => self.indexOf(value) === index); // remove duplicates
        this.$store.commit('datasets_search/setDatasetName', 'Datasets with ' + this.clickedItem.display + ' [Visual Data Explorer]');
        this.$store.commit('datasets_search/setDatasetDescription', 'Datasets containing ' + this.clickedItem.display + ' coming from Visual Data Explorer');
        this.$store.commit('datasets_search/setDatasetIds', datasetIds);
        this.$store.commit('datasets_search/setTabIndex', 2);
        this.$router.push({path: "/datasets/search"});
      }
    },

    mounted() {
      let self = this;
      self.$axios.get("/api/search?format=sunburst&projects=atlas").then(res => {
          self.sunburst = res.data;
          self.plot();
          let plotDiv = document.getElementById("plotDiv");
          document.getElementById("draggable-container").style.left = plotDiv.getBoundingClientRect().left + (plotDiv.offsetWidth *0.85) + 'px';
          document.getElementById("draggable-container").style.top = plotDiv.getBoundingClientRect().top + 150 + 'px';

          plotDiv.on('plotly_click', function(data) { self.setClickedItem(data) });

      });
    }
}
</script>

<style>
</style>
