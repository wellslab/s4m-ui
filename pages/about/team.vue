<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
      <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
        <PageSidebar :sidebarType="'about'" :activeItem="'team'" />
      </b-col>
      <b-col>
        <h3>The Stemformatics Team</h3>
        <p>Stemformatics is developed and maintained by a small multidisciplinary team, mainly consisting of postdocs and 
          students. While physically based at the 
          <b-link href="https://biomedicalsciences.unimelb.edu.au/departments/anatomy-and-neuroscience/engage/cscs" target="_blank">
          Centre for Stem Cell Systems</b-link> at the University of Melbourne, the team has a current member working in Queensland and 
          has had members working from as far away as Dublin and Siberia in the past.
        </p>
        <div class='text-center'><b-img src="/img/StemformaticsTeamPhotos.png"></b-img></div>
        <b>Project lead: Christine Wells</b>
        <p>Christine has lead the Stemformatics project and its team from inception, sourcing funding and managing many of the staff 
          and students along the way, as well as engaging in the stem cell research communities both nationally and internationally.
          She also loves macrophages and her favourite gene is CLEC4.
        </p>
        <b>Project manager and developer: Jarny Choi</b>
        <p>Jarny has been involved in Stemformatics from its early days and has extensive experience in developing systems
          that makes genomics data easy to access and use. He is the main creator of the new Stemformatics website, playing many
          roles including bioinformatician, developer and system administrator within the project.
        </p>
        <b>Data processing and annotation: Suzy Butcher</b>
        <p>Suzy is a postdoc with a versatile set of skills, having worked in the lab as well as analysing data.
          Her current work in Stemformatics includes developing and implementing data processing pipelines as well as
          annotating thousands of the samples in the system for consistency and ontological insight.
        </p>
        <b>Other contributors</b>
        <p>Many of the other members of the lab make significant contributions towards Stemformatics, including 
        <b>Zahra Elahi</b> who has built the <b-link to='/atlas/dc'>DC Atlas</b-link> and
        <b>Nadia Rajab</b> who is the driving force behind the <b-link to='/atlas/myeloid'>Myeloid Atlas</b-link>.
        Yidi Deng develops methods to project and integrate single cell data within the atlas project.
        </p>
        <h5>Former team members</h5>
        <p>A huge range of people from a diverse range of backgrounds have worked on our team in the past, from undergraudate
          students to software engineers:<br/>
          Paul Angel, Jake Barry, Othmar Korn, Steve Englart, Jack Bransfield, Tyrone Chen, Rowland Mosbergen, Isha Nagpal,
          Chris Pacheco Rivera, Elizabeth Mason, Isaac Virshup, Catherine Song, Xinly Pan, Thanushi Peiris, Yifan Wang, Lu Chen, Palash, 
          Luxin, JingCheng Wang, Wu Yan, Ariane Mora, Sadia Waleem, Huan Wang, Melinda Wang, Peter Zhang. 
        </p>
        <h5>Former annotators</h5>
        <p>A key ingredient in making Stemformatics useful for research is extensive data annotation, most of which cannot be
          automated. Many people have contributed to this effort over the years, including Jessica Schwarber, Alejandro Vitale,
          and Jill Shepherd.
        </p>
        <h5>Collaborators</h5>
        <p>Stemformatics has been fortunate to collaborate with many excellent scientists over the years, both nationally and
          internationally, and these continue to drive the project forward. Particular thanks go to Kim-Anh Le Cao at the 
          University of Melbourne and Karen Keeshan, Joana Silvestre and Mhairi Copland from the University of Glasgow.
        </p>
        <p>We collaborated recently with a team from <b-link href="https://mdap.unimelb.edu.au/" target="_blank">Melbourne Data Analytics Platform</b-link>,
        whose members included Priyanka Pillai, Bobbie Shaban, Noel Faux, Aleks Michalewicz and Mar Quiroga. This collaboration produced 
        a better annotation structure that incorporated ontology-based choices for the hosted datasets, and improved ways to visualise the data.
        </p>
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
          { text: 'Team and collaborators', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
