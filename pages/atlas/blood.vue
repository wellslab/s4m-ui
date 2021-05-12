<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <Atlas atlasType="blood" displayName="Blood"/>
</b-container>
</div>
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
