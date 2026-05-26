<template>
  <section class="custom-section">
    <div class="frameworks-layout">
      <div class="fw-sidebar">
        <p class="menu-label">Frameworks</p>
        <b-loading :is-full-page="false" v-model="loadingFrameworks" />
        <aside class="menu" v-if="!loadingFrameworks">
          <ul class="menu-list">
            <li v-for="fw in frameworks" :key="fw.id">
              <a
                @click="toggleFramework(fw.id)"
                :class="{
                  'is-active-fw': openFramework === fw.id,
                  'framework-inactive': !fw.is_active,
                }"
              >
                <b-icon
                  :icon="fw.is_active ? 'folder-outline' : 'folder-lock'"
                  size="is-small"
                />
                {{ fw.code }} — {{ fw.name }}
                <b-button
                  v-if="isAdmin"
                  :icon-left="fw.is_active ? 'lock' : 'lock-open'"
                  size="is-small"
                  type="is-ghost"
                  class="fw-toggle-btn"
                  :title="
                    fw.is_active ? 'Deactivate framework' : 'Activate framework'
                  "
                  @click.stop="toggleFrameworkActive(fw)"
                />
              </a>
              <ul
                v-if="
                  openFramework === fw.id && fw.versions && fw.versions.length
                "
              >
                <li v-for="v in fw.versions" :key="v.id">
                  <a
                    @click="selectVersion(v)"
                    :class="{
                      'is-active':
                        selectedVersion && selectedVersion.id === v.id,
                      'version-inactive': !v.is_active,
                    }"
                  >
                    <b-icon
                      :icon="v.is_active ? 'file-document-outline' : 'lock'"
                      size="is-small"
                    />
                    {{ v.version_label }}
                  </a>
                </li>
              </ul>
              <p
                v-else-if="openFramework === fw.id"
                class="has-text-grey is-size-7 ml-4"
              >
                No versions available
              </p>
            </li>
          </ul>
        </aside>
        <p
          v-if="!loadingFrameworks && frameworks.length === 0"
          class="has-text-grey is-size-7"
        >
          No frameworks loaded.
        </p>
      </div>

      <div class="fw-content">
        <div class="fw-content-topbar">
          <b-button
            v-if="isAdmin"
            type="is-primary"
            icon-left="upload"
            size="is-small"
            @click="$router.push('/frameworks/upload')"
          >
            Upload Framework
          </b-button>
        </div>

        <div v-if="!selectedVersion" class="fw-empty">
          <b-icon
            icon="file-tree"
            size="is-large"
            class="has-text-grey-light"
          />
          <p class="has-text-grey mt-2">
            Select a framework version to explore its standards.
          </p>
        </div>

        <div v-else>
          <div class="fw-version-header">
            <div>
              <h2 class="title is-5 mb-1">
                {{ selectedVersion.version_label }}
                <span
                  v-if="selectedVersion.is_active"
                  class="tag is-success is-light ml-2"
                  >Active</span
                >
                <span v-else class="tag is-danger is-light ml-2">Inactive</span>
              </h2>
              <span class="tag is-light">{{
                selectedVersion.version_code
              }}</span>
              <span
                class="tag is-light ml-1"
                v-if="selectedVersion.effective_date"
                >Effective: {{ selectedVersion.effective_date }}</span
              >
            </div>
            <div class="fw-version-stats" v-if="standards.length">
              <span class="tag is-success is-light"
                >{{ standards.length }} Standards</span
              >
              <span class="tag is-info is-light ml-1"
                >{{ totalDRs }} Disclosure Requirements</span
              >
              <span class="tag is-warning is-light ml-1"
                >{{ totalDataPoints }} DataPoints</span
              >
            </div>
            <div v-if="isAdmin">
              <b-button
                :type="
                  selectedVersion.is_active
                    ? 'is-danger is-light'
                    : 'btn-app-green'
                "
                :icon-left="selectedVersion.is_active ? 'lock' : 'lock-open'"
                size="is-small"
                @click="toggleVersionActive"
              >
                {{ selectedVersion.is_active ? "Deactivate" : "Activate" }}
              </b-button>
            </div>
          </div>

          <b-loading :is-full-page="false" v-model="loadingStandards" />

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
            <b-table-column
              field="category"
              label="Category"
              width="140"
              v-slot="props"
            >
              <span
                :class="categoryTagClass(props.row.category)"
                class="tag is-light"
              >
                {{ props.row.category }}
              </span>
            </b-table-column>
            <b-table-column
              field="is_mandatory"
              label="Mandatory"
              width="100"
              v-slot="props"
            >
              <b-icon
                :icon="
                  props.row.is_mandatory ? 'check-circle' : 'circle-outline'
                "
                :type="props.row.is_mandatory ? 'is-success' : 'is-grey-light'"
                size="is-small"
              />
            </b-table-column>
            <b-table-column
              field="dr_count"
              label="DRs"
              width="70"
              numeric
              v-slot="props"
            >
              <span class="tag is-dark is-light">{{ props.row.dr_count }}</span>
            </b-table-column>
            <b-table-column
              field="datapoint_count"
              label="DataPoints"
              width="100"
              numeric
              v-slot="props"
            >
              <span class="tag is-info is-light">{{
                props.row.datapoint_count
              }}</span>
            </b-table-column>

            <template slot="detail" slot-scope="props">
              <div class="standard-detail">
                <b-loading :is-full-page="false" v-model="props.row._loading" />
                <div v-if="!props.row._loading && props.row._drs">
                  <div
                    v-for="dr in props.row._drs"
                    :key="dr.id"
                    class="dr-section"
                  >
                    <div
                      class="dr-header-row"
                      @click="toggleDR(props.row.id, dr.id)"
                    >
                      <b-icon
                        :icon="
                          isDROpen(props.row.id, dr.id)
                            ? 'chevron-down'
                            : 'chevron-right'
                        "
                        size="is-small"
                        class="mr-1"
                      />
                      <strong class="dr-code">{{ dr.code }}</strong>
                      <span class="dr-name ml-2">{{ dr.name }}</span>
                      <span class="tag is-warning is-light ml-2 is-small"
                        >{{ dr.datapoint_count }} DataPoints</span
                      >
                    </div>

                    <b-table
                      v-if="isDROpen(props.row.id, dr.id)"
                      :data="dr.data_points"
                      class="dp-table"
                      striped
                      hoverable
                      size="is-small"
                    >
                      <b-table-column
                        field="official_id"
                        label="ID"
                        width="100"
                        v-slot="p"
                      >
                        <code>{{ p.row.official_id }}</code>
                      </b-table-column>
                      <b-table-column field="name" label="DataPoint" v-slot="p">
                        {{ p.row.name }}
                      </b-table-column>
                      <b-table-column
                        field="data_type"
                        label="Type"
                        width="90"
                        v-slot="p"
                      >
                        <span
                          :class="dataTypeClass(p.row.data_type)"
                          class="tag is-small"
                        >
                          {{ p.row.data_type || "—" }}
                        </span>
                      </b-table-column>
                      <b-table-column
                        field="is_voluntary"
                        label="Vol."
                        width="50"
                        v-slot="p"
                      >
                        <b-icon
                          :icon="p.row.is_voluntary ? 'check' : ''"
                          size="is-small"
                          type="is-info"
                        />
                      </b-table-column>
                      <b-table-column
                        field="paragraph_ref"
                        label="§ Ref"
                        width="70"
                        v-slot="p"
                      >
                        <span class="is-size-7 has-text-grey">{{
                          p.row.paragraph_ref || "—"
                        }}</span>
                      </b-table-column>
                    </b-table>
                  </div>
                </div>
              </div>
            </template>
          </b-table>

          <p
            v-if="!loadingStandards && standards.length === 0"
            class="has-text-grey mt-4"
          >
            No standards found for this version.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axiosInstance from "@/services/axiosInstance";

