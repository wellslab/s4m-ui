<template>
<div>
    <nav v-if="sidebarType=='about'">
        <b-list-group>
        <b-list-group-item to="/about" :class="{current: activeItem=='about'}">About Stemformatics</b-list-group-item>
        <b-list-group-item to="/about/team" :class="{current: activeItem=='team'}">Team and collaborators</b-list-group-item>
        <b-list-group-item to="/about/cite" :class="{current: activeItem=='cite'}">How to cite us</b-list-group-item>
        <b-list-group-item to="/about/processing" :class="{current: activeItem=='processing'}">About data processing</b-list-group-item>
        <b-list-group-item to="/about/privacy" :class="{current: activeItem=='privacy'}">Privacy, license and funding</b-list-group-item>
        <b-list-group-item to="/about/developers" :class="{current: activeItem=='developers'}">For developers</b-list-group-item>
        <b-list-group-item to="/about/contact" :class="{current: activeItem=='contact'}">Contact us</b-list-group-item>
        </b-list-group>
    </nav>

    <nav v-if="sidebarType=='datasets'">
        <b-list-group>
        <b-list-group-item to="/datasets/explore" :class="{current: activeItem=='explore'}">Explore data</b-list-group-item>
        <b-list-group-item to="/datasets/collections" :class="{current: activeItem=='collections'}">View collections</b-list-group-item>
        <b-list-group-item to="/datasets/filter" :class="{current: activeItem=='filter'}">Filter datasets</b-list-group-item>
        <b-list-group-item to="/datasets/view" :class="{current: activeItem=='view'}">View a dataset</b-list-group-item>
        <b-list-group-item to="/datasets/api" :class="{current: activeItem=='api'}">API access</b-list-group-item>
        </b-list-group>
    </nav>

    <nav v-if="sidebarType=='atlas'">
        <b-list-group>
        <b-list-group-item to="/atlas/myeloid" :class="{current: activeItem=='myeloid'}">Myeloid atlas</b-list-group-item>
        <b-list-group-item to="/atlas/blood" :class="{current: activeItem=='blood'}">Blood atlas</b-list-group-item>
        <b-list-group-item to="/atlas/about" :class="{current: activeItem=='about'}">About atlases</b-list-group-item>
        </b-list-group>
    </nav>
</div>
</template>

<script>
export default {
    name: "PageSidebar",
    props: ['sidebarType', 'activeItem'],

    data() {
        return {
        }
    },
}
</script>

<style>
.current {
  background-color:#000 !important;
  color: white !important;
}
</style>