// Convenience functions here for manipulating data, which may be used commonly across the application.
// Since these functions may end up across the entire application, use underscore convention to find them more easily.
export default {
    methods: {
        // Create a dictionary keyed on columns of sampleTable, where values are arrays
        // Eg: sampleTable = [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]
        // returns {'sample_id':['s1',...], 'cell_type':['T Cell',...], ...}
        _sampleGroupDictionary(sampleTable) 
        {
            let sgd = {};
            for (let i=0; i<sampleTable.length; i++) {
                for (let key in sampleTable[i]) {
                    if (!(key in sgd))
                        sgd[key] = [];
                    if (sgd[key].indexOf(sampleTable[i][key])==-1)
                        sgd[key].push(sampleTable[i][key]);
                }
            }
            return sgd;
        },

        // Return an array of sample groups which can be used for plotly trace (eg. ['cell_type','tissue_of_origin',...]),
        // given sampleTable, which is in record form ([{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]).
        // This function removes any sample group with one or less values, as these aren't useful for plotly traces.
        // Also removes fields under hideKeys.
        _sampleGroupsForPlotlyTrace(sampleTable) 
        {
            const hideKeys = ["sample_description","external_source_id"];
            let sgd = this._sampleGroupDictionary(sampleTable);
            let sampleGroups = Object.keys(sgd).filter(item => sgd[item].length>1 && sgd[item].length<sampleTable.length && hideKeys.indexOf(item)==-1);

            // Sort these with some preferences to certain fields 
            // (from https://stackoverflow.com/questions/13304543/javascript-sort-array-based-on-another-array)
            const sorted = ['cell_type','sample_type']; // remember that not all sampleGroups will have all these values
            sampleGroups.sort((a,b) => {
                const index1 = sorted.indexOf(a);
                const index2 = sorted.indexOf(b);
                return (index1 > -1 ? index1 : Infinity) - (index2 > -1 ? index2 : Infinity);
            });
            return sampleGroups;
        },

        // Return a dictionary of sample ids as array, keyed on each unique value in sampleGroup.
        // Eg: sampleTable = [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...], sampleGroup = 'cell_type'
        // returns {'T Cell':['s1',...], ...}
        _sampleIdsFromSampleGroup(sampleTable, sampleGroup) 
        {
            let sampleIds = {}; // dict to return
            for (let i=0; i<sampleTable.length; i++) {
                let sampleId = sampleTable[i]["sample_id"];
                let value = sampleTable[i][sampleGroup];
                if (!(value in sampleIds))
                    sampleIds[value] = [];
                sampleIds[value].push(sampleId);
            }
            return sampleIds;
        },

        // Return a dictionary which can be used as plotly legends.
        // Eg: sampleTable = [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]
        // returns {'cell_type':[{'value':'T Cell', 'number':2, 'sampleIds':['s1','s2'],
        //          'colour':'#cccccc', 'visible':true,},...], ...}
        // params can be used to fine-tune, such as providing ordering for sampleGroupItems
        _legendsFromSampleTable(sampleTable, params) 
        {
            // console.log("Printing sample table");
            // console.log(sampleTable);

            // If params is undefined, create an empty dictionary. This means params.orient will also be undefined
            // (while params['orient'] will throw an error), which is convenient for code below.
            if (params==undefined) params = {};

            // object to return
            let legends = {};
            // Distinct set of colours to use if colour isn't specified in params
            const exampleColours = ['#64edbc', '#6495ed', '#ed6495', '#edbc64', '#8b8b00', '#008b00', '#8b008b', '#00008b', 
                                    '#708090', '#908070', '#907080', '#709080', '#008080', '#008000', '#800000', '#bca68f', 
                                    '#bc8fa6', '#bc8f8f', '#008160', '#816000', '#600081', '#ff1493', '#14ff80'];

            if (params.orient) {   // alternative format for sampleTable, so convert
                let table = [];
                if (params.orient=='dict') { // {col:{row:value}} format
                    // Find all sampleIds which will define each row of table uniquely
                    const sampleGroups = Object.keys(sampleTable);
                    
                    // console.log("sampleGroups:");
                    // console.log(sampleGroups);
                    // console.log(sampleGroups[0]);
                    // console.log(sampleTable[sampleGroups[0]]);
                    
                    const sampleIds = Object.keys(sampleTable[sampleGroups[0]]);
                    table = sampleIds.map(sampleId => {
                        let dict = {'sample_id':sampleId};
                        sampleGroups.forEach(sampleGroup => {
                            dict[sampleGroup] = sampleTable[sampleGroup][sampleId];
                        });
                        return dict;
                    })
                } // other orient formats should be supported in future
                sampleTable = table;
            }

            let sampleGroups = this._sampleGroupsForPlotlyTrace(sampleTable);

            // See if there is a localStorage version of sampleGroupItemsOrdered - use this below
            let sampleGroupItemsOrdered = localStorage.getItem('s4m:datasets_view.sampleGroupItemsOrdered.' + params.datasetId) || '';
            sampleGroupItemsOrdered = sampleGroupItemsOrdered!=''? JSON.parse(sampleGroupItemsOrdered) : {};

            sampleGroups.forEach(sampleGroup => {
                // First collect sample ids based on sampleGroup
                let sampleIds = this._sampleIdsFromSampleGroup(sampleTable, sampleGroup);
                let groupItems = Object.keys(sampleIds);

                // Ordering of groupItems may be specified in params - otherwise try localStorage, then finally alphabetical sort
                // Note that we can't do params.sampleGroupItemsOrdered.sampleGroup because sampleGroup is a dynamic variable, not static property.
                if (params.sampleGroupItemsOrdered && params.sampleGroupItemsOrdered[sampleGroup])
                    groupItems = params.sampleGroupItemsOrdered[sampleGroup].filter(item => item!='');
                else if (sampleGroupItemsOrdered[sampleGroup])
                    groupItems = sampleGroupItemsOrdered[sampleGroup].filter(item => item!='');    
                else
                    groupItems.sort();

                // Keys of sampleIds form sample group items. Create a legend per sample group item
                legends[sampleGroup] = groupItems.map((value,i) => {
                    const colour = (params.sampleGroupItemColours && params.sampleGroupItemColours[sampleGroup])? 
                        params.sampleGroupItemColours[sampleGroup][value] : exampleColours[i % exampleColours.length];
                    const projectedItem = params.projectedItems && params.projectedItems.indexOf(value)!=-1;
                    return {'value':value, 'number':sampleIds[value].length, 'sampleIds':sampleIds[value], 'colour':colour, 'visible':true, 'projectedItem':projectedItem};
                });
            });
            return legends;
        }
    }
}