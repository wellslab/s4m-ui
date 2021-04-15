<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
  <b-tabs v-model="tabIndex" content-class="mt-3 text-center">
    <b-tab title="Quick search" active>
      <h4 class="mb-2">Quick gene search</h4>
      <b-form-group class="mt-3" label-cols-md="3" content-cols-md="6" label-align-md="right" label="gene symbol or id">
        <b-input-group>
          <b-form-input id="quickSearchInput" v-model="searchString" placeholder="eg. Myb" @keyup.enter="search"></b-form-input>
          <b-input-group-append>
            <b-button variant="dark" @click="search">search</b-button>
          </b-input-group-append>
        </b-input-group>
      </b-form-group>
    </b-tab>

    <b-tab title="Advanced search">
      <h4 class="mb-2">Advanced gene search</h4>
      <b-row>
        <b-col class="text-right col-md-2 col-12">List of keywords</b-col>
        <b-col class="col-12 col-md-6">
          <b-form-textarea id="advancedSearchInput" v-model="searchString" rows="6" max-rows="10"></b-form-textarea>
        </b-col>
        <b-col class="text-left">
          Search for one or more terms here by using commas or spaces or new lines.
          Eg. myb, suz12, ENSMUSG00000005672 will search for myb [or] suz12 [or] ENSMUSG00000005672.
          You can also upload a list of genes here by entering a list of gene symbols or ids. Use search scope to ensure 
          matches are made only within selected fields.
        </b-col>
      </b-row>
      <b-row class="mt-2">
        <b-col class="text-right col-md-2 col-12">Search scope</b-col>
        <b-col class="col-12 col-md-6">
          <b-form-select v-model="searchScope">
            <b-form-select-option value="all">gene symbol, synonyms, Ensembl gene id, description</b-form-select-option>
            <b-form-select-option value="symbol">gene symbol</b-form-select-option>
            <b-form-select-option value="id">Ensembl gene id</b-form-select-option>
          </b-form-select>
        </b-col>
        <b-col></b-col>
      </b-row>
      <b-row class="mt-2">
        <b-col></b-col>
        <b-col class="col-12 col-md-6 mt-3 text-left">
          <b-form-checkbox v-model="useExactMatch">use exact match</b-form-checkbox>
        </b-col>
        <b-col></b-col>
      </b-row>
      <b-button>clear</b-button><b-button class="ml-2">search</b-button>
    </b-tab>

    <b-tab title="Search results">
        <h4 class="mb-2">Search results</h4>
        <b-form-group class="mt-3 mb-2" label-cols-md="8" content-cols-md="3" label-align-md="right" label="Click on the gene name to go to gene expression page for that gene, where you can select a dataset.">
          <b-form-input v-model="tableFilter" type="search" placeholder="Narrow your search"></b-form-input>
        </b-form-group>
        <b-table hover small sticky-header head-variant="light" :items="table" :fields="tableColumns" :filter="tableFilter">
            <template #cell(gene_name)="row">
                <b-link :to="'/genes/expression?gene_id=' + row.item.gene_id + '&gene_symbol=' + row.item.gene_name" >{{row.value}}</b-link>
            </template>
            <template #cell(links)="row">
                <b-link :href="'https://ensembl.org/Gene/Summary?g=' + row.item.gene_id" target="_blank" v-b-tooltip.hover title="Go to Ensembl site">
                  <b-img src="/img/ensembl.gif"></b-img>
                </b-link>
                <b-link :href="'https://www.ncbi.nlm.nih.gov/gene/?term=' + row.item.gene_id" target="_blank" v-b-tooltip.hover title="Go to Entrez site">
                  <b-img src="/img/ncbi.ico"></b-img>
                </b-link>
            </template>
        </b-table>
    </b-tab>
  </b-tabs>
</b-container>
</div>
</template>

<script>
export default {
    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Genes', active: true },
          { text: 'Search', active: true }
        ],

        tabIndex: 0,

        searchString: "",
        useExactMatch: false,
        searchScope: "all",

        table: [],
        tableColumns: [{key:"gene_name", sortable:true},
                       {key:"links", label:"External links"},
                       {key:"gene_description", sortable:true, class:"truncate"},],
        tableFilter: "",
      }
    },

    methods: {
      search() {
        this.$axios.get("/api/genes?search_string=" + this.searchString ).then(res => {
          this.table = res.data;
          this.tabIndex = 2;
        });
      }
    }
}
</script>

<style>
</style>
