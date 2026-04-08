<template>
  <div>
    <!-- ===== Selección de organización y auditorías ===== -->
    <div class="form-container selectors-grid">
      <div class="row-organization">
        <h3>Select an organization</h3>
        <b-select v-model="orgSelected" placeholder="Select an organization">
          <option
            v-for="org in organizations"
            :key="org.id"
            :value="org.id"
          >
            {{ org.name }}
          </option>
        </b-select>
      </div>

      <div class="row-audits">
        <div>
          <h3>Select audit 1</h3>
          <b-select
            v-model="auditOneId"
            :disabled="!orgSelected"
            placeholder="Select an audit"
          >
            <option
              v-for="aud in auditsForSelectOne"
              :key="aud.id"
              :value="aud.id"
            >
              {{ aud.name }}
            </option>
          </b-select>
        </div>

        <div>
          <h3>Select audit 2</h3>
          <b-select
            v-model="auditTwoId"
            :disabled="!orgSelected"
            placeholder="Select an audit"
          >
            <option
              v-for="aud in auditsForSelectTwo"
              :key="aud.id"
              :value="aud.id"
            >
              {{ aud.name }}
            </option>
          </b-select>
        </div>
      </div>
    </div>

    <!-- ===== Coeficientes Globales ===== -->
    <div v-if="auditOneId || auditTwoId" class="coefficients-global">
      <div v-if="auditOneId">
        <strong>Audit 1 ({{ detailsAuditOne.audit.name }}) coefficient:</strong> {{ detailsAuditOne.audit.coefficient ?? '-' }}
      </div>
      <div v-if="auditTwoId">
        <strong>Audit 2 ({{ detailsAuditTwo.audit.name }}) coefficient:</strong> {{ detailsAuditTwo.audit.coefficient ?? '-' }}
      </div>
    </div>

    <!-- ===== Resultados comparativos por procesos ===== -->
    <div v-if="auditOneId || auditTwoId" class="graphics-container">
      <div v-for="process in comparedProcesses" :key="process.id" class="process-block">
        <h4>{{ process.name }}</h4>
        <div class="process-indices">
          <span>{{ detailsAuditOne.audit.name }} sustainability index: {{ process.auditOne.processIndex ?? '-' }}</span>
          <span>{{ detailsAuditTwo.audit.name }} sustainability index: {{ process.auditTwo.processIndex ?? '-' }}</span>
        </div>

        <div class="indicators-container">
          <div class="audit-column">
            <h5>{{ detailsAuditOne.audit.name }}</h5>
            <div v-if="process.auditOne.indicators.length">
              <div
                v-for="ind in process.auditOne.indicators"
                :key="ind.id"
                class="indicator"
              >
                <span
                  class="dot"
                  :style="{ backgroundColor: dimensionColors[ind.dimension] || '#999' }"
                ></span>
                {{ ind.name }} ({{ ind.dimension }}, {{ ind.goal }})
                <span class="status" :class="{ inactive: ind.deleted_at }">
                  {{ ind.deleted_at ? 'Inactive' : 'Active' }}
                </span>
              </div>
            </div>
            <div v-else class="empty">No indicators</div>
          </div>

          <div class="audit-column">
            <h5>{{ detailsAuditTwo.audit.name }}</h5>
            <div v-if="process.auditTwo.indicators.length">
              <div
                v-for="ind in process.auditTwo.indicators"
                :key="ind.id"
                class="indicator"
              >
                <span
                  class="dot"
                  :style="{ backgroundColor: dimensionColors[ind.dimension] || '#999' }"
                ></span>
                {{ ind.name }} ({{ ind.dimension }}, {{ ind.goal }})
                <span class="status" :class="{ inactive: ind.deleted_at }">
                  {{ ind.deleted_at ? 'Inactive' : 'Active' }}
                </span>
              </div>
            </div>
            <div v-else class="empty">No indicators</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axiosInstance from '@/services/axiosInstance'

