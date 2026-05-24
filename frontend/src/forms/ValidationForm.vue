<template>
  <section v-if="action === 'validation'">
    <div class="validation-header">
      <b-button
        class="mdi mdi-keyboard-backspace button-back"
        @click="closeValidation"
      />
      <h1 class="title">Validate Questionnaire</h1>
      <div class="header-actions">
        <b-button
          class="btn-app-green-outline"
          icon-left="content-save"
          style="margin-right: 8px;"
          :loading="isSaving"
          @click="save"
        >
          Save
        </b-button>
        <b-button
          class="btn-app-green"
          icon-left="lock"
          :loading="isClosing"
          :disabled="!allValidated"
          @click="confirmClose"
        >
          Close audit
        </b-button>
      </div>
    </div>

    <b-loading :is-full-page="false" v-model="isLoading" />

    <div v-if="!isLoading && standards.length === 0" class="notification is-light">
      No questionnaire data found for this audit.
    </div>

    <div v-if="!isLoading && standards.length > 0">
      <b-tabs
        v-model="activeStandardTab"
        :vertical="standards.length > 1"
        type="is-boxed"
        class="validation-tabs"
      >
        <b-tab-item
          v-for="standard in standards"
          :key="standard.id"
        >
          <template #header>
            <span class="tab-label-code">{{ standard.code }}</span>
            <span class="tab-label-name">{{ standard.name }}</span>
            <b-tag
              :type="standardProgress(standard).validated === standardProgress(standard).total && standardProgress(standard).total > 0 ? 'is-success is-light' : 'is-light'"
              size="is-small"
              class="tab-counter"
            >
              {{ standardProgress(standard).validated }} / {{ standardProgress(standard).total }}
            </b-tag>
          </template>

          <div class="standard-toolbar">
            <b-button
              class="btn-app-green-outline"
              size="is-small"
              icon-left="check-all"
              @click="validateAll(standard)"
            >
              Validate all
            </b-button>
          </div>

          <div v-if="standard.disclosure_requirements.length === 0" class="notification is-light">
            No answered datapoints in this standard.
          </div>

          <div
            v-for="dr in standard.disclosure_requirements"
            :key="dr.id"
            class="box dr-box"
          >
            <div class="dr-header">
              <span class="tag is-dark dr-code">{{ dr.code }}</span>
              <span class="dr-name">{{ dr.name }}</span>
            </div>

            <div
              v-for="dp in dr.data_points"
              :key="dp.id"
              class="dp-block"
              :class="{
                'dp-validated': dpStatus[dp.id] === 'validated',
                'dp-rejected': dpStatus[dp.id] === 'rejected',
              }"
            >
              <div class="dp-title-row">
                <span class="dp-name">{{ dp.name }}</span>
                <span class="dp-official-id">{{ dp.official_id }}</span>
                <div class="dp-actions">
                  <b-button
                    :type="dpStatus[dp.id] === 'validated' ? 'is-success' : 'is-light'"
                    size="is-small"
                    icon-left="check"
                    @click="toggleValidate(dp.id)"
                  >
                    {{ dpStatus[dp.id] === 'validated' ? 'Validated' : 'Validate' }}
                  </b-button>
                  <b-button
                    :type="dpStatus[dp.id] === 'rejected' ? 'is-danger' : 'is-light'"
                    size="is-small"
                    icon-left="close"
                    @click="toggleReject(dp.id)"
                  >
                    {{ dpStatus[dp.id] === 'rejected' ? 'Rejected' : 'Reject' }}
                  </b-button>
                </div>
              </div>
              <div class="dp-value">
                <span class="dp-value-label">Value:</span>
                <span class="dp-value-text">{{ displayValue(dp) }}</span>
              </div>
              <div v-if="dp.response && dp.response.evidence_reference" class="dp-value">
                <span class="dp-value-label">Evidence:</span>
                <span class="dp-value-text">{{ dp.response.evidence_reference }}</span>
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
  name: 'ValidationForm',
  props: {
    action: String,
    id_audit: Number,
  },
  data() {
    return {
      isLoading: false,
      isSaving: false,
      isClosing: false,
      standards: [],
      dpStatus: {},
      activeStandardTab: 0,
    };
  },
  mounted() {
    if (this.id_audit) {
      this.loadQuestionnaire();
    }
  },
  computed: {
    standardProgress() {
      return (standard) => {
        let total = 0;
        let validated = 0;
        standard.disclosure_requirements.forEach((dr) => {
          dr.data_points.forEach((dp) => {
            total++;
            if (this.dpStatus[dp.id] === 'validated') validated++;
          });
        });
        return { validated, total };
      };
    },
    allValidated() {
      let total = 0;
      let validated = 0;
      this.standards.forEach((std) => {
        std.disclosure_requirements.forEach((dr) => {
          dr.data_points.forEach((dp) => {
            total++;
            if (this.dpStatus[dp.id] === 'validated') validated++;
          });
        });
      });
      return total > 0 && validated === total;
    },
  },
  methods: {
    loadQuestionnaire: async function () {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${this.id_audit}/questionnaire`);
        const standards = response.data.standards || [];

        const dpStatus = {};
        standards.forEach((std) => {
          std.disclosure_requirements.forEach((dr) => {
            dr.data_points = dr.data_points.filter((dp) => dp.response != null);
            dr.data_points.forEach((dp) => {
              if (dp.response.status === 'validated' || dp.response.status === 'rejected') {
                dpStatus[dp.id] = dp.response.status;
              }
            });
          });
          std.disclosure_requirements = std.disclosure_requirements.filter((dr) => dr.data_points.length > 0);
        });

        this.standards = standards;
        this.dpStatus = dpStatus;
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

    displayValue: function (dp) {
      const resp = dp.response;
      if (resp.is_applicable === false) return 'Not applicable';
      const value = resp.value_text;
      if (value === null || value === '') return '—';
      if (dp.data_type === 'boolean') {
        return value === 'true' ? 'Yes' : 'No';
      }
      return value;
    },

    toggleValidate: function (dpId) {
      if (this.dpStatus[dpId] === 'validated') {
        this.$set(this.dpStatus, dpId, null);
      } else {
        this.$set(this.dpStatus, dpId, 'validated');
      }
    },

    toggleReject: function (dpId) {
      if (this.dpStatus[dpId] === 'rejected') {
        this.$set(this.dpStatus, dpId, null);
      } else {
        this.$set(this.dpStatus, dpId, 'rejected');
      }
    },

    validateAll: function (standard) {
      standard.disclosure_requirements.forEach((dr) => {
        dr.data_points.forEach((dp) => {
          this.$set(this.dpStatus, dp.id, 'validated');
        });
      });
    },

    buildPayload: function () {
      const validated_ids = [];
      const rejected_ids = [];
      Object.keys(this.dpStatus).forEach((id) => {
        if (this.dpStatus[id] === 'validated') validated_ids.push(Number(id));
        else if (this.dpStatus[id] === 'rejected') rejected_ids.push(Number(id));
      });
      return { validated_ids, rejected_ids };
    },

    save: async function () {
      try {
        this.isSaving = true;
        await axiosInstance.post(`/audits/${this.id_audit}/questionnaire/validate`, this.buildPayload());
        this.$buefy.snackbar.open({
          message: 'Validation saved successfully.',
          type: 'is-success',
          duration: 4000,
        });
        this.closeValidation();
      } catch (error) {
        this.$buefy.snackbar.open({
          message: 'Error saving validation. Please try again.',
          type: 'is-danger',
          duration: 7000,
        });
        console.error(error);
      } finally {
        this.isSaving = false;
      }
    },

    confirmClose: function () {
      this.$buefy.dialog.confirm({
        title: 'Close audit',
        message: 'All datapoints are validated. Closing the audit is final. Do you want to continue?',
        confirmText: 'Close audit',
        cancelText: 'Cancel',
        type: 'is-warning',
        hasIcon: true,
        onConfirm: this.closeAudit,
      });
    },

    closeAudit: async function () {
      try {
        this.isClosing = true;
        await axiosInstance.post(`/audits/${this.id_audit}/questionnaire/validate`, this.buildPayload());
        await axiosInstance.post(`/audits/${this.id_audit}/close`);
        this.$buefy.snackbar.open({
          message: 'Audit closed successfully.',
          type: 'is-success',
          duration: 4000,
        });
        this.closeValidation();
      } catch (error) {
        const msg = error.response?.data?.error || 'Error closing audit. Please try again.';
        this.$buefy.snackbar.open({
          message: msg,
          type: 'is-danger',
          duration: 7000,
        });
        console.error(error);
      } finally {
        this.isClosing = false;
      }
    },

    closeValidation: function () {
      this.$emit('finished-actions-for-audit');
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
    },
  },
};
</script>

<style scoped>
.validation-header {
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

.validation-tabs {
  margin-top: 8px;
}

.validation-tabs >>> nav.tabs {
  align-self: flex-start;
}

.validation-tabs >>> .tab-content {
  flex: 1;
  min-width: 0;
}

.standard-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
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
  word-break: break-word;
}

.dp-block {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fafafa;
  transition: border-color 0.15s, background-color 0.15s;
}

.dp-block.dp-validated {
  border-color: #98a869;
  background: #f4f7ed;
}

.dp-block.dp-rejected {
  border-color: #d04949;
  background: #fbe9e9;
}

.dp-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.dp-name {
  font-size: 0.92rem;
  font-weight: 500;
  color: #363636;
}

.dp-official-id {
  font-family: monospace;
  font-size: 0.78rem;
  color: #888;
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 3px;
}

.dp-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.dp-value {
  font-size: 0.86rem;
  margin-top: 2px;
}

.dp-value-label {
  font-weight: 600;
  color: #777;
  margin-right: 6px;
}

.dp-value-text {
  color: #363636;
  word-break: break-word;
}
</style>
