<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <Atlas atlasType="ma" displayName="Myeloid Activation"/>
</b-container>
</div>
</template>

<script>
export default {
    data() {
        return {
            breadcrumb: [
                { text: 'Home', to: '/' },
                { text: 'Atlas', to: '/atlas/about' },
                { text: 'Myeloid Activation', active: true },
            ],
        }
    }
};
</script>
