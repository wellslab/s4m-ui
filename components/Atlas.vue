<template>
<div>
    <div class="text-center mt-1">
        <h3 class="mb-2">Integrated Atlas: <b-link @click="showVersionInfo" v-b-tooltip.hover title="Click to show atlas version">{{displayName}}</b-link>
            <small class="align-middle">
                <b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar class="ml-2">
                    <b-icon-info-circle></b-icon-info-circle>
                </b-link>
                <b-link v-show="tab.pca == true && selectedPlotBy == 'sample type'" @click="tourPCA1.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-link v-show="tab.pca == true && selectedPlotBy == 'gene expression'" @click="tourPCA2.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-link v-show="tab.pca == true && selectedPlotBy == 'find dataset'" @click="tourPCA3.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-link v-show="tab.box == true" @click="tourBox.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-link v-show="tab.projection == true" @click="tourProjection.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-link v-show="tab.tools == true" @click="tourTools.start()" title="Click here for a quick tour of the page." type="button" class="question-bbutton">
                    <b-icon-question-circle class="q1 m1-1"></b-icon-question-circle>
                </b-link>
                <b-spinner label="Loading..." variant="secondary" :style="{visibility: loading ? 'visible' : 'hidden'}" class="ml-1" style="width:1.5rem; height:1.5rem;"></b-spinner>
            </small>
        </h3>
    </div>

    <!-- Put the whole tab inside card. Each tab has single row with 2 columns -->
    <b-card no-body class="mb-2">
    <b-tabs card pills align="center">
        <!-- PCA tab -->
        <b-tab title="PCA Plot" active @click="tab.pca=true; tab.box=false, tab.projection=false, tab.tools=false">
        <b-row class="small justify-content-center" @mousemove="updateMousePosition">
            <b-col md="3">
                <b-form inline>
                    <b-form-select v-model="selectedPlotBy" size="sm" class="plot-by m-1" @change="changePlotBy">
                        <b-form-select-option value="sample type">Plot by sample type</b-form-select-option>
                        <b-form-select-option value="gene expression">Plot by gene expression</b-form-select-option>
                        <b-form-select-option value="find dataset">Find dataset</b-form-select-option>
                    </b-form-select>
                    <b-form-checkbox v-model="is3d" @change="updatePlot();" class="d-switch ml-1">3D</b-form-checkbox>
                </b-form>

                <!-- Plot legend, only shown if selectedPlot not gene expression. -->
                <PlotLegend v-show="!showColourByAsDraggable && (showTwoPlots || selectedPlotBy=='sample type')"
                    :legends="allLegends" :initial-sample-group="selectedColourBy" :items-with-margins="itemsWithMargins"
                    @legend-clicked="updatePlot" @sample-group-changed="updatePlot">
                    <template #header>
                        Colour by: <b-link @click="toggleLegend" v-b-tooltip.hover title="pop out this area as a draggable box" class="colour-by">
                            <b-icon-box-arrow-in-up-right></b-icon-box-arrow-in-up-right></b-link>
                    </template>
                </PlotLegend>

                <!-- Gene expression input area, only shown if selectedPlot gene expression. -->
                <div v-show="selectedPlotBy=='gene expression'" class="p-2">
                    <p>Show expression of a gene in the PCA using colour gradient.
                    </p>
                    <b-button-group inline>
                        <b-form-input size="sm" v-model="selectedGene" list="possible-genes-datalist"
                            @keyup="getPossibleGenes()" @keyup.enter="showGeneExpression(selectedGene)" @change="showGeneExpression(selectedGene)"
                            placeholder="[gene symbol]" v-b-tooltip.hover.right :title="tooltip.selectedGene" class="pca-gene-select m-1"></b-form-input>
                        <b-form-datalist id="possible-genes-datalist">
                            <option v-for="gene in possibleGenes" :key="gene.ensembl">{{gene.inclusion? '' : '('}}{{gene.symbol}}{{gene.inclusion? '' : ')'}}</option>
                        </b-form-datalist>
                        <b-form-input v-show="false"></b-form-input>
                        <b-button size="sm" @click="showGeneExpression(selectedGene); updatePlot()" variant="outline-dark" class="pca-go m-1 rounded">Go</b-button>
                    </b-button-group>
                </div>

                <!-- Find dataset area -->
                <div v-show="selectedPlotBy=='find dataset'" class="find-datasets p-2">
                    <p>All the datasets which were used for the construction of this atlas are shown below. 
                    You can show these on the PCA or view details of the dataset.</p>
                    <div style="max-height:500px; overflow:auto">
                        <p v-for="item in datasetInfo.allData" :key="item.dataset_id"
                            class="my-0 py-0">
                            <b-link :to="'/datasets/view?id=' + item.dataset_id" target="_blank">
                                {{item.display_name}}
                            </b-link>
                            ({{item.sampleIds.length}})
                            <b-link  
                            @click="highlightDatasets(item.dataset_id)">
                            <b-icon-caret-right-fill></b-icon-caret-right-fill>
                        </b-link>
                        </p>
                    </div>
                </div>
            </b-col>
            <!-- One plot - PCA -->
            <b-col col :md="showTwoPlots? (showColourByAsDraggable? 6: 4): (selectedPlotBy=='sample type' || selectedPlotBy=='gene expression' || geneExpression.length==0? 9: 12)" class="overflow-auto text-center">
                <div id="mainPlotDiv"></div>
            </b-col>
            <!-- Two plots -->
            <b-col v-show="showTwoPlots" col :md="showColourByAsDraggable? 6: 4" class="overflow-auto text-center">
                <div id="rightPlotDiv"></div>
            </b-col>
        </b-row>
        </b-tab>

        <!-- Box Plot Tab -->
        <b-tab title="Box Plot" @click="tab.pca=false, tab.box=true, tab.projection=false, tab.tools=false">
        <b-row class="small justify-content-center">
            <b-col md="3">
                <!-- @submit.prevent stops the page refreshing when hitting the 'enter' key in the gene selection drop down box -->
                Gene:
                <b-form @submit.prevent>
                <b-button-group inline class="mb-4">
                    <b-form-input size="sm" v-model="boxPlot.selectedGene" list="boxplot-possible-genes-datalist" 
                        @keyup="getPossibleGenes('boxPlot')" @keyup.enter="showGeneExpression(boxPlot.selectedGene,'boxPlot')" 
                        @change="showGeneExpression(boxPlot.selectedGene,'boxPlot')"
                        placeholder="[gene symbol]" v-b-tooltip.hover.right :title="tooltip.selectedGene" class="choose-gene"></b-form-input>
                    <b-form-datalist id="boxplot-possible-genes-datalist">
                        <option v-for="gene in boxPlot.possibleGenes" :key="gene.ensembl">{{gene.inclusion? '' : '('}}{{gene.symbol}}{{gene.inclusion? '' : ')'}}</option>
                    </b-form-datalist>    
                    <b-button @click="geneExpressionScatterPlot" size="sm" class="plot-gene-button rounded">Go</b-button>
                </b-button-group>
                </b-form>
                Group by:
                <b-form-select  size="sm" v-model="boxPlot.selectedSampleGroup" :options="colourBy" 
                    @change="geneExpressionScatterPlot" class="group-by mb-2"></b-form-select>
                Plot type:
                <b-form-select  size="sm" v-model="boxPlot.selectedPlotType" :options="boxPlot.plotTypes" 
                    @change="geneExpressionScatterPlot" class="plot-type mb-2"></b-form-select>

                <b-form-checkbox  size="sm" v-model="boxPlot.showPoints" @change="geneExpressionScatterPlot" class="show-points mb-2">Show points</b-form-checkbox>
                <b-button v-b-tooltip.hover.right title="Download plot as a jpeg file" @click="downloadGeneExpressionScatterPlot" class="box-download">
                    Download plot
                </b-button>
            </b-col>
            <b-col>
                <div id="boxPlotDiv"></div>
            </b-col>
        </b-row>
        </b-tab>

        <!-- Projection Tab -->
        <b-tab title="Projection" @click="tab.pca=false, tab.box=false, tab.projection=true, tab.tools=false">
        <b-row class="small">
            <b-col md="3">
                <p>Benchmark another dataset using the atlas as a reference 
                    (<b-link to="/AtlasVignette/Stemformatics_atlas_projection_vignette.html" target="_blank">vignette</b-link>).
                </p>
                <b-button size="sm" variant="outline-primary" @click="projection_selectedView='stemformatics'" 
                    :pressed="projection_selectedView=='stemformatics'" class="project-stem">
                    Project Stemformatics data</b-button>
                <b-button size="sm" variant="outline-primary" @click="projection_selectedView='bulk'"
                    :pressed="projection_selectedView=='bulk'" class=" project-bulk mt-2">
                    Project bulk data</b-button>
                <b-button size="sm" variant="outline-primary" @click="projection_selectedView='singlecell'"
                    :pressed="projection_selectedView=='singlecell'" class=" project-single mt-2">
                    Project single cell data</b-button>
                <b-button size="sm" variant="outline-primary" @click="projection_selectedView='capybara'; projectionState=true; plotCapybara()"
                    :pressed="projection_selectedView=='capybara'" class="capybara mt-2">
                    Cabybara score</b-button>

            </b-col>
            <b-col>
                <!-- Project Stemformatics data -->
                <div v-show="projection_selectedView=='stemformatics'">
                    <AtlasDataUpload :atlas-type="atlasType" selectedDataSource="Stemformatics" @project-data="projectData"></AtlasDataUpload>
                </div>

                <!-- Project bulk user data -->
                <div v-show="projection_selectedView=='bulk'">
                    <AtlasDataUpload :atlas-type="atlasType" selectedDataSource="User" @project-data="projectData"></AtlasDataUpload>
                </div>
                
                <!-- Project single-cell data -->
                <b-container v-show="projection_selectedView=='singlecell'">
                    <b-card bg-variant="light" class="mt-3">
                        <h5>Project single cell data (Coming soon)</h5>
                        <p>You can project your own single cell data here. </p>
                        <!-- Email -->
                        <b-form-group id="input-group-1" label="Email address:" label-for="project-email-input" description="We'll send the results to your email.">
                            <b-input-group size="sm" style="width: 360px">
                            <b-input-group-prepend is-text>
                                <b-icon icon="envelope"></b-icon>
                            </b-input-group-prepend>
                            <b-form-input :state="isEmailValid" aria-describedby="input-live-feedback" debounce="1000" style="width: 220px" id="project-email-input" v-model.lazy="singleCellData.email" placeholder="Enter email" required size="sm" class="project-email-input"></b-form-input>
                            <b-form-invalid-feedback id="input-live-feedback">Enter a valid email.</b-form-invalid-feedback>
                            </b-input-group>
                        </b-form-group>
                        <!-- Upload files -->
                        <!-- Desired format can be found here. -->
                        <b-form-group label="Single-cell data file:" label-for="project-data-input" description="Only .tsv files are accepted for online analysis.">
                            <b-form-file accept=".tsv" size="sm" v-model="singleCellData.data" drop-placeholder="Drop file here" placeholder="Choose a file or drop it here" id="project-data-input"></b-form-file>
                        </b-form-group>
                        <!-- Upload button -->
                        <div class="form-group text-center">
                            <b-button :disabled="singleCellData.email=='' || singleCellData.data==null" size="sm" variant="primary" class="upload-button text-center mt-1 rounded" @click="uploadSingleCell(); disableUploadButton()"> <b-icon icon="cloud-upload-fill"></b-icon>  Upload data</b-button>
                            <b-spinner label="Loading..." variant="secondary" :style="{visibility: showLoading ? 'visible' : 'hidden'}" class="ml-2 align-middle"></b-spinner>
                            <span :style="{visibility: showLoading ? 'visible' : 'hidden', color:'#ced4da'}" class="ml-1 align-middle"
                                v-b-tooltip.hover title="It may take up to a minute for your data to be uploaded.">{{loadingTime}}s</span>
                        </div>
                    </b-card>
                </b-container>

                <!-- Show project score -->
                <b-container v-show="projection_selectedView=='capybara'">
                    <b-card bg-variant="light" class="mt-3">
                        <h5>Capybara score</h5>
                        <p>
                            Each projected sample is scored using 
                            <b-link href="https://doi.org/10.1101/2020.02.17.947390" target="_blank">
                            Capybara</b-link> here, and the score is rendered as a heatmap. Higher values imply more closeness with that atlas sample group.
                            The rows of this table match samples groups in the query data, and columns match those in the atlas.
                        </p>
                        <b-form inline class="justify-content-center mt-2">
                            Show rows as: 
                            <b-form-select v-model="projection_selectedSampleGroup" size="sm"
                                :options="projection_sampleGroups" @change="plotCapybara" class="mx-2" style="width: 15%">
                            </b-form-select>
                            Columns as: 
                            <b-form-select v-model="projection_selectedAtlasSampleGroup" size="sm"
                                :options="colourBy" @change="plotCapybara" class="ml-1">
                            </b-form-select>
                            <b-button size="sm" v-b-tooltip.hover title="Download this plot" @click="downloadCapybara" class="ml-2">Download</b-button>
                        </b-form>
                    </b-card>
                    <div id="capybaraPlotDiv" v-show="projection_selectedView=='capybara'"></div>
                </b-container>
            </b-col>
        </b-row>
        </b-tab>

        <!-- Tools Tab -->
        <b-tab title="Tools" @click="tab.pca=false, tab.box=false, tab.projection=false, tab.tools=true">
        <b-row class="small">
            <b-col md="3">
                <p>Download data or define custom sample groups.</p>
                <b-button size="sm" variant="outline-primary" @click="toolsTab.selectedView='downloadData'" 
                    :pressed="toolsTab.selectedView=='downloadData'" class="download-data">
                    Download data</b-button><br/>
                <b-button size="sm" variant="outline-primary" @click="toolsTab.selectedView='downloadPlots'" 
                    :pressed="toolsTab.selectedView=='downloadPlots'" class="download-plots mt-2">
                    Download plots</b-button><br/>
                <b-button size="sm" variant="outline-primary" @click="toolsTab.selectedView='sampleGroups'" 
                    :pressed="toolsTab.selectedView=='sampleGroups'" class="combine-samples mt-2">
                    Custom sample groups</b-button>
            </b-col>

            <b-col>
                <!-- Download data/plots -->
                <b-container class="mt-3" v-show="toolsTab.selectedView=='downloadData'">
                    <b-card>
                        <h5>Download data</h5>
                        <b-card-text>
                            You can download the data used for the atlas here. The samples matrix contains data about each sample, 
                            the genes matrix shows which genes were included in the atlas and which were left out, and 
                            the expression matrix contains rank normalised expression values (note: large file).
                            <ul class="mt-2">
                                <li v-for="item in downloadData.fileTypes" :key="item.key">
                                    <b-link :href="apiUrl + '/atlases/' + atlasType + '/' + item.key + '?as_file=true'">{{item.name}}</b-link> ({{item.size}})
                                </li>
                            </ul>
                        </b-card-text>
                    </b-card>
                </b-container>

                <b-container class="mt-3" v-show="toolsTab.selectedView=='downloadPlots'">
                    <b-card>
                        <h5>Download plots</h5>
                        <b-card-text>
                            You can download plots at high resolution here, rather than relying the low resolution png download
                            button provided by plotly.
                        </b-card-text>
                        <b-form-group label="Image type" v-slot="{ ariaDescribedby }">
                            <b-form-radio-group v-model="downloadData.selectedImageType" :options="downloadData.imageTypes" :aria-describedby="ariaDescribedby"></b-form-radio-group>
                        </b-form-group>
                        <b-form inline>
                            <b-form-group label="width (pixels)"><b-form-input v-model="downloadData.plotWidth"></b-form-input></b-form-group>
                            <b-form-group label="height (pixels)"><b-form-input v-model="downloadData.plotHeight"></b-form-input></b-form-group>
                        </b-form>
                        <b-button size="sm" @click="downloadPlot" class="mt-2">Download</b-button>
                    </b-card>
                </b-container>

                <!-- Combine sample groups -->
                <b-card v-show="toolsTab.selectedView=='sampleGroups'">
                    <h5>Custom sample groups</h5>
                    <div class="overflow-hidden">
                        <div slot="main" class="p-2">
                            <atlas-custom-sample-group :sample-table="sampleTable" :sample-ids="sampleIds" :sample-type-colours="sampleTypeColours"
                                :sample-groups="colourBy" :sample-type-ordering="sampleTypeOrdering" :custom-group-name="customSampleGroup.groupName"
                                :selected-sample-group1="colourBy[0]"
                                @save="applyCustomSampleGroup" @close="customSampleGroup.show=false"></atlas-custom-sample-group>
                        </div>
                    </div>
                </b-card>
            </b-col>
        </b-row>
        </b-tab>
    </b-tabs>
    </b-card>

