<template>
  <section class="custom-section">

    <Header
      title="Sustainability Indicators Repository"
      :perPage="perPage"
      :showAdd="isAdmin"
      :showActions="isAdmin"
      :showRemove="true"
      :showImport="true"
      :showExport="true"
      @update:perPage="perPage = $event"
      @add="openAddModal"
      @bulk-remove="removeSelectedIndicators"
      @import-csv="triggerFileInput('csv')"
      @import-excel="triggerFileInput('excel')"
      @export-csv="exportToCsv"
      @export-excel="exportToExcel"
    />
    <input 
      ref="fileInputCSV" 
      type="file" 
      @change="handleFileUpload" 
      style="display: none;" 
      accept=".csv"
    />
    <input 
      ref="fileInputExcel" 
      type="file" 
      @change="handleFileUpload" 
      style="display: none;" 
      accept=".xlsx, .xls" 
    />
    <Table
      :data="indicators"
      :columns="columns"
      :actions="rowActions"
      :checkable="isAdmin"
      :selected.sync="indicatorsSelected"
      @show="getIndicatorForShow"
      @edit="getIndicatorForEdit"
      @remove="removeIndicator"
    />
    <Pagination
      class="custom-pagination"
      :total="total"
      :perPage="perPage"
      :currentPage="currentPage"
      @change="onPageChange"
    />
    <b-modal
      v-model="isModalActive"
      close-button-aria-label="Close"
      :can-cancel="[]"
    >
      <header class="modal-card-head">
        <p class="modal-card-title">
          {{ action === 'show' ? 'Indicator' : (action === 'edit' ? 'Edit' : 'New') + ' indicator' }}
        </p>
      </header>
      
      <ShowForm 
        :fields="filteredIndicatorFields" 
        :action="action" 
      >
        <template #default>
          <b-field label="Formula">
            <div class="org-lists">
              <p class="field-value">{{ formula }}</p>
            </div>
          </b-field>
        </template>
      </ShowForm>

      <section v-if="action != 'show'" class="modal-card-body" >           
        <form>
          <b-loading :is-full-page="false" v-model="isLoading"></b-loading>
          <b-field 
            label="Name *" 
            for="name"
            :type="messageName != '' ? 'is-danger': ''"
            :message=messageName
          >
            <b-input
              id="name"
              v-model="name"
              placeholder="Enter indicator's name"
              :icon-right="name != '' && name != null ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="name=''"
              @input="messageName = ''"
            >
            </b-input>
          </b-field>
          <b-field 
            label="Dimension *"
            for="dimension"     
            :type="messageDimension != '' ? 'is-danger': ''"
            :message=messageDimension
          >
            <b-select 
              v-model="dimension"
              expanded 
              filterable 
              placeholder="Select or add a dimension"
              @input="messageDimension=''">
              <option v-for="(dimension, index) in dimensions" :key="index" :value="dimension">
                {{ dimension }}
              </option>
            </b-select>
            <div class="add-dimension">
              <b-input v-model="newDimension" placeholder="Add a new dimension" @input="messageDimension=''" @keyup.enter="addDimension"></b-input>
              <b-button @click="addDimension" type="is-primary" outlined>Add</b-button>
            </div>
          </b-field>
          <b-field
            label="Formula *"
            for="formula"
            :type="messageFormula != '' ? 'is-danger': ''"
            :message=messageFormula
          >
            <b-input 
              id="formula"
              v-model="formula"
              placeholder="Enter indicator's formula" 
              type="textarea"
              :icon-right="formula != '' && formula != null ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="formula=''"
              @input="messageFormula = ''"
              >
            </b-input>
          </b-field>
          <b-field 
            label="Goal *" 
            for="goal"
            :type="messageGoal != '' ? 'is-danger': ''"
            :message=messageGoal
          >
            <b-select 
              id="goal"
              v-model="goal"
              placeholder="Select a goal"
              icon="plus-minus-variant"
              @input="messageGoal = ''"
              >
              <option 
                  v-for="(value, index) in goals"
                  :value="value"
                >
                  {{ value }}
                </option>
            </b-select>
          </b-field>
          <b-field 
            label="Unit of measurement *" 
            for="measure"
            :type="messageMeasure != '' ? 'is-danger': ''"
            :message=messageMeasure
          >
            <b-input
              id="measure"
              v-model="measure"
              placeholder="Enter indicator's unit of measurement"
              :icon-right="measure != '' && measure != null ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="measure=''"
              @input="messageMeasure = ''"
            >
            </b-input>
          </b-field>
          <b-field 
            label="Frequency *" 
            for="frequency"
            :type="messageFrequency != '' ? 'is-danger': ''"
            :message=messageFrequency
          >
            <b-select 
              id="frequency"
              v-model="frequency"
              placeholder="Select a frequency"
              @input="messageFrequency = ''"
              >
              <option 
                  v-for="(value, index) in frequencies"
                  :value="value"
                >
                  {{ value }}
                </option>
            </b-select>
          </b-field>   
        </form>
      </section>
      <footer class="modal-card-foot custom-footer">
        <b-button
          label="Close"
          @click="isModalActive = false" />
        <b-button
          v-if="action == 'edit'"
          label="Edit"
          type="is-primary"
          @click="editIndicator" />
        <b-button
          v-if="action == 'add'"
          label="Add"
          type="is-primary"
          @click="addIndicator" />
      </footer>
    </b-modal>
  </section>
