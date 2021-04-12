<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <PageSidebar :sidebarType="'datasets'" :activeItem="'api'" />
      </b-col>

      <b-col>
        <h3>API access</h3>
        <p>All Stemformatics data can be accessed via 
          <b-link href="https://en.wikipedia.org/wiki/API" target="_blank">API</b-link>. 
          Use your favourite tool, such as python or R to search for relevant datasets and download them
          to do your own anayses. Or simply go to the api server and view the data in raw form.
        </p>
          <pre><code>
  # python example
  import pandas, requests, json
  r = requests.get('https://api.stemformatics.org/datasets/2000/metadata')
  df = pandas.DataFrame.from_records(r.data)
  display(df)

  # R example
  library(httr)
  library(jsonlite)
  response = GET("https://api.stemformatics.org/datasets/2000/metadata")
  print(content(response))
          </code></pre>        

        <b>Full list of APIs</b>
        <div>
        <b-link href="#" v-if="!showApi1" aria-controls="api1" @click="showApi1 = !showApi1"><b-icon-chevron-right></b-icon-chevron-right></b-link>
        <b-link href="#" v-if="showApi1" aria-controls="api1" @click="showApi1 = !showApi1"><b-icon-chevron-down></b-icon-chevron-down></b-link>
        /dataset/{dataset_id}/metadata
        <b-collapse id="api1" v-model="showApi1" class="mt-0"><b-card class="mt-1">
          <p>Fetches dataset metadata. Example data</p>
          <pre><code>
    {
      "dataset_id": 2000,
      "title": "Disease-specific, neurosphere-derived cells as models for brain disorders",
      "authors": "Nicholas Matigian, Greger Abrahamsen, ...",
      "description": "Understanding the molecular bases of neurological and psychiatric conditions...",
      "platform": "Illumina HumanRef-8 V2",
      "private": false,
      "pubmed_id": "20699480",
      "name": "Matigian_2010_20699480",
      "accession": "",
      "version": "1.0",
      "platform_type": "Microarray"
    }
         </code></pre>
        </b-card></b-collapse>
            
        </div>

        <p>More to come...</p>
      </b-col>
    </b-row>
</b-container>
</div>
</template>

<script>
import Vue from 'vue'
import { BootstrapVueIcons } from 'bootstrap-vue'
Vue.use(BootstrapVueIcons)

export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Datasets', active: true },
          { text: 'API access', active: true }
        ],

        showApi1: false,
      }
    },

    methods: {
    },

    mounted() {
    }
}
</script>

<style>
</style>