<!-- Legend area can be "popped out" to be a draggable -->
<draggable-div v-show="showColourByAsDraggable" class="border border-light bg-light" style="width:350px; opacity:0.95; left:20%">
    <div slot="header" class="card-header bg-dark" title="Drag me around by this area">
        <span class="text-white">Colour by</span>
        <b-link href="#" @click="toggleLegend" class="float-right font-weight-bold text-white" v-b-tooltip.hover title="Pop this box back into the page">
            <b-icon-box-arrow-in-down-left></b-icon-box-arrow-in-down-left>
        </b-link>
    </div>
    <div slot="main">
        <PlotLegend :legends="allLegends" :initial-sample-group="selectedColourBy" :items-with-margins="itemsWithMargins"
            @legend-clicked="updatePlot" @sample-group-changed="updatePlot">
                <template #header><span></span></template>
        </PlotLegend>
    </div>
    <div slot="footer">
        <b-link href="#" @click="toggleLegend" class="font-weight-bold text-white" v-b-tooltip.hover title="Pop this box back into the page">
            <b-icon-box-arrow-in-down-left></b-icon-box-arrow-in-down-left>
        </b-link>
    </div>
</draggable-div>

<b-sidebar id="sidebar" title="Help and more info" shadow>
    <div class="px-3 py-2">
        <p>Stemformatics integrated atlas provides a way to visualise multiple datasets together on a single PCA plot.
            Read more about it at our <b-link to='/atlas/about'>about atlas</b-link> page, which briefly outlines the method we used
            to construct the atlas and links to our published papers. 
        </p>
        <p>You can explore the atlas in several ways: Plot by <b>"sample type"</b> to change 
            the colour of the samples to based on attributes such as cell type or sample source. 
            Plot by <b>"gene expression"</b> to search by gene symbol to overlay a heatmap onto the atlas. 
            Display sample annotations and gene expression data side-by-side. Click on the item in the legend to add or remove that category.
        </p>
        <p> 
            Zoom in or out using your mouse, double-click individual samples to see more information on their origin, cell type, 
            Stemformatics dataset, and sample description. <b>"project other data"</b> function allows you
            to see where samples from another dataset sit, either from another Stemformatics dataset or your own.
            You can see exactly which datasets were used to build this atlas by selecting <b>"find dataset"</b> function. 
            All of the data displayed in this atlas are available to download via <b>"download data/plots"</b> function.
        </p>
  </div>
