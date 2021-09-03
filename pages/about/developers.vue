<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'developers'" />
        </b-col>
        <b-col>
            <h3>For developers</h3>
            <p>Stemformatics is built as 2 seperate applications: an API server which hosts all the data, and an UI server
                which hosts the website. Some details about how the system has been designed can be read below.</p>
            <p>
              <b-img class="my-2" src="/img/ServerInfrastructure.png" fluid 
                alt="Schematic of the server infrastructure design in Stemformatics"></b-img>
            </p>
            <p>Mongo db mainly holds dataset metadata and sample metadata in two separate collections.
                Expression files are held mainly in text files, but also duplicated in hdf5 files for performance reasons.
                Note that most text files below certain size can be read very quickly by pandas (see 
                <b-link href="https://www.architecture-performance.fr/ap_blog/loading-data-into-a-pandas-dataframe-a-performance-study/" target="_blank">
                this useful article</b-link>), but hdf5 files are useful for analyses which 
                require looping through multiple expression matrices quickly).
            </p>
            <p>The API server is built on <b-link href="https://flask-restful.readthedocs.io/en/latest/" target="_blank">Flask-restful</b-link>.
            It uses pandas extensively to manipulate data frames. Models contain data models which interface the underlying data to fetch them
            in suitable formats, and resources contain "controllers" which interface between the data models and the API endpoints.
            See our <b-link to="/datasets/api">API</b-link> page for more details.
            </p>
            <p>The UI server is built on <b-link href="https://nuxtjs.org/" target="_blank">Nuxt JS</b-link>, using
            <b-link href="https://bootstrap-vue.org/" target="_blank">BootstrapVue</b-link> to build components easily.
            Most of the plots are performed by <b-link href="https://plotly.com/" target="_blank">Plotly</b-link>.
            </p>
            <h3>Github repository</h3>
            <p>Both the API server and the UI server code can be found at github:</p>
            <ul><li><b-link href="https://github.com/wellslab/s4m-api" target="_blank">API server</b-link></li>
                <li><b-link href="https://github.com/wellslab/s4m-ui" target="_blank">UI server</b-link></li>
            </ul>
        </b-col>
    </b-row>
</b-container>
</div>
</template>

<script>
export default {
    data() {
        return {
            breadcrumb: [
            { text: 'Home', to: '/' },
            { text: 'About', to: '/about' },
            { text: 'For developers', active: true }
            ],
        }
    }
}
</script>

<style>
</style>
