<template>
  <section class="custom-section">
    <div class="frameworks-layout">

      <!-- Panel izquierdo: selector -->
      <div class="fw-sidebar">
        <p class="menu-label">Frameworks</p>
        <b-loading :is-full-page="false" v-model="loadingFrameworks" />
        <aside class="menu" v-if="!loadingFrameworks">
          <ul class="menu-list">
            <li v-for="fw in frameworks" :key="fw.id">
              <a @click="toggleFramework(fw.id)" :class="{ 'is-active-fw': openFramework === fw.id }">
                <b-icon icon="folder-outline" size="is-small" />
                {{ fw.code }} — {{ fw.name }}
              </a>
              <ul v-if="openFramework === fw.id && fw.versions && fw.versions.length">
                <li v-for="v in fw.versions" :key="v.id">
                  <a
                    @click="selectVersion(v)"
                    :class="{ 'is-active': selectedVersion && selectedVersion.id === v.id }"
                  >
                    <b-icon icon="file-document-outline" size="is-small" />
                    {{ v.version_label }}
                  </a>
                </li>
              </ul>
              <p v-else-if="openFramework === fw.id" class="has-text-grey is-size-7 ml-4">No versions available</p>
            </li>
          </ul>
        </aside>
        <p v-if="!loadingFrameworks && frameworks.length === 0" class="has-text-grey is-size-7">No frameworks loaded.</p>
      </div>

      <!-- Panel derecho: contenido -->
      <div class="fw-content">
        <div v-if="!selectedVersion" class="fw-empty">
          <b-icon icon="file-tree" size="is-large" class="has-text-grey-light" />
          <p class="has-text-grey mt-2">Select a framework version to explore its standards.</p>
        </div>

        <div v-else>
          <!-- Version -->
          <div class="fw-version-header">
            <div>
              <h2 class="title is-5 mb-1">{{ selectedVersion.version_label }}</h2>
              <span class="tag is-light">{{ selectedVersion.version_code }}</span>
              <span class="tag is-light ml-1" v-if="selectedVersion.effective_date">Effective: {{ selectedVersion.effective_date }}</span>
            </div>
            <div class="fw-version-stats" v-if="standards.length">
              <span class="tag is-success is-light">{{ standards.length }} Standards</span>
              <span class="tag is-info is-light ml-1">{{ totalDRs }} Disclosure Requirements</span>
              <span class="tag is-warning is-light ml-1">{{ totalDataPoints }} DataPoints</span>
            </div>
          </div>

          <b-loading :is-full-page="false" v-model="loadingStandards" />

          <!-- Standards -->
          <b-table
            v-if="!loadingStandards && standards.length > 0"
            :data="standards"
            detailed
            detail-key="id"
            :opened-detailed="openedStandards"
            @details-open="onStandardOpen"
            :show-detail-icon="true"
            hoverable
            striped
            class="standards-table"
          >
            <b-table-column field="code" label="Code" width="80" v-slot="props">
              <span class="has-text-weight-bold">{{ props.row.code }}</span>
            </b-table-column>
            <b-table-column field="name" label="Standard" v-slot="props">
              {{ props.row.name }}
            </b-table-column>
            <b-table-column field="category" label="Category" width="140" v-slot="props">
              <span :class="categoryTagClass(props.row.category)" class="tag is-light">
                {{ props.row.category }}
              </span>
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

            <!-- Detalle expandible: DRs y DataPoints -->
            <template slot="detail" slot-scope="props">
              <div class="standard-detail">
                <b-loading :is-full-page="false" v-model="props.row._loading" />
                <div v-if="!props.row._loading && props.row._drs">
                  <div
                    v-for="dr in props.row._drs"
                    :key="dr.id"
                    class="dr-section"
                  >
                    <div class="dr-header-row" @click="toggleDR(props.row.id, dr.id)">
                      <b-icon
                        :icon="isDROpen(props.row.id, dr.id) ? 'chevron-down' : 'chevron-right'"
                        size="is-small"
                        class="mr-1"
                      />
                      <strong class="dr-code">{{ dr.code }}</strong>
                      <span class="dr-name ml-2">{{ dr.name }}</span>
                      <span class="tag is-warning is-light ml-2 is-small">{{ dr.datapoint_count }} DataPoints</span>
                    </div>

                    <b-table
                      v-if="isDROpen(props.row.id, dr.id)"
                      :data="dr.data_points"
                      class="dp-table"
                      striped
                      hoverable
                      size="is-small"
                    >
                      <b-table-column field="official_id" label="ID" width="100" v-slot="p">
                        <code>{{ p.row.official_id }}</code>
                      </b-table-column>
                      <b-table-column field="name" label="DataPoint" v-slot="p">
                        {{ p.row.name }}
                      </b-table-column>
                      <b-table-column field="data_type" label="Type" width="90" v-slot="p">
                        <span :class="dataTypeClass(p.row.data_type)" class="tag is-small">
                          {{ p.row.data_type || '—' }}
                        </span>
                      </b-table-column>
                      <b-table-column field="is_voluntary" label="Vol." width="50" v-slot="p">
                        <b-icon :icon="p.row.is_voluntary ? 'check' : ''" size="is-small" type="is-info" />
                      </b-table-column>
                      <b-table-column field="paragraph_ref" label="§ Ref" width="70" v-slot="p">
                        <span class="is-size-7 has-text-grey">{{ p.row.paragraph_ref || '—' }}</span>
                      </b-table-column>
                    </b-table>
                  </div>
                </div>
              </div>
            </template>
          </b-table>

          <p v-if="!loadingStandards && standards.length === 0" class="has-text-grey mt-4">
            No standards found for this version.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'FrameworksView',
  data() {
    return {
      frameworks: [],
      loadingFrameworks: false,
      openFramework: null,
      selectedVersion: null,
      standards: [],
      loadingStandards: false,
      openedStandards: [],
      openDRs: {},  // { [standardId]: { [drId]: Boolean } }
    };
  },
  computed: {
    totalDRs() {
      return this.standards.reduce((sum, s) => sum + (s.dr_count || 0), 0);
    },
    totalDataPoints() {
      return this.standards.reduce((sum, s) => sum + (s.datapoint_count || 0), 0);
    },
  },
  mounted() {
    this.loadFrameworks();
  },
  methods: {
    async loadFrameworks() {
      this.loadingFrameworks = true;
      try {
        const res = await axiosInstance.get('/frameworks');
        this.frameworks = res.data || [];
        // Abrir automaticamente el primer framework
        if (this.frameworks.length > 0) {
          this.openFramework = this.frameworks[0].id;
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingFrameworks = false;
      }
    },
    toggleFramework(id) {
      this.openFramework = this.openFramework === id ? null : id;
    },
    async selectVersion(version) {
      this.selectedVersion = version;
      this.standards = [];
      this.openedStandards = [];
      this.openDRs = {};
      this.loadingStandards = true;
      try {
        const res = await axiosInstance.get(`/frameworks/versions/${version.id}/standards`);
        this.standards = (res.data.standards || []).map(s => ({ ...s, _drs: null, _loading: false }));
      } catch (e) {
        console.error(e);
      } finally {
        this.loadingStandards = false;
      }
    },
    async onStandardOpen(row) {
      if (row._drs !== null) return; // ya cargado
      const idx = this.standards.findIndex(s => s.id === row.id);
      if (idx === -1) return;
      this.$set(this.standards[idx], '_loading', true);
      try {
        const res = await axiosInstance.get(`/frameworks/versions/${this.selectedVersion.id}/standards/${row.id}`);
        this.$set(this.standards[idx], '_drs', res.data.disclosure_requirements || []);
      } catch (e) {
        console.error(e);
        this.$set(this.standards[idx], '_drs', []);
      } finally {
        this.$set(this.standards[idx], '_loading', false);
      }
    },
    toggleDR(standardId, drId) {
      if (!this.openDRs[standardId]) {
        this.$set(this.openDRs, standardId, {});
      }
      const isOpen = !!this.openDRs[standardId][drId];
      this.$set(this.openDRs[standardId], drId, !isOpen);
    },
    isDROpen(standardId, drId) {
      return !!(this.openDRs[standardId] && this.openDRs[standardId][drId]);
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
    dataTypeClass(type) {
      if (!type) return 'is-light';
      switch (type.toLowerCase()) {
        case 'narrative': return 'is-primary is-light';
        case 'boolean': return 'is-warning is-light';
        case 'integer': return 'is-info is-light';
        case 'percent': return 'is-success is-light';
        default: return 'is-light';
      }
    },
  },
};
</script>

<style scoped lang="scss">
.frameworks-layout {
  display: flex;
  height: 100%;
  gap: 0;
  flex: 1;
}

.fw-sidebar {
  width: 260px;
  min-width: 220px;
  border-right: 1px solid #e8e8e8;
  padding: 20px 16px;
  overflow-y: auto;
  background: #fafafa;

  .menu-label {
    color: #98A869;
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    margin-bottom: 12px;
  }

  .menu-list a {
    border-radius: 6px;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #363636;
    &:hover { background: #f0f4e8; color: #98A869; }
    &.is-active { background: #98A869; color: white; }
    &.is-active-fw { font-weight: 600; color: #98A869; }
  }

  .menu-list ul {
    margin-left: 16px;
    border-left: 2px solid #e8e8e8;
    padding-left: 8px;
  }
}

.fw-content {
  flex: 1;
  padding: 24px 28px;
  overflow-y: auto;
}

.fw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #aaa;
}

.fw-version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;

  .fw-version-stats {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.standard-detail {
  padding: 12px 16px;
  background: #f9f9f9;
}

.dr-section {
  margin-bottom: 10px;
}

.dr-header-row {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  &:hover { background: #f0f4e8; }

  .dr-code { color: #98A869; font-size: 0.9rem; }
  .dr-name { font-size: 0.88rem; color: #555; flex: 1; }
}

.dp-table {
  margin: 6px 0 6px 24px;
}

.standards-table {
  margin-top: 8px;
}
</style>