</b-sidebar>

<!-- Sample info div -->
<div v-if="sampleInfo.show" class="sampleInfo" :style="{top:sampleInfoDivPosition('y'), left:sampleInfoDivPosition('x')}">
    <div style="background-color:#EE255F;" class="p-2">
        <span v-b-tooltip.hover title="Details of last double-clicked sample" class="text-white">Sample Info</span>
        <b-link href="#" @click="sampleInfo.show=false" class="float-right font-weight-bold text-white">X</b-link>
    </div>
    <ul class="list-unstyled p-2"><li v-for="item in sampleInfo.shownData" :key="item.key">
        <span class="font-weight-bold">{{item.key}}</span><br/>
        <span class="ml-1">
            <b-link v-if="item.key=='dataset' && ('datasetId' in item)" :href="'/datasets/view?id='+item.datasetId" target="_blank">{{item.value}}</b-link>
            <span v-else>{{item.value}}</span>
        </span>
    </li></ul>
</div>

<!-- version info (modal) -->
<b-modal v-model="versionInfo.show" title="Atlas version" hide-footer>
    <p>Currently showing version {{versionInfo.currentVersion}} of the {{atlasType}} atlas. Available versions are:</p>
    <ul class="list-unstyled"><li v-for="(item,i) in versionInfo.availableVersions" :key="item">
        <b-link href="#" v-if="versionInfo.showReleaseNotes.indexOf(item)==-1" @click="versionInfo.showReleaseNotes.push(item)">
            <b-icon-chevron-right></b-icon-chevron-right>
            {{item}}
        </b-link>
        <b-link href="#" v-if="versionInfo.showReleaseNotes.indexOf(item)!=-1" @click="versionInfo.showReleaseNotes.splice(versionInfo.showReleaseNotes.indexOf(item),1)">
            <b-icon-chevron-down></b-icon-chevron-down>
            {{item}}
        </b-link>
        <b-collapse :visible="versionInfo.showReleaseNotes.indexOf(item)!=-1">
            <ul class="list-unstyled ml-3"><li v-for="line in versionInfo.releaseNotes[i].split('\n')" :key="line">{{line}}</li></ul>
        </b-collapse>
        </li></ul>
</b-modal>

