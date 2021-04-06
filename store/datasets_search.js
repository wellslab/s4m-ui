// Stored states for the datasets/search page
export const state = () => ({
    tabIndex: 0,
    tableName: 'Search Results',
    tableDescription: '',
    datasetIds: [],
    tableColumns: []
})

export const mutations = {
    setTabIndex(state, value) { state.tabIndex = value },
    setTableName(state, value) { state.tableName = value },
    setTableDescription(state, value) { state.tableDescription = value },
    setDatasetIds(state, value) { state.datasetIds = value },
    setTableColumns(state, value) { state.tableColumns = value },
}
  
export const getters = {
    getTabIndex(state) { return state.tabIndex },
    getTableName(state) { return state.tableName },
    getTableDescription(state) { return state.tableDescription },
    getDatasetIds(state) { return state.datasetIds },
    getTableColumns(state) { return state.tableColumns },
}
