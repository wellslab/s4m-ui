<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <Atlas atlasType="myeloid" displayName="Myeloid"/>
</b-container>
</div>
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