</div>
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
    props: ["atlasType", "displayName"],

    computed: {
        // Check whether email input under Projection tab in /Atlases is of valid format
        isEmailValid() {
            if(this.singleCellData.email) {
                return this.emailState();
            }
            return null;
        }
    },

    data() {
        return {
        
            coords: {},         // {"0":{"6638_GSM868879":5.72,"6638_GSM868880":5.511, ...}, ...}
            sampleIds: [],      // ["6638_GSM868879","6638_GSM868880", ...]
            sampleTable: {},    // {'celltype':{'6638_GSM868879':'HPC', ...}, ...}

            selectedPlotBy: "sample type",  // one of ["sample type", "gene expression", "find dataset"]
            is3d: true, // whether plot is in 3d or 2d
            sampleText: "Show sample colour plot",

            backgroundColour: 'outline-primary',
            textColour: 'white',

            // Variables for email and file input
            singleCellData: {
                email: '',
                data: null,
            },
            selectedDataSource: "",

            show: true,

            // User ID obtained from URL query
            userID: null,

            colourBy: [],   // ["Cell Type", "Sample Source", ...]
            selectedColourBy: "Cell Type",  // overwrite at mounted()
            showColourByAsDraggable: false,

            sampleTypeColoursOriginal: {},    // colours may change, so we keep original colours stored here
            sampleTypeColours: {},    // {"Sample Source":{"in vivo":"#8b8b00",...}, ...}
            sampleTypeOrdering: {},  // {"Sample Source":["in vivo","ex vivo",...], ...}

            apiUrl: 'http://127.0.0.1:5000', // set to process.env.BASE_URL when mounted

            // gene expression related
            selectedGene: "",
            possibleGenes: [],  // gene ids and symbols used to populate the autocomplete field
            geneExpression: [], // flat list of values, in same order as sampleIds, to be fetched when requested
            boxPlot: {
                selectedGene: "",
                geneExpression: [],
                selectedSampleGroup: 'Cell Type',
                plotTypes: ["violin", "box"],
                selectedPlotType: "box",
                showPoints: false,
            },

            // plotly requires id of div where it will plot, so set them as vars here
            mainPlotDiv: "mainPlotDiv",
            rightPlotDiv: "rightPlotDiv",

            // default camera angle for a 3d plot in plotly
            camera: {up: {x:0, y:0, z:1}, center: {x:0, y:0, z:0}, eye: {x:1.25, y:1.25, z:1.25}},
            showTwoPlots: false,

            allLegends: {},
            itemsWithMargins: {},
            loading: false,
            showInfo: false,

            showLoading: false,
            loadingTime: 0,
            interval: null,

            projection_selectedView: "stemformatics",
            projection_data: {},
            projection_showScore: false,
            projection_sampleGroups: [],
            projection_selectedSampleGroup:'',
            projection_selectedAtlasSampleGroup:'Cell Type',

            toolsTab: {
                selectedView: "downloadData"
            },

            // Variables used to determine which tab is activate to v-show the right page tour button
            tab: {
                pca: true,
                box: false,
                projection: false,
                tools: false,  
            },

            // Page tour variables
            tourPCA1: null,
            tourPCA2: null,
            tourPCA3: null,
            tourBox: null,
            tourProjection: null,
            tourGeneSets: null,
            tourTools: null,

            // variables used by the find dataset div which can be used to show a table of datasets
            datasetInfo: {
                allData: [], // [{"dataset_id":7268,"author":"Abud","pubmed_id":"28426964","platform":"RNAseq",...},...]
                show: false,
                selectedDatasetId: '',
            },

            // variables used by the sample info div which is shown when a sample is double-clicked
            sampleInfo: {
                allData: {}, // {'6731_GSM2064216': {'Cell Type': 'Clec4e-/- microglia I/R', 'FACS profile': '', ...}, ...}
                show: false,
                shownData: [],
                sampleId: null,
                lastClickTime: 0,
                mouseX: 0,
                mouseY: 0,
                divX: 0,
                divY: 0
            },

            // download data
            downloadData: {
                selectedDataType: 'data', // either 'data' or 'plots'
                fileTypes: [{key:'samples', name:'samples matrix', size:'~50kb'},
                            {key:'genes', name:'genes matrix', size:'~360kb'},
                            {key:'expression-file', name:'expression matrix', size:'226Mb'},
                            {key:'colours-and-ordering', name:'colours and ordering', size:'1kb'},
                            {key:'coordinates', name:'pca coordinates', size:'~50kb'},
                ],
                imageTypes: ['svg','jpeg','webp'],
                selectedImageType: 'svg',
                plotWidth: 1200,
                plotHeight: 900,
            },

            // upload data
            uploadData: {
                projectedSampleIds: [],  // record sample ids which have been projected
                name: null, // name of the dataset used for projection - will be the prefix for projected samples
            },
        
            // custom sample group
            customSampleGroup: {
                show: false,
                groupName: 'custom_sample_group',   // used as sample group name
                data: [], // data specified by the user
            },

            // version info
            versionInfo: {
                show: false,
                currentVersion:'',
                availableVersions:[],   // ['1.3','1.2',...]
                showReleaseNotes:[],  // will hold version numbers where release notes are currently showing
                releaseNotes:[] // ['These files correspond to...', ...]
            },

            // tooltip texts
            tooltip: {atlasType: "show information about this page",
                    atlasToggle: "toggle atlas",
                    selectedGene: "Select a gene from suggestions and press go to show its expression." +
                                    "The genes with brackets were filtered out before creating this PCA.",
                    geneExpressionPlot: "This plot shows rank normalised values of the gene in the atlas as "+
                                        "either a violin or a box plot. The values are in the range [0,1]." +
                                        "You can drag this plot overlay by grabbing it near the title.",
                    editLegend: "Edit colours of points",
                    showProjectionFunctions: "Show nearest neighbours of projected points.",
                    projectionFunctions: "You can drag this plot overlay by grabbing it near the title.",
                    customSampleGroup: "You can drag this dialog overlay by grabbing it near the title.",
            },

            // Showing/hiding capybara when clicking collapsable button - 'Show projection score'
            projectionState: false,
        }
    },

    methods: {
        // ------------ Data wrangling methods ---------------
        // Return an object of sample ids (array), keyed on sample group item. eg. {'HPC':['6638_GSM868879',...], ...}
        sampleIdsFromSampleGroup(sampleGroup) {
            let tableCol = this.sampleTable[sampleGroup];   // {'6638_GSM868879':'HPC', ...}
            let sampleIds = {};
            for (const [sampleId, value] of Object.entries(tableCol)) {
                if (!(value in sampleIds)) sampleIds[value] = [];
                sampleIds[value].push(sampleId)
            }
            return sampleIds;
        },

        // Colours for sample groups may not be pre-defined, and samples groups also may be created dynamically (eg. custom sample group).
        // Hence run this function to ensure all sample group colours have been populated.
        updateSampleTypeColours() {
            // If colours weren't specified we set them here from this list
            let exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                  '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                  '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];
            this.colourBy.forEach(sampleGroup => {
                if (!(sampleGroup in this.sampleTypeColours)) {
                    this.sampleTypeColours[sampleGroup] = {};
                    Object.keys(this.sampleIdsFromSampleGroup(sampleGroup)).forEach((sampleGroupItem, i) => {
                        this.sampleTypeColours[sampleGroup][sampleGroupItem] = exampleColours[i % exampleColours.length];
                    });
                }
            });
        },

        // Some sample groups may come without sample type ordering, but this is used throughout
        // the page, so this function will define this based on alphabetical ordering.
        updateSampleTypeOrdering() {
            this.colourBy.forEach(sampleGroup => {
                if (!(sampleGroup in this.sampleTypeOrdering)) {
                    let sampleGroupItems = Object.keys(this.sampleIdsFromSampleGroup(sampleGroup));
                    sampleGroupItems.sort();
                    this.sampleTypeOrdering[sampleGroup] = sampleGroupItems;
                }
            });
        },
        
        toggleLegend() {
            this.allLegends = JSON.parse(JSON.stringify(this.allLegends));  // PlotLegend component will refresh when allLegends is refreshed
            this.showColourByAsDraggable = !this.showColourByAsDraggable;
        },

        // Run before sample group plot to populate the legends array, and when a legend is clicked to show/hide a trace
        updateLegends() {
            this.allLegends = this._legendsFromSampleTable(this.sampleTable, 
                {orient:'dict', sampleGroupItemColours:this.sampleTypeColours, sampleGroupItemsOrdered:this.sampleTypeOrdering});
        },
        
        // ------------ Plot related methods ---------------
        // Layout dict used by plotly - can control size, camera, etc.
        layout() {
            return { 
                showlegend: false,
                height: 500,   // height of the plot in pixels
                width: this.showTwoPlots? 500 : 800,
                margin: {t:20, l:0, r:0, b:0},
                xaxis: {title: "PC1"},
                yaxis: {title: "PC2"},
                uirevision: true,
                hovermode: 'closest',
                scene: {camera: this.camera,
                        up: { x: 1, y: 0, z: 0 }, 
                        xaxis: {title: "PC1"},
                        yaxis: {title: "PC2"},
                        zaxis: {title: "PC3"}}
            };
        },
        
        // Return a list of traces to use for plots.
        traces(type="sample type") {
            let self = this;	// this refers to the Vue instance, and it's safer to map it to another variable

            // Define elements common to all traces and return them - if we simply define a variable here, it will
            // only be referenced when I try to use it below. Using {...template} or Array.from(template) will clone
            // the array instead of referencing, but won't do a deep copy so have to deal with template.markers
            // separately, for example. So it's easier to define a function that will return a new object.
            function traceTemplate() {
                let template = {
                    marker: {},
                    mode: "markers",
                    hoverinfo: "text",
                };

                if (self.is3d) {  // specify parameters specific to 3d plot
                    template.type = "scatter3d";
                    template.marker.size = 5;
                } else {
                    template.type = "scatter";
                }
                return template;
            }

            // What hover text do we want to show
            let hovertext = {};
            for (let i=0; i<self.sampleIds.length; i++) {
                // show currently selected value + help text
                let values = [self.sampleTable[self.selectedColourBy][self.sampleIds[i]], "(double-click for more info)"];
                // also add sample and dataset ids
                //values.push("(" + self.sampleIds[i] + ")");
                hovertext[self.sampleIds[i]] = values.map(item => "<span style='font-size:14px'>" + item + "</span>").join(" ");
            }

            // create traces
            let traces = [];
            let legends = self.allLegends[self.selectedColourBy];
            if (type=="sample type") {
                // one trace per item of availableValues
                for (let i=0; i<legends.length; i++) {
                    let legend = legends[i];
                    let trace = traceTemplate();
                    trace.x = legend.sampleIds.map(item => self.coords['0'][item]);
                    trace.y = legend.sampleIds.map(item => self.coords['1'][item]);
                    trace.z = legend.sampleIds.map(item => self.coords['2'][item]);
                    trace.text = legend.sampleIds.map(item => hovertext[item]);
                    trace.name = legend.value;
                    // For colours, use array instead of single value so we can control them individually later if needed
                    trace.marker.color = legend.sampleIds.map(item => legend.colour);  
                    trace.marker.symbol = legend.sampleIds.map(item => 
                        self.uploadData.projectedSampleIds.indexOf(item)==-1? "circle" : "diamond-open");
                    trace.sampleIds = legend.sampleIds;
                    trace.visible = legend.visible;
                    traces.push(trace);
                }
            } else {    // gene expression plot - one trace only
                var trace = traceTemplate();
                trace.x = self.sampleIds.map(item => self.coords['0'][item]);
                trace.y = self.sampleIds.map(item => self.coords['1'][item]);
                trace.z = self.sampleIds.map(item => self.coords['2'][item]);
                trace.text = self.sampleIds.map(item => hovertext[item]);
                trace.marker.color = self.geneExpression;
                trace.marker.colorbar = { title: self.selectedGene };
                if (self.showTwoPlots) {    
                    // It's possible that some traces are hidden from rightPlotDiv, in which case we want to match that here.
                    // For each sampleId, set marker size to zero if it belongs to the hidden legend.
                    // Note that there's a bug in plotly where size specified as an array in marker is rendered differently to
                    // when specified as a number, even for the same size.
                    var defaultSize = self.is3d? 11 : 6;
                    var visibleLegends = legends.filter(item => item.visible).map(item => item.value);
                    trace.marker.size = self.sampleIds.map((item,i) =>
                        visibleLegends.indexOf(self.sampleTable[self.selectedColourBy][self.sampleIds[i]])==-1? 0 : defaultSize
                    );
                    trace.marker.line = {width: 0}; // plotly also seems to add stroke after array is specified as size
                }
                trace.sampleIds = self.sampleIds;
                traces.push(trace);
            }
            return traces;
        },
        
        mainPlot() {
            let self = this;
            let div = document.getElementById(self.mainPlotDiv);
            Plotly.newPlot(div, this.traces(), this.layout(this.selectedPlotBy));
        
            // set up synchronisation with rightPlotDiv by listening for events on mainPlotDiv
            div.on('plotly_relayout',
                function(eventdata) { 
                    self.camera = eventdata["scene.camera"];    // update camera values with this
                    if (self.showTwoPlots)
                        Plotly.react(self.rightPlotDiv, self.traces(), self.layout());
            });

            // Set up double click event, where sampleInfo.shownData is populated with info about the sample double clicked.
            // Note that plotly doesn't really have double click event detection, so we're going to measure the interval between
            // two single clicks if it's on the sample id.
            div.on('plotly_click', function(data) { self.handlePlotlyClick(data); });
        },

        // Function to update the plot
        updatePlot(legend) {
            let self = this;
            self.loading = true;
            let div = document.getElementById(self.rightPlotDiv);

            if (legend && 'selectedSampleGroup' in legend)  // comes from PlotLegend component, changing colourBy
                this.selectedColourBy = legend.selectedSampleGroup;
            else if (legend && 'value' in legend) { // comes from PlotLegend compoenent, when a legend is clicked
                const index = this.allLegends[this.selectedColourBy].map(legend => legend.value).indexOf(legend.value);
                this.allLegends[this.selectedColourBy][index].visible = !legend.visible;
            }

            if (self.selectedPlotBy=="sample type") // always show one plot for sample type
                self.showTwoPlots = false;

            if (self.showTwoPlots) {
                if (div==null || div.layout==null) {    // no plot yet - we plot both and set up sync
                    self.mainPlot();
                    Plotly.newPlot(div, self.traces(), self.layout());
                    div.on('plotly_relayout',
                        function(eventdata){ 
                            self.camera = eventdata["scene.camera"];    // update camera values with this
                            if (self.showTwoPlots)
                                Plotly.react(self.mainPlotDiv, self.traces(self.selectedPlotBy), self.layout());
                    });
                    div.on('plotly_click', function(data) { self.handlePlotlyClick(data, "sample type") });
                } else  // there's already a plot in rightPlotDiv, so just update it
                    Plotly.react(div, self.traces(), self.layout());
                self.showColourByAsDraggable = true;
            } else {
                if (div!=null && div.layout!=null)   // showing only one plot but rightPlotDiv contains a plot, so purge it
                    Plotly.purge(div);
            }
            // always update mainPlotDiv
            Plotly.react(self.mainPlotDiv, self.traces(self.selectedPlotBy), self.layout(self.selectedPlotBy)).then(function() {
                self.loading = false;
            });
        },
        
        // ------------ Control related methods ---------------
        // Runs when plotBy changes between "sample type", "gene expression", "find dataset"
        changePlotBy() {
            if (this.selectedPlotBy=="sample type") // going back to sample type after showing expression
                this.updatePlot();
            else if (this.selectedPlotBy=="gene expression")   // going to gene expression after showing sample type - update only if previously an expression was shown
                if (this.selectedGene!="") this.updatePlot();
        },
                
        // ------------ sampleInfo methods ---------------
        // Should run when user clicks on a point in the plot. Since there's no double-click event detection in plotly
        // we measure the time interval between clicks to define double click.
        handlePlotlyClick(data, plotBy) {
            let self = this;
            if (plotBy==null) plotBy = self.selectedPlotBy;
            // Fetch sampleId of clicked point
            let sampleId = plotBy=="sample type"? self.traces()[data.points[0].curveNumber].sampleIds[data.points[0].pointNumber] : self.sampleIds[data.points[0].pointNumber];
            
            if (self.sampleInfo.sampleId==sampleId && performance.now() - self.sampleInfo.lastClickTime < 600) {   
                // same sample id clicked and its internval since last click is short enough to define as double-click

                // Useful to know if this is a projected sample or not
                let isProjectedSample = self.uploadData.projectedSampleIds.indexOf(sampleId)!=-1;

                // Update sampleInfo.shownData, which is used to render the content of sample info for the clicked point.
                if (isProjectedSample) {  // provide a simpler set of info
                    self.sampleInfo.shownData = [{key:'Projected Sample', value:sampleId},
                                                 {key:'dataset', value:self.uploadData.name}];
                } else {
                    // First populate the info coming from sampleTable (these are atlas specific sample annotations)
                    self.sampleInfo.shownData = [];
                    self.colourBy.forEach(item => {
                        self.sampleInfo.shownData.push({'key':item, 'value':self.sampleTable[item][sampleId]});
                    });
                    // Now populate the info coming from sample metadata
                    for (let key in self.sampleInfo.allData[sampleId])
                        if (self.sampleInfo.allData[sampleId][key]!="")
                            self.sampleInfo.shownData.push({'key':key, 'value':self.sampleInfo.allData[sampleId][key]});
                    // Last key is 'dataset', which will have dataset id as value. We can get datasetId from sampleId
                    // but have to get its display name from datasetInfo.allData.
                    let datasetId = sampleId.split("_")[0];
                    let matchingDataset = self.datasetInfo.allData.filter(item => parseInt(item.dataset_id)==parseInt(datasetId));
                    self.sampleInfo.shownData.push({'key':'dataset', 
                                                    'value':matchingDataset[0].display_name, 
                                                    'datasetId':datasetId});
                }

                self.sampleInfo.divX = self.sampleInfo.mouseX;
                self.sampleInfo.divY = self.sampleInfo.mouseY;
                self.sampleInfo.show = true;
            } else {   // set this as last sampleId clicked, and record time
                self.sampleInfo.sampleId = sampleId;
                self.sampleInfo.lastClickTime = performance.now();
                self.sampleInfo.shownData = [];
                self.sampleInfo.show = false;
            }
        },

        // In order to know where to show the sampleInfoDiv on double-click, we need to keep track
        // of mouse position and save this.
        updateMousePosition(event) {
            this.sampleInfo.mouseX = event.clientX;
            this.sampleInfo.mouseY = event.clientY;
        },

        // Return the position where the sample info div should appear - just a wrapper for sampleInfo.divX and divY
        sampleInfoDivPosition(axis) {            
            return axis=='x'? this.sampleInfo.divX + 20 + "px" : this.sampleInfo.divY + "px";
        },

        // ------------ datasetInfo methods ---------------
        // Should run when user hovers on the dataset in datasetInfo dialog, to highlight samples with matching dataset id
        highlightDatasets(datasetId) {
            if (!datasetId || datasetId=='') return;

            // Clear all existing highlights first
            this.clearHighlight();

            // Find samples with matching datasetId and hightlight these in the plot
            let sampleIds = this.datasetInfo.allData.filter(item => String(item.dataset_id)==String(datasetId))[0].sampleIds;
            
            // Each trace has sampleIds property, which holds sampleIds, so we can use this
            let traces = document.getElementById(this.mainPlotDiv).data; // we could also use self.traces()
            traces.forEach((trace,index) => {
                let update = {'marker': trace.marker};
                update['marker']['color'] = trace.marker.color.map((item,i) => 
                    sampleIds.indexOf(trace.sampleIds[i])==-1? item: 'black');
                Plotly.restyle(this.mainPlotDiv, update, [index]);
            })
        },

        // Clear the highlighted datasets
        clearHighlight() {
            this.traces().forEach((trace,index) => {
                Plotly.restyle(this.mainPlotDiv, {'marker': trace.marker}, [index]);
            })
        },

        // ------------ Gene expression related methods ---------------
        // Show autocomplete on gene expression by fetching all possible entries
        // If boxPlot is not null, apply to boxPlot variables
        getPossibleGenes(boxPlot) {
            let self = this;
            let gene = boxPlot==null? self.selectedGene : self.boxPlot.selectedGene;
            if (gene.length<=1) return;    // ignore 1 or less characters entered
            self.$axios.get('/api/atlases/' + self.atlasType + '/possible-genes?query_string=' + gene)
                .then(function (response) {
                    if (response.data.length>0)
                        if (boxPlot==null) 
                            self.possibleGenes = response.data;
                        else
                            self.boxPlot.possibleGenes = response.data;
                    console.log(self.boxPlot.possibleGenes);
            });
        },
        
        // Show gene expression - fetch values from server and save them, then run 
        // updatePlot only for PCA if boxPlot is null, otherwise run geneExpressionScatterPlot.
        showGeneExpression(geneSymbol, boxPlot) {
            let self = this;
            if (geneSymbol!=null) {
                if (boxPlot==null)
                    self.selectedGene = geneSymbol.replace('(','').replace(')','');
                else
                    self.boxPlot.selectedGene = geneSymbol.replace('(','').replace(')','');
            }
            let matchingGenes = boxPlot==null? self.possibleGenes.filter(item => item.symbol==self.selectedGene):
                self.boxPlot.possibleGenes.filter(item => item.symbol==self.boxPlot.selectedGene);
            if (matchingGenes.length>0) {
                let geneId = matchingGenes[0].ensembl;
                // use filtered=true for expression-values api if gene has been filtered in
                let filtered = matchingGenes[0].inclusion;
                self.loading = true;
                self.$axios.get('/api/atlases/' + self.atlasType + '/expression-values?orient=records&gene_id=' + geneId + '&filtered=' + filtered)
                    .then(function (response) {
                        if (response.data.length>0) {
                            // response.data would looke like [{column:value, ...}]
                            if (boxPlot==null) {
                                self.geneExpression = self.sampleIds.map(item => response.data[0][item]);
                                // Only run updatePlot if in the PCA Plot tab
                                if (self.selectedPlotBy != "gene expression")
                                    self.updatePlot();
                            } else {
                                self.boxPlot.geneExpression = self.sampleIds.map(item => response.data[0][item]);
                                self.geneExpressionScatterPlot();
                            }

                        } else {
                            alert("Could not find expression values for this gene");
                        }
                        self.loading = false;
                });
            } else
                alert("No expression values exist in this atlas for the specified gene");
        },

        // Plot gene expression scatter plot
        geneExpressionScatterPlot() {
            let self = this;
            let selectedSampleGroup = self.boxPlot.selectedSampleGroup;
            let traces = [];
            let sampleIds = self.sampleIdsFromSampleGroup(selectedSampleGroup);
            let orderedSampleGroupItems = self.sampleTypeOrdering[selectedSampleGroup].filter(item => item!="");
            let names = [];

            // Plot first empty/opaque data point for purposes of plot background
            let trace = {
                name: ' ',
                y: [0],
                type: 'box',
                opacity: 0,
                hoverinfo: 'skip',
            }
            traces.push(trace);
            // Empty name for padding purposes
            names.push(' ');

            orderedSampleGroupItems.forEach(sampleGroupItem => {
                let trace = {
                        type: self.boxPlot.selectedPlotType,
                        y: self.boxPlot.geneExpression.filter(function(item,i) { return sampleIds[sampleGroupItem].indexOf(self.sampleIds[i])!=-1}),
                        box: { visible: true },
                        line: { width: 1, color: 'black' },
                        meanline: { visible: true },
                        name: sampleGroupItem,
                        x0: sampleGroupItem,
                        showlegend: false,
                        hoverinfo: "y",
                        points: self.boxPlot.showPoints? 'all': false, // works for violin
                        boxpoints: self.boxPlot.showPoints? 'all': false,  // works for boxplot
                    };

                if (selectedSampleGroup in self.sampleTypeColours && 
                        sampleGroupItem in self.sampleTypeColours[selectedSampleGroup]) {
                    trace['marker'] = {'color': self.sampleTypeColours[selectedSampleGroup][sampleGroupItem]};
                    trace['fillcolor'] = self.sampleTypeColours[selectedSampleGroup][sampleGroupItem];
                }

                traces.push(trace);
                names.push(sampleGroupItem);
            });

            // Plot the last empty/opaque data point for purposes of plot background
            trace = {
                name: '  ',
                y: [0],
                type: 'box',
                opacity: 0,
                hoverinfo: 'skip',
            }
            traces.push(trace);
            // Empty name for padding purposes
            names.push('  ');

            // Set plot layout and draw grey rectangle for plot background
            let layout = {  title: "",  margin: {t:10, l:20, r:0, b:0},
                            xaxis: {
                                automargin: true,
                                // tickmode: 'array',
                                // tickvals: [...Array(names.length).keys()],
                                // ticktext: names,
                                // range: [0, names.length],
                            },
                            // Grey background
                            // shapes: [{
                            //     type: 'rect',
                            //     xref: 'x',
                            //     yref: 'y',
                            //     x0: ' ',
                            //     x1: '  ',
                            //     y0: 0.2, // placeholder
                            //     y1: 0.8, // placeholder
                            //     fillcolor: '#d3d3d3',
                            //     opacity: 0.2,
                            //     layer: 'below',
                            //     line: {
                            //         width: 0
                            //     }
                            // }],
                    };
            Plotly.newPlot("boxPlotDiv", traces, layout);
        },

        downloadGeneExpressionScatterPlot() {
            Plotly.downloadImage(document.getElementById("boxPlotDiv"), {
                format: 'jpeg', height: 900, width: 2000,
                filename: 'Stemformatics_' + this.atlasType + '_atlas_' + this.boxPlot.selectedGene
            });
        },

        // ------------ Download data methods ---------------
        downloadPlot() {
            Plotly.downloadImage(document.getElementById(this.mainPlotDiv), {
                format: this.downloadData.selectedImageType,
                height: parseInt(this.downloadData.height),
                width: parseInt(this.downloadData.width),
                filename: 'Stemformatics_' + this.atlasType + '_atlas'
            });
        },

        downloadCapybara() {
            Plotly.downloadImage(document.getElementById('capybaraPlotDiv'), {
                format: "jpeg",
                height: parseInt(800),
                width: parseInt(1200),
                filename: 'Stemformatics_' + this.atlasType + '_atlas_projection_capybara'
            });
        },

        // ------------ Data projection methods ---------------
        projectData(projectionData) {
            // Map a particular sample field from test data to all of the sample fields in the atlas.
            // projectionData needs to have following objects (examples)
            // name: "notta"
            // samples: [{"Sample Type":"CMP_71+_BAH+","Parental cell type":"CMP"}, ...]
            // coords: [{'x':8.03,'y':0,'z':1.2}, ...]
            // combinedCoords: {'index':[], 'columns':[], 'data':[]}
            // sampleIds: ['notta_GSM1977399',...]
            // column: 'Sample Type'
            let column = projectionData.column;

            // This is a list of projected items that will be displayed in the legend. ["Ang_iPSC","Ang_HSC","Ang_iPSC",...]
            // Note that this list is same length as projected sample ids. Also these don't change when colour by changes.
            let sampleTypes = projectionData.samples.map(item => projectionData.name + "_" + item[column]);

            // Create some dataset attributes needed
            var datasetAttributes = {"dataset_id":'0000', "display_name":"[Projected Data]", "sampleIds":projectionData.sampleIds};
            
            // Now add projected points to all relevant data variables. Note that we should be able to
            // remove these points later - for now, reload page.
            this.uploadData.name = projectionData.name;
            for (let item in this.coords) { // update coordinates to include projected coordinates
                for (let i=0; i<projectionData.coords.length; i++)
                    this.coords[item][projectionData.sampleIds[i]] = projectionData.coords[i][item];
            }
            this.colourBy.forEach(item => {   // add a breakpoint in sampleTypeOrdering
                if (item in this.sampleTypeOrdering)
                    this.sampleTypeOrdering[item].push("");
            });

            // update sampleInfo.allData, sampleTable, sampleTypeColours and sampleTypeOrdering
            for (let i=0; i<sampleTypes.length; i++) {
                let sampleId = projectionData.sampleIds[i];
                this.sampleInfo.allData[sampleId] = {};
                this.uploadData.projectedSampleIds.push(sampleId);
                for (let item in this.sampleTable) {
                    this.sampleTable[item][sampleId] = sampleTypes[i];
                    this.sampleTypeColours[item][sampleTypes[i]] = "black";
                    if (this.sampleTypeOrdering[item].indexOf(sampleTypes[i])==-1)
                        this.sampleTypeOrdering[item].push(sampleTypes[i]);
                    this.sampleInfo.allData[sampleId][item] = sampleTypes[i];
                }
            }
            projectionData.sampleIds.forEach(item => {
                this.sampleIds.push(item);
            })
            
            this.datasetInfo.allData.push(datasetAttributes);
            this.updateLegends();
            this.updatePlot();

            this.projection_data = projectionData;
            this.projection_sampleGroups = Object.keys(projectionData.samples[0]);
            this.projection_sampleGroups.sort();
            this.projection_selectedSampleGroup = column;
        },

        testProjectData(projectionData) {
            console.log("Starting test project data.");
            // console.log(this.sampleTable);
            // console.log(this.sampleTypeColours)
            // console.log(projectionData);

            let column = projectionData.column;
            let sampleTypes = projectionData.samples.map(item => projectionData.name + "_" + item[column]);
            var datasetAttributes = {"dataset_id":'0000', "display_name":"[Projected Data]", "sampleIds":projectionData.sampleIds};
            this.uploadData.name = projectionData.name;

            for (let item in this.coords) { // update coordinates to include projected coordinates
                for (let i=0; i<projectionData.coords.length; i++)
                    this.coords[item][projectionData.sampleIds[i]] = projectionData.coords[i][item];
            }
            this.colourBy.forEach(item => {   // add a breakpoint in sampleTypeOrdering
                if (item in this.sampleTypeOrdering)
                    this.sampleTypeOrdering[item].push("");
            });

            // update sampleInfo.allData, sampleTable, sampleTypeColours and sampleTypeOrdering

            // console.log(sampleTypes.length)
            // this.sampleTable = {};
            // console.log("Find sample table array.");
            // console.log(typeof this.sampleTable);
            // console.log(this.sampleTable['Cell Type']['notta_GSM1977399']);
            for (let i=0; i<sampleTypes.length; i++) {
                // console.log(sampleTypes[i]);
                // console.log(projectionData.sampleIds[i]);
                let sampleId = projectionData.sampleIds[i];
                this.sampleInfo.allData[sampleId] = {};
                this.uploadData.projectedSampleIds.push(sampleId);
                for (let item in this.sampleTable) {
                    // console.log("Sample Types...");
                    // console.log(sampleTypes[i]);
                    // console.log(sampleId);
                    // console.log(item);
                    // console.log(this.sampleTable);
                    this.sampleTable[item][sampleId] = sampleTypes[i];
                    // console.log(this.sampleTypeColours);
                    this.sampleTypeColours[item][sampleTypes[i]] = "black";
                    if (this.sampleTypeOrdering[item].indexOf(sampleTypes[i])==-1)
                        this.sampleTypeOrdering[item].push(sampleTypes[i]);
                    this.sampleInfo.allData[sampleId][item] = sampleTypes[i];
                }
            }
            projectionData.sampleIds.forEach(item => {
                this.sampleIds.push(item);
            })

            this.datasetInfo.allData.push(datasetAttributes);
            this.updateLegends();
            this.updatePlot();

            this.projection_data = projectionData;
            this.projection_sampleGroups = Object.keys(projectionData.samples[0]);
            this.projection_sampleGroups.sort();
            this.projection_selectedSampleGroup = column;

        },

        plotCapybara() {
            if (!this.projection_data.capybara) {
                this.$bvModal.msgBoxOk("Use this function after projection to show quantitative scores.");
                return;
            }
            // this.projectionState = true;
            // Expanding 'Show projection score' button - plot capybara
            if(this.projectionState) {
                this.projection_showScore = true;
                let div = document.getElementById('capybaraPlotDiv');
                const capybara = this.projection_data.capybara[this.projection_selectedAtlasSampleGroup];

                // y depends on projection_selectedSampleGroup
                let y = this.projection_data.samples.map(item => item[this.projection_selectedSampleGroup]);

                // Round data
                let data = [];
                capybara.data.forEach(row => {
                    data.push(row.map(item => Math.round(100*item)/100));
                })
                let traces = [{type:'heatmap', z:data, y:y, x:capybara.columns}];
                let layout = {xaxis:{side:"top", automargin:true}, yaxis:{automargin:true}};
                Plotly.newPlot(div, traces, layout);
            }
            // Collapsing button - back to PCA plot
            else {
                this.selectedPlotBy = 'sample type';
                this.updatePlot();
            }
        },

        // ------------ Custom sample group methods ---------------
        // Apply custom sample group defined. data looks like [{sampleGroup:'B Cell_in vitro', sampleIds:['s1',...]}, ...]
        applyCustomSampleGroup(inputData) {
            let self = this;
            const data = inputData.filter(item => item.sampleIds.length>0);
            if (data.length==0) {
                return;
            }
            // Update various data
            var groupName = self.customSampleGroup.groupName;
            if (self.colourBy.indexOf(groupName)==-1)
                self.colourBy.push(groupName);
            self.sampleTable[groupName] = {};
            self.sampleTypeOrdering[groupName] = [];
            for (var i=0; i<data.length; i++) {
                self.sampleTypeOrdering[groupName].push(data[i].sampleGroup);
                for (var j=0; j<data[i].sampleIds.length; j++)
                    self.sampleTable[groupName][data[i].sampleIds[j]] = data[i].sampleGroup;
            }

            // Show sample type plot and custom sample group defined 
            // - otherwise it's not obvious to the user that the changes have been saved
            delete self.sampleTypeColours[groupName]
            self.updateSampleTypeColours();
            self.selectedColourBy = self.customSampleGroup.groupName;
            self.selectedPlotBy = "sample type";
            self.updateLegends();
            self.updatePlot();
        },
        
        // ------------ Show version info ---------------
        showVersionInfo() {
            this.versionInfo.show = true;
            this.$axios.get("/api/atlas-types").then(res => {
                this.versionInfo.availableVersions = res.data[this.atlasType].versions;
                this.versionInfo.currentVersion = res.data[this.atlasType].current_version;
                this.versionInfo.releaseNotes = res.data[this.atlasType].release_notes;
            });
        },

        // Change button colour on collapse
        changeCollapseColour() {
            if(this.backgroundColour == '#2780E3') {
                this.backgroundColour = 'white';
                this.textColour = '#2780E3;'
            }
            else {
                this.backgroundColour = '#2780E3';
                this.textColour = 'white'
            }
        },

        // Upload single-cell data projection
        uploadSingleCell() {
            // Return if any of the data fields are empty
            if(this.singleCellData.email == "" || this.singleCellData.data == null) {
                return;
            }

            // Check file type - checking for .csv or .tsv at the moment.
            if(this.singleCellData.data.name.split('.').pop() != "tsv" && this.singleCellData.data.name.split('.').pop() != "csv") {
                alert("Wrong data type. Single-cell data file must be .tsv or .csv.");
                this.singleCellData.data = null;
                return;
            }

            // Check file size - if it is greater than 1 GB, then reset data file and return
            let GB = 1;
            if(this.singleCellData.data.size > GB * Math.pow(1024, 3)) {
                alert("Data file is too big. Ensure file size is less than 1 GB.");
                this.singleCellData.data = null;
                return;
            }

            let formData = new FormData();
            this.selectedDataSource = "User-Single";

            formData.append("data_source", this.selectedDataSource);
            formData.append("email", this.singleCellData.email);
            formData.append("data", this.singleCellData.data);  

            this.showLoading = true;
            this.interval = setInterval(() => { this.loadingTime += 1; }, 1000);
            this.$axios.post('/api/atlas-projection/' + this.atlasType + '/' + this.selectedDataSource, 
                formData, { headers: {'Content-Type': 'multipart/form-data'},}).then(response => {
                    this.showLoading = false;
                    clearInterval(this.interval);
                    this.loadingTime = 0;
                }).catch(error => {
                    alert(error.response.data.message); 
                })
        },

        // Disable projection upload button for 15s after each upload
        disableUploadButton() {
            const button = document.querySelector(".upload-button");
            button.disabled = true;

            // Set a timeout of 15s
            setTimeout(()=>{
                button.disabled = false;
            }, 15000);
        },

        // Check validity of email format using Regex
        emailState() {
            const emailRegexp = new RegExp(/^[a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1}([a-zA-Z0-9][\-_\.\+\!\#\$\%\&\'\*\/\=\?\^\`\{\|]{0,1})*[a-zA-Z0-9]@[a-zA-Z0-9][-\.]{0,1}([a-zA-Z][-\.]{0,1})*[a-zA-Z0-9]\.[a-zA-Z0-9]{1,}([\.\-]{0,1}[a-zA-Z]){0,}[a-zA-Z0-9]{0,}$/i);
            const button = document.querySelector(".upload-button");

            if(emailRegexp.test(this.singleCellData.email)) {
                button.disabled = false;
            }
            else {
                button.disabled = true;
            }

            return emailRegexp.test(this.singleCellData.email);
        },

    },



    mounted() {
        this.apiUrl = process.env.BASE_API_URL;
        this.loading = true;

        // Fetch sample table
        this.$axios.get("/api/atlases/" + this.atlasType + "/samples?orient=dict").then(res => {
            this.sampleTable = res.data;    // {col: {row:val}}
            this.colourBy = Object.keys(this.sampleTable);   // ["Cell Type", "Sample Source", ...]
            this.selectedColourBy = this.colourBy[0];
            this.projection_selectedAtlasSampleGroup = this.selectedColourBy;

            // Fetch colours and ordering
            this.$axios.get("/api/atlases/" + this.atlasType + "/colours-and-ordering").then(res2 => {
                this.sampleTypeColoursOriginal = res2.data.colours;
                this.sampleTypeColours = res2.data.colours;
                this.sampleTypeOrdering = res2.data.ordering;
                this.updateSampleTypeColours();
                this.updateSampleTypeOrdering();

                // set itemsWithMargins
                this.colourBy.forEach(key => {
                    this.itemsWithMargins[key] = [];
                    if (key in this.sampleTypeOrdering) {
                        for (let j=1; j<this.sampleTypeOrdering[key].length; j++) {
                            if (this.sampleTypeOrdering[key][j-1]=="")
                                this.itemsWithMargins[key].push(this.sampleTypeOrdering[key][j]);
                        }
                    }
                });

                // Fetch coordinates
                this.$axios.get("/api/atlases/" + this.atlasType + "/coordinates?orient=dict").then(res3 => {
                    this.coords = res3.data;
                    this.sampleIds = Object.keys(this.coords[Object.keys(this.coords)[0]]);

                    // Construct sampleInfo.allData - can't construct just from sampleTable, since we want to include
                    // other sample metadata fields, not available from atlas sample table. Only fetching facs_profile for now.
                    // The fetched data here look like: {"6638_GSM868879":{"facs_profile":"CD16- CD123+",...},...}
                    let datasetIds = this.sampleIds.map(item => item.split("_")[0]);
                    datasetIds = Array.from(new Set(datasetIds));   // unique values only
                    this.$axios.get("/api/search/samples?orient=index&field=facs_profile&limit=1200&dataset_id=" + datasetIds.join(",")).then(res4 => {
                        this.sampleInfo.allData = res4.data;
                        Object.keys(this.sampleInfo.allData).forEach(sampleId => { this.sampleInfo.allData[sampleId]["sample_id"] = sampleId});
                    });

                    // Construct datasetInfo.allData by fetching from api
                    this.$axios.get("/api/search/datasets?projects=" + this.atlasType + "_atlas").then(res5 => {
                        // We only need some keys (trick from https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties)
                        this.datasetInfo.allData = res5.data.map(item => 
                            (({ dataset_id, display_name, name}) => ({ dataset_id, display_name, name }))(item)
                        );
                        
                        // Might as well sort on display name
                        this.datasetInfo.allData.sort((a,b) => a.display_name < b.display_name? -1 : 1);
                        
                        // Add sampleIds used for each dataset
                        this.datasetInfo.allData.forEach(item => {
                            item.sampleIds = this.sampleIds.filter(sampleId => sampleId.split("_")[0]==String(item.dataset_id))
                        });
                    });

                    this.loading = false;
                    this.updateLegends();
                    this.mainPlot();
                });
            });
        });

        // Set datasetId if coming from query
        if (this.$route.query.id!=null) {
            this.userID = this.$route.query.id;
            let unique = this.userID;

            // Calling the get function from resources/atlases.AtlasProjectionResults
            this.$axios.get('/api/atlas-projection-results', {params: {id: unique}}).then(res6 => {
                let newProjectionData = res6?.data;
                this.testProjectData(newProjectionData);
                // this.projectData(res6.data);
            });

        };

        // Page tour setup
        this.$nextTick(() => {
            // Set up tour variables
            // PCA 1
            this.tourPCA1 = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // PCA 2
            this.tourPCA2 = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // PCA 3
            this.tourPCA3 = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // Box
            this.tourBox = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // Projection
            this.tourProjection = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // Tools PCA
            this.tourTools = this.$shepherd({
                useModalOverlay: true,
                canClickTarget: false,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true,
                    }
                },
            });

            // Add steps to all tour variables
            // PCA tab tour steps
            this.tourPCA1.addSteps([
            {
            title: 'Choose your plot type',
            canClickTarget: false,
            attachTo: {
                element: this.$el.querySelector('.plot-by'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.cancel();
                },
                secondary: true,
                text: 'Exit',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Here you can choose to plot by sample type, gene expression, or find a specific dataset.',
            },
            {
            title: '2D/3D',
            attachTo: {
                element: this.$el.querySelector('.d-switch'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.back();
                },
                secondary: true,
                text: 'Back',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Toggle between a 2D or 3D perspective.',
            },
            {
            title: 'Plot colouring',
            attachTo: {
                element: this.$el.querySelector('.colour-by'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.back();
                },
                secondary: true,
                text: 'Back',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Finish',
                },
            ],
            text: 'Choose what the colours of the PCA plot points represent.',
            },

            ]);

            // PCA tab tour steps
            this.tourPCA2.addSteps([
            {
            title: 'Choose your plot type',
            canClickTarget: false,
            attachTo: {
                element: this.$el.querySelector('.plot-by'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.cancel();
                },
                secondary: true,
                text: 'Exit',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Here you can choose to plot by sample or by gene expression.',
            },
            {
            title: '2D/3D',
            attachTo: {
                element: this.$el.querySelector('.d-switch'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.back();
                },
                secondary: true,
                text: 'Back',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Toggle between a 2D or 3D perspective.',
            },
            {
                title: 'Select Gene',
                attachTo: {
                    element: this.$el.querySelector('.pca-gene-select'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Choose a gene from the sugestions to view it\'s expression. Click the suggestion or hit \'Enter\' to select. The genes with the brackets were filtered out before creating this PCA.',

                // Only show this step if there is an element of this class name
                // showOn: function() {
                //     return document.querySelector('.pca-gene-select') ? true: false;
                // }
            },
            {
                title: 'Plot',
                attachTo: {
                    element: this.$el.querySelector('.pca-go'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Finish',
                    },
                ],
                text: 'Click this button to render the plot by gene expression below.',
            },
            // {
            // title: 'Show or hide sample colour plot',
            // attachTo: {
            //     element: this.$el.querySelector('.sample-button'),
            //     on: 'bottom',
            // },
            // buttons: [
            //     {
            //     action: function () {
            //         return this.back();
            //     },
            //     secondary: true,
            //     text: 'Back',
            //     },
            //     {
            //     action: function () {
            //         return this.next();
            //     },
            //     text: 'Next',
            //     },
            // ],
            // text: 'Show or hide the sample colour plot after plotting by gene expression.',
            // },
            ]);

            // PCA tab tour steps
            this.tourPCA3.addSteps([
            {
            title: 'Choose your plot type',
            canClickTarget: false,
            attachTo: {
                element: this.$el.querySelector('.plot-by'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.cancel();
                },
                secondary: true,
                text: 'Exit',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Here you can choose to plot by sample type, gene expression, or find a specific dataset.',
            },
            {
            title: '2D/3D',
            attachTo: {
                element: this.$el.querySelector('.d-switch'),
                on: 'bottom',
            },
            buttons: [
                {
                action: function () {
                    return this.back();
                },
                secondary: true,
                text: 'Back',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Next',
                },
            ],
            text: 'Toggle between a 2D or 3D perspective.',
            },
            {
            title: 'Find individual datasets',
            attachTo: {
                element: this.$el.querySelector('.find-datasets'),
                on: 'top',
            },
            buttons: [
                {
                action: function () {
                    return this.back();
                },
                secondary: true,
                text: 'Back',
                },
                {
                action: function () {
                    return this.next();
                },
                text: 'Finish',
                },
            ],
            text: 'Highlight individual datasets that were used in the construction of this atlas.',
            },
            ]);

            // Box Plot tab tour steps
            this.tourBox.addSteps([
            {
                title: 'Select a gene',
                canClickTarget: false,
                attachTo: {
                    element: this.$el.querySelector('.choose-gene'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.cancel();
                    },
                    secondary: true,
                    text: 'Exit',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Choose a gene from the sugestions to view it\'s box/violin plot. Click the suggestion or hit enter to select.',
                },
                {
                title: 'Plot',
                attachTo: {
                    element: this.$el.querySelector('.plot-gene-button'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Click this button after you have selected a gene to render the plot below.',
                },
                {
                title: 'Grouping',
                attachTo: {
                    element: this.$el.querySelector('.group-by'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Choose what category to group the gene by.',
                },
                {
                title: 'Plot type',
                attachTo: {
                    element: this.$el.querySelector('.plot-type'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Choose either a box or violin plot.',
                },
                {
                title: 'Show all data points',
                attachTo: {
                    element: this.$el.querySelector('.show-points'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Click this checkbox to display all data points next to the box/violin plot.',
                },
                {
                title: 'Download',
                attachTo: {
                    element: this.$el.querySelector('.box-download'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.hide();
                    },
                    text: 'Finish',
                    },
                ],
                text: 'Download the plot as a jpeg file.',
                },

            ]);

            // Projection Plot tab tour steps
            this.tourProjection.addSteps([
            {
                title: 'Project Stemformatics data',
                canClickTarget: false,
                attachTo: {
                    element: this.$el.querySelector('.project-stem'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.cancel();
                    },
                    secondary: true,
                    text: 'Exit',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Project samples from another Stemformatics dataset onto the current atlas.',
                },
                {
                title: 'Project bulk data',
                canClickTarget: false,
                attachTo: {
                    element: this.$el.querySelector('.project-bulk'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Project samples from your own bulk data onto the current atlas.',
                },
                {
                title: 'Project single-cell data',
                attachTo: {
                    element: this.$el.querySelector('.project-single'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Project your own single-cell data onto the current atlas.',
                },
                {
                title: 'Capybara score',
                attachTo: {
                    element: this.$el.querySelector('.capybara'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Finish',
                    },
                ],
                text: 'Show projection score as a heatmap using Capybara.',
                },
                // Only show this step if there is an element of this class name
                // showOn: function() {
                //     return document.querySelector('.project-email-input') ? true: false;
                // },
            ]);

            // Tools (tab tour steps)
            this.tourTools.addSteps([
                {
                title: 'Download data',
                canClickTarget: false,
                attachTo: {
                    element: this.$el.querySelector('.download-data'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.cancel();
                    },
                    secondary: true,
                    text: 'Exit',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Download the data used for the current atlas.',
                },
                {
                title: 'Download plot',
                canClickTarget: false,
                attachTo: {
                    element: this.$el.querySelector('.download-plots'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.next();
                    },
                    text: 'Next',
                    },
                ],
                text: 'Download high resolution images of the plots here.',
                },
                {
                title: 'Combine sample groups',
                attachTo: {
                    element: this.$el.querySelector('.combine-samples'),
                    on: 'bottom',
                },
                buttons: [
                    {
                    action: function () {
                        return this.back();
                    },
                    secondary: true,
                    text: 'Back',
                    },
                    {
                    action: function () {
                        return this.hide();
                    },
                    text: 'Finish',
                    },
                ],
                text: 'Define a custom sample group by combining two existing groups.',
                },
            ]);
        
        });


    }
    
}
</script>

<style>
.js-plotly-plot .plotly .modebar {
    left: 40%;
    transform: translateX(-40%);
}
.btn-dark:hover, .open>.dropdown-toggle.btn-dark {
  background-color: #EE255F;
}
div.sampleInfo {
    position: absolute;
    background:#f0f0f0; 
    font-size: 14px;
    opacity: 0.9;
    max-width: 300px;
}
div.sampleInfo li {
    margin-top: 5px;
}
.js-plotly-plot .plotly .user-select-none {
    margin: auto;
}

#stylized h4 {
    float: center;
    text-align: center;
}

p {
    font-size: 13px;
}

.project-single:active {
    background-color: #2780E3 !important;
    color: white !important;
}

.question-button {
  display: inline-block;
  border-radius: 8px;
  background-color: #EE255F;
  border: none;
  color: #FFFFFF;
  text-align: center;
  font-size: 12px;
  padding: 6px;
  width: 60px;
  height: 37px;
  transition: all 0.5s;
  cursor: pointer;
  margin: 5px;
}

.question-button span {
cursor: pointer;
display: inline-block;
position: relative;
transition: 0.5s;
}

.question-button span:after {
  content: '\00bb';
  position: absolute;
  opacity: 0;
  top: 0;
  right: -20px;
  transition: 0.5s;
}

.question-button:hover span {
  padding-right: 15px;

}

.question-button:hover span:after {
  opacity: 1;
  right: 0;
}

.nav-pills.tab-tools.nav-link {
    color: black;
}

.tab-title-class {
    color: red;
}

.tab-title-class:active-class {
    color: red;
}

/* Helps to stop collapsible content flashing on tab change */
.collapsing {
    -webkit-transition: none;
    transition: none;
    display: none;
}


</style>
