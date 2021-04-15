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
            <p>Please do not hesitate to contact us with your enquiries in relation to expession data requests, 
                protocol and biostats information or any other requests. We will endeavour to respond in a timely fashion. 
                Thanks for your interest in Stemformatics!
            </p>

            <ul>
                <li>Email: info@stemformatics.org</li>
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
