// Stored states for the datasets/view page where details about a single dataset can be viewed.
export const state = () => ({   // Return some default even if there's nothing in the store
    datasetId: process.browser? localStorage.getItem('s4m:datasets_view.selectedDatasetId') || 7283 : 7283,
})

export const mutations = {
    setDatasetId(state, value) { state.datasetId = value; 
        if (process.browser) localStorage.setItem('s4m:datasets_view.selectedDatasetId', value) },
}
  
export const getters = {
    getDatasetId(state) { return state.datasetId },
}
