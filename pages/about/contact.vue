<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'contact'" />
        </b-col>
        <b-col>
            <h3>Contact us</h3>
            <p>Please do not hesitate to contact us with your enquiries. We also welcome feedback (positive or negative). 
              Alerting us with any bugs or functions can be extremely useful for us, as they can sometimes go undetected otherwise.
              Feel free to also make new feature requests, as these could be community driven.
              Thanks for your interest in Stemformatics!
            </p>

            <ul>
                <li>Email: <b-link href="mailto:chen.zhan@unimelb.edu.au">chen.zhan@unimelb.edu.au</b-link></li>
                <li>Address: 30 Royal Parade, Kenneth Myer Building (144), University of Melbourne, Parkville, Victoria</li>
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
          { text: 'Contact us', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
