<template>
  <section v-if="action === 'extraction'">

    <!-- Cabecera -->
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <b-button class="mdi mdi-keyboard-backspace button-back" @click="closeExtraction" />
      <h1 class="title">DataPoint Extraction with IA</h1>
      <b-button
        type="is-primary"
        icon-left="file-upload"
        style="margin-left: auto;"
        :loading="isUploading"
        @click="triggerUpload"
      >
        Upload file
      </b-button>
      <!-- Subir archivo -->
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.docx"
        style="display: none;"
        @change="onFileSelected"
      />
    </div>

    <b-loading :is-full-page="false" v-model="isLoading" />

    <!-- Documentos subidos -->
    <div v-if="!isLoading">
      <p class="section-label">Documents uploaded</p>

      <div v-if="documents.length === 0" class="notification is-light">
        No files found. Upload a PDF or DOCX to get started.
      </div>

      <div v-for="doc in documents" :key="doc.id" class="box doc-box">
        <div class="doc-row">
          <b-icon :icon="fileIcon(doc.format)" size="is-medium" class="doc-icon" />
          <div class="doc-info">
            <span class="doc-name">{{ doc.original_name }}</span>
            <div style="display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap;">
              <b-tag
                :type="doc.processed_status === 'completed' ? 'is-success is-light' : 'is-danger is-light'"
                size="is-small"
              >
                {{ doc.processed_status === 'completed' ? 'Completed' : 'Failed to process' }}
              </b-tag>
              <b-tag v-if="doc.page_count" type="is-light" size="is-small">
                {{ doc.page_count }} pages
              </b-tag>
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <b-button
              v-if="selectedDocumentId !== doc.id"
              type="is-info is-light"
              size="is-small"
              :disabled="doc.processed_status !== 'completed'"
              @click="selectedDocumentId = doc.id"
            >
              Select
            </b-button>
            <b-button v-else type="is-success" size="is-small" icon-left="check" @click="selectedDocumentId = null">
              Selected
            </b-button>
            <b-button
              type="is-danger is-light"
              size="is-small"
              icon-left="delete"
              @click="confirmDeleteDocument(doc)"
            />
          </div>
        </div>
      </div>

      <!-- Extraer por estandares -->
      <div v-if="selectedDocumentId !== null" style="margin-top: 32px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; gap: 10px; flex-wrap: wrap;">
          <p class="section-label" style="margin-bottom: 0;">Material Standards</p>
          <b-tag type="is-info is-light" style="font-size: 0.82rem;">
            Document: {{ selectedDocument ? selectedDocument.original_name : '' }}
          </b-tag>
          <b-button size="is-small" type="is-light" @click="selectedDocumentId = null">Change</b-button>
        </div>

        <div v-if="materialStandards.length === 0" class="notification is-light">
          No material standards found. Complete the materiality assessment first.
        </div>

        <div
          v-for="std in materialStandards"
          :key="std.id"
          class="box standard-box"
        >
          <div class="standard-row">
            <span class="tag is-dark" style="font-family: monospace; margin-right: 8px;">{{ std.code }}</span>
            <span class="standard-name">{{ std.name }}</span>
            <b-button
              type="is-info is-light"
              icon-left="robot"
              size="is-small"
              style="margin-left: auto;"
              :loading="!!loadingStandards[std.id]"
              @click="extractStandard(std)"
            >
              Extract
            </b-button>
          </div>
           <!-- Resultados -->
          <div v-if="extractionResults[std.id]" class="extraction-result">
            <b-tag
              :type="extractionResults[std.id].extracted > 0 ? 'is-success is-light' : 'is-warning is-light'"
              style="margin-top: 8px;"
            >
              <b-icon icon="check-circle" size="is-small" style="margin-right: 4px;" />
              {{ extractionResults[std.id].extracted }} DataPoints extracted
            </b-tag>

            <div
              v-for="r in extractionResults[std.id].results"
              :key="r.data_point_id"
              class="result-row"
            >
              <div class="result-header">
                <span class="tag is-dark is-small result-code" style="font-family: monospace; flex-shrink: 0;">{{ r.official_id || r.data_point_id }}</span>
                <span class="result-name">{{ r.name || '—' }}</span>
                <b-button
                  :type="r.included ? 'is-primary' : 'is-light'"
                  size="is-small"
                  :icon-left="r.included ? 'check' : 'plus'"
                  style="margin-left: auto; flex-shrink: 0;"
                  @click="includeResult(r)"
                >
                  {{ r.included ? 'Marked' : 'Include' }}
                </b-button>
              </div>
              <div class="result-body">
                <span class="result-value">{{ r.extracted_value }}</span>
                <div class="result-meta">
                  <span v-if="r.page_hint" class="has-text-grey" style="font-size: 0.75rem;">p.{{ r.page_hint }}</span>
                  <progress
                    class="progress is-small"
                    :class="confidenceClass(r.confidence)"
                    :value="Math.round(r.confidence * 100)"
                    max="100"
                    style="width: 60px; margin-bottom: 0;"
                  />
                  <span class="has-text-grey" style="font-size: 0.72rem;">{{ Math.round(r.confidence * 100) }}%</span>
                </div>
              </div>
            </div>

            <!-- Botón finalizar -->
            <div v-if="extractionResults[std.id] && extractionResults[std.id].results.length > 0" style="margin-top: 12px; display: flex; justify-content: flex-end;">
              <b-button
                type="is-primary"
                icon-left="content-save"
                :loading="!!finalizingStandards[std.id]"
                :disabled="false"
                @click="finalizeStandard(std)"
              >
                Finalize
              </b-button>
            </div>
          </div>

        </div>
      </div>
    </div>

  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'DocumentExtractionForm',

  props: {
    action: String,
    id_audit: Number,
  },

  data() {
    return {
      isLoading: false,
      isUploading: false,
      documents: [],
      materialStandards: [],
      selectedDocumentId: null,
      loadingStandards: {},
      finalizingStandards: {},
      extractionResults: {},
    };
  },

  computed: {
    selectedDocument() {
      return this.documents.find(d => d.id === this.selectedDocumentId) || null;
    },
  },

  mounted() {
    if (this.id_audit) {
      this.loadDocuments();
      this.loadMaterialStandards();
    }
  },

  methods: {
    loadDocuments: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${this.id_audit}/documents`);
        this.documents = response.data || [];
      } catch (error) {
        const msg = error.response?.data?.error || 'Error loading documents.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 5000 });
        console.error(error);
      } finally {
        this.isLoading = false;
      }
    },

    loadMaterialStandards: async function() {
      try {
        const response = await axiosInstance.get(`/audits/${this.id_audit}/materiality`);
        const all = response.data || [];
        this.materialStandards = all.filter(
          item => item.assessment && item.assessment.is_material === true
        );
      } catch (error) {
        const msg = error.response?.data?.error || 'Error loading material standards.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 5000 });
        console.error('[LOAD_STANDARDS]', error);
      }
    },

    triggerUpload: function() {
      this.$refs.fileInput.click();
    },

    onFileSelected: async function(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.$refs.fileInput.value = '';
      await this.uploadFile(file);
    },

    uploadFile: async function(file) {
      const allowedExt = ['.pdf', '.docx'];
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      if (!allowedExt.includes(ext)) {
        this.$buefy.snackbar.open({
          message: 'Only PDF and DOCX files are accepted.',
          type: 'is-danger',
          duration: 4000,
        });
        return;
      }
      try {
        this.isUploading = true;
        const formData = new FormData();
        formData.append('document', file);
        const response = await axiosInstance.post(
          `/audits/${this.id_audit}/documents`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        this.documents.unshift(response.data);
        this.$buefy.snackbar.open({
          message: `"${response.data.original_name}" uploaded successfully.`,
          type: 'is-success',
          duration: 4000,
        });
      } catch (error) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          'Error uploading the document.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 6000 });
        console.error('[UPLOAD]', error);
      } finally {
        this.isUploading = false;
      }
    },

    extractStandard: async function(standard) {
      if (!this.selectedDocumentId) return;

      this.$set(this.loadingStandards, standard.id, true);
      try {
        const response = await axiosInstance.post(
          `/audits/${this.id_audit}/ai/extract/${standard.id}`,
          { source_document_id: this.selectedDocumentId }
        );
        this.$set(this.extractionResults, standard.id, {
          extracted: response.data.extracted,
          results: (response.data.results || []).map(r => ({ ...r, included: false })),
        });
        if (response.data.extracted > 0) {
          this.$buefy.snackbar.open({
            message: `${response.data.extracted} DataPoints extracted for ${standard.code}.`,
            type: 'is-success',
            duration: 5000,
          });
        } else {
          this.$buefy.snackbar.open({
            message: `No data found for ${standard.code} in this document.`,
            type: 'is-warning',
            duration: 5000,
          });
        }
      } catch (error) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          `Error extracting ${standard.code}.`;
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 7000 });
        console.error('[EXTRACT]', error);
      } finally {
        this.$set(this.loadingStandards, standard.id, false);
      }
    },

    includeResult: function(r) {
      this.$set(r, 'included', !r.included);
    },

    finalizeStandard: async function(standard) {
      const results = this.extractionResults[standard.id];
      if (!results) return;
      const toSave = results.results.filter(r => r.included);

      if (toSave.length === 0) {
        this.$buefy.snackbar.open({ message: 'No DataPoints marked — nothing saved.', type: 'is-warning', duration: 3000 });
        return;
      }

      this.$set(this.finalizingStandards, standard.id, true);
      try {
        await axiosInstance.post(`/audits/${this.id_audit}/questionnaire`, {
          data_points: toSave.map(r => ({
            data_point_id: r.data_point_id,
            value_text:    r.extracted_value,
            is_applicable: true,
            status:        'completed',
          })),
        });
        this.$buefy.snackbar.open({
          message: `${toSave.length} DataPoint(s) saved to questionnaire.`,
          type: 'is-success',
          duration: 3000,
        });
        this.closeExtraction();
      } catch (error) {
        const msg =
          error.response?.data?.detail ||
          error.response?.data?.error ||
          'Error saving DataPoints.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 5000 });
        console.error('[FINALIZE]', error);
      } finally {
        this.$set(this.finalizingStandards, standard.id, false);
      }
    },

    confirmDeleteDocument: function(doc) {
      this.$buefy.dialog.confirm({
        title: 'Delete document',
        message: `Are you sure you want to delete <strong>${doc.original_name}</strong>? This will also remove any AI extractions linked to it.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'is-danger',
        hasIcon: true,
        onConfirm: () => this.deleteDocument(doc),
      });
    },

    deleteDocument: async function(doc) {
      try {
        await axiosInstance.delete(`/audits/${this.id_audit}/documents/${doc.id}`);
        this.documents = this.documents.filter(d => d.id !== doc.id);
        if (this.selectedDocumentId === doc.id) this.selectedDocumentId = null;
        this.$buefy.snackbar.open({ message: `"${doc.original_name}" deleted.`, type: 'is-success', duration: 3000 });
      } catch (error) {
        const msg = error.response?.data?.error || 'Error deleting document.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 5000 });
        console.error('[DELETE_DOC]', error);
      }
    },

    closeExtraction: function() {
      this.$emit('back-to-questionnaire');
    },

    fileIcon: function(format) {
      if (format && format.includes('pdf')) return 'file-pdf-box';
      return 'file-word-box';
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
/* Spinner visible en botones de color claro */
.standard-box .button.is-loading::after {
  border-color: transparent transparent #1976d2 #1976d2 !important;
}

.button-back {
  margin-right: 20px;
  color: #adb987;
  border-radius: 30px;
  max-width: 40px;
}
.title {
  margin-right: 10px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.section-label {
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #888;
  margin-bottom: 12px;
}
.doc-box {
  margin-bottom: 10px;
}
.doc-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.doc-icon {
  color: #adb987;
  flex-shrink: 0;
}
.doc-info {
  flex: 1;
  min-width: 0;
}
.doc-name {
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
.standard-box {
  border-left: 4px solid #adb987;
  margin-bottom: 10px;
}
.standard-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.standard-name {
  font-size: 0.95rem;
  font-weight: 500;
}
.extraction-result {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}
.result-row {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.result-row:last-child {
  border-bottom: none;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: nowrap;
  min-width: 0;
}
.result-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #363636;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.result-code {
  flex-shrink: 0;
}
.result-body {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}
.result-value {
  font-size: 0.84rem;
  flex: 1;
  color: #555;
  line-height: 1.4;
}
.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
</style>
