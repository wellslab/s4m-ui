<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <!-- Can change between Atlas and AtlasBackup -->
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
                { text: 'Atlas', to: '/atlas/about' },
                { text: 'Myeloid', active: true },
            ],
        }
    },

};
</script>