</template>

<script>
import Header from '@/components/Header.vue';
import Table from '@/components/Table.vue';
import Pagination from '@/components/Pagination.vue';
import ShowForm from '@/forms/ShowForm.vue';
import axiosInstance from '@/services/axiosInstance';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default {
  name: 'IndicatorView',
  components: {
    Header,
    Table,
    Pagination,
    ShowForm,
  },
  data() {
    return {
      userRole: localStorage.getItem('role'),

      isModalActive: false,
      action: null,

      indicators: [],
      indicatorsSelected: [],
      idIndicator: null,
      
      name: null,
      dimension: null,
      formula: null,
      goal: null,
      measure: null,
      frequency: null,
      messageName: '',
      messageDimension: '',
      messageGoal: '',
      messageFormula: '',
      messageMeasure: '',
      messageFrequency: '',

      fileType: null,      
      errorImporting: null,
      isLoading: false,
      dimensions: ["Economic", "Social", "Enviromental", "Institutional", "Technological Innovation"],
      newDimension: '',
      goals: ["Minimize", "Maximize"],
      frequencies: ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"],
      
      total: 1,
      page: 1,
      perPage: 5,
      currentPage: 1,
      sortField: "id",
      sortOrder: "asc",

      columns: [
        { field: 'id', label: 'ID', sortable: true, render: row => `I${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'dimension', label: 'Dimension', sortable: true },
        { field: 'goal', label: 'Goal', sortable: true },
        { field: 'measure', label: 'Measure', sortable: true },
        { field: 'frequency', label: 'Frequency', sortable: true }
      ],

      indicatorFields: {
        Name: this.name,
        Dimension: this.dimension,
        Goal: this.goal,
        Frequency: this.frequency,
        'Unit of measurement': this.measure,
      },
    }
  },
  watch: {
    isModalActive() {
      if (this.isModalActive == false) {
        this.name = null;
        this.dimension = null;
        this.formula = null;
        this.goal = null;
        this.measure = null;
        this.frequency = null;
        this.action = null;
        this.messageName = '';
        this.messageDimension = '';
        this.messageGoal = '';
        this.messageFormula = '';
        this.messageMeasure = '';
        this.messageFrequency = '';
        this.indicatorsSelected = [];
        this.idIndicator = null;
        this.newDimension = '';
      }
    },
    perPage: async function() {
      await this.getIndicators();
    },
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin' || this.userRole === 'chief_auditor';
    },
    rowActions() {
      return [
        { icon: 'mdi mdi-eye', event: 'show' },
        { 
          icon: 'mdi mdi-pencil', 
          event: 'edit', 
          if: () => this.isAdmin 
        },
        { 
          icon: 'mdi mdi-delete', 
          event: 'remove', 
          disabledCondition: (row) => (row.remove_indicator === false),
          if: () => this.isAdmin 
        }
      ]
    },
    filteredIndicatorFields() {
      let filteredFields = {};
      for (let key in this.indicatorFields) {
        const value = this.indicatorFields[key];
        if (value) {
          filteredFields[key] = value;
        }
      }
      return filteredFields;
    },
  },
  mounted: async function() {
    await this.getIndicators();
  },
  methods: {
    onPageChange: async function(page) {
      this.page = page;
      await this.getIndicators();
    },
    openAddModal() {
      this.action = 'add';
      this.isModalActive = true;
    },
    addDimension() {
      if (this.newDimension && !this.dimensions.includes(this.newDimension)) {
        this.dimensions.push(this.newDimension);
        this.dimension = this.newDimension;
        this.newDimension = "";
      }
    },
    async importCSV(file) {
      Papa.parse(file, {
        header: true,
        complete: async (result) => {
          for (const ind of result.data) {
            this.name = ind.name;
            this.dimension = ind.dimension;
            this.formula = ind.formula;
            this.goal = ind.goal;
            this.measure = ind.measure;
            this.frequency = ind.frequency;

            await this.addIndicator();
          }
        }
      });
    },
    importExcel(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        for (const ind of jsonData) {
          this.name = ind.name;
          this.dimension = ind.dimension;
          this.formula = ind.formula;
          this.goal = ind.goal;
          this.measure = ind.measure;
          this.frequency = ind.frequency;
          await this.addIndicator();
        }
      };

      reader.readAsArrayBuffer(file);
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (this.fileType === 'csv' && fileExtension !== 'csv') {
        alert('Por favor, seleccione un archivo CSV.');
        return;
      }
      
      if (this.fileType === 'excel' && !['xlsx', 'xls'].includes(fileExtension)) {
        alert('Por favor, seleccione un archivo Excel (.xlsx o .xls).');
        return;
      }

      if (this.fileType === 'csv') {
        this.importCSV(file);
      } else if (this.fileType === 'excel') {
        this.importExcel(file);
      }
    },
    triggerFileInput(type) {
      this.fileType = type;
      let message = '';
      const headers = "<b>name, dimension, formula, goal, measure, frequency</b>";
      if (this.fileType === 'csv') {
        message = `Make sure the file has these headers: ${headers}. CSV files should use semicolons (;) as separators. If the headers are not exactly like this, the import may not work correctly.`;
      } else {
        message = `Make sure the file has these headers: ${headers}. If the headers are not exactly like this, the import may not work correctly.`;
      }
      this.$buefy.dialog.alert({
        title: "Warning",
        message: message,
        html: true,
        confirmText: "Select file",
        onConfirm: () => {
          if (this.fileType === 'csv') {
            this.$refs.fileInputCSV.click();
          } else if (this.fileType === 'excel') {
            this.$refs.fileInputExcel.click();
          }
        }
      })
    },
    getDate: function() {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const hh = String(today.getHours()).padStart(2, '0')
      const mi = String(today.getMinutes()).padStart(2, '0')
      return `${yyyy}${mm}${dd}_${hh}${mi}`
    },
    exportToCsv() {
      
      if (this.indicatorsSelected.length > 0){

        const date = this.getDate()
        const name = `indicators_${date}.csv`

        const columns = [
          'name',
          'dimension',
          'formula',
          'frequency',
          'goal',
          'measure'
        ]

        const headers = columns

        const rows = this.indicatorsSelected.map(indicator =>
          columns.map(key => indicator[key])
        )

        let csvContent = ''
        csvContent += headers.join(';') + '\n'
        rows.forEach(row => {
          csvContent += row.join(';') + '\n'
        })

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', name)
        link.click()
      }
    },
    exportToExcel() {

      if (this.indicatorsSelected.length > 0) {

        const date = this.getDate()
        const name = `indicators_${date}.xlsx`

        const columns = [
          'name',
          'dimension',
          'formula',
          'frequency',
          'goal',
          'measure'
        ]

        // Construimos los datos respetando el orden de columnas
        const data = this.indicatorsSelected.map(indicator => {
          const row = {}
          columns.forEach(key => {
            row[key] = indicator[key]
          })
          return row
        })

        const worksheet = XLSX.utils.json_to_sheet(data)
        const workbook = XLSX.utils.book_new()

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Indicators')
        XLSX.writeFile(workbook, name)
      }
    },
    getIndicator: async function(id) {
      try {
          const response = await axiosInstance.get(`/indicators/${id}`);
          var ind = response.data;
          this.name = ind.name;
          this.dimension = ind.dimension.charAt(0).toUpperCase() + ind.dimension.slice(1);
          this.formula = ind.formula;
          this.goal = ind.goal.charAt(0).toUpperCase() + ind.goal.slice(1);
          this.measure = ind.measure;
          this.frequency = ind.frequency.charAt(0).toUpperCase() + ind.frequency.slice(1);
          this.idIndicator = ind.id;
          if (this.action === 'show') {
            this.indicatorFields = {
              Name: this.name,
              Dimension: this.dimension,
              Goal: this.goal,
              Frequency: this.frequency,
              'Unit of measurement': this.measure,
            };
          }
          this.isModalActive = true;
        } catch (error) {
          console.log(error);
        }
    },
    getIndicatorForShow: async function(row) {
      this.action = 'show';
      this.getIndicator(row.id);
    },
    getIndicatorForEdit: async function(row) {
      this.action = 'edit';
      this.getIndicator(row.id);
    },
    removeSelectedIndicators: async function() {
      try {
        const response = await axiosInstance.delete(`/indicators`, {
          data: { ids: this.indicatorsSelected.map(indicator => indicator.id) },
        });
        if (response.status == 200){
          await this.getIndicators();
        }
        this.indicatorsSelected = [];
      } catch(error) {
        this.$buefy.snackbar.open({
          message: error.response.data.error || 'Error removing indicators',
          duration: 5000,
          type: 'is-danger',
        });
      }
    },
    removeIndicator: async function(row) {
      try {
        const response = await axiosInstance.delete(`/indicators/${row.id}`);
        if (response.status == 200){
          await this.getIndicators();
        }
      } catch(error) {
        this.$buefy.snackbar.open({
          message: error.response.data.error || 'Error removing indicator',
          duration: 5000,
          type: 'is-danger',
        });
      }
    },
    getIndicators: async function() {
      try {
        const response = await axiosInstance.get(`/indicators`, {
          params: {
            page: this.page,
            perPage: this.perPage,
            sortBy: this.sortField,
            sortOrder: this.sortOrder,
          }
        });
        this.currentPage = response.data.currentPage;
        this.total = response.data.total;
        this.indicators = response.data.data;
      } catch (error) {
        console.log(error);
      }
    },
    addIndicator: async function() {
      try {
          this.action = 'add';
          this.isLoading = true;

          const response = await axiosInstance.post(`/indicators`, {
            'name': this.name,
            'dimension': this.dimension,
            'formula': this.formula,
            'goal': this.goal,
            'measure': this.measure,
            'frequency': this.frequency,
          });
          await this.getIndicators();
          this.isLoading = false;
          this.isModalActive = false;
      } catch (error) {
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    editIndicator: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.put(`/indicators/${this.idIndicator}`, {
          'name': this.name,
          'dimension': this.dimension,
          'formula': this.formula,
          'goal': this.goal,
          'measure': this.measure,
          'frequency': this.frequency,
          'id': this.idIndicator
        });
        this.isLoading = false;
        this.isModalActive = false;
        await this.getIndicators();
      } catch(error){
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    handleErrors: function(error){
      if (this.isModalActive){
        switch(error.response.status) {
          case 406:
            if (error.response.data.errors.name) {
              this.messageName = error.response.data.errors.name;
            }
            break;
          case 400:
            if (error.response.data.errors.name) {
              this.messageName = error.response.data.errors.name;
            }
            if (error.response.data.errors.dimension) {
              this.messageDimension = error.response.data.errors.dimension;
            }
            if (error.response.data.errors.formula) {
              this.messageFormula = error.response.data.errors.formula;
            }
            if (error.response.data.errors.goal) {
              this.messageGoal = error.response.data.errors.goal;
            }
            if (error.response.data.errors.measure) {
              this.messageMeasure = error.response.data.errors.measure;
            }
            if (error.response.data.errors.frequency) {
              this.messageFrequency = error.response.data.errors.frequency;
            }
            if (error?.response?.data?.error){
              this.showError(error?.response?.data?.error)
            } else {
              this.showError("Please, review form")
            }
            break;
          case 500:
              this.showError("An internal error occurred. Please try again later.")
            break;
          default:
            break;
        }
      } else {
        this.errorImporting = {
          indicator: JSON.parse(error.config.data).indicator,
          error: (error.response.data.message != undefined) ? error.response.data.message : error.response.data.errors,
        }
      }
    },
    showError: function(error) {
      this.$buefy.snackbar.open({
        message: error,
        type: 'is-danger',
        duration: 5000,
      });
    },
  },
}

</script>

<style scoped lang="scss">
.custom-section {
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.custom-pagination {
  display:flex; 
  justify-content: flex-end; 
  align-items: end; 
  margin-bottom: 30px;
}


.org-lists {
  margin-top: 1em;
}

.field-value {
  font-weight: 500;
  color: #2c3e50;
  margin-top: 0.25em;
}

.custom-footer {
  justify-content: flex-end;
}

.add-dimension {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

</style>