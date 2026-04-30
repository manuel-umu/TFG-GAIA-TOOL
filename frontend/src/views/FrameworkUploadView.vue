<template>
  <section class="custom-section">
    <div class="upload-container">

      <!-- Cabecera -->
      <div class="upload-header">
        <b-button
          class="mdi mdi-keyboard-backspace button-back"
          @click="$router.push('/frameworks')"
        />
        <h1 class="title is-4 mb-0">Upload Regulatory Framework</h1>
      </div>

      <!-- Stepper visual -->
      <div class="steps-bar">
        <div :class="['step-item', step >= 1 ? 'is-active' : '']">
          <div class="step-marker">1</div>
          <div class="step-details">Metadata & File</div>
        </div>
        <div class="step-divider" />
        <div :class="['step-item', step >= 2 ? 'is-active' : '']">
          <div class="step-marker">2</div>
          <div class="step-details">Preview & Confirm</div>
        </div>
      </div>

      <!-- PASO 1 -->
      <div v-if="step === 1" class="step-content">
        <div class="columns">
          <!-- Columna izquierda: Framework -->
          <div class="column">
            <div class="box">
              <div class="box-title-row">
                <p class="title is-6">Framework</p>
                <b-button size="is-small" type="is-light" icon-left="auto-fix" @click="fillDefaults">
                  Use CSRD defaults
                </b-button>
              </div>
              <b-field label="Code *" label-position="on-border">
                <b-input v-model="form.fw_code" placeholder="e.g. CSRD" />
              </b-field>
              <b-field label="Name *" label-position="on-border">
                <b-input v-model="form.fw_name" placeholder="e.g. Corporate Sustainability Reporting Directive" />
              </b-field>
              <b-field label="Issuing Body" label-position="on-border">
                <b-input v-model="form.fw_issuing_body" placeholder="e.g. European Union" />
              </b-field>
              <b-field label="Description" label-position="on-border">
                <b-input v-model="form.fw_description" type="textarea" rows="2" />
              </b-field>
            </div>
          </div>

          <!-- Columna derecha: Versión + archivo -->
          <div class="column">
            <div class="box">
              <p class="title is-6">Framework Version</p>
              <b-field label="Version Code *" label-position="on-border">
                <b-input v-model="form.fv_code" placeholder="e.g. ESRS-SET1-2024" />
              </b-field>
              <b-field label="Version Label *" label-position="on-border">
                <b-input v-model="form.fv_label" placeholder="e.g. ESRS Set 1 - 2024" />
              </b-field>
              <b-field label="Effective Date" label-position="on-border">
                <b-datepicker v-model="form.fv_effective_date" placeholder="Select date" icon="calendar-today" />
              </b-field>
            </div>

            <div class="box mt-4">
              <p class="title is-6">Excel File (EFRAG IG3 format)</p>
              <b-field>
                <b-upload v-model="form.file" accept=".xlsx" drag-drop expanded>
                  <section class="section">
                    <div class="content has-text-centered">
                      <p><b-icon icon="upload" size="is-large" /></p>
                      <p v-if="!form.file">Drop your <strong>.xlsx</strong> file here or click to browse</p>
                      <p v-else class="has-text-success">
                        <b-icon icon="check-circle" />
                        {{ form.file.name }}
                      </p>
                    </div>
                  </section>
                </b-upload>
              </b-field>
            </div>
          </div>
        </div>

        <div class="has-text-right mt-4">
          <b-button
            type="is-primary"
            icon-right="arrow-right"
            :loading="isParsing"
            :disabled="!canPreview"
            @click="doPreview"
          >
            Parse & Preview
          </b-button>
        </div>
      </div>

      <!-- PASO 2 -->
      <div v-if="step === 2" class="step-content">

        <!-- Info de la versión -->
        <div class="notification is-light mb-4">
          <strong>{{ form.fw_code }}</strong> — {{ form.fw_name }} &nbsp;|&nbsp;
          <strong>{{ form.fv_label }}</strong> ({{ form.fv_code }})
        </div>

        <!-- Aviso de conflicto -->
        <b-message v-if="preview.version_conflict" type="is-warning" has-icon>
          A version with code <strong>{{ form.fv_code }}</strong> already exists for this framework.
          Confirming will fail. Go back and use a different version code.
        </b-message>

        <!-- Totales -->
        <div class="totals-row mb-4">
          <span class="tag is-success is-medium mr-2">{{ preview.summary.length }} Standards</span>
          <span class="tag is-info is-medium mr-2">{{ preview.total_drs }} Disclosure Requirements</span>
          <span class="tag is-warning is-medium">{{ preview.total_dps }} DataPoints</span>
        </div>

        <!-- Tabla de estándares parseados -->
        <b-table :data="preview.summary" striped hoverable>
          <b-table-column field="code" label="Code" width="80" v-slot="props">
            <strong>{{ props.row.code }}</strong>
          </b-table-column>
          <b-table-column field="name" label="Standard" v-slot="props">
            {{ props.row.name }}
          </b-table-column>
          <b-table-column field="category" label="Category" width="140" v-slot="props">
            <span :class="categoryTagClass(props.row.category)" class="tag is-light">{{ props.row.category }}</span>
          </b-table-column>
          <b-table-column field="is_mandatory" label="Mandatory" width="100" v-slot="props">
            <b-icon
              :icon="props.row.is_mandatory ? 'check-circle' : 'circle-outline'"
              :type="props.row.is_mandatory ? 'is-success' : 'is-grey-light'"
              size="is-small"
            />
          </b-table-column>
          <b-table-column field="dr_count" label="DRs" width="70" numeric v-slot="props">
            <span class="tag is-dark is-light">{{ props.row.dr_count }}</span>
          </b-table-column>
          <b-table-column field="datapoint_count" label="DataPoints" width="100" numeric v-slot="props">
            <span class="tag is-info is-light">{{ props.row.datapoint_count }}</span>
          </b-table-column>
        </b-table>

        <div class="action-row mt-5">
          <b-button icon-left="arrow-left" @click="step = 1">Back</b-button>
          <b-button
            type="is-success"
            icon-left="database-import"
            :loading="isImporting"
            :disabled="preview.version_conflict"
            @click="doImport"
            class="ml-3"
          >
            Confirm Import
          </b-button>
        </div>
      </div>

    </div>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';
