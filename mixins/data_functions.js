// Convenience functions here for manipulating data, which may be used commonly across the application.
export default {
    methods: {
        _sampleGroupDictionary(sampleTable) {
            // Create a dictionary keyed on columns of sampleTable, where values are arrays
            // Eg: sampleTable = [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]
            // this function returns {'sample_id':['s1',...], 'cell_type':['T Cell',...], ...}
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

        _sampleGroupsForPlotlyTrace(sampleTable) {
            // Return an array of sample groups which can be used for plotly trace (eg. ['cell_type','tissue_of_origin',...]),
            // given sampleTable, which is in record form ([{'sample_id':'s1', 'cell_type':'T Cell',...}, ...]).
            // This function removes any sample group with one or less values, as these aren't useful for plotly traces.
            let sgd = this._sampleGroupDictionary(sampleTable);
            let sampleGroups = Object.keys(sgd).filter(item => sgd[item].length>1 && sgd[item].length<sampleTable.length);
            sampleGroups.sort();
            return sampleGroups;
        },

        _sampleIdsFromSampleGroup(sampleTable, sampleGroup) {
            // Return a dictionary of sample ids as array, keyed on each unique value in sampleGroup.
            // Eg: sampleTable = [{'sample_id':'s1', 'cell_type':'T Cell',...}, ...], sampleGroup = 'cell_type'
            // returns {'T Cell':['s1',...], ...}
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

    }
}