export default {
  name: "FrameworksView",
  data() {
    return {
      userRole: localStorage.getItem("role"),
      frameworks: [],
      loadingFrameworks: false,
      openFramework: null,
      selectedVersion: null,
      standards: [],
      loadingStandards: false,
      openedStandards: [],
      openDRs: {},
    };
  },
  computed: {
    isAdmin() {
      return this.userRole === "admin";
    },
    totalDRs() {
      return this.standards.reduce((sum, s) => sum + (s.dr_count || 0), 0);
    },
    totalDataPoints() {
      return this.standards.reduce(
        (sum, s) => sum + (s.datapoint_count || 0),
        0,
      );
    },
  },
  mounted: async function () {
    await this.loadFrameworks();
  },
  methods: {
    loadFrameworks: async function () {
      this.loadingFrameworks = true;
      try {
        const response = await axiosInstance.get("/frameworks");
        this.frameworks = response.data || [];
        if (this.frameworks.length > 0) {
          this.openFramework = this.frameworks[0].id;
        }
      } catch (error) {
        console.log(error);
      } finally {
        this.loadingFrameworks = false;
      }
    },
    toggleFramework(id) {
      this.openFramework = this.openFramework === id ? null : id;
    },
    selectVersion: async function (version) {
      this.selectedVersion = version;
      this.standards = [];
      this.openedStandards = [];
      this.openDRs = {};
      this.loadingStandards = true;
      try {
        const response = await axiosInstance.get(
          `/frameworks/versions/${version.id}/standards`,
        );
        this.standards = (response.data.standards || []).map((s) => ({
          ...s,
          _drs: null,
          _loading: false,
        }));
      } catch (error) {
        console.log(error);
      } finally {
        this.loadingStandards = false;
      }
    },
    onStandardOpen: async function (row) {
      if (row._drs !== null) return;
      const idx = this.standards.findIndex((s) => s.id === row.id);
      if (idx === -1) return;
      this.$set(this.standards[idx], "_loading", true);
      try {
        const response = await axiosInstance.get(
          `/frameworks/versions/${this.selectedVersion.id}/standards/${row.id}`,
        );
        this.$set(
          this.standards[idx],
          "_drs",
          response.data.disclosure_requirements || [],
        );
      } catch (error) {
        console.log(error);
        this.$set(this.standards[idx], "_drs", []);
      } finally {
        this.$set(this.standards[idx], "_loading", false);
      }
    },
    toggleDR(standardId, drId) {
      if (!this.openDRs[standardId]) {
        this.$set(this.openDRs, standardId, {});
      }
      this.$set(
        this.openDRs[standardId],
        drId,
        !this.openDRs[standardId][drId],
      );
    },
    isDROpen(standardId, drId) {
      return !!(this.openDRs[standardId] && this.openDRs[standardId][drId]);
    },
    categoryTagClass(category) {
      if (!category) return "is-light";
      const c = category.toLowerCase();
      if (c.includes("environ")) return "is-success";
      if (c.includes("social")) return "is-info";
      if (c.includes("govern")) return "is-warning";
      if (c.includes("cross")) return "is-primary";
      return "is-light";
    },
    dataTypeClass(type) {
      if (!type) return "is-light";
      switch (type.toLowerCase()) {
        case "narrative":
          return "is-primary is-light";
        case "boolean":
          return "is-warning is-light";
        case "integer":
          return "is-info is-light";
        case "percent":
          return "is-success is-light";
        default:
          return "is-light";
      }
    },
    toggleVersionActive: function () {
      const isActive = this.selectedVersion.is_active;
      this.$buefy.dialog.confirm({
        title: `${isActive ? "Deactivate" : "Activate"} version`,
        message: `Are you sure you want to ${
          isActive ? "deactivate" : "activate"
        } <strong>${this.selectedVersion.version_label}</strong>?`,
        confirmText: isActive ? "Deactivate" : "Activate",
        type: isActive ? "is-danger" : "is-success",
        hasIcon: true,
        onConfirm: async () => {
          try {
            const response = await axiosInstance.patch(
              `/frameworks/versions/${this.selectedVersion.id}/active`,
            );
            const newActive = response.data.is_active;
            this.$set(this.selectedVersion, "is_active", newActive);
            for (const fw of this.frameworks) {
              if (!fw.versions) continue;
              const idx = fw.versions.findIndex(
                (v) => v.id === this.selectedVersion.id,
              );
              if (idx !== -1) {
                this.$set(fw.versions[idx], "is_active", newActive);
                break;
              }
            }
            this.$buefy.snackbar.open({
              message: `Version ${
                newActive ? "activated" : "deactivated"
              } successfully.`,
              type: newActive ? "is-success" : "is-warning",
              duration: 4000,
            });
          } catch (error) {
            console.log(error);
            this.$buefy.snackbar.open({
              message: "Error updating version status.",
              type: "is-danger",
              duration: 5000,
            });
          }
        },
      });
    },
    toggleFrameworkActive: function (fw) {
      const isActive = fw.is_active;
      this.$buefy.dialog.confirm({
        title: `${isActive ? "Deactivate" : "Activate"} framework`,
        message: `Are you sure you want to ${
          isActive ? "deactivate" : "activate"
        } <strong>${fw.code} — ${fw.name}</strong>?`,
        confirmText: isActive ? "Deactivate" : "Activate",
        type: isActive ? "is-danger" : "is-success",
        hasIcon: true,
        onConfirm: async () => {
          try {
            const response = await axiosInstance.patch(
              `/frameworks/${fw.id}/active`,
            );
            const idx = this.frameworks.findIndex((f) => f.id === fw.id);
            if (idx !== -1) {
              this.$set(
                this.frameworks[idx],
                "is_active",
                response.data.is_active,
              );
              if (!response.data.is_active && this.frameworks[idx].versions) {
                this.frameworks[idx].versions.forEach((v, vIdx) => {
                  this.$set(this.frameworks[idx].versions, vIdx, {
                    ...v,
                    is_active: false,
                  });
                });
              }
            }
            this.$buefy.snackbar.open({
              message: `Framework ${
                response.data.is_active ? "activated" : "deactivated"
              } successfully.`,
              type: response.data.is_active ? "is-success" : "is-warning",
              duration: 4000,
            });
          } catch (error) {
            console.log(error);
            this.$buefy.snackbar.open({
              message: "Error updating framework status.",
              type: "is-danger",
              duration: 5000,
            });
          }
        },
      });
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
    color: #98a869;
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
    &:hover {
      background: #f0f4e8;
      color: #98a869;
    }
    &.is-active {
      background: #98a869;
      color: white;
    }
    &.is-active-fw {
      font-weight: 600;
      color: #98a869;
    }
    &.version-inactive {
      opacity: 0.5;
      font-style: italic;
    }
    &.framework-inactive {
      opacity: 0.5;
      font-style: italic;
    }
    .fw-toggle-btn {
      margin-left: auto;
      padding: 0 4px;
      height: 20px;
      min-width: 20px;
      opacity: 0;
      transition: opacity 0.15s;
    }
    &:hover .fw-toggle-btn {
      opacity: 1;
    }
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

.fw-content-topbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
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
  &:hover {
    background: #f0f4e8;
  }

  .dr-code {
    color: #98a869;
    font-size: 0.9rem;
  }
  .dr-name {
    font-size: 0.88rem;
    color: #555;
    flex: 1;
  }
}

.dp-table {
  margin: 6px 0 6px 24px;
}

.standards-table {
  margin-top: 8px;
}
</style>

<style>
.btn-app-green {
  background-color: #adb987 !important;
  border-color: #adb987 !important;
  color: #fff !important;
}
.btn-app-green:hover,
.btn-app-green:focus {
  background-color: #9aa876 !important;
  border-color: #9aa876 !important;
  color: #fff !important;
}
</style>
