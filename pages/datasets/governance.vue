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
                <p>History</p>
                <p><b-link href='#' @click="getHtmlReport('multiqc')">MultiQC</b-link></p>
                <p>QC: Piccard</p>
                <p><b-link href='#' @click="showPCA">QC: PCAc</b-link></p>
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
export default {
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
        tabIndex: 0
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
                            '/qchtml?type=' + reportType, ).then(res => {
                var newWindow = window.open('',this.selectedDataset.dataset_id + ': MultiQC Report');
                newWindow.document.write(res.data);
            }).catch(error => {
                this.$bvModal.msgBoxOk(error.response.data.message);
            })
        },

        showPCA() {
            
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
