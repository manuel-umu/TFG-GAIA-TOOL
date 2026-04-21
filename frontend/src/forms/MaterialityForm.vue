<template>
  <section v-if="action === 'materiality'">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeMateriality"
      />
      <h1 class="title">Double Materiality Assessment</h1>
    </div>

    <b-loading :is-full-page="false" v-model="isLoading" />

    <div v-if="!isLoading && standards.length === 0" class="notification is-light">
      No standards found for this audit.
    </div>

    <div v-if="!isLoading && standards.length > 0">
      <div v-for="(standards, category) in groupedStandards" :key="category" style="margin-bottom: 32px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span
            class="tag category-tag is-medium"
            :class="categoryTagClass(category)"
            style="margin-right: 10px; font-weight: 600; letter-spacing: 0.03em;"
          >
            {{ category }}
          </span>
          <hr style="flex: 1; margin: 0; border-color: #e0e0e0;" />
        </div>

        <!-- Lista de estandares para cada categoria ESG -->
        <div
          v-for="standard in standards"
          :key="standard.id"
          class="box standard-box"
        >
          <div class="standard-header">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span class="tag is-dark standard-code">{{ standard.code }}</span>
              <span class="standard-name">{{ standard.name }}</span>
              <b-tag v-if="standard.is_mandatory" type="is-warning is-light" style="font-size: 0.75rem;">
                <b-icon icon="lock" size="is-small" style="margin-right: 3px;" />
                Mandatory
              </b-tag>
              <b-tag v-if="standard.assessment && standard.assessment.assessed_at" type="is-info is-light" style="font-size: 0.72rem;">
                Last assessed: {{ formatDate(standard.assessment.assessed_at) }}
              </b-tag>
            </div>

            <div class="switch-wrapper">
              <span
                class="switch-label"
                :style="{ color: localData[standard.id].is_material ? '#3a7d44' : '#888' }"
              >
                {{ localData[standard.id].is_material ? 'Material' : 'Not material' }}
              </span>
              <b-switch
                v-model="localData[standard.id].is_material"
                type="is-success"
              />
            </div>
          </div>

          <!-- Campo de justificación -->
          <b-field
            :label="localData[standard.id].is_material ? 'Justification (required)' : 'Justification (optional)'"
            label-position="on-border"
            style="margin-top: 14px;"
            :type="localData[standard.id].is_material && !localData[standard.id].justification ? 'is-danger' : ''"
            :message="localData[standard.id].is_material && !localData[standard.id].justification ? 'Provide a justification for material standards' : ''"
          >
            <b-input
              v-model="localData[standard.id].justification"
              type="textarea"
              rows="2"
              placeholder="Explain why this standard is or is not material for this audit..."
            />
          </b-field>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <b-button
          type="is-success"
          icon-left="content-save"
          :loading="isSaving"
          @click="saveMateriality"
        >
          Save assessment
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
      isSaving: false,
      standards: [],
      localData: {},
    };
  },
  computed: {
    groupedStandards() {
      const groups = {};
      const sorted = this.standards.slice().sort((a, b) => a.sort_order - b.sort_order);
      sorted.forEach(std => {
        const cat = std.category || 'Other';
        if (!groups[cat]) {
          groups[cat] = [];
        }
        groups[cat].push(std);
      });
      return groups;
    },
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
        this.standards = response.data;
        const data = {};
        this.standards.forEach(std => {
          data[std.id] = {
            is_material: std.assessment ? (std.assessment.is_material === true) : false,
            justification: std.assessment ? (std.assessment.justification || '') : '',
          };
        });
        this.localData = data;
      } catch (error) {
        this.$buefy.snackbar.open({
          message: 'Error loading materiality data. Please try again.',
          type: 'is-danger',
          duration: 7000,
        });
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },
    saveMateriality: async function() {
      const payload = this.standards.map(std => ({
        standard_id: std.id,
        is_material: this.localData[std.id].is_material,
        justification: this.localData[std.id].justification || '',
      }));

      try {
        this.isSaving = true;
        await axiosInstance.post(`/audits/${this.id_audit}/materiality`, { standards: payload });
        this.$buefy.snackbar.open({
          message: 'Materiality assessment saved successfully.',
          type: 'is-success',
          duration: 4000,
        });
        this.$emit('finished-actions-for-audit');
        this.closeMateriality();
      } catch (error) {
        const msg =
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'Error saving materiality assessment. Please try again.';
        this.$buefy.snackbar.open({
          message: msg,
          type: 'is-danger',
          duration: 7000,
        });
        console.error(error);
      } finally {
        this.isSaving = false;
      }
    },
    closeMateriality: function() {
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
    },
    // Colores para cada enfoque de los estandares 
    categoryTagClass: function(category) {
      switch (category) {
        case 'Environmental': return 'is-success';
        case 'Social': return 'is-info';
        case 'Governance': return 'is-warning';
        case 'General': return 'is-light';
        default: return 'is-light';
      }
    },
    hasPreviousAssessment: function(standard) {
      return !!(standard && standard.assessment && standard.assessment.assessed_at);
    },
    formatDate: function(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
  margin-right: 10px;
  margin-top: 0px !important;
  margin-bottom: 0px !important;
}

.category-tag {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.standard-box {
  border-left: 4px solid #adb987;
  transition: box-shadow 0.15s;
}

.standard-box:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
}

.standard-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.standard-code {
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
}

.standard-name {
  font-size: 1rem;
  font-weight: 500;
}
.switch-wrapper {
  margin-left: auto;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-label {
  display: inline-block;
  min-width: 95px;
  text-align: right;
  font-weight: 600;
}

.switch-wrapper .b-checkbox.switch {
  margin-right: 0;
}
</style>
