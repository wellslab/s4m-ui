<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="p-4">
    <h3 class="text-center">API access</h3>
    <p>All Stemformatics data can be accessed via 
        <b-link href="https://en.wikipedia.org/wiki/API" target="_blank">API</b-link>. 
        Use your favourite tool, such as python or R to search for relevant datasets and download them
        to do your own anayses. Or simply go to the api server and view the data in raw form.
    </p>
    <pre class="px-3 border border-gray-500"><code>
# cURL example
curl https://api.stemformatics.org/datasets/2000/metadata

# python examples
import pandas, requests
r = requests.get('https://api.stemformatics.org/datasets/2000/samples')
df = pandas.DataFrame(r.json())
print(df.head())
        sample_id    cell_type parental_cell_type  ... developmental_stage treatment external_source_id
0  2000_1787466030_H  neurosphere         epithelium  ...
1  2000_1787466065_A  neurosphere         epithelium  ...
2  2000_1787466030_E  neurosphere         epithelium  ...
3  2000_1787466065_D  neurosphere         epithelium  ...
4  2000_1699538158_H  neurosphere         epithelium  ...

# Note that you can safely use spaces inside query string variable and requests will parse it for you
r = requests.get('https://api.stemformatics.org/search/samples?query_string=%s&field=tissue_of_origin,dataset_id' % 'dendritic cell')
print(r.json()[:2])
[{'sample_id': '7277_GSM2067549', 'dataset_id': 7277, 'tissue_of_origin': 'umbilical cord blood'}, 
    {'sample_id': '7277_GSM2067548', 'dataset_id': 7277, 'tissue_of_origin': 'umbilical cord blood'}]

# To get expression matrix as file but read it into pandas directly
import io
r = requests.get('https://api.stemformatics.org/datasets/6756/expression?as_file=true')
df = pandas.read_csv(io.StringIO(r.text), sep='\t', index_col=0)
print(df.head())
            GSM741192.CEL  GSM741193.CEL  GSM741194.CEL  GSM741195.CEL  \
