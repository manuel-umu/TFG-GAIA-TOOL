<template>
  <section v-if="action === 'show'" class="modal-card-body">
    <div class="org-meta-grid">
      <b-field v-for="(value, label) in fields" :key="label" :label="label">
        
        <p v-if="isLinkField(label)" class="field-value">
          <a :href="`https://${value}`" target="_blank" class="field-link">{{ value }}</a>
        </p>

        <p v-else class="field-value">{{ value }}</p>
      </b-field>
    </div>

    <div v-if="$slots.default" class="org-lists">
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ShowForm',
  props: {
    action: String,        // Acción para mostrar u ocultar el formulario
    fields: Object,        // Campos que se van a mostrar (objeto con label: value)
  },
  methods: {
    isLinkField(fieldName) {
      const linkFields = ['Website'];
      return linkFields.includes(fieldName);
    }
  }
}
</script>

<style scoped>

.org-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1em;
  margin-bottom: 1.5em;
}

.org-lists {
  margin-top: 1em;
}

.field-value {
  font-weight: 500;
  color: #2c3e50;
  margin-top: 0.25em;
}

.field-link {
  color: #3498db;
  text-decoration: underline;
}

</style>
