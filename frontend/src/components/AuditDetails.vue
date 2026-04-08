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
      <div style="margin-left:10px;">
        <h3>Select an audit</h3>
        <b-select 
          v-model="auditSelected"
          placeholder="Select an audit"
          :disabled="orgSelected == null"
        >
          <option v-for="(aud, index) in audits" :key="index" :value="aud.id">
            {{ aud.name }}
          </option>
        </b-select>
      </div>
    </div>
    <div v-if="processes?.length > 0" class="graphic-container">
      <h4>Critical factors involved in audit: {{ factorsNumber }}</h4>
      <div class="graphics-chart">
        <div class="pie-chart-container">
          <h4>Dimensions covered by indicators</h4>
          <pie-chart class="pie-chart" :data="chartData" :options="chartOptions"/>
        </div>
        <div class="bar-chart-container">
          <h4>Sustainability index for each process</h4>
          <bar-chart class="bar-chart" :data="barChartData" :options="barChartOptions" />
        </div>
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
  name: "AuditDetails",
  components: {
    PieChart: Pie,
    BarChart: Bar
  },
  data() {
    return {
      organizations: [],
      orgSelected: null,
      audits: [],
      auditSelected: null,
      processes: [],

      factorsNumber: 0,
      chartData: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
          }
        ]
      },
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.raw} indicators`
              }
            }
          }
        }
      },

      barChartData: {
        labels: [],  // Etiquetas de los procesos
        datasets: [
          {
            label: 'Sustainability Index', // Etiqueta de la barra
            data: [],  // Índices de sostenibilidad
            backgroundColor: '#36A2EB', // Color de las barras
            hoverBackgroundColor: '#FF6384', // Color al pasar el rató
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
      }
    };
  },
  mounted: async function() {
    await this.getOrganizations();
  },
  watch: {
    orgSelected: async function() {
      await this.getAudits();
    },
    auditSelected: async function() {
      await this.getDetailsAudit();
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
      } catch (error) {
        console.log(error);
      }
    }, 
    getDetailsAudit: async function() {
      try {
        const response = await axiosInstance.get(`/audits/${this.auditSelected}/processes`);
        this.processes = response.data;

        // Actualizar los índices de sostenibilidad para el gráfico de barras
        this.updateSustainabilityIndexData();
        // Factores criticos
        this.factorsNumber = this.countDistinctCriticalFactors();
        // Dimensiones
        const chartData = this.getChartData()
        this.chartData = JSON.parse(JSON.stringify(chartData));  
        this.chartData.labels = chartData.labels
        this.chartData.datasets = chartData.datasets
        this.$nextTick(() => {
          this.$forceUpdate(); 
        });
      } catch (error) {
        console.log(error);
      }
    },
    countDistinctCriticalFactors() {
      const distinctFactors = new Set();
      this.processes.forEach(process => {
          process.indicators.forEach(indicator => {
              distinctFactors.add(indicator.factor.id);
          });
      });
      return distinctFactors.size;
  },
    // Método para contar las dimensiones y prepararlas para el gráfico
    countDimensions() {
      const dimensionCounts = {}
      this.processes.forEach(process => {
        process.indicators.forEach(indicator => {
          if (dimensionCounts[indicator.dimension]) {
            dimensionCounts[indicator.dimension]++
          } else {
            dimensionCounts[indicator.dimension] = 1
          }
        })
      })

      return dimensionCounts
    },

    // Método para obtener los datos del gráfico
    getChartData() {
      const dimensionCounts = this.countDimensions()
      // Extraemos las dimensiones y las cantidades
      const labels = Object.keys(dimensionCounts)
      const data = Object.values(dimensionCounts)

      // Generamos colores aleatorios para cada dimensión
      const backgroundColor = labels.map(() => this.getRandomColor());

      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor,
            hoverBackgroundColor: backgroundColor,
          }
        ]
      }
    },
    getRandomColor() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    },
    // Actualizar los datos para el gráfico de barras
    updateSustainabilityIndexData() {
      const labels = this.processes.map(process => process.processName); // Extraer nombres de los procesos
      const sustainabilityIndexes = this.processes.map(process => process.processIndex); // Extraer índices de sostenibilidad

      // Actualizamos barChartData de manera reactiva
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

<style lang="scss">
.two-select{
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.form-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); 
  margin-bottom: 30px;
}

.pie-chart-container {
  height: auto;
}

.pie-chart {
  height: auto;
  max-height: 300px;
  max-width: 300px;
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
