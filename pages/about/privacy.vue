<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <b-row>
        <b-col class="col-12 col-sm-12 col-md-6 col-lg-3 col-xl-3">
            <PageSidebar :sidebarType="'about'" :activeItem="'privacy'" />
        </b-col>
        <b-col>
            <h4>Stemformatics data are sourced from other Internet sites only for the convenience of its users.</h4>
            <p>Stemformatics is not responsible for the availability or content of these external sites, nor do we endorse, 
                warrant or guarantee the products, services or information described or offered.</p>
            <p>Information obtained on the Stemformatics website is not intended to take the place of medical advice from a fully qualified health professional.</p>
            <p>The views and opinions of authors expressed on Stemformatics website do not necessarily reflect those of the contributing organisations, 
                and they may not be used for advertising or product endorsement purposes without the author's explicit written permission.</p>

            <h4 class="mt-3">Stemformatics is subject to the laws governing privacy in Australia: The Commonwealth Privacy Act 1988.</h4>

            <p>Stemformatics uses session data to make the user experience better, by remembering the last dataset which was looked at in detail, 
                for example. Stemformatics uses Google Analytics to track user numbers, pages and access preferences to help us improve our services.</p>
            <p>Stemformatics may log IP addresses of requests made to the API server purely for the purpose of identifying potentially malicious
                requests. Stemformatics does not pass any information to another third party without the knowledge and prior consent of the user.</p>

            <h4>License agreement</h4>
            <p>Stemformatics is an open source resource freely available to anyone.  It is released under the 
                <b-link href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons Attribution 4.0 
                International License (CC BY 4.0)</b-link>, which apply to all software and code.
            </p>

            <h4 class="mt-3">Funding sources</h4>
            Our current list of funders include:
            <ul>
                <li>NHMRC Synergy grant 1186371</li>
                <li>ARC Future Fellowship (FT150100330)</li>
                <li>JEM Research Foundation philanthropic funding</li>
                <li>University of Melbourne Centre for Stem Cell Systems</li>
            </ul>

            Past funders include:
            <ul>
                <li>Stemformatics was established as part of the ARC Special Research Initiative to Stem Cells Australia (SR1101002)</li>
                <li>QLD Government Smart Futures Fellowship</li>
            </ul>


            <h4 class="mt-3">Any Questions?</h4>
            <p>Please contact us on <b-link href="mailto:jarnyc@unimelb.edu.au">jarnyc@unimelb.edu.au</b-link> 
              if you have any question regarding our privacy policy.</p>
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
          { text: 'Privacy, license and funding', active: true }
        ],
      }
    }
}
</script>

<style>
</style>
