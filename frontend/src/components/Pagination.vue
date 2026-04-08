<template>
  <div class="pagination">
    <b-pagination
      v-model="localPage"
      :total="total"
      :per-page="perPage"
      size="is-small"
      @change="$emit('change', localPage)"
    />
  </div>
</template>

<script>
export default {
  name: 'BasePagination',
  props: {
    total: Number,
    perPage: Number,
    currentPage: Number
  },
  data() {
    return {
      localPage: this.currentPage
    }
  },
  watch: {
    currentPage(val) {
      this.localPage = val
    }
  }
}
</script>
