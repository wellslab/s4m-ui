<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <nav>
            <b-list-group>
            <b-list-group-item :class="{current: activeItem=='Overview'}" @click="activeItem='Overview'" href="#">Overview</b-list-group-item>
            <b-list-group-item :class="{current: activeItem=='Method'}" @click="activeItem='Method'" href="#">Method</b-list-group-item>
            <b-list-group-item :class="{current: activeItem=='Projections'}" @click="activeItem='Projections'" href="#">Projections</b-list-group-item>
            </b-list-group>
        </nav>
      </b-col>
      <b-col>
        <h3>About the Stemformatics integrated atlases</h3>
        <div v-if="activeItem=='Overview'">
          <h5>Overview</h5>
            <p>The Stemformatics integrated atlases provide interactive pages based on 
              <b-link href="https://en.wikipedia.org/wiki/Principal_component_analysis" target="_blank">
            PCA (principal components anaysis)</b-link> plots, compiled from hundreds of samples and tens of datasets (microarray and bulk RNA-seq).
            Currently 3 atlases are hosted at Stemformatics, each focused on a particular biological system:
            <ul class="mt-2">
              <li><b-link to='/atlas/myeloid'>Myeloid Atlas</b-link>: the samples in this atlas represent human monocyte, 
              dendritic cell and macrophage biology</li>
              <li><b-link to='/atlas/blood'>Blood Atlas</b-link>: this atlas contains a more broad range of human blood cells</li>
              <li><b-link to='/atlas/dc'>DC Atlas</b-link>: contains samples from human dendritic cells and monocytes</li>
            </ul>
            </p>
            <div class='text-center'><b-img src="/img/AtlasSummaryWithIcons.png" fluid></b-img></div>
            <p class='mt-2'>Read more about the Myeloid atlas at <b-link href="https://doi.org/10.1016/j.stemcr.2021.04.010" target="_blank">Stem Cell Reports</b-link> and
              blood atlas at <b-link href="https://doi.org/10.1371/journal.pcbi.1008219" target="_blank">PLOS Comp Biology</b-link>.
            </p>
        </div>
        <div v-if="activeItem=='Method'">
          <h5>Method</h5>
            <p>In brief, the data integration here has been done by first selecting appropriate samples across many curated datasets of
            relevance, then performing an evaluation of each gene's variance on batch and filtering out genes where this is large.
            This method achieves data integration across multiple platforms and data types quite robustly, as long as cell types are represented
            well across multiple batches. We normalise rank prior to gene filtering in order to use the same scale of values,
            but no other value transformation takes place, at the expense of retaining only a subset of all genes. More details 
            on the method used are available at <b-link href="https://doi.org/10.1371/journal.pcbi.1008219" target="_blank">Angel, et. al. (PLOS Comp Biology)</b-link>.</p>
            <div class='text-center'><b-img src="/img/AtlasMethodSummary.png" fluid></b-img></div>
            <p>When you perform a gene expression plot, you will see some genes in brackets on autocomplete. Even though the 
            values of these genes are shown, beware that these genes have been filtered out before constructing the PCA due to their 
            high variance across batches.</p>
        </div>
        <div v-if="activeItem=='Projections'">
          <h5>Projections</h5>
            <p>You can project samples from your own dataset to the atlas using the "project other data" function. 
            This can give you some idea about the transcriptional distance of those samples to those in the atlas.
            To do this, you need to provide two files: expression matrix and samples. Both files need to be tab separated text files.
            Row ids of the expression file must be Ensembl ids. 
            You can download example <b-link href="https://data.stemformatics.org/files/notta_expression.tsv">expression matrix</b-link> and
            <b-link href="https://data.stemformatics.org/files/notta_samples.tsv">sample description</b-link> files, if you want to examine the exact format.
            Check out the <b-link href="/AtlasVignette/Stemformatics_atlas_projection_vignette.html" target="_blank">vignette</b-link> 
            provided for more detail on projections, including how to project single cell RNA-Seq data.</p>

            <div class='text-center'><b-img src="/img/AtlasProjectionSchematic.png" fluid></b-img></div>

            <p>The projection method uses only the genes which are common between
            the atlas and the dataset being projected, so if the number of these genes are too small, you may receive an error message.
            Note that if samples are transcriptionally very different to blood cells, such as fibroblasts or neurons, projected 
            points will end up in the central region of the PCA. This region corresponds to coordinates where samples sit equally far away 
            from all regions of the PCA.</p>

            <p>If you find projection not working, it's most likely due to file format issue, or null values in the expression 
            (best to not have these). Feel free to <b-link to='/about/contact'>contact us</b-link> and we may be able to help.
            This also helps us to improve this functionality in future by identifying common errors.</p>
        </div>
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
          { text: 'Atlases', active: true },
          { text: 'About', active: true }
        ],
        activeItem: "Overview"
      }
    }
}
</script>

<style>
</style>
