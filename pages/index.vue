<template>
<b-container class="text-center h-100">
  <b-jumbotron header="Welcome to Stemformatics" header-level="4" class="bg-white" lead="Visualise hundreds of gene expression datasets">
  <b-carousel fade indicators controls>
    <b-carousel-slide caption="Explore Datasets and Samples">
      <template #img>
        <b-link to="/datasets/explore">
          <img class="d-block img-fluid w-100" src="/img/SunburstScreenshot1.png" alt="screenshot of sunburst plot">
        </b-link>
      </template>
    </b-carousel-slide>
    <b-carousel-slide caption="Integrated Data Atlas">
      <template #img>
        <b-link to="/atlas/myeloid">
          <img class="d-block img-fluid w-100" src="/img/AtlasScreenshot1.png" alt="screenshot of myeloid atlas">
        </b-link>
      </template>
    </b-carousel-slide>
    <b-carousel-slide caption="Discover genes and pathways">
      <template #img>
        <b-link to="/genes">
          <img class="d-block img-fluid w-100" src="/img/GeneExpressionScreenshot1.png" alt="screenshot of gene expression plot">
        </b-link>
      </template>
    </b-carousel-slide>
  </b-carousel>
  </b-jumbotron>
</b-container>
</template>

<script>
export default {

  data() {
    return {
      breadcrumb: [
        { text: 'Home', active: true },
      ],
        slide: 0,
        sliding: null
    }
  },

    methods: {
      onSlideStart(slide) {
        this.sliding = true
      },
      onSlideEnd(slide) {
        this.sliding = false
      }
    },

  mounted() {
  }
}
</script>

<style>
div.jumbotron {
  padding-top: 3rem;
}
.carousel-caption {
  color: black;
}
.carousel-indicators li {
  background-color: #999;
  background-color: rgba(70, 70, 70, 0.25);
}
.carousel-indicators .active {
  background-color: #444;
}

</style>
