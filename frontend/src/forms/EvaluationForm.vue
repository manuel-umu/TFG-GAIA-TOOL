<template>
    <section v-if="action === 'evaluate'">
      <div style="display: flex; align-items: center;">
        <b-button 
            v-if="!finished" 
            class="mdi mdi-keyboard-backspace button-back" 
            @click="closeEvaluation"
        />

        <h1 class="title">Sustainability Audit</h1>
        <b-tooltip
            position="is-right"
            style="max-width: 100%;"
            :multilined="false">
            <template #content>
              <div>
                  <strong>Name's audit:</strong> {{ name }}<br>
                  <strong>Organization:</strong> {{ organizationName }}
              </div>
            </template>
            <b-icon class="mdi mdi-information-variant-circle-outline icon-info"></b-icon>
        </b-tooltip>
      </div>
      <b-steps
        v-model="activeStep"
        :animated=true
        :rounded=true
        :has-navigation=true
        style="margin-top: 30px;"
      >
        <b-step-item step="1" label="Indicators value" :clickable="false" style="margin-top: 20px;">
          <h1>Indicators value</h1>
          <form>
            <div v-for="(item, index) in processesAudit" class="box">
              <h4>{{ index+1 }}. {{ item.name }}</h4>
              <ul>
                <li v-for="(subitem, index) in item.indicators" :key="index">
                  <div style="display: grid; grid-template-columns: auto fit-content(200px); align-items: center;">
                    {{ subitem.name }}
                    <div style="display: flex;">
                      <b-field 
                        label="Real value" 
                        label-position="on-border" 
                        style="margin-right: 15px;"
                        :type="/^(?!.*[.,].*[.,])[0-9]*([.,][0-9]*)?$/.test(subitem.real_value) || subitem.real_value === '' || subitem.real_value === undefined ? '' : 'is-danger'"
                      >
                        <b-input v-model="subitem.real_value"/>
                      </b-field>
                      <b-field 
                        label="Ideal value" 
                        label-position="on-border"
                        :type="/^(?!.*[.,].*[.,])[0-9]*([.,][0-9]*)?$/.test(subitem.ideal_value) || subitem.ideal_value === '' || subitem.ideal_value === undefined ? '' : 'is-danger'"
                      >
                        <b-input v-model="subitem.ideal_value"/>
                      </b-field>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </form>
        </b-step-item>
        <b-step-item step="2" label="Weight" :clickable="false" style="margin-top: 20px;">
          <h1>Weights</h1>
          <form>
            <div v-for="(item, index) in processesAudit" class="box" :key="index">
              <h4 style="margin-bottom: 0px;">{{ index + 1 }}. {{ item.name }}</h4>

              <div class="matrix-container" style="overflow-x: auto; margin-top: 20px; position: relative;">

                <ul style="list-style-type: none; padding: 0; text-align: center; overflow-x: auto; min-width: max-content; padding-left: 60px; padding-bottom: 20px;">

                  <li :key="item.name" style="display: flex; flex-direction: column;">

                    <!-- Fila de encabezados de columna con los números de indicadores -->
                    <div style="display: flex; justify-content: center; flex-wrap: nowrap; min-width: max-content;">
                      
                      <!-- Espacio vacío en la esquina superior izquierda -->
                      <div style="min-width: 80px; height: 40px;"></div> 

                      <!-- Recorremos los indicadores para ponerlos como encabezados de columna -->
                      <div v-for="(el, index_c) in matricesSatty[item.name]" :key="'header-' + index_c"
                        style="display: flex; width: 80px; justify-content: center; align-items: center; margin: 2px; background-color: #F8F8F8; font-weight: bold; position: sticky; top: 0; z-index: 2;">
                        {{ getIndicatorName(item.name, index_c) }}
                      </div>
                    </div>

                    <!-- Recorremos las filas de la matriz -->
                    <div v-for="(row, index_f) in matricesSatty[item.name]" :key="'row-' + index_f" 
                      style="display: flex; justify-content: center; flex-wrap: nowrap; min-width: max-content;">
                      
                      <!-- Poner el número del indicador a la izquierda de la fila (Primera columna) -->
                      <div style="display: flex; width: 80px; justify-content: center; align-items: center; margin: 2px; font-weight: bold; background-color:  #F8F8F8; position: sticky; left: 0; z-index: 2;">
                        {{ getIndicatorName(item.name, index_f) }}
                      </div>
                      <!-- Recorremos cada columna de la fila -->
                      <div v-for="(el, index_c) in row" :key="'cell-' + index_c" style="margin: 2px; flex-grow: 1;">
                        <b-field
                        :type="/^(?!.*[.,].*[.,])[0-9]*([.,][0-9]*)?$/.test(matricesSatty[item.name][index_c][index_f]) || matricesSatty[item.name][index_c][index_f] === '' ? '' : 'is-danger'"
                        >
                          <b-input
                          v-model="matricesSatty[item.name][index_f][index_c]"
                          :disabled="isDiagonal(index_f, index_c) || isBelowDiagonal(index_f, index_c)"
                          style="width: 80px; height: 40px; text-align: center; font-size: 18px;"
                          @input="onInput(item.name, index_f, index_c)"
                          />
                        </b-field>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </form>
        </b-step-item>
        <b-step-item step="3" label="Results" :clickable="false" style="margin-top: 20px;">

            <b-table
              :data="results"
              hover
              striped
              style="margin-bottom:15px;"
            >
            <b-table-column field="Process ID" label="Process ID" v-slot="props">
              P{{ props.row.id }}
            </b-table-column>
            <b-table-column field="Business process" label="Process" v-slot="props">
              {{ props.row.name }}
            </b-table-column>
            <b-table-column field="Indicator ID" label="Indicator ID" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  I{{ ind.id }}
                </li>
              </ul>
            </b-table-column>
            <b-table-column field="Indicators" label="Indicators" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  {{ ind.name }}
                </li>
              </ul>
            </b-table-column>
            <b-table-column field="Real value" label="Real value" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  {{ ind.real_value }}
                </li>
              </ul>
            </b-table-column>
            <b-table-column field="Ideal value" label="Ideal value" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  {{ ind.ideal_value }}
                </li>
              </ul>
            </b-table-column>
            <b-table-column field="Normalized value" label="Normalize value" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  {{ ind.normalized_value.toFixed(2) }}
                </li>
              </ul>
            </b-table-column>
            <b-table-column field="Weight" label="Weight" v-slot="props">
              <ul style="list-style-type: none; padding: 0; margin: 0px !important;">
                <li v-for="(ind, index) in props.row.indicators" :key="index">
                  {{ ind.weight.toFixed(2) }}
                </li>
              </ul>
            </b-table-column>
          </b-table>
          <b-table
              :data="results"
              hover
              striped
            >
            <b-table-column field="Process ID" label="Process ID" v-slot="props">
              P{{ props.row.id }}
            </b-table-column>
            <b-table-column field="Business process" label="Process" v-slot="props">
              {{ props.row.name }}
            </b-table-column>
            <b-table-column field="Process sustainability index" label="Process sustainability index" v-slot="props">
              {{ props.row.index !== undefined ? props.row.index.toFixed(2) : '-' }}
            </b-table-column>
          </b-table>
          <h3>Sustainability coefficient of the organization: {{ this.coefficient }}</h3>
        </b-step-item>
        <template
            #navigation="{previous}">
            <b-field class="button-field">  
              <b-button
                  v-if="activeStep != 0"
                  class="button-next"
                  type="is-sucess"
                  icon="chevron-left"
                  :disabled="previous.disabled"
                  @click.prevent="previous.action">
                  Previous
              </b-button>
              <b-button
                  v-if="activeStep != 2"
                  class="button-next"  
                  type="is-success"
                  icon="chevron-right"
                  @click="onNext">
                  {{activeStep == 1 ? "Evaluate" : "Next" }}
              </b-button>
              <b-button
                  v-if="activeStep == 2"
                  class="button-next"  
                  icon="chevron-right"
                  @click="closeEvaluation">
                  Finish
              </b-button>
            </b-field>
        </template>
        <b-loading :is-full-page=false v-model="isLoading"></b-loading>
      </b-steps>
    </section>
