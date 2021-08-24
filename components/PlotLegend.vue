Component designed to be used as interactive plotly legends, instead of the
default legends provided by plotly (hence use showlegend=false in layout for corresponding plot).

Main input for data is through "legends" property, which looks like
{'cell_type':[{value:'HSC', sampleIds:['s1','s2',...], visible:true, ...}, ...], ...}
See data_functions.js:_legendsFromSampleTable for expected data.

<template>
<div class="card-body">
    <slot name="header">colour by:</slot>
    <b-form-select size="sm" v-model="selectedSampleGroup" :options="sampleGroups" 
        @change="$emit('sample-group-changed', {'selectedSampleGroup':selectedSampleGroup})" class="ml-1"></b-form-select>
    <ul class="mt-3 list-unstyled p-0">
        <li v-for="legend in legends[selectedSampleGroup]" :key="legend.value" 
            :class="(itemsWithMargins && itemsWithMargins[selectedSampleGroup] && itemsWithMargins[selectedSampleGroup].indexOf(legend.value)!=-1)? 'mt-2' : ''">
            <b-link @click="$emit('legend-clicked', legend)" style="font-size:13px;">
                <b-icon-circle-fill v-if="!itemsWithDiffShapes || itemsWithDiffShapes[selectedSampleGroup].indexOf(legend.value)==-1" 
                    :style="{'color': legend.colour, 'opacity': legend.visible? 1:0.6}" scale="0.6"></b-icon-circle-fill>
                <b-icon-diamond v-if="itemsWithDiffShapes && itemsWithDiffShapes[selectedSampleGroup].indexOf(legend.value)!=-1" 
                    :style="{'color': legend.colour, 'opacity': legend.visible? 1:0.6}" scale="0.6"></b-icon-diamond>
                <span :style="{'color': legend.visible? 'black':'#a7a7a7', 'font-weight': (itemsToHighlight && itemsToHighlight[selectedSampleGroup] && itemsToHighlight[selectedSampleGroup].indexOf(legend.value)!=-1)? 'bold':'normal'}">
                    {{legend.value}} ({{legend.number}})</span>
            </b-link>
        </li>
    </ul>
</div>
</template>

<script>
export default {
    props: {
        legends: Object, // object that holds all legend data

        sampleGroupsOrdered: Array, // ordered list of sample groups
        initialSampleGroup: String,
        
        itemsToHighlight: Object,  // highlight these items
        itemsWithMargins: Object,
        itemsWithDiffShapes: Object
    },

    data() {
        return {
            sampleGroups: [],
            selectedSampleGroup:'cell_line',
        }
    },

    watch: {
        legends: function() {
            if (this.sampleGroupsOrdered && this.sampleGroupsOrdered.length>0)
                this.sampleGroups = this.sampleGroupsOrdered;
            else {
                this.sampleGroups = Object.keys(this.legends);
                this.sampleGroups.sort();
            }
            this.selectedSampleGroup = (this.initialSampleGroup && this.sampleGroups.indexOf(this.initialSampleGroup)!=-1)? 
                this.initialSampleGroup : this.sampleGroups[0];
        },
    },

    methods: {

        // Return true if legend.value matches itemsToHighlight
        legendToHighlight(legend) {
            if (!this.itemsToHighlight) return false;
            const items = this.itemsToHighlight[this.selectedSampleGroup];  // eg ['HSC','B Cell']
            if (items && items.length>0) {
                return items[0]==legend.value || items.length>1 && items[1]==legend.value;
            }
            return false;
        },

    },

    // Note that a component may mount before page elements, so use watch to populate data which may get fetched after component
    mounted() {
    }
}
</script>

<style>

</style>