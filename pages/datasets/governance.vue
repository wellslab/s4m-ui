<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4 text-center">
    <h2>Dataset Processing and Governance</h2>
    <b-card v-if="$auth.loggedIn" class="border-0">
        <b-tabs v-model="tabIndex">
            <b-tab title="Pending datasets">
            <b-container class="col-md-6 justify-content-center">
                <div style="height:400px" class="overflow-auto border my-3 p-2">
                    <ul class="list-unstyled text-left">
                        <li v-for="item in datasets" :key="item.dataset_id">
                            <b-link href='#' @click="showDataset(item)" class='mr-2'>{{item.dataset_id}}</b-link> {{item.name}}
                        </li>
                    </ul>
                </div>
                <span class="float-left">Logged in as: {{$auth.user.username}}</span>
                <b-button v-b-modal.token-modal class="float-right">get token</b-button>
                <b-button @click="$auth.logout()" class="float-right mx-2">logout</b-button>
            </b-container>
            </b-tab>
            <b-tab title="Dataset detail">
                <h4 class="my-3">Dataset {{selectedDataset==null? '':selectedDataset.dataset_id}} 
                    ({{selectedDataset==null? '': selectedDataset.name}})</h4>
                <b-button-group>
                    <b-select v-model="selectedDatasetDetail" @change="showSelectedDatasetDetail">
                        <b-select-option value="History">History</b-select-option>
                        <b-select-option value="PCA">PCA</b-select-option>
                    </b-select>
                    <b-button @click="getHtmlReport('multiqc')" class="mx-1">MultiQC</b-button>
                    <b-button>Piccard</b-button>
                </b-button-group>

                <div v-if="selectedDatasetDetail=='History'" class="overflow-auto text-center mt-3">
                    <p>History of data processing</p>
                </div>
                <div v-if="selectedDatasetDetail=='PCA'" class="overflow-auto text-center">
                    <div id="pcaPlotDiv" style="width:800px; height:600px; margin:auto"></div>
                </div>
            </b-tab>
        </b-tabs>
        <b-modal id='token-modal' ok-only>
            <p style="word-wrap: break-word;">Access token: {{$auth.getToken('local')}}</p>
        </b-modal>
    </b-card>
    <b-card v-else class="col-md-4 mx-auto mt-4">
        <b-form-group label="Username">
            <b-form-input v-model="username"></b-form-input>
        </b-form-group>
        <b-form-group label="Password">
            <b-form-input v-model="password" type="password"></b-form-input>
        </b-form-group>
        <p>{{invalidLogin}}</p>
        <b-button @click="login">Login</b-button>
    </b-card>
</b-container>
</div>
</template>

<script>
// Note that this.$auth.loggedIn is meant to reactive, to refresh after a login and to persist after a page reload.
// But I was having trouble with this property: either it was set to false after login + page reload (https://github.com/nuxt-community/auth-module/issues/53)
// or that it wasn't working at all even after a login (still false). Setting propertyName to false in nuxt.config.js fixed this issue.
// Without this, I believe that property isn't accessing api to get the value to refresh.
import data_functions from "~/mixins/data_functions.js"

export default {
    head: {
      script: [ { src: 'https://cdn.plot.ly/plotly-latest.min.js' } ],
    },
    mixins: [data_functions],

    data() {
      return {
        breadcrumb: [
          { text: 'Home', to: '/' },
          { text: 'Datasets', active: true },
          { text: 'Governance', active: true }
        ],
        username:'',
        password:'',
        invalidLogin:'',

        datasets: [],
        selectedDataset: null,
        tabIndex: 0,
        selectedDatasetDetail: "History",

        pcaCoords: {}
      }
    },
    
    methods: {
        login() {
            let self = this;
            self.$auth.loginWith('local', {data: {username:self.username, password:self.password}}).then(res => {
                self.getDatasets();
            }).catch(error => {
                self.invalidLogin = error.response.data.message;
            });
        },
        
        // Fetch a list of pending datasets
        getDatasets() {
            this.$axios.get('/api/governance/summary?status=pending').then(res => {
                this.datasets = res.data;
            })
        },

        // Show details for selected dataset id
        showDataset(dataset) {
            this.selectedDataset = dataset;
            this.$axios.get('/api/governance/' + dataset.dataset_id + '/report').then(res => {
                this.tabIndex = 1;
            })
        },

        getHtmlReport(reportType) {
            this.$axios.get('/api/governance/' + this.selectedDataset.dataset_id + 
                            '/html?type=' + reportType, ).then(res => {
                var newWindow = window.open('',this.selectedDataset.dataset_id + ': MultiQC Report');
                newWindow.document.write(res.data);
            }).catch(error => {
                this.$bvModal.msgBoxOk(error.response.data.message);
            })
        },

        plotPCA() {
            let sampleIds = Object.keys(this.pcaCoords['0']);
            let x = sampleIds.map(item => this.pcaCoords['0'][item]);
            let y = sampleIds.map(item => this.pcaCoords['1'][item]);
            let traces = [{x:x, y:y, mode: 'markers', type: 'scatter'}];
            let layout = {margin: {t:20, l:0, r:0, b:0},};
            Plotly.newPlot('pcaPlotDiv', traces, layout);
        },

        showSelectedDatasetDetail() {
            if (this.selectedDatasetDetail=="PCA") {
                this.$axios.get('/api/governance/' + this.selectedDataset.dataset_id + '/pca').then(res => {
                    this.pcaCoords = res.data.pca;
                    this.plotPCA()
                    this.$axios.get('/api/datasets/' + this.selectedDataset.dataset_id + '/samples').then(res2 => {
                        console.log(res2.data);
                    })
                }).catch(error => {
                    this.$bvModal.msgBoxOk(error.response.data.message);
                });
            }
        }
    },

    mounted() {
        if (this.$auth.loggedIn)
            this.getDatasets();
    }
}
</script>

<style>
</style>
