<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="py-4">
    <b-row>
        <b-col class="col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'datasets'" :activeItem="'api'" />
        </b-col>
        <b-col class="col-sm-12 col-md-6 col-lg-9 col-xl-9">
            <h3>API access</h3>
            <p>All Stemformatics data can be accessed via 
                <b-link href="https://en.wikipedia.org/wiki/API" target="_blank">API</b-link>. 
                Use your favourite tool, such as python or R to search for relevant datasets and download them
                to do your own anayses. Or simply go to the api server and view the data in raw form.
            </p>
            <pre><code>
  # cURL example
  curl https://api.stemformatics.org/datasets/2000/metadata

  # python example
  import pandas, requests
  r = requests.get('https://api.stemformatics.org/datasets/2000/samples')
  df = pandas.DataFrame(r.json())
  display(df.head())
                sample_id    cell_type parental_cell_type  ... developmental_stage treatment external_source_id
        0  2000_1787466030_H  neurosphere         epithelium  ...
        1  2000_1787466065_A  neurosphere         epithelium  ...
        2  2000_1787466030_E  neurosphere         epithelium  ...
        3  2000_1787466065_D  neurosphere         epithelium  ...
        4  2000_1699538158_H  neurosphere         epithelium  ...

  # R example
  library(httr)
  library(jsonlite)
  response = GET("https://api.stemformatics.org/datasets/2000/metadata")
  print(content(response))
            </code></pre>

            <b>Full list of APIs</b>
            <p>Where you see the parameters, default vaules are given and these can be left out.
                For example, /datasets/2000/samples will work the same as 
                /datasets/2000/sample?orient=records&as_file=false. If default value is not given,
                it is a required parameter and this is explained.
            </p>
            <p>The parameter 'orient' can have same values as specified by 
                <b-link href="https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_dict.html" target="_blank">to_dict()</b-link> function
                in <b-link href="https://pandas.pydata.org/" target="_blank">python pandas</b-link> package.
            </p>
            <div v-for="api in apis" :key="api.url" :class="('insertMargin' in api)? 'mt-3 mb-1' : 'mb-1'">
                <b-link v-if="!api.show" @click="api.show = !api.show"><b-icon-chevron-right></b-icon-chevron-right></b-link>
                <b-link v-else @click="api.show = !api.show"><b-icon-chevron-down></b-icon-chevron-down></b-link>
                {{api.url}}
                <b-collapse v-model="api.show" class="mt-0"><b-card class="mt-1">
                    <p>{{api.heading}}</p>
                    <pre><code>
    {{api.example}}
                    </code></pre>
                </b-card></b-collapse>
            </div>

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
            showApi2: false,

            apis:[
                {show: false, url:'/datasets/{dataset_id}/metadata', 
                 heading: 'Fetches dataset metadata. Example data',
                 example:
    `{
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
      "platform_type": "Microarray",
      "projects": []
    }`
                },                
                
                {show: false, url:'/datasets/{dataset_id}/samples?orient=records&as_file=false', 
                 heading: 'Fetches dataset sample metadata. If as_file=true, ' + 
                    'the whole table can be downloaded as a file (orient parameter is then ignored).',
                 example:
    `[
        {
            "sample_id": "2000_1787466030_H",
            "cell_type": "neurosphere",
            "parental_cell_type": "epithelium",
            "final_cell_type": "neurosphere",
            "disease_state": "Parkinson's disease",
            "organism": "olfactory mucosa",
            "sample_type": "ONS",
            "tissue_of_origin": "nasal mucus",
            "sample_name_long": "1787466030_H",
            "media": "",
            "cell_line": "",
            "facs_profile": "",
            "sample_description": "Olfactory neurosphere-derived cell Parkinson's disease donor 26",
            "age_time": "60",
            "sex": "male",
            "reprogramming_method": "",
            "genetic_modification": "",
            "labelling": "",
            "developmental_stage": "",
            "treatment": "",
            "external_source_id": ""
        },
        ...
    ]`
                },
               
                {show: false, url:'/datasets/{dataset_id}/expression?gene_id={Ensembl_gene_id}&key=cpm&orient=records&as_file=false', 
                 heading: 'Fetches expression values for a gene in the dataset. key may be ' +
                    'one of [raw,genes] for microarray data, where you should use probe id for gene_id ' +
                    'if key=raw, and one of [raw,cpm] for RNA-seq data, where raw means unnormalised ' +
                    'count values. If as_file=true, the entire expression matrix can be downloaded for the matching key.',
                 example:
    `[
        {
            "2000_1699538155_A": 3.04880437204288,
            "2000_1699538155_B": 3.29992980406424,
            "2000_1699538155_C": 3.04517193769474,
            ...
        }
    ]`       
                },

                {show: false, url:'/datasets/{dataset_id}/pca?orient=records&dims=20', 
                 heading: 'Fetches pca coordinates and attributes for a dataset. ' +
                    'The number of dimensions has been optimised for each dataset and may vary. Some datasets ' +
                    'with large numbers of samples may have large number of pca dimensions, and dims parameter ' +
                    'is the maximum number that will be fetched. Note that each coordinate label is a string.',
                 example:
    `{
        "coordinates": [
            {
                "0": -1.7815665799455362,
                "1": -24.798786945907214,
                "2": 0.40088979328275,
                ...
            },
            ...
        ],
        "attributes": [
            {
                "explained_variance_": 2695.003519944256,
                "explained_variance_ratio_": 0.3246910477464182,
                "singular_values_": 575.7477164115751
            },
            ...
        ]
    }`       
                },

                {show: false, url:'/search/datasets?dataset_id={datasetId}&query_string={queryString}&platform_type={platformType}&projects={projects}&name={name}&limit={limit}', 
                 heading: 'Fetches dataset metadata for datasets matching the search parameters. ' +
                    'Note that some sample metadata are included in the results here, unlike /datasets/{dataset_id}/metadata ' +
                    'which only contains dataset metadata. If no parameters are specified, metadata for all datasets will be fetched. ' +
                    'platform_type may be one of [Microarray,RNASeq], projects may be one or more of [myeloid_atlas,blood_atlas,dc_atlas]. ' +
                    'Multiple parameters work as "AND" operator, so platform_type=Microarray&projects=myeloid_atlas,blood_atlas will fetch ' +
                    'Microarray datasets under myeloid and blood atlas projects.',
                 insertMargin: true,
                 example:
    `[
        {
            "dataset_id": 6741,
            "title": "Transcriptional specialization of human dendritic cell subsets in response to microbial vaccines",
            "authors": "Banchereau R, Baldwin N, Cepika AM, Athale S, Xue Y, Yu CI, Metang P, Cheruku A, Berthier I, Gayet I, Wang Y, Ohouo M, Snipes L, Xu H, Obermoser G, Blankenship D, Oh S, Ramilo O, Chaussabel D, Banchereau J, Palucka K, Pascual V",
            "description": "The mechanisms by which microbial vaccines interact with human APCs remain elusive. Herein, we describe the transcriptional programs induced in human DCs by pathogens, innate receptor ligands and vaccines. Exposure of DCs to influenza, Salmonella enterica and Staphylococcus aureus allows us to build a modular framework containing 204 transcript clusters. We use this framework to characterize the responses of human monocytes, monocyte-derived DCs and blood DC subsets to 13 vaccines. Different vaccines induce distinct transcriptional programs based on pathogen type, adjuvant formulation and APC targeted. Fluzone, Pneumovax and Gardasil, respectively, activate monocyte-derived DCs, monocytes and CD1c+ blood DCs, highlighting APC specialization in response to vaccines. Finally, the blood signatures from individuals vaccinated with Fluzone or infected with influenza reveal a signature of adaptive immunity activation following vaccination and symptomatic infections, but not asymptomatic infections. These data, offered with a web interface, may guide the development of improved vaccines. Abstract from Nat Commun. 2014 Oct 22;5:5283.",
            "platform": "Illumina HumanHT-12 v4.0 Expression BeadChip",
            "private": false,
            "pubmed_id": "25335753",
            "name": "Banchereau_2014_25335753_d",
            "accession": "GSE56744",
            "version": 1.0,
            "platform_type": "Microarray",
            "status": "passed",
            "projects": [
                "myeloid_atlas",
                "blood_atlas",
                "dc_atlas"
            ],
            "samples": 88,
            "cell_type": "CD1c+ dendritic cell,CD141+ dendritic cell",
            "display_name": "Banchereau (2014)"
        },
        ...
    ]`       
                },

                {show: false, url:'/search/samples?dataset_id={datasetId}&query_string={queryString}&field={field}&orient=records&limit=50', 
                 heading: 'Fetches sample metadata matching the search parameters. ' +
                    'field specifies a subset of the fields to fetch, for example field=cell_type&field=tissue_of_origin. ' +
                    'See example below for a full list of available fields.',
                 example:
    `[
        {
            "sample_id": "6363_GSM1094014",
            "dataset_id": 6363,
            "cell_type": "hematopoietic progenitor cell",
            "parental_cell_type": "hematopoietic multipotent progenitor cell",
            "final_cell_type": "multipotent progenitor",
            "disease_state": "normal",
            "organism": "homo sapiens",
            "sample_type": "CD34+ CB",
            "tissue_of_origin": "umbilical cord blood",
            "sample_name_long": "",
            "media": "",
            "cell_line": "",
            "facs_profile": "CD34+",
            "sample_description": "Cord blood CD34+ cells expanded from day -3 to day zero (D0) with Flt3L, SCF, and TPO, and then harvested",
            "age_time": "",
            "sex": "",
            "reprogramming_method": "",
            "genetic_modification": "",
            "labelling": "",
            "developmental_stage": "",
            "treatment": "",
            "external_source_id": ""
        },
        ...
    ]`       
                },

                {show: false, url:'/values/datasets/{key}?include_count=false', 
                 heading: 'Fetches all available values for key in dataset metadata. ' +
                    'If include_count is true, returns a dictionary of counts of each value. ' +
                    'Example here is for key=platform&include_count=true. For a full list of available keys, ' +
                    'see the example data from /datasets/{dataset_id}/metadata',
                 insertMargin: true,
                 example:
    `{
        "Affymetrix Human Genome U133 Plus 2.0 Array [HG-U133_Plus_2]": 90,
        "Affymetrix Human Gene 1.0 ST Array [HuGene-1_0-st]": 52,
        "Illumina HumanHT-12 v4.0 Expression BeadChip": 40,
        ...
    }`       
                },

                {show: false, url:'/values/samples/{key}?include_count=false', 
                 heading: 'Fetches all available values for key in sample metadata. ' +
                    'If include_count is true, returns a dictionary of counts of each value. ' +
                    'Example here is for key=cell_type&include_count=true. For a full list of available keys, ' +
                    'see the example data from /datasets/{dataset_id}/samples',
                 example:
    `{
        "": 6035,
        "monocyte": 1575,
        "Day_7": 466,
        "Day_6": 415,
        ...
    }` 
                },

            ],
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
