<template>
<b-container>
    <b-row class="bg-white py-2">
        <b-col class="overflow-auto">
            <b-form-select v-model="selectedSampleGroup1" :options="sampleGroupsToShow" @change="selectedItems1=[]" size="sm"></b-form-select>
            <div class='overflow-auto mt-2 p-1' style='max-height:250px;'>
                <b-link @click="toggleSelectAll(0)">select all/none</b-link>
                <b-form-checkbox-group stacked v-model="selectedItems1" :options="sampleTypeOrderingFiltered[selectedSampleGroup1]"></b-form-checkbox-group>
            </div>
        </b-col>
        <b-col>
            <b-form-select v-model="selectedSampleGroup2" :options="sampleGroupsToShow" @change="selectedItems2=[]" size="sm"></b-form-select>
            <div class='overflow-auto mt-2 p-1' style='max-height:300px;'>
                <b-link @click="toggleSelectAll(1)">select all/none</b-link>
                <b-form-checkbox-group stacked v-model="selectedItems2" :options="sampleTypeOrderingFiltered[selectedSampleGroup2]"></b-form-checkbox-group>
            </div>
        </b-col>
        <b-col>
            <b-form-input v-model="customGroupName" size="sm"></b-form-input>
            <ul class="overflow-auto mt-2 p-1" style='max-height:300px;'>
                <li v-for="item in customItems()" :key="item.sampleGroup"><span :style="item.sampleIds.length==0? 'color:#868e96' : 'color:inherit'">
                    &bull; {{item.sampleGroup}} ({{item.sampleIds.length}})</span>
                </li>
            </ul>
        </b-col>
    </b-row>
    <b-button-group size="sm" class="mt-2 float-left">
        <b-button @click="save">Save</b-button>
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
            sampleTypeOrderingFiltered: {},  // modified from sampleTypeOrdering to remove blanks, etc
            selectedItems1: [],
            selectedItems2: [],
            selectAll: [false, false],
            //customItemCount: 0, // this will count length of custom items without those with zero sample ids
        }
    },

    methods: {

        setData() {
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
        },

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

        toggleSelectAll(key) {
            let target = this.sampleTypeOrderingFiltered[key==0? this.selectedSampleGroup1: this.selectedSampleGroup2];
            this.selectAll[key] = !this.selectAll[key];
            if (this.selectAll[key]) {
                if (key==0)
                    this.selectedItems1 = target.map(item => item.value);
                else
                    this.selectedItems2 = target.map(item => item.value);
            } else {
                if (key==0)
                    this.selectedItems1 = [];
                else
                    this.selectedItems2 = [];
            }
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

    watch: {
        sampleTypeOrdering: function() {
            this.setData();
        }
    }
}
</script>

<style>
</style>
