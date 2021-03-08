export const state = () => ({
    tabIndex: 0,
    datasetName: 'Search Results',
    datasetDescription: '',
    datasetIds: []
})

export const mutations = {
    setTabIndex(state, value) { state.tabIndex = value },
    setDatasetName(state, value) { state.datasetName = value },
    setDatasetDescription(state, value) { state.datasetDescription = value },
    setDatasetIds(state, value) { state.datasetIds = value }
}
  
export const getters = {
    getTabIndex(state) { return state.tabIndex },
    getDatasetName(state) { return state.datasetName },
    getDatasetDescription(state) { return state.datasetDescription },
    getDatasetIds(state) { return state.datasetIds },
}
