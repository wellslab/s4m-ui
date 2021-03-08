<template>
<div>
<Breadcrumb :breadcrumb="breadcrumb"/>
<b-container class="pt-4">
    <Atlas atlasType="dc"/>
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
                { text: 'DC', active: true },
            ],
        }
    }
};
</script>
