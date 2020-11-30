<template>
<div>
    <nav v-if="sidebarType=='about'">
        <b-list-group>
        <b-list-group-item>About Stemformatics</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='team'}">Team</b-list-group-item>
        <b-list-group-item>How to cite us</b-list-group-item>
        <b-list-group-item>About data processing</b-list-group-item>
        <b-list-group-item>Privacy and disclaimer</b-list-group-item>
        <b-list-group-item>Funding and collaborators</b-list-group-item>
        <b-list-group-item>Contact us</b-list-group-item>
        </b-list-group>
    </nav>

    <nav v-if="sidebarType=='datasets'">
        <b-list-group>
        <b-list-group-item :class="{current: activeItem=='explore'}">Explore datasets</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='select'}">Select and filter</b-list-group-item>
        <b-list-group-item to="/datasets/view" :class="{current: activeItem=='view'}">View a dataset</b-list-group-item>
        <b-list-group-item to="/datasets/api" :class="{current: activeItem=='api'}">API access</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='annotation'}">About sample annotation</b-list-group-item>
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
  background-color:#FEEFEF !important;
}
</style>