import { parseEsrsExcel } from '@/services/esrsExcelParser.js';

const CSRD_DEFAULTS = {
  fw_code: 'CSRD',
  fw_name: 'Corporate Sustainability Reporting Directive',
  fw_issuing_body: 'European Union',
  fw_description: 'EU Directive 2022/2464 requiring large companies to report on sustainability matters',
  fv_code: 'ESRS-SET1-2024',
  fv_label: 'ESRS Set 1 - 2024',
  fv_effective_date: new Date('2024-01-01'),
};

export default {
  name: 'FrameworkUploadView',
  data() {
    return {
      step: 1,
      form: {
        fw_code: '',
        fw_name: '',
        fw_issuing_body: '',
        fw_description: '',
        fv_code: '',
        fv_label: '',
        fv_effective_date: null,
        file: null,
      },
      preview: {
        token: null,
        summary: [],
        total_drs: 0,
        total_dps: 0,
        version_conflict: false,
      },
      isParsing: false,
      isImporting: false,
    };
  },
  computed: {
    canPreview() {
      return this.form.fw_code && this.form.fw_name && this.form.fv_code && this.form.fv_label && this.form.file;
    },
  },
  methods: {
    fillDefaults() {
      Object.assign(this.form, { ...CSRD_DEFAULTS });
    },
    async doPreview() {
      this.isParsing = true;
      try {
        // 1. Leer el archivo como ArrayBuffer (igual que hace IndicatorView)
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(this.form.file);
        });

        // 2. Parsear en cliente
        let parsed;
        try {
          parsed = parseEsrsExcel(arrayBuffer);
        } catch (e) {
          this.$buefy.snackbar.open({ message: 'Could not parse Excel file: ' + e.message, type: 'is-danger', duration: 7000 });
          return;
        }

        if (!parsed.standards || parsed.standards.length === 0) {
          this.$buefy.snackbar.open({ message: 'No standards found. Check the file format (EFRAG IG3).', type: 'is-danger', duration: 7000 });
          return;
        }

        // 3. Enviar JSON al backend
        const payload = {
          framework: {
            code: this.form.fw_code,
            name: this.form.fw_name,
            issuing_body: this.form.fw_issuing_body || null,
            description: this.form.fw_description || null,
          },
          frameworkVersion: {
            version_code: this.form.fv_code,
            version_label: this.form.fv_label,
            effective_date: this.form.fv_effective_date
              ? this.form.fv_effective_date.toISOString().split('T')[0]
              : null,
            source_file: this.form.file.name,
          },
          standards: parsed.standards,
        };

        const res = await axiosInstance.post('/frameworks/upload/preview', payload);
        this.preview = res.data;
        this.step = 2;
      } catch (e) {
        const msg = e.response?.data?.error || 'Error during preview. Please try again.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 7000 });
      } finally {
        this.isParsing = false;
      }
    },
    async doImport() {
      this.isImporting = true;
      try {
        const res = await axiosInstance.post(`/frameworks/upload/import/${this.preview.token}`);
        const t = res.data.totals;
        this.$buefy.snackbar.open({
          message: `Framework imported: ${t.standards} standards, ${t.disclosure_requirements} DRs, ${t.data_points} DataPoints.`,
          type: 'is-success',
          duration: 6000,
        });
        this.$router.push('/frameworks');
      } catch (e) {
        const msg = e.response?.data?.error || 'Import failed. Please try again.';
        this.$buefy.snackbar.open({ message: msg, type: 'is-danger', duration: 7000 });
      } finally {
        this.isImporting = false;
      }
    },
    categoryTagClass(category) {
      if (!category) return 'is-light';
      const c = category.toLowerCase();
      if (c.includes('environ')) return 'is-success';
      if (c.includes('social')) return 'is-info';
      if (c.includes('govern')) return 'is-warning';
      if (c.includes('cross')) return 'is-primary';
      return 'is-light';
    },
  },
};
</script>

<style scoped lang="scss">
.upload-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 28px 24px;
  width: 100%;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.button-back {
  color: #adb987;
  border-radius: 30px;
  max-width: 40px;
  border: none;
  box-shadow: none;
}

.steps-bar {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  gap: 0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0.4;
  transition: opacity 0.2s;

  &.is-active {
    opacity: 1;
  }

  .step-marker {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #98A869;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .step-details {
    font-weight: 600;
    font-size: 0.9rem;
    color: #363636;
  }
}

.step-divider {
  flex: 1;
  height: 2px;
  background: #d6dcc3;
  margin: 0 16px;
}

.step-content {
  .box-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}

.totals-row {
  display: flex;
  align-items: center;
}

.action-row {
  display: flex;
  align-items: center;
}
</style>
