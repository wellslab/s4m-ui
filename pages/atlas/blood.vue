<template>
</template>

<script>
export default {
    middleware: [
        function({ redirect }) {
            redirect('/atlas?type=blood');
        },
    ],
};
</script>
