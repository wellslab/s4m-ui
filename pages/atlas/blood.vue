<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <Atlas atlasType="blood"/>
</b-container>
</template>

<script>
export default {
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Atlas', active: true },
                { text: 'Blood', active: true },
            ],
        }
    }
};
</script>
