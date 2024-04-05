<template>
<div>
    <!-- Page title -->
    <div class="text-center mt-1">
        <h3 class="mb-2">Integrated Atlas: <b-link @click="showVersionInfo" 
            v-b-tooltip.hover title="Click to show atlas version">{{displayName}}</b-link>
            <small>
                <b-link v-b-tooltip.hover.right title="Background and more information" v-b-toggle.sidebar class="ml-2">
                    <b-icon-info-circle></b-icon-info-circle>
                </b-link>
                <b-spinner label="Loading..." variant="secondary" :style="{visibility: showLoading ? 'visible' : 'hidden'}" 
                    class="ml-1" style="width:1.5rem; height:1.5rem;"></b-spinner>
            </small>
        </h3>
    </div>

    <!-- Put the whole tab inside card. Each tab has a single row with 2 columns -->
    <b-card no-body class="mb-2">
    <b-tabs card pills v-model="selectedTabIndex" align="center">
        <!-- Sample groups tab -->
        <b-tab title="Sample groups" active>
        <b-row class="small justify-content-center">
            <b-col md="3">
                <!-- Top level controls for this tab - selects what to show in the tab. -->
                <b-form-select v-model="sampleGroupsTab.selectedView" size="sm" class="m-1">
                    <b-form-select-option value="PCA by sample group">PCA by sample group</b-form-select-option>
                    <b-form-select-option value="Find dataset">Find dataset</b-form-select-option>
                    <b-form-select-option value="Customise sample groups">Customise sample groups</b-form-select-option>
                </b-form-select>
                <!-- Plot legend - we do our own legend div instead of using plotly's -->
                <PlotLegend v-show="sampleGroupsTab.selectedView=='PCA by sample group'"
                    :legends="allLegends" :initial-sample-group="selectedColourBy" :items-with-margins="itemsWithMargins" 
                    @legend-clicked="updatePlot" @sample-group-changed="updatePlot">
                </PlotLegend>

                <!-- Find dataset area -->
                <div v-if="sampleGroupsTab.selectedView=='Find dataset'" class="find-datasets p-2">
                    <p>All the datasets which were used for the construction of this atlas are shown below. 
                    You can show these on the PCA or view details of the dataset.</p>
                    <div style="max-height:500px; overflow:auto">
                        <p v-for="item in datasetInfo.allData" :key="item.dataset_id" class="my-0 py-0">
                            <b-link :to="'/datasets/view?id=' + item.dataset_id" target="_blank" 
                                v-b-tooltip.hover title="Click to show details on this dataset (new window)">
                                {{item.display_name}}
                            </b-link>
                            ({{item.sampleIds.length}})
                            <b-link v-show="datasetInfo.selectedDatasetId!=item.dataset_id" @click="highlightDatasets(item.dataset_id)"
                                v-b-tooltip.hover title="Click to show corresponding samples in the plot">
                                <b-icon-caret-right-fill></b-icon-caret-right-fill>
                            </b-link>
                            <b-link v-show="datasetInfo.selectedDatasetId==item.dataset_id" @click="clearHighlight()"
                                v-b-tooltip.hover title="Click to hide corresponding samples in the plot">
                                <b-icon-caret-right></b-icon-caret-right>
                            </b-link>
                        </p>
                    </div>
                </div>

            <div v-if="sampleGroupsTab.selectedView=='Customise sample groups'" class="p-2">
                <p>You can define a custom sample group here by combining two existing sample groups together.</p>
                <p>Start selecting items from each sample group, and the third column will automatically show the combinations.
                Items where the combination yields no samples in it will be ignored later.</p>
                <p>Note that currently only one custom sample group is available.</p>
            </div>
            </b-col>

            <!-- divs for the plots or customise sample groups -->
            <b-col class="overflow-auto" @mousemove="updateMousePosition"> 
                <b-card v-show="sampleGroupsTab.selectedView!='Customise sample groups'" border-variant="light">
                    <h5 class="text-center">PCA by sample group
                        <small class="align-middle ml-2">
                        <b-link v-b-hover="handleHover_image1" v-b-tooltip.hover title="Toggle between 2d/3d" @click="sampleGroupsTab.is3d=!sampleGroupsTab.is3d; updatePlot();">
                            <b-img v-if="imageHoverState.image1" src="/img/Icon_3d_red.svg" width="25" alt="3d icon hover"></b-img>
                            <b-img v-if="!imageHoverState.image1 && !sampleGroupsTab.is3d" src="/img/Icon_3d_grey.svg" width="25" alt="3d icon not selected"></b-img>
                            <b-img v-if="!imageHoverState.image1 && sampleGroupsTab.is3d" src="/img/Icon_3d_blue.svg" width="25" alt="3d icon selected"></b-img>
                        </b-link>
                        <b-link v-b-hover="handleHover_image2" v-b-tooltip.hover title="Download plot" @click="downloadPlot(mainPlotDiv, 'PCA')">
                            <b-img v-if="imageHoverState.image2" src="/img/Icon_download_red.svg" width="25" alt="download icon hover"></b-img>
                            <b-img v-else src="/img/Icon_download_blue.svg" width="25" alt="download icon selected"></b-img>
                        </b-link>
                        </small>
                    </h5>
                    <div id="mainPlotDiv" v-show="sampleGroupsTab.selectedView!='Customise sample groups'"></div>
                </b-card>
                <b-card v-show="sampleGroupsTab.selectedView=='Customise sample groups'" border-variant="light">
                    <h5 class="text-center">Customise sample groups</h5>
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

        <!-- Gene expression Tab -->
        <b-tab title="Gene expression">
        <b-row class="small justify-content-center">
            <b-col md="3">
                <!-- @submit.prevent stops the page refreshing when hitting the 'enter' key in the gene selection drop down box -->
                Gene:
                <b-form @submit.prevent>
                <b-button-group inline class="mb-4">
                    <b-form-input size="sm" v-model="geneExpressionTab.selectedGene" list="possible-genes-datalist" 
                        @keyup="getPossibleGenes()" @keyup.enter="showGeneExpression(geneExpressionTab.selectedGene)" 
                        @change="showGeneExpression(geneExpressionTab.selectedGene)"
                        placeholder="[gene symbol]" v-b-tooltip.hover.right :title="tooltip.selectedGene"></b-form-input>
                    <b-form-datalist id="possible-genes-datalist">
                        <option v-for="gene in geneExpressionTab.possibleGenes" :key="gene.ensembl">
                            {{gene.inclusion? '' : '('}}{{gene.symbol}}{{gene.inclusion? '' : ')'}}</option>
                    </b-form-datalist>    
                    <b-button @click="geneExpressionPlot" size="sm" class="rounded">Go</b-button>
                </b-button-group>
                </b-form>
                Plot type:
                <b-form-select size="sm" v-model="geneExpressionTab.selectedPlotType" :options="geneExpressionTab.plotTypes" 
                    @change="geneExpressionPlot" class="mb-2"></b-form-select>
                <div v-show="geneExpressionTab.selectedPlotType!='pca'">
                    Group by:
                    <b-form-select size="sm" v-model="geneExpressionTab.selectedSampleGroup" :options="colourBy" 
                        @change="geneExpressionPlot" class="mb-2"></b-form-select>
                    <b-form-checkbox  size="sm" v-model="geneExpressionTab.showPoints" @change="geneExpressionPlot" class="my-2">
                        Show points</b-form-checkbox>
                </div>
            </b-col>
            <b-col class="overflow-auto text-center">
                <h5>{{geneExpressionTab.selectedGene==""? 'Gene expression' : geneExpressionTab.selectedGene}}
                    <small class="align-middle ml-2">
                    <b-link v-b-hover="handleHover_image1" v-b-tooltip.hover title="Download plot" @click="downloadPlot('boxPlotDiv', geneExpressionTab.selectedGene)">
                        <b-img v-if="imageHoverState.image1" src="/img/Icon_download_red.svg" width="25"></b-img>
                        <b-img v-else src="/img/Icon_download_blue.svg" width="25"></b-img>
                    </b-link>
                    </small>
                </h5>
                <p v-if="geneExpressionTab.selectedGene==''">
                    Select a gene to show its expression profile in the atlas
                </p>
                <div id="boxPlotDiv"></div>
            </b-col>
        </b-row>
        </b-tab>

        <!-- Geneset Tab -->
        <b-tab title="Gene sets">
            <Genesets :atlas-type="atlasType" @show-gene-expression="showGeneExpressionFromGeneset"></Genesets>
        </b-tab>

        <!-- Projection Tab -->
        <b-tab title="Projection">
        <b-row class="small">
            <b-col md="3">
                <p>Benchmark another dataset using the atlas as a reference 
                    (<b-link to="/AtlasVignette/Stemformatics_atlas_projection_vignette.html" target="_blank">vignette</b-link>).
                </p>
                <b-list-group>
                    <b-list-group-item button :class="{selectedListGroupItem: projection_selectedView=='stemformatics'}"
                        @click="projection_selectedView='stemformatics'">Project Stemformatics data</b-list-group-item>
                    <b-list-group-item button :class="{selectedListGroupItem: projection_selectedView=='bulk'}"
                        @click="projection_selectedView='bulk'">Project Other data</b-list-group-item>
                    <b-list-group-item button :class="{selectedListGroupItem: projection_selectedView=='capybara'}"
                        @click="projection_selectedView='capybara'">Show Capybara score</b-list-group-item>
                </b-list-group>
            </b-col>
            <b-col md="9">
                <!-- Project Stemformatics data -->
                <div v-show="projection_selectedView=='stemformatics'">
                    <AtlasDataUpload :atlas-type="atlasType" selectedDataSource="Stemformatics" @project-data="projectData"></AtlasDataUpload>
                </div>

                <!-- Project bulk user data -->
                <div v-show="projection_selectedView=='bulk'">
                    <AtlasDataUpload :atlas-type="atlasType" selectedDataSource="User" @project-data="projectData"></AtlasDataUpload>
                </div>
                
                <!-- Capybara score plot -->
                <b-container v-show="projection_selectedView=='capybara'" class="overflow-auto">
                    <b-card border-variant="light">
                        <h5 class="text-center">Capybara score 
                            {{projection_data.name!=null? ': ' + projection_data.name + " &raquo; " + atlasType + ' atlas' : ""}}
                        </h5>
                        <p v-if="projection_data.name==null">
                            Once a projection has been made, you can see how the projected samples score against
                            the atlas samples here as a heatmp using <b-link href="https://doi.org/10.1101/2020.02.17.947390" target="_blank">
                            Capybara</b-link> scores.
                        </p>
                        <p v-else>
                            Each projected sample is scored using 
                            <b-link href="https://doi.org/10.1101/2020.02.17.947390" target="_blank">
                            Capybara</b-link> here, and the score is rendered as a heatmap. Higher values imply more closeness with that atlas sample group.
                            The rows of this table match samples groups in the query data, and columns match those in the atlas.
                        </p>
                        <b-form v-show="projection_data.name!=null" inline class="justify-content-center mt-2">
                            Show rows as: 
                            <b-form-select v-model="projection_selectedSampleGroup" size="sm"
                                :options="projection_sampleGroups" @change="plotCapybara" class="mx-2" style="width: 15%">
                            </b-form-select>
                            Columns as: 
                            <b-form-select v-model="projection_selectedAtlasSampleGroup" size="sm"
                                :options="colourBy" @change="plotCapybara" class="ml-1">
                            </b-form-select>
                            <b-link v-b-hover="handleHover_image1" v-b-tooltip.hover title="Show projections on PCA plot" 
                                @click="selectedTabIndex=0; sampleGroupsTab.selectedView='PCA by sample group'" class="ml-2">
                                <b-img v-if="imageHoverState.image1" src="/img/Icon_project_red.svg" width="25" alt="project icon hover"></b-img>
                                <b-img v-else src="/img/Icon_project_blue.svg" width="25" alt="project icon selected"></b-img>
                            </b-link>
                            <b-link v-b-hover="handleHover_image2" v-b-tooltip.hover title="Download plot" 
                                @click="downloadPlot('capybaraPlotDiv', projection_data.name + '_capybara')">
                                <b-img v-if="imageHoverState.image2" src="/img/Icon_download_red.svg" width="25" alt="download icon hover"></b-img>
                                <b-img v-else src="/img/Icon_download_blue.svg" width="25" alt="download icon selected"></b-img>
                            </b-link>
                        </b-form>
                    </b-card>
                    <div id="capybaraPlotDiv" v-show="projection_selectedView=='capybara'"></div>
                </b-container>
            </b-col>
        </b-row>
        </b-tab>

        <!-- Tools Tab -->
        <b-tab title="Tools">
        <b-row class="small">
            <b-col md="3">
                <p>Extra tools for the atlas.</p>
                <b-list-group>
                    <b-list-group-item button :class="{selectedListGroupItem: toolsTab.selectedView=='downloadData'}"
                        @click="toolsTab.selectedView='downloadData'">Download data</b-list-group-item>
                    <b-list-group-item button :class="{selectedListGroupItem: toolsTab.selectedView=='plotPreferences'}"
                        @click="toolsTab.selectedView='plotPreferences'">Preferences</b-list-group-item>
                </b-list-group>
            </b-col>

            <b-col>
                <!-- Download data/plots -->
                <b-container v-if="toolsTab.selectedView=='downloadData'">
                    <b-card border-variant="light">
                        <h5 class="text-center">Download data</h5>
                        <div style="font-size:13px"> <!-- same style as b-card-text which is basically <p> that shouldn't be outside ul -->
                            You can download the data used for the atlas here. The samples matrix contains data about each sample, 
                            the genes matrix shows which genes were included in the atlas and which were left out, and 
                            the expression matrix contains rank normalised expression values (note: large file).
                            <ul class="mt-2">
                                <li v-for="item in toolsTab.fileTypes" :key="item.key">
                                    <b-link :href="apiUrl + '/atlases/' + atlasType + '/' + item.key + '?as_file=true'">{{item.name}}</b-link> ({{item.size}})
                                </li>
                            </ul>
                        </div>
                    </b-card>
                </b-container>

                <b-container v-if="toolsTab.selectedView=='plotPreferences'">
                    <b-card border-variant="light">
                        <h5 class="text-center">Preferences for plot download</h5>
                        <b-card-text>
                            Set your preferred image format and size here for all plot downloads.
                        </b-card-text>
                        <b-form-group label="Image type">
                            <b-form-radio-group v-model="toolsTab.selectedImageType" :options="toolsTab.imageTypes"></b-form-radio-group>
                        </b-form-group>
                        <b-form inline>
                            <b-form-group label="width (pixels)"><b-form-input v-model="toolsTab.plotWidth" size="sm"></b-form-input></b-form-group>
                            <b-form-group label="height (pixels)"><b-form-input v-model="toolsTab.plotHeight" size="sm"></b-form-input></b-form-group>
                        </b-form>
                        <b-button size="sm" class="mt-2">Save</b-button>
                    </b-card>
                </b-container>
            </b-col>
        </b-row>
        </b-tab>
    </b-tabs>
    </b-card>