</template>

<script>

import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'EvaluationForm',
  props: {
    action: String,
    id_audit: Number,
  },
  data() {
    return {



      isLoading: false,
      isDataActive: false,

      name: null,
      organization: null,
      organizationName: null,

      organizations: [],
      processes: [],
      
      // EVALUACION
      activeStep: 0,
      processesAudit: [],
      matricesSatty: {},
      results: [],
      coefficient: null,
      finished: false,
    }
  },
  watch: {
    isDataActive: function() {
      if (this.isDataActive == false) {
        this.activeStep = 0;
        this.processesAudit = [];
        this.matricesSatty = [];
        this.id_audit = null;
        this.results = [];
        this.coefficient = null;
        this.finished = false;
      }
    },
  },
  mounted: async function() {
    await this.getOrganizations();
    if (this.id_audit != null) {
        await this.getAudit(this.id_audit);
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
      } catch (error) {
        console.log(error);
      }
    },
    getAudit: async function(id) {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${id}`);
        const audit = response.data.audit;
        const results = response.data.results;
        this.name = audit.name;
        this.organization = audit.organization;
        this.organizationName = this.organizations.find(org => org.id === this.organization)?.name || '';
        await this.getIndicatorsProcess(audit.processes);

        if (Object.keys(results).length !== 0) {
          this.fillEvaluatedData(results);
          this.activeStep = 2;
          this.finished = true;
        }
        this.isDataActive = true;
        this.isLoading = false;
      }catch(error) {
        console.log(error);
        this.isLoading = false;
      }
    },
    getIndicatorsProcess: async function(processes) {
      for (const p of processes) {
        try {
          const response = await axiosInstance.get(`/processes/${p}`)
          this.processesAudit.push(response.data);
        } catch(error){
          console.log(error);
        }
      };
    },
    getIndicatorName(processName, index) {
      const process = this.processesAudit.find(proc => proc.name === processName);

      if (process && process.indicators && process.indicators[index]) {
        return 'I'+ process.indicators[index].id;
      }

      return '';
    },
    fillEvaluatedData(results) {
      this.coefficient = parseFloat(results.coefficient).toFixed(2);
      this.results = [];

      results.processes.forEach(procResult => {
        const process = this.processesAudit.find(
          p => p.id === procResult.process
        );

        if (!process) return;

        procResult.indicators.forEach(indResult => {
          const indicator = process.indicators.find(
            i => i.id === indResult.id
          );

          if (indicator) {
            indicator.real_value = Number(indResult.real_value);
            indicator.ideal_value = Number(indResult.ideal_value);
            indicator.normalized_value = Number(indResult.normalized_value);
            indicator.weight = Number(indResult.weight);
          }
        });

        const size = process.indicators.length;
        const matrix = Array.from({ length: size }, () =>
          Array.from({ length: size }, () => '')
        );

        procResult.matrix.forEach(el => {
          const row = process.indicators.findIndex(i => i.id === el.column_ind);
          const col = process.indicators.findIndex(i => i.id === el.row_ind);

          if (row !== -1 && col !== -1) {
            const value = Number(el.element);
            matrix[row][col] = isNaN(value) ? '' : value.toFixed(2);
          }
        });

        this.$set(this.matricesSatty, process.name, matrix);

        this.results.push({
          id: process.id,
          name: process.name,
          index: procResult.sustainability_index,
          indicators: process.indicators
        });
      });
    },

    convertToFloat: function(value) {
      let string = (typeof value == 'string');
      if (string && !/[a-zA-Z]/.test(value) && ((value.split('.').length - 1) <= 1) && ((value.split(',').length - 1) <= 1)){
        let valueWithPoint = value.replace(",", ".");
        return parseFloat(valueWithPoint);
      } else {
        return value;
      }
    },
    isDiagonal(row, col) {
      return row === col;
    },
    isBelowDiagonal(row, col) {
      return row > col;
    },
    onInput(name, row, col) {
      this.updateLowerMatrixValues(name, row, col);
      let value = this.matricesSatty[name][row][col];
      const floatValue = this.convertToFloat(value);

      this.$set(this.matricesSatty[name], row, [...this.matricesSatty[name][row]]);
      if (isNaN(floatValue)) {
        this.matricesSatty[name][row][col] = value;
      } else {
        this.matricesSatty[name][row][col] = floatValue;
      }
    },
    updateLowerMatrixValues(name, row, col) {
      if (row < col) {
        // Si la fila es menor que la columna, está en la parte superior de la matriz, se debe recalcular el valor en la parte inferior.
        const lowerRow = col;  // Cambiar las filas y columnas para la celda inferior
        let value = this.matricesSatty[name][row][col];

        this.$set(this.matricesSatty[name], lowerRow, [...this.matricesSatty[name][lowerRow]]);
        if (value == '' || value == null || value == undefined) {
          this.matricesSatty[name][lowerRow][row] = '';
        } else {
          value = this.convertToFloat(value);
          this.matricesSatty[name][lowerRow][row] = (1 / value).toFixed(2);
        }
      }
    },
    validateIndicatorBusinessRules(indicator) {
      const real = this.convertToFloat(indicator.real_value)
      const ideal = this.convertToFloat(indicator.ideal_value)
      const goal = indicator.goal?.toLowerCase()

      if (goal === 'maximize') {
        if (ideal === 0) {
          return `Ideal value of indicator "${this.getIndicatorNameById(indicator.id)}" (goal is to maximize) can't be 0`
        }
      }
      if (goal === 'minimize') {
        if (real === 0 && ideal !== 0) {
          return `The real value of indicator "${this.getIndicatorNameById(indicator.id)}" (goal is to minimize) can't be 0 if its ideal value isn't 0.`
        }
      }

      return null
    },
    onNext: async function() {
      var errors = false;
      switch(this.activeStep) {
          case 0:
            let errorMessage = null

            for (const process of this.processesAudit) {
              for (const ind of process.indicators) {
                if (
                  ind.real_value === null || ind.real_value === undefined ||
                  ind.ideal_value === null || ind.ideal_value === undefined ||
                  isNaN(ind.real_value) || isNaN(ind.ideal_value)
                ) {
                  errorMessage = 'Please fill all real and ideal values for indicators with valid values'
                  break
                }
                const businessError = this.validateIndicatorBusinessRules(ind)
                if (businessError) {
                  errorMessage = businessError
                  break
                }
              }
              if (errorMessage) break
            }
            if (!errorMessage) {
              this.processesAudit.forEach(proc => {
                proc.indicators.forEach(ind => {
                  ind.real_value = this.convertToFloat(ind.real_value);
                  ind.ideal_value = this.convertToFloat(ind.ideal_value);
                });
                if (!this.matricesSatty[proc.name]) {
                  const size = proc.indicators.length;
                  const matrix = Array.from({ length: size }, (_, row) =>
                    Array.from({ length: size }, (_, col) => (row === col ? 1 : ''))
                  );

                  this.$set(this.matricesSatty, proc.name, matrix);
                }
              });
              this.activeStep += 1;
            } else {
              this.showError(errorMessage);
            }
            break;
          case 1:
            errors = !Object.keys(this.matricesSatty).every(processName => {
              const matrix = this.matricesSatty[processName];
              return matrix.every((row, rowIndex) =>
              row.every((cell, colIndex) => {
                if (rowIndex === colIndex) return true;
                if (cell === undefined || cell === null || cell === '') return false;
                return !isNaN(cell) && isFinite(cell);
              })
              );
            });

            if (!errors) {
              Object.keys(this.matricesSatty).forEach(m => {
                let matrix = this.matricesSatty[m];
                matrix.forEach((row, rowIndex) => {
                  row.forEach((cell, colIndex) => {
                    this.$set(this.matricesSatty[m][rowIndex], colIndex, this.convertToFloat(cell));
                  });
                });
              });
              await this.evaluateAudit();
            } else {
              this.showError('Please fill all matrix values with valid numbers');
            }
            break;
      }
    },
    getIndicatorNameById(indicatorId) {
      for (const process of this.processesAudit) {
        const indicator = process.indicators.find(
          i => String(i.id) === String(indicatorId)
        )
        if (indicator) {
          return indicator.name
        }
      }
      return null
    },
    evaluateAudit: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.post(`/audits/${this.id_audit}/evaluation`, {
          matrix: this.matricesSatty,
          processes: this.processesAudit,
        });
        this.coefficient = response.data.results.coefficient.toFixed(2);
        this.results = response.data.results.processes;
        this.isLoading = false;
        this.activeStep +=2;
        this.finished = true;
      } catch(error){
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    handleErrors: function (error) {
      if (!error.response) {
        console.error('Network or unexpected error', error);
        return;
      }
      switch (error.response.status) {
        case 406:
          break;
        case 400:
          if (error?.response?.data?.error){
            if (error?.response?.data?.error.includes("Illegal")){
              let message = error.response.data.error
              message = message.split(": ")[1]
              const indicatorId = message.match(/indicator\s+(\d+)/)?.[1]
              if (indicatorId) {
                const indicatorName = this.getIndicatorNameById(indicatorId)

                if (indicatorName) {
                  message = message.replace(
                    new RegExp(`indicator\\s+${indicatorId}`),
                    `indicator "${indicatorName}"`
                  )
                }
              }
              this.showError(message);
            } else {
              this.showError(error?.response?.data?.error)
            }
          } else {
            this.showError("Please, review evaluation because there are errors")
          }
          break;
        case 500:
            this.showError("An internal error occurred. Please try again later.")
          break;
        default:
          break;
      }
    },
    showError: function(error) {
      this.$buefy.snackbar.open({
        message: error,
        type: 'is-danger',
        duration: 15000,
      });
    },
    closeEvaluation: function() {
      this.isDataActive = false;
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
      this.$emit('finished-actions-for-audit');
    },
  }
}
</script>

<style scoped>
.button-back {
  margin-right:20px;
  color: #adb987;
  border-radius: 30px;
  max-width: 40px;
}

.icon-info {
  font-size: 1.5rem; 
  color: #adb987; 
  display:flex;
}

.title {
  margin-right: 10px;
  margin-top: 0px !important;
  margin-bottom: 0px !important;
}

.matrix-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.input-matrix {
  width: 80px;
  height: 40px; 
  font-size: 18px; 
  text-align: center; 
}

.evaluate-button{
  background-color: #98A869 !important;
  color: white !important;
  width: 80px;
  margin-right: 5px;
  height: 30px;
}

.button-field {
  display: flex;
  margin-bottom: 1rem;
  justify-content: center;
}

</style>