1415670_at         8.209027       8.262415       8.557468       9.205204   
1415671_at        10.852328      11.100999      10.912304      10.836298   
1415672_at        10.431524      10.364212      10.517259      11.122440   

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
        <b-link @click="api.show = !api.show">{{api.url}}</b-link>
        <b-collapse v-model="api.show" class="mt-0"><b-card class="mt-1">
            <p>{{api.heading}}</p>
            <pre><code>
{{api.example}}
            </code></pre>
        </b-card></b-collapse>
    </div>
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
                { text: 'Datasets', to: '/datasets' },
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
               
                {show: false, url:'/datasets/{dataset_id}/expression?gene_id={Ensembl_gene_id}&key=cpm&log2=false&orient=records&as_file=false', 
                 heading: 'Fetches expression values for a gene in the dataset. key may be one of [raw,genes,cpm]. ' +
                    'For Microarray data, raw refers to probe level expression while genes refers to expression summarised at the ' +
                    'gene level (max value used for multiple probe matches to a gene). For RNASeq data, where raw means unnormalised ' +
                    'count values (genes is the same as raw), while cpm calculates cpm values.  ' + 
                    "If log2=true, numpy.log2(exp+1) will be applied, but if the values are already logged, such as for microarray data, " +
                    "it will not log again. If as_file=true, the entire expression matrix can be downloaded for the matching key.",
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

                {show: false, url:'/datasets/{dataset_id}/correlated-genes?gene_id={Ensembl_gene_id}&cutoff=30', 
                 heading: 'Fetches a list of genes correlated to the specified gene within the dataset. ' +
                    'A dictionary is returned in {gene_id: correlation_value} format, sorted with highest to lowest correlation values.  ' +
                    'Cutoff controls the number of genes returned.',
                 example:
    `{
        "ENSG00000102145": 0.9999999999999999,
        "ENSG00000029534": 0.9218905803378692,
        "ENSG00000222915": 0.9131896759304162,
        ...
}`       
                },

                {show: false, url:'/datasets/{dataset_id}/ttest?gene_id={Ensembl_gene_id}&sample_group={sample_group}&sample_group_item1={item1}&sample_group_item2={item2}', 
                 heading: 'Fetches a dictionary of T-test result applied to the dataset, gene_id, sample_group, ' +
                    'sample_group_item1, sample_group_item2 combination. Eg: ' +
                    '/datasets/8144/ttest?gene_id=ENSG00000197576&sample_group=cell_type&sample_group_item1=conventional%20dendritic%20cell&sample_group_item2=macrophage',
                 example:
    `{
        "statistic": -2.413572003929416,
        "pvalue": 0.028148025632041544
}`       
                },

                {show: false, url:"/search/datasets", 
                 heading: 'Fetches dataset metadata for datasets matching the search parameters. See below for parameters. ' +
                    'Note that some sample metadata are included in the results here, unlike /datasets/{dataset_id}/metadata ' +
                    'which only contains dataset metadata. Use query_string=* to return metadata for all datasets. ' +
                    'Multiple parameters work as "AND" operator, so platform_type=Microarray&projects=myeloid_atlas,blood_atlas will fetch ' +
                    'Microarray datasets under myeloid and blood atlas projects.',
                 insertMargin: true,
                 example:
    `Optional parameters:
        dataset_id: comma separated list of dataset ids to restrict the search on
        query_string: perform text search on this query string on dataset (and sample metadata if include_samples_query)
        include_samples_query: if true, query_string will search sample metadata as well as dataset metadata

        platform_type: comma separated list of platform types to restrict the search of datasets on
        projects: comma separated list of projects to restrict the search of datasets on
        organism: comma separated list of organisms to restrict the search of datasets on

        -- The parameters below are probably more useful for the Stemformatics website UI than general use
        and the output format is also slightly different if pagination_limit is specified.
        -- parameters for returning data formatted for a plotly's sunburst plot
        sunburst_inner: sample group (eg. 'cell_type') for inner wheel of sunburst
        sunburst_outer: sample group for outer wheel of sunburst
        sunburst_inner_cutoff: max number of items in the inner wheel
        sunburst_outer_cutoff: max number of items in the outer wheel

        -- parameters filtering data after the search; these work like a sub-query if present, where the counts are not affected
        filter_Project: comma separated list of projects to apply filter on (note capital 'P')
        filter_platform_type: platform type to apply filter on (not comma separated list)
        filter_cell_type: comma separated list of cell types to apply filter on
        filter_tissue_of_origin: comma separated list of tissues to apply filter on

        -- parameters for sorting
        sort_field: sort the list of datasets based on this field; default is 'name'
        sort_ascending: default is true

        -- parameters for pagination
        pagination_limit: number of items per page
        pagination_start: start page

    Example data returned
    [
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

                {show: false, url:'/search/samples?limit=50&orient=records', 
                 heading: 'Fetches sample metadata matching the search parameters. ' +
                    'limit is the total number of sample records to return ' +
                    'See example below for a full list of available fields.',
                 example:
    `Optional parameters:
        dataset_id: comma separated list of dataset ids to restrict the search on
        query_string: perform text search on this query string on sample metadata
        organism: comma separated list of organisms to restrict the search of samples on
        field: comma separated list of fields for output (eg. field=cell_type,tissue_of_origin will only return these fields)
    [
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
                    'organism is another parameter available to restrict the search to that organism. ' +
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
                    'organism is another parameter available to restrict the search to that organism. ' +
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

                {show: false, url:'/download?dataset_id={comma separated dataset ids}', 
                 heading: 'Creates one zip file containing all the files for each dataset specified. ' +
                    'Note that this operation may take a long time for many datasets.',
                 insertMargin: true,
                 example:
    `
    Downloaded files look like this:
        2000_expression_genes.tsv
        2000_expression_probes.tsv
        2000_metadata.tsv
        2000_samples.tsv
    `       
                },

                {show: false, url:'/genes/sample-group-to-genes?sample_group={sample_group}&sample_group_item={sample_group_item}&cutoff=10', 
                 heading: 'Returns highly expressed genes in specified sample_group and ' +
                    'sample_group_item (eg. cell_type=monocyte). The algorithm first finds all ' +
                    'datasets where the sample_group_item is defined and find genes with ' +
                    'high difference in mean, which is returned as rankScore.',
                 insertMargin: true,
                 example:
    `{
        "sampleGroup": "cell_type",
        "sampleGroupItem": "monocyte",
        "rankScore": [
            {
                "geneId": "ENSG00000215458",
                "meanRank": 0.8999700898495135,
                "datasetIds": "1000,6003,6463,6638",
                "count": 4
            },
            {
                "geneId": "ENSG00000174791",
                "meanRank": 0.83232307575388,
                "datasetIds": "1000,6003,6463,6638",
                "count": 4
            },
            ...
        ]
    }`       
                },

                {show: false, url:'/genes/gene-to-sample-groups?gene_id={Ensembl_gene_id}&sample_group=cell_type', 
                 heading: 'Returns highly expressed sample group items within sample_group ' +
                    'for selected gene. Higher score indicates higher expression within a dataset ' +
                    'as well as more datasets where similar pattern is observed. ',
                 example:
    `{
        "CML hematopoietic progenitor cell": {
            "score": [1.0],
            "datasetIds": [6610],
            "count": 1
        },
        "HepG2": {
            "score": [3.0],
            "datasetIds": [6245],
            "count": 1
        },
        ...
    } `       
                },

                {show: false, url:"/atlas-types", 
                 heading: 'Return a dictionary of available atlas types and versions. ',
                 insertMargin: true,
                 example:
    `{
        "myeloid": {
            "current_version": "1.0",
            "versions": [
                "1.0"
            ],
            "release_notes": [
                "These files correspond to those from www1.stemformatics.org:/var/www/pylons-data/prod/PCAFiles/atlas/, copied on 2021-02-11, and correspond to v7.3 in this versioning system.\n"
            ]
        },
        ...
    }`       
                },

                {show: false, url:"/atlases/{atlas_type}/{item}?version=''&orient=records&filtered=false&query_string=''&gene_id=''&as_file=false", 
                 heading: 'Fetches atlas data for atlas_type (one of myeloid,blood,dc). ' +
                    'Additional parameters are applicable depending on the item. version specifies a particular version of ' +
                    'the atlas to fetch. ',
                 insertMargin: true,
                 example:
    `For item=coordinates, returns PCA coordinates used by the atlas:
    [
        {
            "index": "1000_1674120023_B",
            "0": -0.3089953429523829,
            "1": -2.331254360290466,
            "2": -3.708666728816238
        },
        {
            "index": "1000_1674120023_F",
            "0": -1.6988969119278687,
            "1": -3.539426275611378,
            "2": -3.028939281330146
        },
        ...
    ]

    For item=samples, returns the sample table:
    [
        {
            "index": "7268_GSM2360259",
            "Cell Type": "hematopoietic multipotent progenitor",
            "Sample Source": "in vitro",
            "Progenitor Type": "pluripotent stem cell",
            "Activation Status": "growth factor",
            "Tissue": "in vitro",
            "Disease State": "normal",
            "Platform Category": "RNASeq"
        },
        ...
    ]

    For item=expression-values, returns expression values for gene_id.
    [
        {
            "index": "ENSG00000118513",
            "1000_1674120023_B": 0.9276657500763824,
            "1000_1674120023_F": 0.6500152765047357,
            "1000_1674120053_B": 0.7045142071494043,
            ...
        }
    ]

    For item=expression-file, file download is served for expression matrix
    For item=genes, file download is served for genes matrix.

    For item=colours-and-ordering, return the dictionary of colours and ordering used for the atlas
    {
        "colours": {
            "Sample Source": {
                "in vivo": "#54E4AD",
                "ex vivo": "#d87e22",
                "in vitro": "#a6611a",
                "in vivo (HuMouse)": "#4c9282"
            },
            ...
        },
        "ordering": {
            "Sample Source": [
                "in vivo",
                "ex vivo",
                "in vitro",
                "in vivo (HuMouse)"
            ],
            ...
        }
    }

    For item=possible-genes, returns matching genes in the atlas for query_string:
    [
        {
            "ensembl": "ENSG00000118513",
            "inclusion": false,
            "symbol": "MYB"
        },
        ...
    ]

    `       
                },

                {show: false, url:"/atlas-projection/{atlas_type}/{data_source}", 
                 heading: "Project query data onto atlas of atlas_type. dataSource is one of  ['stemformatics','user']. " +
                    "Note that this is a POST request, not GET.",
                 example:
    `The form posted should have following fields
        test_name: name given to the test dataset, and used as a prefix to projected samples (default 'test_data')
        test_sample_column: which column of sample table to group samples under (first column by default)

        -- If data_source=stemformatics
            name={Stemformatics dataset name (eg. 'Helft_2017_28723558')}

        -- else (data_source=user)
            test_expression: expression matrix as a file object
            test_samples: sample matrix as a file object

    Returns a dictionary, with following keys and values:
        error: if not empty string, there was an error with projection
        coords: coordinates of projection
        samples: sample table (same as input)
        sampleIds: index of sample table with test_name prepended
        column: test_sample_column
        capybara: capybara score where query sample ids are row ids and column from atlas form columns
    `       
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
