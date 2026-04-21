<template>
  <section v-if="action === 'questionnaire'">
    <div style="display: flex; align-items: center; margin-bottom: 20px;">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeQuestionnaire"
      />
      <h1 class="title">Questionnaire</h1>
    </div>

    <div v-if="isLoading">Loading...</div>

    <div v-if="!isLoading">
      <div v-for="std in standards" :key="std.id" style="margin-bottom: 30px;">
        <h2>{{ std.code }} - {{ std.name }}</h2>

        <div v-for="dr in std.disclosure_requirements" :key="dr.id" class="box">
          <h4>{{ dr.code }} - {{ dr.name }}</h4>

          <div v-for="dp in dr.data_points" :key="dp.id" style="margin-bottom: 15px;">
            <label>{{ dp.name }} ({{ dp.data_type }})</label>

            <!-- boolean -->
            <b-switch
              v-if="dp.data_type === 'boolean'"
              v-model="dp.response.value_text"
              true-value="true"
              false-value="false"
            >
              {{ dp.response.value_text === 'true' ? 'Yes' : 'No' }}
            </b-switch>

            <!-- narrative -->
            <b-input
              v-else-if="dp.data_type === 'narrative'"
              type="textarea"
              rows="2"
              v-model="dp.response.value_text"
            />

            <!-- integer -->
            <b-input
              v-else-if="dp.data_type === 'integer'"
              type="number"
              v-model="dp.response.value_numeric"
            />

            <!-- percent -->
            <b-input
              v-else-if="dp.data_type === 'percent'"
              type="number"
              step="0.01"
              v-model="dp.response.value_numeric"
            />

            <!-- otros tipos: de momento no renderizamos nada -->
          </div>
        </div>
      </div>

      <div style="margin-top: 20px;">
        <b-button type="is-success" @click="saveDraft">Save</b-button>
      </div>
    </div>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'QuestionnaireForm',
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
      this.loadQuestionnaire();
    }
  },
  methods: {
    loadQuestionnaire: async function () {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${this.id_audit}/questionnaire`);
        this.standards = response.data.standards;
        this.isLoading = false;
      } catch (error) {
        console.log(error);
        this.isLoading = false;
      }
    },
    saveDraft: async function () {
      const data_points = [];
      this.standards.forEach(std => {
        std.disclosure_requirements.forEach(dr => {
          dr.data_points.forEach(dp => {
            data_points.push({
              data_point_id: dp.id,
              value_text: dp.response.value_text,
              value_numeric: dp.response.value_numeric,
              is_applicable: true,
              evidence_reference: null,
              status: 'draft',
            });
          });
        });
      });

      try {
        await axiosInstance.post(`/audits/${this.id_audit}/questionnaire`, { data_points });
        alert('Saved');
      } catch (error) {
        console.log(error);
        alert('Error saving');
      }
    },
    closeQuestionnaire: function () {
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
