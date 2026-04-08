<template>
  <section class="custom-section">
    <Header
      title="Statistics"
      :perPage="null"
      :showAdd="false"
      :showActions="false"
      class="custom-header"
    />
    <div class="flex-content">
      <div>
        <b-menu class="menu-audits">
          <b-menu-list label="Menu">
            <b-menu-item 
              icon="eye-outline" 
              label="View audit details"
              @click="actionMenu(0)"
              >
            </b-menu-item>
            <b-menu-item 
              icon="chart-line" 
              label="Organization evolution"
              @click="actionMenu(1)"
              >
            </b-menu-item>
            <b-menu-item 
              v-if="isAdmin"
              icon="compare" 
              label="Audit comparation"
              @click="actionMenu(2)"
              >
            </b-menu-item>
          </b-menu-list>
        </b-menu>
      </div>
      <div class="statistics">
        <AuditDetails
          v-if="showAuditDetails"
        />
        <OrganizationEvolution
          v-if="showOrganizationEvolution"
        />
        <CompareAudits
          v-if="compareAudits"
        />
        <div v-if="!showAuditDetails && !showOrganizationEvolution && !compareAudits">
          <h5 style="margin-bottom: 10px">View audit details</h5>
          <span>Here you can see detailed information about a selected audit, including the covered dimensions, the number of critical factors, and a comparison of the sustainability indices of the involved processes.</span>
          <h5 style="margin-bottom: 10px; margin-top: 20px;">Organization evolution</h5>
          <span>This section shows the historical evolution of an organization, including sustainability indices and trends over time.</span>
          <h5 v-if="isAdmin" style="margin-bottom: 10px; margin-top: 20px;">Compare audits</h5>
          <span>Use this section to compare two audits side by side, examining processes, indicators, and global coefficients.</span>
        </div>
      </div>
  </div>
  </section>
</template>

<script>
import AuditDetails from '../components/AuditDetails.vue';
import OrganizationEvolution from '../components/OrganizationEvolution.vue';
import CompareAudits from '../components/CompareAudits.vue';
import Header from '@/components/Header.vue';

export default {
  name: "StatisticsView",
  components: {
    Header,
    CompareAudits,
    OrganizationEvolution,
    AuditDetails,
  },
  data() {
    return {
      userRole: localStorage.getItem('role'),
      showAuditDetails: false,
      showOrganizationEvolution: false,
      compareAudits: false,
    }
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin' || this.userRole === 'chief_auditor';
    },
  },
  methods: {
    actionMenu: function(action) {
      switch(action){
        case 0:
          this.showAuditDetails = true;
          this.showOrganizationEvolution = false;
          this.compareAudits = false;
          break;
        case 1:
          this.showOrganizationEvolution = true;
          this.showAuditDetails = false;
          this.compareAudits = false;
          break;
        case 2:
          this.compareAudits = true;
          this.showAuditDetails = false;
          this.showOrganizationEvolution = false;
        default:
          break;
      }
    },
  }
};
</script>

<style scoped lang="scss">
.custom-section {
  padding: 40px;
  display: flex;
  flex-direction: column;
  padding-bottom: 30px;
}

.custom-header {
  border-bottom: 1px solid rgb(156, 155, 155);
}

.flex-content{
  display: flex;
  height: 100%; 
}

.statistics {
  flex: 1;
  padding: 20px;
}

.menu-audits {
  display: grid;
  border-right: 1px solid grey;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.content ul {
  margin-left: 0em;
  list-style: none;
}

</style>