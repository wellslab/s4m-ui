<template>
<main class="col-md-9 ml-sm-auto col-lg-10 px-md-4 py-4">
<div class="row">
    <div class="col">
        <div class="card">
            <h5 class="card-header">Dataset</h5>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table">
                        <thead><tr>
                                <th scope="col">key</th>
                                <th scope="col">value</th>
                        </tr></thead>
                        <tbody><tr v-for="row in table" :key="row.key">
                                <th scope="row">{{row.key}}</th>
                                <td>{{row.value}}</td>
                        </tr></tbody>
                    </table>
                </div>
                <a href="#" class="btn btn-block btn-light">View all</a>
            </div>
        </div>
    </div>
</div>
</main>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            table: [],
        }
    },
    
    //middleware: 'datasets',

    methods: {
        async getSampleTable() {
            //let res = await axios.get('https://api.stemformatics.org/samples / metadata/7171/metadata', {headers: {"Access-Control-Allow-Origin": "*"}});
            let res = await axios.get('/api/samples / metadata/7171/metadata', {headers: {"Access-Control-Allow-Origin": "*"}});
            var values = JSON.parse(res.data)[0]['datasets'][0];
            for (var  key in values) {
                this.table.push({key: key, value: values[key]});
            }
        }
    },
    mounted() {
        this.getSampleTable();
    }
}
</script>

<style>
</style>