<template>
<b-container>
    <p>You can define a custom sample group here by combining two existing sample groups together.
        Start selecting items from each sample group, and the third column will automatically show the combinations.
        Items where the combination yields no samples in it will be ignored later. 
        Note that currently only one custom sample group is available.
    </p>
    <b-row class="bg-white py-2">
        <b-col class="overflow-auto">
            <b-form-select v-model="selectedSampleGroup1" :options="sampleGroupsToShow" @change="selectedItems1=[]"></b-form-select>
            <div class='overflow-auto mt-2 p-1' style='max-height:500px; font-size:smaller'>
                <b-form-checkbox-group stacked v-model="selectedItems1" :options="sampleTypeOrderingFiltered[selectedSampleGroup1]"></b-form-checkbox-group>
            </div>
        </b-col>
        <b-col>
            <b-form-select v-model="selectedSampleGroup2" :options="sampleGroupsToShow" @change="selectedItems2=[]"></b-form-select>
            <div class='overflow-auto mt-2 p-1' style='max-height:500px; font-size:smaller'>
                <b-form-checkbox-group stacked v-model="selectedItems2" :options="sampleTypeOrderingFiltered[selectedSampleGroup2]"></b-form-checkbox-group>
            </div>
        </b-col>
        <b-col>
            <span class="custom-select" style="background:white">{{customGroupName}}</span>
            <ul class="overflow-auto mt-2 p-1" style='max-height:500px; font-size:smaller;'>
                <li v-for="item in customItems()" :key="item.sampleGroup"><span :style="item.sampleIds.length==0? 'color:#868e96' : 'color:inherit'">
                    &bull; {{item.sampleGroup}} ({{item.sampleIds.length}})</span>
                </li>
            </ul>
        </b-col>
    </b-row>
    <b-button-group class="mt-2 float-right">
        <b-button variant="dark" @click="save">save</b-button><b-button @click="close" class="ml-1">close</b-button>
    </b-button-group>
</b-container>
</template>

<script>
export default {

    props: {
        sampleTable: Object,
        sampleIds: Array,
        sampleTypeColours: Object,
        sampleGroups: Array,
        sampleTypeOrdering: Object,
        customGroupName: String,
    },

    data() {
        return {
            sampleGroupsToShow: [],
            selectedSampleGroup1: null,
            selectedSampleGroup2: null,
            sampleTypeOrderingFiltered: {},
            selectedItems1: [],
            selectedItems2: [],
            //customItemCount: 0, // this will count length of custom items without those with zero sample ids
        }
    },

    computed: {
    },

    methods: {

        // Return array of items after combining the selections from 1 and 2
        customItems() {
            let self = this;
            let group1 = self.sampleTable[self.selectedSampleGroup1];
            let group2 = self.sampleTable[self.selectedSampleGroup2];
            self.customItemCount = 0;

            // Create combinations of selected items and corresponding numbers
            let items = [];
            let sampleIdsInGroups = [];
            for (let i=0; i<self.selectedItems1.length; i++) {
                for (let j=0; j<self.selectedItems2.length; j++) {
                    // count the number of sampleIds which belong to both of these groups
                    let sampleIds = self.sampleIds.filter(sampleId => 
                        group1[sampleId]==self.selectedItems1[i] && group2[sampleId]==self.selectedItems2[j]);
                    sampleIdsInGroups.push(sampleIds);
                    items.push({'sampleGroup':self.selectedItems1[i] + "_" + self.selectedItems2[j], 'sampleIds':sampleIds});
                }
            }

            // Add "other" group - find all sampleIds not found above
            sampleIdsInGroups = [].concat.apply([], sampleIdsInGroups); // flatten the array
            if (sampleIdsInGroups.length>0) {
                items.push({'sampleGroup':'other', 
                            'sampleIds':self.sampleIds.filter(sampleId => sampleIdsInGroups.indexOf(sampleId)==-1)}
                          );
            }

            return items;
        },

        // Send signal to save the result
        save() {
            this.$emit('save', this.customItems());
        },

        // Send signal to close this component if used as a dialog
        close() {
            this.$emit('close');
        },
    },

    mounted() {
        // Customise some properties specific to this component
        this.sampleGroupsToShow = this.sampleGroups.filter(item => item !== this.customGroupName);  // remove customGroupName
        this.selectedSampleGroup1 = this.sampleGroupsToShow[0];
        this.selectedSampleGroup2 = this.sampleGroupsToShow[1];

        // sampleTypeOrderingFiltered is a modified version of sampleTypeOrdering that removes
        // blanks and inserts counts
        for (const [key,val] of Object.entries(this.sampleTypeOrdering)) {
            const filtered = val.filter(item => item!=''); // ['in vivo','ex vivo',...]
            const counts = filtered.map(item => Object.values(this.sampleTable[key]).filter(value => value==item).length);
            this.sampleTypeOrderingFiltered[key] = filtered.map((item,i) => {
                return {value:item, text:item + ' (' + counts[i] + ')'};
            });
        }

        // If customGroupName is included in sampleGroup, we need reconstruct current custom group
        if (this.sampleGroups.indexOf(this.customGroupName)!=-1) { 
            var orderedItems = this.sampleTypeOrdering[this.customGroupName];
            for (var i=0; i<orderedItems.length; i++) {
                var items = orderedItems[i].split("_");
                if (items[0]=="other" || items[1]=="other") continue;   // 
                if (this.selectedItems1.indexOf(items[0])==-1)
                    this.selectedItems1.push(items[0]);
                if (this.selectedItems2.indexOf(items[1])==-1)
                    this.selectedItems2.push(items[1]);
            }
        }
        //console.log(this.customGroupName);
    }
}
</script>

<style>
</style>
