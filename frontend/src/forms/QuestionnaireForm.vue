<template>
  <section v-if="action === 'questionnaire'">
    <!-- Cabecera sticky con botón back y título -->
    <div class="questionnaire-header">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeQuestionnaire"
      />
      <h1 class="title">ESRS Questionnaire</h1>
      <div class="header-actions">
        <b-button
          class="btn-app-green-outline"
          icon-left="robot"
          style="margin-right: 8px;"
          @click="$emit('open-extraction')"
        >
          Complete with AI
        </b-button>
        <b-button
          class="btn-app-green"
          icon-left="content-save"
          :loading="isSaving"
          @click="save"
        >
          Save
        </b-button>
      </div>
    </div>

    <b-loading :is-full-page="false" v-model="isLoading" />

    <div v-if="!isLoading && standards.length === 0" class="notification is-light">
      No material standards found for this audit. Complete the materiality assessment first.
    </div>

    <div v-if="!isLoading && standards.length > 0">
      <!-- Tabs verticales: una pestaña por estándar material -->
      <b-tabs
        v-model="activeStandardTab"
        :vertical="standards.length > 1"
        type="is-boxed"
        class="questionnaire-tabs"
      >
        <b-tab-item
          v-for="standard in standards"
          :key="standard.id"
        >
          <!-- Label del tab con contador -->
          <template #header>
            <span class="tab-label-code">{{ standard.code }}</span>
            <span class="tab-label-name">{{ standard.name }}</span>
            <b-tag
              :type="standardProgress(standard).filled === standardProgress(standard).total ? 'is-success is-light' : 'is-light'"
              size="is-small"
              class="tab-counter"
            >
              {{ standardProgress(standard).filled }} / {{ standardProgress(standard).total }}
            </b-tag>
          </template>

          <!-- Barra de acciones del estándar -->
          <div class="standard-toolbar">
            <b-button
              class="btn-app-green-outline"
              size="is-small"
              icon-left="checkbox-marked-circle-outline"
              @click="markEmptyAsNA(standard)"
            >
              Mark empty as N/A
            </b-button>
          </div>

          <!-- Contenido del estándar: bloques por DisclosureRequirement -->
          <div
            v-for="dr in standard.disclosure_requirements"
            :key="dr.id"
            class="box dr-box"
          >
            <!-- Cabecera del DR -->
            <div class="dr-header">
              <span class="tag is-dark dr-code">{{ dr.code }}</span>
              <span class="dr-name">{{ dr.name }}</span>
            </div>

            <!-- Lista de DataPoints del DR -->
            <div
              v-for="dp in dr.data_points"
              :key="dp.id"
              class="dp-block"
            >
              <!-- Cabecera línea 1: nombre + tags + official_id -->
              <div class="dp-header">
                <div class="dp-title-row">
                  <span class="dp-name">{{ dp.name }}</span>
                  <b-tag
                    v-if="dp.is_voluntary"
                    type="is-info is-light"
                    size="is-small"
                    class="dp-tag"
                  >
                    Voluntary
                  </b-tag>
                  <b-tag
                    v-if="dp.is_conditional"
                    type="is-warning is-light"
                    size="is-small"
                    class="dp-tag"
                  >
                    Conditional
                  </b-tag>
                  <span class="dp-official-id">{{ dp.official_id }}</span>
                  <div
                    v-if="dp.paragraph_ref || dp.cross_reference || dp.link"
                    class="dp-info-wrapper"
                    @mouseenter="$set(infoOpen, dp.id, true)"
                    @mouseleave="$set(infoOpen, dp.id, false)"
                  >
                    <b-icon
                      icon="information-outline"
                      size="is-small"
                      class="dp-info-icon"
                    />
                    <div v-show="infoOpen[dp.id]" class="dp-info-panel">
                      <div v-if="dp.paragraph_ref" class="dp-info-line">
                        <strong>Paragraph:</strong> {{ dp.paragraph_ref }}
                      </div>
                      <div v-if="dp.cross_reference" class="dp-info-line">
                        <strong>Cross-ref:</strong> {{ dp.cross_reference }}
                      </div>
                      <div v-if="dp.link" class="dp-info-line dp-info-line--link">
                        <strong>Link:</strong>
                        <a
                          :href="dp.link"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="dp-info-link"
                        >
                          {{ dp.link }}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Cabecera línea 2: checkbox Not applicable -->
                <div class="dp-applicable-row">
                  <b-checkbox
                    :value="localData[dp.id] && !localData[dp.id].is_applicable"
                    @input="setNotApplicable(dp.id, $event)"
                    size="is-small"
                  >
                    Not applicable
                  </b-checkbox>
                </div>
              </div>

              <!-- Renderizador dinámico por data_type -->
              <div
                class="dp-input-area"
                :class="{ 'dp-disabled': localData[dp.id] && !localData[dp.id].is_applicable }"
              >
                <template v-if="dp.data_type === 'boolean'">
                  <b-field label="Value" label-position="on-border">
                    <b-switch
                      :value="localData[dp.id] && localData[dp.id].value_text === 'true'"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      @input="setBooleanValue(dp.id, $event)"
                    >
                      {{ localData[dp.id] && localData[dp.id].value_text === 'true' ? 'Yes' : 'No' }}
                    </b-switch>
                  </b-field>
                </template>

                <!-- narrative / semi-narrative / string -->
                <template v-else-if="dp.data_type === 'narrative' || dp.data_type === 'semi-narrative' || dp.data_type === 'string'">
                  <b-field label="Value" label-position="on-border">
                    <b-input
                      type="textarea"
                      rows="3"
                      :value="localData[dp.id] ? localData[dp.id].value_text : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="Enter narrative response..."
                      @input="setTextValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- integer -->
                <template v-else-if="dp.data_type === 'integer'">
                  <b-field label="Value" label-position="on-border">
                    <b-input
                      type="number"
                      step="1"
                      :value="localData[dp.id] ? localData[dp.id].value_numeric : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="0"
                      @input="setNumericValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- percent -->
                <template v-else-if="dp.data_type === 'percent'">
                  <b-field label="Value (%)" label-position="on-border" class="has-addons">
                    <b-input
                      type="number"
                      step="0.01"
                      :value="localData[dp.id] ? localData[dp.id].value_numeric : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="0.00"
                      expanded
                      @input="setNumericValue(dp.id, $event)"
                    />
                    <p class="control">
                      <span class="button is-static">%</span>
                    </p>
                  </b-field>
                </template>

                <!-- monetary -->
                <template v-else-if="dp.data_type === 'monetary'">
                  <b-field label="Value (€)" label-position="on-border" class="has-addons">
                    <p class="control">
                      <span class="button is-static">€</span>
                    </p>
                    <b-input
                      type="number"
                      step="0.01"
                      :value="localData[dp.id] ? localData[dp.id].value_numeric : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="0.00"
                      expanded
                      @input="setNumericValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- decimal / value -->
                <template v-else-if="dp.data_type === 'decimal' || dp.data_type === 'value'">
                  <b-field label="Value" label-position="on-border">
                    <b-input
                      type="number"
                      step="0.01"
                      :value="localData[dp.id] ? localData[dp.id].value_numeric : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="0.00"
                      @input="setNumericValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- date / datetime -->
                <template v-else-if="dp.data_type === 'date' || dp.data_type === 'datetime'">
                  <b-field label="Date" label-position="on-border">
                    <b-datepicker
                      :value="getDateValue(dp.id)"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="Select date..."
                      icon="calendar-today"
                      trap-focus
                      @input="setDateValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- fallback: cualquier tipo no reconocido -->
                <template v-else>
                  <b-field label="Value" label-position="on-border">
                    <b-input
                      type="textarea"
                      rows="2"
                      :value="localData[dp.id] ? localData[dp.id].value_text : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      :placeholder="'Enter value (' + dp.data_type + ')...'"
                      @input="setTextValue(dp.id, $event)"
                    />
                  </b-field>
                </template>

                <!-- Evidence reference: desplegable opcional -->
                <div class="evidence-section">
                  <a
                    v-if="!evidenceOpen[dp.id]"
                    class="evidence-toggle"
                    @click="openEvidence(dp.id)"
                  >
                    + Add evidence reference
                  </a>
                  <b-field
                    v-else
                    label="Evidence reference"
                    label-position="on-border"
                    class="evidence-field"
                  >
                    <b-input
                      size="is-small"
                      :value="localData[dp.id] ? localData[dp.id].evidence_reference : ''"
                      :disabled="localData[dp.id] && !localData[dp.id].is_applicable"
                      placeholder="Document reference, file name, URL..."
                      @input="setEvidenceValue(dp.id, $event)"
                    />
                  </b-field>
                </div>
              </div>
            </div>
          </div>

        </b-tab-item>
      </b-tabs>
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
      isSaving: false,
      standards: [],
      // { [data_point_id]: { value_text, value_numeric, is_applicable, evidence_reference, status } }
      localData: {},
      // Controla si el campo de evidencia está expandido para cada dp
      evidenceOpen: {},
      // Guarda qué dp.id tenían response previo (para no filtrarlos al guardar)
      hadPreviousResponse: {},
      // Controla qué dp.id tienen el panel de info visible
      infoOpen: {},
      activeStandardTab: 0,
    };
  },
  mounted() {
    if (this.id_audit) {
      this.loadQuestionnaire();
    }
  },
  computed: {
    // Devuelve { filled, total } para mostrar el contador en la pestaña
    standardProgress() {
      return (standard) => {
        let total = 0;
        let filled = 0;
        if (!standard.disclosure_requirements) return { filled: 0, total: 0 };
        standard.disclosure_requirements.forEach((dr) => {
          if (!dr.data_points) return;
          dr.data_points.forEach((dp) => {
            total++;
            const entry = this.localData[dp.id];
            if (!entry) return;
            if (!entry.is_applicable) {
              filled++;
              return;
            }
            const hasText = entry.value_text !== null && entry.value_text !== '' && entry.value_text !== undefined;
            const hasNumeric = entry.value_numeric !== null && entry.value_numeric !== '' && entry.value_numeric !== undefined;
            if (hasText || hasNumeric) filled++;
          });
        });
        return { filled, total };
      };
    },
  },
  methods: {
    loadQuestionnaire: async function () {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${this.id_audit}/questionnaire`);
        this.standards = response.data.standards || [];

        const localData = {};
        const hadPrev = {};
        const evidenceOpen = {};

        this.standards.forEach((std) => {
          if (!std.disclosure_requirements) return;
          std.disclosure_requirements.forEach((dr) => {
            if (!dr.data_points) return;
            dr.data_points.forEach((dp) => {
              const resp = dp.response;
              hadPrev[dp.id] = resp !== null && resp !== undefined;

              if (resp) {
                localData[dp.id] = {
                  value_text: resp.value_text !== undefined ? resp.value_text : null,
                  value_numeric: resp.value_numeric !== undefined ? resp.value_numeric : null,
                  is_applicable: resp.is_applicable !== undefined ? resp.is_applicable : true,
                  evidence_reference: resp.evidence_reference !== undefined ? resp.evidence_reference : null,
                  status: resp.status === 'completed' ? 'completed' : 'pending',
                };
                // Abrir evidencia si ya tiene valor
                if (resp.evidence_reference) {
                  evidenceOpen[dp.id] = true;
                }
              } else {
                localData[dp.id] = {
                  value_text: null,
                  value_numeric: null,
                  is_applicable: true,
                  evidence_reference: null,
                  status: 'pending',
                };
              }
            });
          });
        });

        // Usar $set masivo: asignamos el objeto completo (Vue 2 detecta cambio)
        this.localData = localData;
        this.hadPreviousResponse = hadPrev;
        this.evidenceOpen = evidenceOpen;
      } catch (error) {
        this.$buefy.snackbar.open({
          message: 'Error loading questionnaire. Please try again.',
          type: 'is-danger',
          duration: 7000,
        });
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },

    // Marca el campo como editado (status completed) y actualiza la clave dada
    markEdited: function (dpId, key, value) {
      if (!this.localData[dpId]) return;
      const current = this.localData[dpId];
      this.$set(this.localData, dpId, {
        ...current,
        [key]: value,
        status: 'completed',
      });
    },

    setTextValue: function (dpId, value) {
      this.markEdited(dpId, 'value_text', value || null);
    },

    setNumericValue: function (dpId, value) {
      this.markEdited(dpId, 'value_numeric', value !== '' && value !== null && value !== undefined ? value : null);
    },

    setBooleanValue: function (dpId, value) {
      this.markEdited(dpId, 'value_text', value ? 'true' : 'false');
    },

    setDateValue: function (dpId, dateObj) {
      if (!dateObj) {
        this.markEdited(dpId, 'value_text', null);
        return;
      }
      // Convertir a ISO string y guardar en value_text
      const iso = dateObj instanceof Date ? dateObj.toISOString() : String(dateObj);
      this.markEdited(dpId, 'value_text', iso);
    },

    setNotApplicable: function (dpId, notApplicable) {
      if (!this.localData[dpId]) return;
      const current = this.localData[dpId];
      this.$set(this.localData, dpId, {
        ...current,
        is_applicable: !notApplicable,
        status: 'completed',
      });
    },

    setEvidenceValue: function (dpId, value) {
      this.markEdited(dpId, 'evidence_reference', value || null);
    },

    // Marca como "Not applicable" todos los DataPoints vacíos del estándar
    markEmptyAsNA: function (standard) {
      const candidates = [];
      (standard.disclosure_requirements || []).forEach((dr) => {
        (dr.data_points || []).forEach((dp) => {
          const entry = this.localData[dp.id];
          if (!entry || !entry.is_applicable) return;
          const hasText = entry.value_text !== null && entry.value_text !== '' && entry.value_text !== undefined;
          const hasNumeric = entry.value_numeric !== null && entry.value_numeric !== '' && entry.value_numeric !== undefined;
          if (!hasText && !hasNumeric) candidates.push(dp.id);
        });
      });

      if (candidates.length === 0) {
        this.$buefy.snackbar.open({
          message: `No empty DataPoints to mark in ${standard.code}.`,
          type: 'is-warning',
          duration: 3000,
        });
        return;
      }

      this.$buefy.dialog.confirm({
        title: 'Mark empty as Not applicable',
        message: `This will mark <strong>${candidates.length}</strong> empty DataPoint(s) of <strong>${standard.code}</strong> as "Not applicable". You can still change them individually afterwards.`,
        confirmText: 'Mark as N/A',
        cancelText: 'Cancel',
        type: 'is-warning',
        hasIcon: true,
        onConfirm: () => {
          candidates.forEach((dpId) => {
            const current = this.localData[dpId];
            this.$set(this.localData, dpId, {
              ...current,
              is_applicable: false,
              status: 'completed',
            });
          });
          this.$buefy.snackbar.open({
            message: `${candidates.length} DataPoint(s) marked as Not applicable in ${standard.code}.`,
            type: 'is-success',
            duration: 4000,
          });
        },
      });
    },

    openEvidence: function (dpId) {
      this.$set(this.evidenceOpen, dpId, true);
    },

    // Parsea el value_text ISO como objeto Date para b-datepicker
    getDateValue: function (dpId) {
      if (!this.localData[dpId] || !this.localData[dpId].value_text) return null;
      const d = new Date(this.localData[dpId].value_text);
      return isNaN(d.getTime()) ? null : d;
    },

    // Construye el payload filtrando entradas vacías sin respuesta previa
    buildPayload: function () {
      const dataPoints = [];
      Object.entries(this.localData).forEach(([id, entry]) => {
        const dpId = Number(id);
        const hadPrev = this.hadPreviousResponse[dpId];
        const hasText = entry.value_text !== null && entry.value_text !== '' && entry.value_text !== undefined;
        const hasNumeric = entry.value_numeric !== null && entry.value_numeric !== '' && entry.value_numeric !== undefined;
        const notApplicable = !entry.is_applicable;
        const hasEvidence = entry.evidence_reference !== null && entry.evidence_reference !== '' && entry.evidence_reference !== undefined;

        // Incluir si: tiene valor rellenado, está marcado N/A, ya tenía respuesta previa
        if (hasText || hasNumeric || notApplicable || hasEvidence || hadPrev) {
          dataPoints.push({
            data_point_id: dpId,
            value_text: entry.value_text || null,
            value_numeric: entry.value_numeric || null,
            is_applicable: entry.is_applicable,
            evidence_reference: entry.evidence_reference || null,
            status: (hasText || hasNumeric || notApplicable) ? 'completed' : 'pending',
          });
        }
      });
      return dataPoints;
    },

    save: async function () {
      try {
        this.isSaving = true;
        const dataPoints = this.buildPayload();
        await axiosInstance.post(`/audits/${this.id_audit}/questionnaire`, {
          data_points: dataPoints,
        });
        // Marcar como teniendo respuesta previa todos los enviados
        dataPoints.forEach((dp) => {
          this.$set(this.hadPreviousResponse, dp.data_point_id, true);
        });
        this.$buefy.snackbar.open({
          message: 'Questionnaire saved successfully.',
          type: 'is-success',
          duration: 4000,
        });
        // No cerramos el formulario, el usuario continúa rellenando
      } catch (error) {
        const msg =
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'Error saving questionnaire. Please try again.';
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

    closeQuestionnaire: function () {
      // Al cerrar manualmente se refresca la tabla padre
      this.$emit('finished-actions-for-audit');
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
    },
  },
};
</script>

<style scoped>
.questionnaire-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 14px 16px;
  position: sticky;
  top: 0;
  z-index: 30;
  background: #fff;
  margin-left: -16px;
  margin-right: -16px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 4px 8px -4px rgba(0, 0, 0, 0.12);
}

.button-back {
  margin-right: 20px;
  color: #adb987;
  border-radius: 30px;
  max-width: 40px;
  flex-shrink: 0;
}

.title {
  margin-right: 10px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  flex: 1;
}

.header-actions {
  margin-left: auto;
  flex-shrink: 0;
}

/* Tabs */
.questionnaire-tabs {
  margin-top: 8px;
}

.standard-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.questionnaire-tabs >>> nav.tabs {
  position: sticky;
  top: 80px;
  align-self: flex-start;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
}

.tab-label-code {
  font-family: monospace;
  font-weight: 700;
  font-size: 0.88rem;
  margin-right: 6px;
  color: #363636;
}

.tab-label-name {
  font-size: 0.82rem;
  color: #555;
  margin-right: 6px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}

.tab-counter {
  flex-shrink: 0;
}

/* DisclosureRequirement box */
.dr-box {
  border-left: 4px solid #adb987;
  margin-bottom: 20px;
  transition: box-shadow 0.15s;
}

.dr-box:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.dr-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.dr-code {
  font-family: monospace;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.dr-name {
  font-size: 1rem;
  font-weight: 600;
}

/* DataPoint block */
.dp-block {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fafafa;
}

.dp-header {
  margin-bottom: 10px;
}

.dp-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.dp-name {
  font-size: 0.92rem;
  font-weight: 500;
  color: #363636;
}

.dp-tag {
  font-size: 0.72rem;
}

.dp-official-id {
  font-family: monospace;
  font-size: 0.78rem;
  color: #888;
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
}

.dp-info-icon {
  color: #adb987;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.dp-info-icon:hover {
  color: #7a8f60;
  background-color: rgba(173, 185, 135, 0.18);
  transform: scale(1.12);
}

/* Wrapper que engloba icono + panel: el mouseenter/leave se mide aquí */
.dp-info-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Panel popover custom */
.dp-info-panel {
  position: absolute;
  /* Empieza justo donde acaba el wrapper, sin gap */
  top: 100%;
  right: 0;
  z-index: 50;
  background: #fff;
  border: 1px solid #dbdbdb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 10px 14px;
  min-width: 220px;
  max-width: 360px;
  white-space: normal;
  word-break: break-word;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #363636;
}

.dp-info-line {
  margin-bottom: 4px;
}

.dp-info-line:last-child {
  margin-bottom: 0;
}

.dp-info-line--link {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.dp-info-line strong {
  color: #363636;
  margin-right: 4px;
}

.dp-info-link {
  color: #3273dc;
  text-decoration: underline;
  word-break: break-all;
}

.dp-info-link:hover {
  color: #276cda;
}

.dp-applicable-row {
  margin-top: 2px;
}

.dp-input-area {
  margin-top: 8px;
}

.dp-disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* Evidence */
.evidence-section {
  margin-top: 8px;
}

.evidence-toggle {
  font-size: 0.78rem;
  color: #adb987;
  cursor: pointer;
  text-decoration: underline;
}

.evidence-toggle:hover {
  color: #7a8f60;
}

.evidence-field {
  margin-top: 6px;
}

/* Botón Save con el verde de la app */
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

.btn-app-green-outline {
  background-color: transparent;
  border: 1.5px solid #adb987;
  color: #adb987;
  font-weight: 500;
}

.btn-app-green-outline:hover,
.btn-app-green-outline:focus-visible {
  background-color: #adb987;
  border-color: #adb987;
  color: #fff;
}

.btn-app-green-outline:focus:not(:focus-visible) {
  background-color: transparent;
  border-color: #adb987;
  color: #adb987;
}

</style>
