<template>
  <div>
    <div class="two-select form-container">
      <div style="margin-right:10px;">
        <h3>Select an organization</h3>
        <b-select 
          v-model="orgSelected"
          placeholder="Select an organization"
        >
          <option v-for="(org, index) in organizations" :key="index" :value="org.id">
            {{ org.name }}
          </option>
        </b-select>
      </div>
    </div>
    <div v-if="audits?.length > 0" class="graphic-container">
      <h4>Amount of audits: {{ auditsLength }}</h4>
      <div style="display: flex; align-items: baseline;">
        <h4 style="margin-right:20px">Evolution of sustainability index</h4>
        <b-select
          :disabled="!isAdmin"
          v-model="numAudit"
        >
          <option
            v-for="n in options"
            :key="n"
            :value="n"
          >
            {{ n }} audits
          </option>
        </b-select>
      </div>
      <div class="graphics-chart">
        <bar-chart class="bar-chart" :data="barChartData" :options="barChartOptions" />
      </div>
    </div>
  </div>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';
import { Pie } from 'vue-chartjs';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, BarElement);

export default {
  name: "OrganizationEvolution",
  components: {
    PieChart: Pie,
    BarChart: Bar
  },
  data() {
    return {
      userRole: localStorage.getItem('role'),
      organizations: [],
      orgSelected: null,
      auditsLength: null,
      audits: [],
      auditsLength: null,
      numAudit: 10,
      
      barChartData: {
        labels: [],  // Etiquetas de los procesos
        datasets: [
          {
            label: 'Sustainability Index', // Etiqueta de la barra
            data: [],  // Índices de sostenibilidad
            backgroundColor: '#36A2EB', // Color de las barras
            hoverBackgroundColor: '#FF6384', // Color al pasar el ratón
            categoryPercentage: 0.7, // ← ocupa el 80% del espacio de la categoría
            barPercentage: 0.9  
          }
        ]
      },
      barChartOptions: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Index: ${context.raw}`;
              }
            }
          }
        }
      },
      options: [5, 10, 25, 50, 100],
    };
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin' || this.userRole === 'chief_auditor';
    },
  },
  mounted: async function() {
    await this.getOrganizations();
  },
  watch: {
    orgSelected: async function() {
      await this.getAudits();
    },
    numAudit: async function() {
      await this.getAudits();
    }
  },
  methods: {
    getOrganizations: async function() {
      try {
        const response = await axiosInstance.get(`/organizations`, {
          params: {
            page: 1,
            perPage: 10000,
            sortBy: "id",
            sortOrder: "asc",
          }
        });
        this.organizations = response.data?.data;
      } catch(error){
        console.log(error);
      }
    },
    getAudits: async function() {
      try {
        const response = await axiosInstance.get(`/organizations/${this.orgSelected}/audits`);
        this.audits = response.data?.audits;
        this.auditsLength = this.audits.length;
        this.audits = this.audits
          .sort((a, b) => new Date(b.end_date) - new Date(a.end_date)) // más recientes primero
          .slice(0, this.numAudit);
        this.updateSustainabilityIndexData();
        this.$nextTick(() => {
          this.$forceUpdate(); 
        });
      } catch (error) {
        console.log(error);
      }
    },
    updateSustainabilityIndexData() {
      const labels = this.audits.map(audit => [
        audit.name,
        `(${audit.end_date})`
      ]);
      const sustainabilityIndexes = this.audits.map(audit => audit.coefficient);

      this.barChartData = {
        labels: labels,
        datasets: [
          {
            label: 'Sustainability Index', // Etiqueta de la barra
            data: sustainabilityIndexes,  // Índices de sostenibilidad
            backgroundColor: '#36A2EB',  // Color de las barras
            hoverBackgroundColor: '#FF6384', // Color al pasar el ratón
            categoryPercentage: 0.7, // ← ocupa el 80% del espacio de la categoría
            barPercentage: 0.9  
          }
        ]
      };
    },

  }
};
</script>

<style lang="scss" scoped>
.two-select{
  display: grid;  
  grid-template-columns: 1fr;  
  grid-template-columns: 1fr;
}

.form-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
  margin-bottom: 30px;
}

.bar-chart{
  height: auto;
  max-height: 300px;
}

.graphic-container{
  display: grid;
  margin-top: 30px;
  padding: 30px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  overflow-y: hidden;
}

.graphics-chart{
  display:grid;
  grid-template-columns: 1fr 1fr;
}
</style>
