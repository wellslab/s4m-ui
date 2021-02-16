<template>
<b-container class="pt-4">
    <b-breadcrumb :items="breadcrumb"></b-breadcrumb>
    <Atlas atlasType="myeloid"/>
</b-container>
</template>

<script>
export default {
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Atlas', activet: true },
                { text: 'Myeloid', active: true },
            ],
        }
    }
};
</script>
