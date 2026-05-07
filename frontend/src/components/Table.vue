<template>
  <b-table
    :data="data"
    :checkable="checkable"
    :checked-rows.sync="localSelected"
    :row-class="getRowClass"
    hover
    striped
  >
    <b-table-column
      v-for="col in columns"
      :key="col.field"
      :field="col.field"
      :label="col.label"
      :sortable="col.sortable"
      v-slot="props"
    >
      {{ col.render ? col.render(props.row) : props.row[col.field] }}
    </b-table-column>

    <b-table-column
      v-if="actions && actions.length"
      label="Actions"
      width="250"
    >
      <template v-slot="props">
        <b-tooltip
          v-for="(action, i) in actions"
          :key="i"
          v-if="!action.if || action.if(props.row)"
          :label="action.tooltip || ''"
          :active="!!action.tooltip"
          type="is-dark"
          position="is-top"
        >
          <b-button
            :class="action.icon"
            type="is-dark"
            inverted
            size="is-small"
            :disabled="action.disabledCondition ? action.disabledCondition(props.row) : false"
            @click="$emit(action.event, props.row)"
            style="background-color: unset; font-size:1em;"
          />
        </b-tooltip>
      </template>
    </b-table-column>
  </b-table>
</template>

<script>
export default {
  name: 'BaseDataTable',
  props: {
    data: {
      type: Array,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    actions: {
      type: Array,
      default: () => []
    },
    checkable: Boolean,
    selected: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localSelected: this.selected
    }
  },
  watch: {
    localSelected(val) {
      this.$emit('update:selected', val)
    },
    selected(val) {
      this.localSelected = val
    }
  },
  methods: {
    getRowClass(row) {
      if (this.$route.name === 'Audits'){
        if (row.state === 'Evaluated') {
          return 'row-evaluated';
        } else if (row.state === 'Pending') {
          return 'row-pending';
        } else if (row.state === 'Closed') {
          return 'row-closed';
        } else if (row.state === 'Not evaluated') {
          return 'row-not-evaluated';
        }
      }
      return '';
    }
  }
}
</script>

<style lang="scss">
.row-evaluated {
  background-color: #d0ebff !important;
}

.row-pending {
  background-color: #f8d7da !important;
}

.row-closed {
  background-color: #d7fdce !important;
}

.row-not-evaluated {
  background-color: #f9daae !important;
}

.b-table td,
.b-table th {
  vertical-align: middle !important;
}

</style>