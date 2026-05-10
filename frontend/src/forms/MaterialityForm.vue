<template>
  <section v-if="action === 'materiality'">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeMateriality"
      />
      <h1 class="title">Double Materiality Assessment</h1>
      <b-button
        type="is-info is-light"
        icon-left="robot"
        style="margin-left: auto;"
        @click="openAiModal"
      >
        Suggest with AI
      </b-button>
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
                {{ standard.is_mandatory ? 'Always material' : (localData[standard.id].is_material ? 'Material' : 'Not material') }}
              </span>
              <b-switch
                v-model="localData[standard.id].is_material"
                type="is-success"
                :disabled="standard.is_mandatory"
              />
            </div>
          </div>

          <!-- Campo de justificación -->
          <b-field
            :label="(!standard.is_mandatory && localData[standard.id].is_material) ? 'Justification (required)' : 'Justification (optional)'"
            label-position="on-border"
            style="margin-top: 14px;"
            :type="(!standard.is_mandatory && localData[standard.id].is_material && !localData[standard.id].justification) ? 'is-danger' : ''"
            :message="(!standard.is_mandatory && localData[standard.id].is_material && !localData[standard.id].justification) ? 'Provide a justification for material standards' : ''"
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
          class="btn-app-green"
          icon-left="content-save"
          :loading="isSaving"
          @click="saveMateriality"
        >
          Save assessment
        </b-button>
      </div>
    </div>

    <!-- Panel de sugerencias de IA -->
    <b-modal
      v-model="aiModalActive"
      has-modal-card
      trap-focus
      :can-cancel="false"
    >
      <div class="modal-card" style="width: 640px; max-width: 95vw;">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <b-icon icon="robot" style="margin-right: 8px;" />
            Analysis of Double Materiality with AI
          </p>
        </header>

        <!-- Formulario -->
        <section v-if="aiStep === 1" class="modal-card-body">
          <p class="has-text-grey" style="margin-bottom: 16px; font-size: 0.9rem;">
            Provide basic information about the company for the AI to suggest which ESRS standards are material.
          </p>
          <b-field label="Sector *" label-position="on-border">
            <b-input v-model="aiForm.sector" placeholder="Ej: Manufacturing, Technology, Agriculture..." />
          </b-field>
          <b-field label="Number of employees *" label-position="on-border">
            <b-input v-model="aiForm.employees" type="number" min="1" placeholder="Ej: 250" />
          </b-field>
          <b-field label="Anual revenue (M€)" label-position="on-border">
            <b-input v-model="aiForm.revenue" type="number" min="0" step="0.1" placeholder="Ej: 45.5" />
          </b-field>
          <b-field label="Activity description" label-position="on-border">
            <b-input
              v-model="aiForm.description"
              type="textarea"
              rows="3"
              placeholder="Describe shortly the main activity of the company..."
            />
          </b-field>
        </section>

        <!-- Resultados -->
        <section v-if="aiStep === 2" class="modal-card-body ai-results">
          <p class="has-text-grey" style="margin-bottom: 12px; font-size: 0.85rem;">
            The AI has evaluated {{ aiSuggestions.length }} standards. Review the suggestions and click "Apply" to fill the form.
          </p>
          <div v-for="s in aiSuggestions" :key="s.code" class="ai-suggestion-row">
            <div class="ai-suggestion-header">
              <span class="tag is-dark" style="font-family: monospace; margin-right: 6px;">{{ s.code }}</span>
              <span class="ai-std-name">{{ s.name }}</span>
              <span class="tag" :class="s.is_material ? 'is-success is-light' : 'is-light'" style="margin-left: 6px;">
                {{ s.is_material ? 'Material' : 'Not material' }}
              </span>
              <!-- Impacto = Empresa afecta al medioambiente/personas. Financiero = Tema afecta a empresa (Doble materialidad) -->
              <span v-if="s.impact_materiality" class="tag is-warning is-light" style="margin-left: 4px; font-size: 0.72rem;">Impact</span>  
              <span v-if="s.financial_materiality" class="tag is-link is-light" style="margin-left: 4px; font-size: 0.72rem;">Financial</span>
            </div>
            <div class="ai-confidence">
              <span class="has-text-grey" style="font-size: 0.75rem; margin-right: 6px;">Confianza {{ Math.round(s.confidence * 100) }}%</span>
              <progress
                class="progress is-small"
                :class="confidenceClass(s.confidence)"
                :value="Math.round(s.confidence * 100)"
                max="100"
                style="flex: 1; margin-bottom: 0;"
              />
            </div>
            <p v-if="s.justification" class="ai-justification">{{ s.justification }}</p>
          </div>
        </section>

        <!-- Footer del formulario -->
        <footer class="modal-card-foot" style="justify-content: flex-end; gap: 8px;">
          <template v-if="aiStep === 1">
            <b-button @click="aiModalActive = false" :disabled="isAiLoading">Cancelar</b-button>
            <b-button
              class="btn-app-green"
              icon-left="auto-fix"
              :loading="isAiLoading"
              @click="runAiSuggestion"
            >
              Analize
            </b-button>
          </template>
          <!-- Footer de los resultados -->
          <template v-if="aiStep === 2">
            <b-button icon-left="arrow-left" @click="aiStep = 1">Volver</b-button>
            <b-button type="is-success" icon-left="check" @click="applyAiSuggestions">
              Apply suggestions
            </b-button>
          </template>
        </footer>
      </div>
    </b-modal>
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
      aiModalActive: false,
      isAiLoading: false,
      aiSuggestions: [],
      aiStep: 1,
      aiForm: {
        sector: '',
        employees: null,
        revenue: null,
        description: '',
      },
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
            is_material: std.is_mandatory ? true : (std.assessment ? (std.assessment.is_material === true) : false),
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
        is_material: std.is_mandatory ? true : this.localData[std.id].is_material,
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
    categoryTagClass: function() {
      return 'category-tag-green';
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
    openAiModal: function() {
      this.aiStep = 1;  // 1-Formulario, 2-Resultados
      this.aiSuggestions = [];
      this.aiModalActive = true;
    },
    runAiSuggestion: async function() {
      if (!this.aiForm.sector || this.aiForm.employees == null) {
        this.$buefy.snackbar.open({ message: 'Sector y empleados son obligatorios.', type: 'is-danger', duration: 4000 });
        return;
      }
      try {
        this.isAiLoading = true;
        const payload = {
          sector: this.aiForm.sector,
          employees: Number(this.aiForm.employees),
          revenue: this.aiForm.revenue != null ? Number(this.aiForm.revenue) : undefined,
          description: this.aiForm.description || undefined,
        };
        const response = await axiosInstance.post(`/audits/${this.id_audit}/ai/materiality`, payload);  // backend
        this.aiSuggestions = response.data.suggestions;
        this.aiStep = 2;
      } catch (error) {
        const msg = error.response && error.response.data && (error.response.data.detail || error.response.data.error)
          ? (error.response.data.detail || error.response.data.error)
          : 'Error al conectar con el servicio de IA.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 7000 });
        console.error('[AI] Error:', error);
      } finally {
        this.isAiLoading = false;
      }
    },
    applyAiSuggestions: function() {
      const suggestionMap = new Map(this.aiSuggestions.map(s => [s.code, s]));
      this.standards.forEach(std => {
        const suggestion = suggestionMap.get(std.code);
        if (!suggestion || std.is_mandatory) return;
        if (!this.localData[std.id]) return;
        this.localData[std.id].is_material = suggestion.is_material;
        if (suggestion.justification) {
          this.localData[std.id].justification = suggestion.justification;
        }
      });
      this.aiModalActive = false;
      this.$buefy.snackbar.open({ // Notificacion del exito de la aplicacion de las sugerencias
        message: 'Sugerencias de IA aplicadas. Revisa y guarda cuando estés listo.',
        type: 'is-info',
        duration: 5000,
      });
    },
    confidenceClass: function(confidence) {
      if (confidence >= 0.80) return 'is-success';
      if (confidence >= 0.60) return 'is-warning';
      return 'is-danger';
    },
  },
};
</script>

<style scoped>
.btn-app-green {
  background-color: #adb987;
  border-color: #adb987;
  color: #fff;
}

.btn-app-green:hover,
.btn-app-green:focus {
  background-color: #9aa876;
  border-color: #9aa876;
  color: #fff;
}

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

.category-tag-green {
  background-color: #adb987 !important;
  color: #fff !important;
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

.ai-results {
  max-height: 420px;
  overflow-y: auto;
}

.ai-suggestion-row {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ai-suggestion-row:last-child {
  border-bottom: none;
}

.ai-suggestion-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.ai-std-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.ai-confidence {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.ai-justification {
  font-size: 0.82rem;
  color: #666;
  font-style: italic;
  margin-top: 4px;
  margin-bottom: 0;
}
</style>
