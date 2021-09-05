<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <Atlas atlasType="dc" displayName="Dendritic Cell"/>
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
                { text: 'DC', active: true },
            ],
        }
    }
};
</script>
