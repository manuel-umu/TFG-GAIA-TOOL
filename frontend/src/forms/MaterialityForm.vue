<template>
  <section v-if="action === 'materiality'">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeMateriality"
      />
      <h1 class="title">Materiality</h1>
    </div>

    <div v-if="isLoading">Loading...</div>

    <div v-if="!isLoading">
      <table class="table is-fullwidth is-bordered">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Material?</th>
            <th>Justification</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="std in standards" :key="std.id">
            <td>{{ std.code }}</td>
            <td>{{ std.name }}</td>
            <td>{{ std.category }}</td>
            <td>
              <b-switch v-model="std.is_material"></b-switch>
            </td>
            <td>
              <b-input
                v-model="std.justification"
                type="textarea"
                rows="2"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px;">
        <b-button type="is-success" @click="saveMateriality">
          Save
        </b-button>
      </div>
    </div>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'MaterialityForm',
  props: {
    action: String,
    id_audit: Number,
  },
  data() {
    return {
      isLoading: false,
      standards: [],
    };
  },
  mounted() {
    if (this.id_audit) {
      this.loadMateriality();
    }
  },
  methods: {
    loadMateriality: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${this.id_audit}/materiality`);
        this.standards = response.data.map(s => {
          s.is_material = s.assessment.is_material;
          s.justification = s.assessment.justification;
          return s;
        });
        this.isLoading = false;
      } catch (error) {
        console.log(error);
        this.isLoading = false;
      }
    },
    saveMateriality: async function() {
      const payload = this.standards.map(s => ({
        standard_id: s.id,
        is_material: s.is_material,
        justification: s.justification,
      }));
      try {
        await axiosInstance.post(`/audits/${this.id_audit}/materiality`, { standards: payload });
        alert('Saved');
        this.closeMateriality();
      } catch (error) {
        console.log(error);
        alert('Error saving');
      }
    },
    closeMateriality: function() {
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
    },
  },
};
</script>

<style scoped>
.button-back {
  margin-right: 20px;
  color: #adb987;
  border-radius: 30px;
  max-width: 40px;
}

.title {
  margin-top: 0px !important;
  margin-bottom: 0px !important;
}
</style>