<b-sidebar id="sidebar" title="Help and more info" shadow>
    <div class="px-3 py-2">
        <p>Stemformatics integrated atlas provides a way to visualise multiple datasets together.
            Read more about it at our <b-link to='/atlas/about'>about atlas</b-link> page, which briefly outlines the method we used
            to construct the atlas and links to our published papers. 
        </p>
        <p>You can explore the atlas in several ways: <b>"Sample groups"</b> tab contains ways
            to view sample relationships, while <b>"Gene expression"</b> tab contains functions to
            plot gene expression in the atlas in different ways. In <b>"Projection"</b> tab, you'll
            find functions to project your own data onto the atlas for benchmarking cell types.
        </p>
        <p>On the plots, zoom in or out using your mouse, double-click on individual samples in the PCA plot
            to see more information on their origin such as cell tye and sample description. 
            All of the data and plots can be downloaded.
        </p>
        <p>How to cite: see our <b-link to="/about/cite">cite</b-link> page.</p>
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

    data() {
        return {
            // Data related variables
            coords: {},         // {"0":{"6638_GSM868879":5.72,"6638_GSM868880":5.511, ...}, ...}
            sampleIds: [],      // ["6638_GSM868879","6638_GSM868880", ...]
            sampleTable: {},    // {'celltype':{'6638_GSM868879':'HPC', ...}, ...}
            sampleTypeColoursOriginal: {},    // colours may change, so we keep original colours stored here
            sampleTypeColours: {},    // {"Sample Source":{"in vivo":"#8b8b00",...}, ...}
            sampleTypeOrdering: {},  // {"Sample Source":["in vivo","ex vivo",...], ...}
            colourBy: [],   // all possible sample group names: ["Cell Type", "Sample Source", ...]

            apiUrl: 'http://127.0.0.1:5000', // set to process.env.BASE_URL when mounted
            userID: null, // User ID could be encoded in the URL

            // Control related variables
            selectedTabIndex: 0,
            showLoading: false,
            loadingTime: 0,
            interval: null,
            // Can be set to true when image is hovered - multiple values available since you can have multiple images on the same page
            imageHoverState: {image1: false, image2: false},

            // default camera angle for a 3d plot in plotly
            camera: {up: {x:0, y:0, z:1}, center: {x:0, y:0, z:0}, eye: {x:1.25, y:1.25, z:1.25}},

            // plotly requires id of div where it will plot, so set them as vars here
            mainPlotDiv: "mainPlotDiv",

            // sampleGroups tab specific
            sampleGroupsTab: {
                selectedView: "PCA by sample group",
                is3d: true,  // whether plot is in 3d or 2d
            },

            // Variables used by PlotLegend component
            selectedColourBy: "Cell Type",  // overwrite at mounted()
            allLegends: {},
            itemsWithMargins: {},

            geneExpressionTab: {
                selectedGene: "",
                possibleGenes: [],  // gene ids and symbols used to populate the autocomplete field
                geneExpression: [], // flat list of values, in same order as sampleIds, to be fetched when requested
                plotTypes: ["box", "violin", "pca"],
                selectedPlotType: "box",
                showPoints: false,
                selectedSampleGroup: 'Cell Type', // overwrite at mounted()
            },

            // Projection related
            projection_selectedView: "stemformatics",
            projection_data: {},
            projection_sampleGroups: [],
            projection_selectedSampleGroup:'',
            projection_selectedAtlasSampleGroup:'Cell Type',
            projection_selectedDataSource: '',
            projection_projectedItems: [],

            // Variables used by AtlasDataUpload component
            uploadData: {
                projectedSampleIds: [],  // record sample ids which have been projected
                name: null, // name of the dataset used for projection - will be the prefix for projected samples
            },

            // Variables used by the find dataset div which can be used to show a table of datasets
            datasetInfo: {
                allData: [], // [{"dataset_id":7268,"author":"Abud","pubmed_id":"28426964","platform":"RNAseq",...},...]
                selectedDatasetId: '',
            },

            // Variables used by the sample info div which is shown when a sample is double-clicked
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

            // tools tab
            toolsTab: {
                selectedView: "downloadData",
                fileTypes: [{key:'samples', name:'samples matrix', size:'~50kb'},
                            {key:'genes', name:'genes matrix', size:'~360kb'},
                            {key:'expression-file', name:'expression matrix', size:'226Mb'},
                            {key:'colours-and-ordering', name:'colours and ordering', size:'1kb'},
                            {key:'coordinates', name:'pca coordinates', size:'~50kb'},
                ],
                imageTypes: ['jpeg','svg','webp'],
                selectedImageType: 'jpeg',
                plotWidth: 1200,
                plotHeight: 900,
            },

            // custom sample group
            customSampleGroup: {
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
                    selectedGene: "Select a gene from suggestions and press go to show its expression." +
                                  "The genes with brackets were filtered out before creating this PCA.",
                    geneExpressionPlot: "This plot shows rank normalised values of the gene in the atlas as "+
                                        "either a violin or a box plot. The values are in the range [0,1]." +
                                        "You can drag this plot overlay by grabbing it near the title.",
            },

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
        
        // Run before sample group plot to populate the legends array, and when a legend is clicked to show/hide a trace
        updateLegends() {
            this.allLegends = this._legendsFromSampleTable(this.sampleTable, 
                {orient:'dict', sampleGroupItemColours:this.sampleTypeColours, sampleGroupItemsOrdered:this.sampleTypeOrdering, projectedItems:this.projection_projectedItems});
        },
     
        handleHover_image1(hovered) { this.imageHoverState.image1 = hovered },
        handleHover_image2(hovered) { this.imageHoverState.image2 = hovered },

        // ------------ Plot related methods ---------------
        // Layout dict used by plotly - can control size, camera, etc (used only for PCA plots)
        layout() {

            // here we can insert matrix of variances explained by PCA plots
            const pca_variances = {
                myeloid:[14.43, 6.78, 6.52],
                dc: [10.20, 6.67, 5.84],
                blood: [17.88, 6.80, 5.64],
                activation: [11.44, 10.88, 8.02],
                ma: [27.96, 15.73, 7.75]
            };
            // now we can fetch variances explained by PC1 by pca_variances[this.atlasType][0]

            return { 
                showlegend: false,
                height: 500,   // height of the plot in pixels
                width: 800,
                margin: {t:20, l:0, r:0, b:0},
                xaxis: {title: `PC1 (${pca_variances[this.atlasType][0]}%)`},
                yaxis: {title: `PC2 (${pca_variances[this.atlasType][1]}%)`},
                uirevision: true,
                hovermode: 'closest',
                scene: {camera: this.camera,
                        up: { x: 1, y: 0, z: 0 }, 
                        xaxis: {title: `PC1 (${pca_variances[this.atlasType][0]}%)`},
                        yaxis: {title: `PC2 (${pca_variances[this.atlasType][1]}%)`},
                        zaxis: {title: `PC3 (${pca_variances[this.atlasType][2]}%)`}}
            };
        },
        
        // Return a list of traces to use for pca plots.
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

                if (self.sampleGroupsTab.is3d) {  // specify parameters specific to 3d plot
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
                trace.marker.color = self.geneExpressionTab.geneExpression;
                trace.marker.colorbar = { title: "rank normalised" };
                trace.sampleIds = self.sampleIds;
                traces.push(trace);
            }
            return traces;
        },
        
        // If all required data are populated, call this function to plot PCA by sample groups.
        plotPCABySampleGroups() {
            let self = this;
            let div = document.getElementById(self.mainPlotDiv);
            Plotly.newPlot(div, this.traces(), this.layout());
        
            // Set up double click event, where sampleInfo.shownData is populated with info about the sample double clicked.
            // Note that plotly doesn't really have double click event detection, so we're going to measure the interval between
            // two single clicks if it's on the sample id.
            div.on('plotly_click', function(data) { self.handlePlotlyClick(data, 'sample type'); });
        },

        // Function to update the PCA by sample groups plot
        updatePlot(legend) {
            this.showLoading = true;
            if (legend && 'selectedSampleGroup' in legend)  // comes from PlotLegend component, changing colourBy
                this.selectedColourBy = legend.selectedSampleGroup;
            else if (legend && 'value' in legend) { // comes from PlotLegend compoenent, when a legend is clicked
                const index = this.allLegends[this.selectedColourBy].map(legend => legend.value).indexOf(legend.value);
                this.allLegends[this.selectedColourBy][index].visible = !legend.visible;
            }
            Plotly.react(document.getElementById(this.mainPlotDiv), this.traces(), this.layout());
            this.showLoading = false;
        },

        // Plot gene expression plot - may be scatter plot or pca.
        geneExpressionPlot() {
            let self = this;
            if (self.geneExpressionTab.geneExpression.length==0) return;
            if (self.geneExpressionTab.selectedPlotType=='pca') {
                let div = document.getElementById("boxPlotDiv");
                Plotly.newPlot(div, this.traces('gene expression'), this.layout());
                div.on('plotly_click', function(data) { self.handlePlotlyClick(data, 'gene expression'); });
                return;
            }
            let selectedSampleGroup = self.geneExpressionTab.selectedSampleGroup;
            let sampleIds = self.sampleIdsFromSampleGroup(selectedSampleGroup); // {"monocyte":["6075_MOCK1",...], ...}
            let orderedSampleGroupItems = self.sampleTypeOrdering[selectedSampleGroup].filter(item => item!="");

            // Plot first empty/opaque data point for purposes of plot background
            // let emptyTrace = {name: '  ', y: [0], type: 'box', opacity: 0, hoverinfo: 'skip'};
            // let traces = [emptyTrace];
            let traces = [];

            // Empty name for padding purposes
            // let names = [' '];
            let names = [];

            orderedSampleGroupItems.forEach(sampleGroupItem => {
                // For each trace, we obtain matching sample ids for this sampleGroupItem (eg. "monocyte")
                let matchingSampleIds = sampleIds[sampleGroupItem]; // ["6075_MOCK1",...]
                // For hovertext, show sample information
                //let hovertext = matchingSampleIds.map(item => self.sampleInfo.allData[item]['cell_type']);
                // console.log(JSON.stringify(self.sampleInfo.allData));
                let trace = {
                        type: self.geneExpressionTab.selectedPlotType,
                        // For y values, use index of matchinSampleIds to work out matching expression values
                        y: self.geneExpressionTab.geneExpression.filter((item,i) => matchingSampleIds.indexOf(self.sampleIds[i])!=-1),
                        box: { visible: true },
                        line: { width: 1, color: 'black' },
                        meanline: { visible: true },
                        name: sampleGroupItem,
                        x0: sampleGroupItem,
                        showlegend: false,
                        hoverinfo: "text",
                        hovertext: matchingSampleIds,
                        points: self.geneExpressionTab.showPoints? 'all': false, // works for violin
                        boxpoints: self.geneExpressionTab.showPoints? 'all': false,  // works for boxplot
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
            // traces.push(emptyTrace);
            // names.push('  ');

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
                            // shapes: [{type:'rect', xref:'x', yref:'y', x0: ' ', x1: '  ',
                            //     y0: 0.2, // placeholder
                            //     y1: 0.8, // placeholder
                            //     fillcolor: '#d3d3d3', opacity: 0.2, layer: 'below',
                            //     line: { width: 0 }}],
                    };
            Plotly.newPlot("boxPlotDiv", traces, layout);
        },

        // ------------ sampleInfo methods ---------------
        // Should run when user clicks on a point in the plot. Since there's no double-click event detection in plotly
        // we measure the time interval between clicks to define double click.
        handlePlotlyClick(data, plotBy) {
            let self = this;
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
                                                    'value':matchingDataset.length>0? matchingDataset[0].display_name : '[private]', 
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

        // In order to know where to show the sampleInfoDiv on double-click, 
        // we need to keep track of mouse position and save this.
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
            });
            this.datasetInfo.selectedDatasetId = datasetId;
        },

        // Clear the highlighted datasets
        clearHighlight() {
            this.traces().forEach((trace,index) => {
                Plotly.restyle(this.mainPlotDiv, {'marker': trace.marker}, [index]);
            });
            this.datasetInfo.selectedDatasetId = '';
        },

        // ------------ Custom sample group methods ---------------
        // Apply custom sample group defined. Shoud run when user hits save.
        // inputData should looks like [{sampleGroup:'B Cell_in vitro', sampleIds:['s1',...]}, ...]
        applyCustomSampleGroup(inputData) {
            let self = this;

            // Check if there is useful input data
            const data = inputData.filter(item => item.sampleIds.length>0);
            if (data.length==0) {
                this.$bvModal.msgBoxOk("Custom sample group seems empty.");
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
            self.updateLegends();
            self.updatePlot();

            // Ask to switch view to make it obvious what's happened
            this.$bvModal.msgBoxConfirm("Successfully defined a custom sample group. Switch to PCA plot to view the result?", {
                okTitle:'Yes', cancelTitle:'Stay here'
            }).then(value => {
                if (value) this.sampleGroupsTab.selectedView = 'PCA by sample group';
            }).catch(err => { // An error occurred
            });
        },
        
        // ------------ Gene expression related methods ---------------
        // Show autocomplete on gene expression by fetching all possible entries.
        // If geneSymbol is specified, run showGeneExpression as a callback after fetching possible genes.
        getPossibleGenes(geneSymbol) {
            let self = this;
            let gene = self.geneExpressionTab.selectedGene;
            if (gene.length<=1) return;    // ignore 1 or less characters entered
            self.$axios.get('/api/atlases/' + self.atlasType + '/possible-genes?query_string=' + gene)
                .then(function (response) {
                    if (response.data.length>0) {
                        self.geneExpressionTab.possibleGenes = response.data;
                        if (geneSymbol!=null)
                            self.showGeneExpression(geneSymbol);
                    }
            });
        },
        
        // Should run when signal is received from Genesets component to show single gene expression
        showGeneExpressionFromGeneset(geneSymbol) {
            this.geneExpressionTab.selectedGene = geneSymbol;
            this.getPossibleGenes(geneSymbol);
            this.selectedTabIndex = 1;
        },
        
        // Show gene expression - fetch values from server and save them, then run geneExpressionPlot
        showGeneExpression(geneSymbol) {
            let self = this;
            if (geneSymbol!=null) {
                self.geneExpressionTab.selectedGene = geneSymbol.replace('(','').replace(')','');
            }
            let matchingGenes = self.geneExpressionTab.possibleGenes.filter(item => item.symbol==self.geneExpressionTab.selectedGene);
            if (matchingGenes.length>0) {
                let geneId = matchingGenes[0].ensembl;
                // use filtered=true for expression-values api if gene has been filtered in
                let filtered = matchingGenes[0].inclusion;
                self.showLoading = true;
                self.$axios.get('/api/atlases/' + self.atlasType + '/expression-values?orient=records&gene_id=' + geneId + '&filtered=' + filtered)
                    .then(function (response) {
                        if (response.data.length>0) {
                            // response.data would looke like [{column:value, ...}]
                            self.geneExpressionTab.geneExpression = self.sampleIds.map(item => response.data[0][item]);
                            self.geneExpressionPlot();
                        } else {
                            this.$bvModal.msgBoxOk("Could not find expression values for this gene.");
                        }
                        self.showLoading = false;
                });
            } else
                this.$bvModal.msgBoxOk("No expression values exist in this atlas for the specified gene.");
        },

        // ------------ Download data/plot methods ---------------
        downloadPlot(divId, name) {
            Plotly.downloadImage(document.getElementById(divId), {
                format: this.toolsTab.selectedImageType,
                height: parseInt(this.toolsTab.plotHeight),
                width: parseInt(this.toolsTab.plotWidth),
                filename: 'Stemformatics_' + this.atlasType + '_atlas_' + name,
            });
        },

        // ------------ Data projection methods ---------------
        projectData(projectionData) {
            // Map a particular sample field from query data to all of the sample fields in the atlas.
            // projectionData needs to have following objects (examples)
            // name: "notta"
            // samples: [{"Sample Type":"CMP_71+_BAH+","Parental cell type":"CMP"}, ...] (sample table of query data as a list of dictionaries)
            // coords: [{'x':8.03,'y':0,'z':1.2}, ...] (projected coords as a list of dictionaries)
            // combinedCoords: {'index':[], 'columns':[], 'data':[]}
            // sampleIds: ['notta_GSM1977399',...]  (list of sample ids matching sample table)
            // column: 'Sample Type' (which sample table column should be selected to show - should be one of the keys of samples)
            // capybara: {'Sample Type':}
            //
            // We prefix all projected items with its name_ so that there's no duplicates in the legend.
            let column = projectionData.column;

            // If we assume that projection included random samples, projectionData.coords should have extra coords for these.
            // We need to include these in samples, as well as sampleIds now.
            let nRandom = projectionData.coords.length - projectionData.sampleIds.length;   // should be 3, unless sample table had less than 3 columns
            let sampleKeys = Object.keys(projectionData.samples[0]);
            for (let i=0; i<nRandom; i++) {
                projectionData.sampleIds.push(projectionData.name + "_random_" + i);
                let sampleObj = {};
                for (const key of sampleKeys)   // note that sample ids won't become unique here but for user uploaded datasets, it's hard to know which field that is.
                    sampleObj[key] = "Random";
                projectionData.samples.push(sampleObj);
            }

            // This is a list of projected items that will be displayed in the legend. ["Ang_iPSC","Ang_HSC","Ang_iPSC",...]
            // Note that this list is same length as projected sample ids. Also these don't change when colour by changes.
            let sampleTypes = projectionData.samples.map(item => projectionData.name + "_" + item[column]);

            // Define which items are projected - add to existing list of projected items in case of multiple projections
            for (const item of Array.from(new Set(sampleTypes))) // unique values of sampleTypes only
                this.projection_projectedItems.push(item);         

            // Create some dataset attributes needed
            let datasetAttributes = {"dataset_id":'0000', "display_name":"[Projected Data]", "sampleIds":projectionData.sampleIds};
            
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
                    this.sampleTypeColours[item][sampleTypes[i]] = sampleTypes[i].includes("Random")? "red" : "black"; // colour for projected samples
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
            this.plotCapybara();
            this.projection_selectedView = 'capybara';
        },

        plotCapybara() {
            if (!this.projection_data.capybara) {
                this.$bvModal.msgBoxOk("Use this function after projection to show quantitative scores.");
                return;
            }
            if (this.projection_selectedAtlasSampleGroup=='custom_sample_group') {
                this.$bvModal.msgBoxOk("Currently calculating Capybara score on custom sample group is not supported.");
                return;
            }
            let div = document.getElementById('capybaraPlotDiv');
            const capybara = this.projection_data.capybara[this.projection_selectedAtlasSampleGroup];

            // y depends on projection_selectedSampleGroup
            let y = this.projection_data.samples.map(item => item[this.projection_selectedSampleGroup]).filter(item => item!='Random');

            // Round data
            let data = [];
            capybara.data.forEach(row => {
                data.push(row.map(item => Math.round(100*item)/100));
            });
            let traces = [{type:'heatmap', z:data, y:y, x:capybara.columns}];
            let layout = {xaxis:{side:"top", automargin:true}, yaxis:{automargin:true}};
            Plotly.newPlot(div, traces, layout);
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

    },

    mounted() {
        this.apiUrl = process.env.BASE_API_URL;
        this.showLoading = true;

        // Axios calls should be nested so if data A relies on B to be set first, call to get
        // A should be inside the call to get B. For data which do not need to be fetched immediately
        // at the start of the page load (eg sample info), they can be called outside this system.

        // Fetch sample table
        this.$axios.get("/api/atlases/" + this.atlasType + "/samples?orient=dict").then(res => {
            this.sampleTable = res.data;    // {col: {row:val}}
            this.colourBy = Object.keys(this.sampleTable);   // ["Cell Type", "Sample Source", ...]
            this.selectedColourBy = this.colourBy[0];
            this.geneExpressionTab.selectedSampleGroup = this.selectedColourBy;
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

                    this.showLoading = false;
                    this.updateLegends();
                    this.plotPCABySampleGroups();
                });
            });
        });

        // Set datasetId if coming from query
        if (this.$route.query.id!=null) {
            this.userID = this.$route.query.id;
            let unique = this.userID;

            // Calling the get function from resources/atlases.AtlasProjectionResults
            this.$axios.get('/api/atlas-projection-results', {params: {id: unique}}).then(res6 => {
                this.projectData(res6.data);
            });

        };
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

.selectedListGroupItem {
  background-color:#2780e3 !important;
  color: white !important;
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

.nav-pills.tab-tools.nav-link {
    color: black;
}

</style>
