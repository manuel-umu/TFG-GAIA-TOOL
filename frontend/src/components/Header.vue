<template>
  <div class="list-header">
    <div style="display: flex;align-items: center;">
      <h1 class="title">{{ title }}</h1>
      <b-tooltip
          v-if="tooltip == 'report'"
          position="is-right"
          style="max-width: 100%; margin-left: 5px;margin-bottom:1.5em">
          <template #content>
            <div>
              <span>Reports can only be generated for closed audits</span>
            </div>
          </template>
          <b-icon class="mdi mdi-information-variant-circle-outline icon-info"></b-icon>
      </b-tooltip>
    </div>
    <div class="buttons">
      <b-select
        class="custom-per-page"
        v-if="perPage !== null"
        v-model="localPerPage"
        @input="$emit('update:perPage', localPerPage)"
      >
        <option
          v-for="n in perPageOptions"
          :key="n"
          :value="n"
        >
          {{ n }} per page
        </option>
      </b-select>

      <b-button
        v-if="showAdd"
        class="mdi mdi-plus add-button"
        @click="$emit('add')"
      />

      <b-dropdown v-if="showActions" aria-role="list" position="is-bottom-left">
        <template #trigger>
          <b-button>
            <b-icon class="mdi mdi-dots-horizontal" />
          </b-button>
        </template>
        <b-dropdown-item v-if="showRemove" @click="$emit('bulk-remove')">
          Remove selected
        </b-dropdown-item>
        <b-dropdown-item v-if="showImport" @click="$emit('import-csv')">
          Import indicators from CSV
        </b-dropdown-item>
        <b-dropdown-item v-if="showImport" @click="$emit('import-excel')">
          Import indicators from Excel
        </b-dropdown-item>
        <b-dropdown-item v-if="showExport" @click="$emit('export-csv')">
          Export indicators to CSV
        </b-dropdown-item>
        <b-dropdown-item v-if="showExport" @click="$emit('export-excel')">
          Export indicators to Excel
        </b-dropdown-item>
      </b-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BaseListHeader',
  props: {
    title: String,
    perPage: Number,
    perPageOptions: {
      type: Array,
      default: () => [5, 10, 25, 50, 100]
    },
    showAdd: Boolean,
    showActions: Boolean,
    showRemove: Boolean,
    showImport: Boolean,
    showExport: Boolean,
    tooltip: String,
  },
  data() {
    return {
      localPerPage: this.perPage
    }
  },
  watch: {
    perPage(val) {
      this.localPerPage = val
    }
  }
}
</script>

<style scoped lang="scss">

.list-header{
  display: flex; 
  justify-content: space-between;
}

.custom-per-page{
  margin-bottom: 8px;
  margin-right: 0.5em;
}

.add-button{
  background-color: #98A869 !important;
  color: white !important;
  margin-bottom: 20px;
  width: 40px;
}

.buttons {
  margin-bottom: 20px !important;
}

.title{
  font-size: 2em;
  margin-bottom: 0.5em !important;
}

</style>