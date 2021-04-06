// Stored states for the datasets/view page where details about a single dataset can be viewed.
export const state = () => ({   // Return some default even if there's nothing in the store
    datasetId: 7283,
})

export const mutations = {
    setDatasetId(state, value) { state.datasetId = value },
}
  
export const getters = {
    getDatasetId(state) { return state.datasetId },
}
