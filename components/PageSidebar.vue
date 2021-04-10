<template>
<div>
    <nav v-if="sidebarType=='about'">
        <b-list-group>
        <b-list-group-item :class="{current: activeItem=='about'}" href="/about">About Stemformatics</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='team'}" href="/about/team">Team</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='cite'}" href="/about/cite">How to cite us</b-list-group-item>
        <b-list-group-item href="#">About data processing</b-list-group-item>
        <b-list-group-item href="#">Privacy and disclaimer</b-list-group-item>
        <b-list-group-item href="#">Funding and collaborators</b-list-group-item>
        <b-list-group-item href="#">Contact us</b-list-group-item>
        </b-list-group>
    </nav>

    <nav v-if="sidebarType=='datasets'">
        <b-list-group>
        <b-list-group-item :class="{current: activeItem=='explore'}" href="#">Explore datasets</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='select'}" href="#">Search and filter</b-list-group-item>
        <b-list-group-item to="/datasets/view" :class="{current: activeItem=='view'}" href="#">View a dataset</b-list-group-item>
        <b-list-group-item to="/datasets/api" :class="{current: activeItem=='api'}" href="#">API access</b-list-group-item>
        <b-list-group-item :class="{current: activeItem=='annotation'}" href="#">About sample annotation</b-list-group-item>
        </b-list-group>
    </nav>

    <nav v-if="sidebarType=='atlas'">
        <b-list-group>
        <b-list-group-item to="/atlas/myeloid" :class="{current: activeItem=='myeloid'}" href="#">Myeloid atlas</b-list-group-item>
        <b-list-group-item to="/atlas/blood" :class="{current: activeItem=='blood'}" href="#">Blood atlas</b-list-group-item>
        <b-list-group-item to="/atlas/about" :class="{current: activeItem=='about'}" href="#">About atlases</b-list-group-item>
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