export default {
  name: 'CompareAudits',
  data() {
    return {
      userRole: localStorage.getItem('role'),
      organizations: [],
      orgSelected: null,

      audits: [],
      auditsForSelectOne: [],
      auditsForSelectTwo: [],

      auditOneId: null,
      auditTwoId: null,

      detailsAuditOne: { audit: {}, details: [] },
      detailsAuditTwo: { audit: {}, details: [] },
    }
  },

  computed: {
    // Colores dinámicos según dimensiones
    dimensionColors() {
      const colors = ['#2196f3','#4caf50','#ff9800','#9c27b0','#f44336','#00bcd4','#ffc107','#795548']
      const map = {}
      let i = 0
      const allIndicators = [
        ...this.detailsAuditOne.details.flatMap(p => p.indicators),
        ...this.detailsAuditTwo.details.flatMap(p => p.indicators)
      ]
      allIndicators.forEach(ind => {
        if (ind.dimension && !map[ind.dimension]) {
          map[ind.dimension] = colors[i % colors.length]
          i++
        }
      })
      return map
    },

    // Comparación de procesos de ambas auditorías
    comparedProcesses() {
      const map = {}

      // Audit 1
      this.detailsAuditOne.details.forEach(p => {
        map[p.processId] = {
          id: p.processId,
          name: p.processName,
          auditOne: {
            indicators: p.indicators,
            processIndex: p.processIndex ?? '-'
          },
          auditTwo: { indicators: [], processIndex: '-' }
        }
      })

      // Audit 2
      this.detailsAuditTwo.details.forEach(p => {
        if (!map[p.processId]) {
          map[p.processId] = {
            id: p.processId,
            name: p.processName,
            auditOne: { indicators: [], processIndex: '-' },
            auditTwo: { indicators: p.indicators, processIndex: p.processIndex ?? '-' }
          }
        } else {
          map[p.processId].auditTwo = {
            indicators: p.indicators,
            processIndex: p.processIndex ?? '-'
          }
        }
      })

      return Object.values(map)
    }
  },

  watch: {
    async orgSelected() {
      this.auditOneId = null
      this.auditTwoId = null
      await this.getAudits()
    },

    async auditOneId() {
      this.auditsForSelectTwo = this.audits.filter(a => a.id !== Number(this.auditOneId))
      await this.getAudit(this.auditOneId, 'one')
      await this.getDetailsAudit(this.auditOneId, 'one')
    },

    async auditTwoId() {
      this.auditsForSelectOne = this.audits.filter(a => a.id !== Number(this.auditTwoId))
      await this.getAudit(this.auditTwoId, 'two')
      await this.getDetailsAudit(this.auditTwoId, 'two')
    }
  },

  mounted() {
    this.getOrganizations()
  },

  methods: {
    async getOrganizations() {
      const res = await axiosInstance.get('/organizations')
      this.organizations = res.data?.data || []
    },

    async getAudits() {
      const res = await axiosInstance.get(`/organizations/${this.orgSelected}/audits`)
      this.audits = res.data?.audits || []
      this.auditsForSelectOne = this.audits
      this.auditsForSelectTwo = this.audits
    },

    async getAudit(id, which) {
      const res = await axiosInstance.get(`/audits/${id}`)
      if (which === 'one') {
        this.detailsAuditOne.audit = res.data?.audit || {}
      } else {
        this.detailsAuditTwo.audit = res.data?.audit || {}
      }
    },

    async getDetailsAudit(id, which) {
      const res = await axiosInstance.get(`/audits/${id}/processes`)
      if (which === 'one') {
        this.detailsAuditOne.details = res.data || []
      } else {
        this.detailsAuditTwo.details = res.data || []
      }
    }
  }
}
</script>

<style scoped>
.selectors-grid {
  display: grid;
  gap: 20px;
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
}

.row-audits {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.coefficients-global {
  margin-top: 20px;
  font-size: 1.1em;
  display: flex;
  gap: 40px;
}

.graphics-container {
  margin-top: 30px;
  display: grid;
  gap: 30px;
}

.process-block {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
}

.process-indices {
  font-size: 0.9em;
  color: #555;
  margin-bottom: 10px;
  display: flex;
  gap: 20px;
}

.indicators-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.audit-column h5 {
  margin-bottom: 10px;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status.inactive {
  color: red;
  margin-left: 5px;
}

.empty {
  font-size: 0.9em;
  color: #999;
}
</style>
