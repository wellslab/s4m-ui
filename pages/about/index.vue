<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'about'" />
        </b-col>
        <b-col>
            <h3 class="first-element">About Stemformatics
              <!-- Tour button example -->
              <!-- <button style="margin-right: 10em" @click="tour.start()" title="Click here for a quick tour of the page." type="button" class="question-button"> <span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
                </svg>
              </span>
            </button> -->
            </h3>

            <p>Stemformatics aims to provide high quality curated gene expression data to the research community.
                It evolved from the idea that an observation in one dataset is anecdotal, becomes generalisable if a pattern 
                is seen across several datasets, and predicts rules of cell behaviour if observed at sufficient scale.
                You will find a number of ways to <b-link to="/datasets/explore">explore the data</b-link> here, 
                as well as a suite of intuitive tools for visualising the data.
                We also host our novel <b-link to="/atlas/myeloid">integrated atlases</b-link>, which can be explored directly or 
                used as references in determining cell identity.
            </p>
            <div class='text-center'><b-img src="/img/StemformaticsSchematic.png" fluid></b-img></div>
        
            <h5 class="mt-4">Data types in Stemformatics</h5>
            <p class="mt-2">Stemformatics was originally developed for the stem cell community, hence it has a major focus on pluripotency, 
                tissue stem cells, and staged differentiation - especially on haematopoietic cell types. It has since expanded its repertoire
                to include many other cell types, including neurons and disease samples such as leukaemic cells. More details can 
                be found in our most recent <b-link href="https://academic.oup.com/nar/advance-article/doi/10.1093/nar/gky1064/5165343" target="_blank">publication</b-link>.
            </p>
            <b-card-group>
                <b-card>
                    <p>Datasets by platform type</p>
                    <b-table-lite small :items="summaryTable1" bordered></b-table-lite>
                    <p>(Above are publicly available datasets. We also host additional datasets which remain
                        private to collaborators until publication.)</p>
                </b-card>
                <b-card>
                    <p>Examples of common cell types</p>
                    <b-table-lite small :items="summaryTable2" bordered></b-table-lite>
                </b-card>
            </b-card-group>
            <h5 class="mt-4">New Stemformatics website</h5>
            <p class="mt-2">
                Stemformatics has been running for over 10 years now. We have recently developed a new website, 
                leveraging the latest software technologies available.
                If you were a previous user of Stemformatics, you'll mostly find a subset of the same data which were hosted on the previous site,
                with improved annotations and accessible with a new set of visualisation tools. Mouse datasets are still accessible through 
                individual dataset ids, but are omitted from various searches.</p>
                <p>Looking for the old site? It's been decommisioned now. 
                <b-link href="mailto:info@stemformatics.org">Contact us</b-link> if you need to access data from the old site.</p>
                <p>Looking for a private dataset you used to access? Please <b-link href="mailto:info@stemformatics.org">contact us</b-link>.
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
                { text: 'About', active: true },
                { text: 'About Stemformatics', active: true }
            ],
            summaryTable1: [],
            summaryTable2: [],
            tour: null,
      }
    },

    mounted() {
        this.$axios.get("/api/values/datasets/platform_type?include_count=true").then(res => {
            for (const [key,val] of Object.entries(res.data)) {
                this.summaryTable1.push({platform_type: key, number_of_datasets: val})
            }
        })

        this.$axios.get("/api/values/samples/cell_type?include_count=true").then(res => {
            let count = 0;
            let valuesToIgnore = [''];
            for (const [key,val] of Object.entries(res.data)) {
                if (valuesToIgnore.indexOf(key)==-1 && !key.startsWith('Day')) {
                    this.summaryTable2.push({cell_type: key, number_of_samples: val});
                    count++;
                }
                if (count>10) break;
            }
        })
        
        // New --
        this.$nextTick(() => {
          this.tour = this.$shepherd({
              // scrollTo: true,
              // scrollIntoView: { behavior: 'smooth', block: 'center' },
              useModalOverlay: true,
              canClickTarget: false,
              defaultStepOptions: {
                  cancelIcon: {
                    enabled: true,
                  }
              },

          });
        
          this.tour.addSteps([
          {
            title: 'Step 1',
            // scrollTo: true,
            canClickTarget: false,
            // canclicktar
            // arrow: false,
            attachTo: {
              element: this.$el.querySelector('.first-element'),
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
            text: 'This is a heading.',
          },
          {
            title: 'Step 2',
            // scrollTo: true,
            attachTo: {
              element: this.$el.querySelector('.mt-4'),
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
            text: 'This is another heading.',
          },
          {
            title: 'Step 3',
            // scrollTo: true,
            attachTo: {
              element: this.$el.querySelector('.mt-2'),
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
                  // After the first time viewing the tour, save a key to local storage
                  if(!localStorage.getItem('shepherd-tour')) {
                      localStorage.setItem('shepherd-tour', 'yes');
                  }

                  return this.hide();
                },
                text: 'Finish',
              },
            ],
            text: 'This is a paragraph.',
          },
        ]);

      // If the user has not visited the site before, start the tour
      // if(localStorage.getItem('shepherd-tour')) {
      //   this.tour.start();
      // }
     });
    // -- New

    }
}
</script>

<style>
h3 {
  margin: 0;
  display: inline-block;
}

h3,h4,h5 {
  color: #EE255F
}

.question-button {
  display: inline-block;
  border-radius: 8px;
  /* background-color: #e6741c; */
  background-color: #EE255F;
  border: none;
  color: #FFFFFF;
  text-align: center;
  font-size: 12px;
  padding: 6px;
  width: 60px;
  transition: all 0.5s;
  cursor: pointer;
  margin: 5px;
  /* float: right; */
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
</style>
