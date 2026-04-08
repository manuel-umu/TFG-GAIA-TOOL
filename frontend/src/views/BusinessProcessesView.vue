<template>
  <section class="custom-section">
    <Header 
      title="Business Processes" 
      :perPage="perPage"
      :showAdd="isAdmin"
      :showActions="isAdmin" 
      :showRemove="true" 
      :showImport="false"
      :showExport="false" 
      @update:perPage="perPage = $event"
      @add="openAddModal"
      @bulk-remove="removeSelectedProcesses"
    />

    <Table 
      :data="processes" 
      :columns="columns" 
      :actions="rowActions" 
      :checkable="isAdmin"
      :selected.sync="processesSelected"
      @show="getProcessForShow" 
      @edit="getProcessForEdit" 
      @remove="removeProcess" 
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
          {{ action === 'show' ? 'Business process' : (action === 'edit' ? 'Edit' : 'New') + ' business process' }}
        </p>
      </header>
      <ShowForm 
        :action="action" 
        :fields="filteredProcessFields"
      >
        <template #default>
          <b-field label="Indicators">
            <div class="selected-box">
              <ul>
                <li v-for="(item, index) in indicatorsSelected" :key="index">
                  {{ item.name }} ({{ item.dimension }}) - Critical factor: {{ item.factor.name }}
                </li>
              </ul>
            </div>
          </b-field>
        </template>
      </ShowForm>

      <section v-if="action != 'show'" class="modal-card-body">
        <b-steps v-model="activeStep" :animated=true :rounded=true :has-navigation=true>
          <b-step-item step="1" label="Characteristics" :clickable="false">
            <h1 class="title has-text-cetered">Characteristics</h1>
            <form>
              <b-loading :is-full-page="false" v-model="isLoading"></b-loading>
              <b-field label="Name *" for="name" :type="messageName != '' ? 'is-danger' : ''" :message=messageName>
                <b-input id="name" v-model="name" placeholder="Enter indicator's name"
                  :icon-right="name != '' && name != null ? 'close-circle' : ''" icon-right-clickable
                  @icon-right-click="name = ''" @input="messageName = ''">
                </b-input>
              </b-field>
              <b-field label="Description" for="description" :type="messageDescription != '' ? 'is-danger' : ''" :message=messageDescription>
                <b-input id="description" v-model="description" placeholder="Enter process's description"
                  type="textarea" @input="messageDescription = ''">
                </b-input>
              </b-field>
              <b-field label="Type *" for="type" :type="messageType != '' ? 'is-danger' : ''" :message=messageType>
                <b-select id="type" v-model="type" placeholder="Select type" @input="messageType = ''">
                  <option v-for="(value, index) in types" :value="value">
                    {{ value }}
                  </option>
                </b-select>
              </b-field>
              <b-field label="Responsible of process *" for="responsible"
                :type="messageResponsible != '' ? 'is-danger' : ''" :message=messageResponsible>
                <b-select id="responsible" v-model="responsible" placeholder="Enter the responsible of process"
                  @input="messageResponsible = ''">
                  <option v-for="(value, index) in users" :value="value.name">
                    {{ value.name }}
                  </option>
                </b-select>
              </b-field>
            </form>
          </b-step-item>
          <b-step-item step="2" label="Indicators *" :clickable="false">
            <h1 class="title has-text-cetered">Indicators</h1>
            <div style="margin-bottom: 10px;">
              <span v-if="messageIndicators != null || messageIndicators != ''" style="color: red;">{{
                indicatorsSelected.length < 3 ? messageIndicators : '' }}</span>
            </div>
            <div v-if="indicatorsSelected.length != 0" class="selected-box">
              <ul>
                <li v-for="(item, index) in indicatorsSelected" :key="index">
                  {{ item.name }} ({{ item.dimension }})
                </li>
              </ul>
            </div>
            <b-table v-if="activeStep == 1" :data="filteredItems" striped :paginated="true" :per-page="6"
              pagination-position="bottom" :pagination-rounded="true" checkable checkbox-position="right"
              :checked-rows.sync="indicatorsSelected">
              <b-table-column field="name" label="Name" searchable>
                <template #searchable="{ filter }">
                  <b-input v-model="searchQuery" placeholder="Search..." size="is-small" class="custom-search-input" />
                </template>

                <template #default="{ row }">
                  {{ row.name }}
                </template>
              </b-table-column>
              <b-table-column label="Dimension" width="50" centered v-slot="props">
                {{ props.row.dimension }}
              </b-table-column>
            </b-table>
          </b-step-item>
          <b-step-item step="3" label="Critical factors *" :clickable="false">
            <span style="color: red;">{{ messageFactors }}</span>
            <b-table :data="indicatorsSelected" striped>
              <b-table-column field="name" label="Name">
                <template v-slot="props" style="display: flex; align-items: center;">
                  <span>{{ props.row.name }}</span>
                  <div style="display: flex; align-items: center;">
                    <b-autocomplete
                      class="cf-autocomplete"
                      placeholder="Select a critical factor"
                      :data="filteredFactors"
                      field="name"
                      :value="props.row.factor ? props.row.factor.name : ''"
                      @select="clickCF(props.row, $event)"
                      @input="inputStringCF($event)"
                      clearable
                      :open-on-focus="true"
                    >
                      <template #default="{ option }">
                        <span class="option-text" :title="option.name">
                          {{ option.name }}
                        </span>
                      </template>
                    </b-autocomplete>
                  </div>
                </template>
              </b-table-column>
            </b-table>
          </b-step-item>
          <template #navigation="{ previous }">
            <b-field class="button-field">
              <b-button class="button-next" type="is-sucess" icon="chevron-left" :disabled="previous.disabled"
                @click.prevent="previous.action" @click="onBack">
                Previous
              </b-button>
              <b-button :disabled="activeStep == 2" class="button-next" type="is-success" icon="chevron-right"
                @click="onNext">
                Next
              </b-button>
            </b-field>
          </template>
          <b-loading :is-full-page=false v-model="isLoading"></b-loading>
        </b-steps>
      </section>
      <footer class="modal-card-foot custom-footer">
        <div class="footer-right">
          <b-button label="Close" @click="isModalActive = false" />
          <b-button v-if="action == 'edit'" label="Edit" type="is-primary" @click="editProcess" />
          <b-button v-if="action == 'add'" label="Add" type="is-primary" @click="addProcess" />
        </div>
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

export default {
  name: 'BusinessProcessesView',
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
      activeStep: 0,

      processes: [],
      processesSelected: [],
      idProcess: null,

      name: null,
      description: null,
      type: null,
      map: null,
      responsible: null,
      indicatorsSelected: [], // Indicadores seleccionados para el proceso de negocio

      messageName: '',
      messageType: '',
      messageResponsible: '',
      messageIndicators: '',
      messageFactors: '',
      messageDescription: '',

      indicatorsRepository: null, // Repositorio de indicadores
      filteredItems: [], // Indicadores filtrados (si no hay filtro serán todos)
      searchQuery: '', // Búsqueda de indicadores
      factors: null, // Factores disponibles
      filteredFactors: null, // Factores filtrados por organizacion
      factorHasBeenSelected: false,
      selectedOrganizationId: null,
      selectedOrganizationName: null,

      isLoading: false,
      types: ["Strategic", "Key", "Support"],
      users: [], // Uusarios disponibles

      total: 1,
      page: 1,
      perPage: 5,
      currentPage: 1,
      sortField: "id",
      sortOrder: "asc",

      columns: [
        { field: 'id', label: 'ID', sortable: true, render: row => `P${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'type', label: 'Type', sortable: true },
        { field: 'responsible', label: 'Responsible', sortable: true },
        { field: 'organization', label: 'Organization' }
      ],

      processFields: {
        Name: this.name,
        'Goal type': this.type,
        Responsible: this.responsible,
        Organization: this.selectedOrganizationName,
      },
    }
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
          disabledCondition: (row) => (row.edit_process === false),
          if: () => this.isAdmin
        },
        { 
          icon: 'mdi mdi-delete',
          event: 'remove', 
          disabledCondition: (row) => (row.remove_process === false),
          if: () => this.isAdmin
        }
      ]
    },
    filteredProcessFields() {
      let filteredFields = {};
      for (let key in this.processFields) {
        const value = this.processFields[key];
        if (value) {
          filteredFields[key] = value;
        }
      }
      return filteredFields;
    },
  },
  watch: {
    isModalActive: async function () {
      if (this.isModalActive == false) {
        this.action = null;
        this.name = null;
        this.description = null;
        this.type = null;
        this.responsible = null;
        this.messageName = '';
        this.messageType = '';
        this.messageResponsible = '';
        this.messageIndicators = '';
        this.messageFactors = '';
        this.messageDescription = '';
        this.processesSelected = [];
        this.idProcess = null;
        this.activeStep = 0;
        this.indicatorsSelected = [];
        this.searchQuery = '';
        this.selectedOrganizationId = null;
        this.selectedOrganizationName = null;
        this.filteredFactors = null;
      }
    },
    indicatorsSelected() {
      if (this.indicatorsSelected.length >= 3) {
        this.messageIndicators = '';
      }
    },
    searchQuery() {
      if (this.indicatorsRepository) {
        const query = this.searchQuery?.toLowerCase() || ''
        if (query === '') {
          this.filteredItems = this.indicatorsRepository;
        } else {
          this.filteredItems = this.indicatorsRepository.filter(item =>item.name.toLowerCase().includes(query));
        }
      }
    },
    perPage: async function () {
      await this.getProcesses();
    },
  },
  mounted: async function () {
    await this.getUsers();
    await this.getProcesses();
  },
  methods: {
    getNameUser: function(id) {
      return this.users.filter(u => u.id === id)[0]?.name;
    },
    getIdUser: function(name) {
      return this.users.filter(u => u.name === name)[0]?.id;
    },
    openAddModal: async function () {
      this.action = 'add';
      this.isModalActive = true;
      await this.getIndicators();
      await this.getFactors();
    },
    onPageChange: async function (page) {
      this.page = page;
      await this.getProcesses();
    },
    getUsers: async function () {
      try {
        const response = await axiosInstance.get(`/users`);
        this.users = response.data.filter(user => user.role !== 'evaluator_auditor'); // No quito al usuario que está creando el proceso de negocio porque me parece innecesario
      } catch (error) {
        console.log(error);
      }
    },
    listFactors: function () {
      let filtered = [];
      this.indicatorsSelected.forEach(ind => {
        if (ind.factor !== undefined && ind.factor !== null && ind.factor.organization == this.selectedOrganizationId) {
          filtered.push(ind);
        }
      })
      if (filtered.length != 0) {
        return this.factors.filter(factor => factor.organization == this.selectedOrganizationId);
      } else {
        return this.factors;
      }
    },
    inputStringCF: function(string){
      this.filteredFactors = this.listFactors();
      if (this.factorHasBeenSelected){
        this.factorHasBeenSelected = false;
        return;
      }
      if (string !== ""){
        this.filteredFactors = this.filteredFactors.filter(factor => (factor.name.toLowerCase().includes(string.toLowerCase())));
      }
    },
    clickCF: function (row, factor) {
      this.factorHasBeenSelected = true;
      if (!factor || typeof factor !== 'object') {
        row.factor = null;
        this.filteredFactors = this.listFactors();
        return;
      }
      row.factor = factor;
      this.messageFactors = '';
      this.selectedOrganizationId = factor.organization;
      this.filteredFactors = this.listFactors();
    },
    getIndicators: async function () {
      try {
        const response = await axiosInstance.get(`/indicators`, {
          params: {
            page: this.page,
            perPage: 10000,
            sortBy: this.sortField,
            sortOrder: this.sortOrder,
          }
        });
        this.indicatorsRepository = response.data.data;
        this.filteredItems = this.indicatorsRepository;
        if (this.indicatorsRepository.length < 3) {
          this.$buefy.snackbar.open({
            message: "There aren't at least 3 indicators in system",
            duration: 5000,
            type: 'is-danger',
            queue: false,
          });
        }
      } catch (error) {
        console.log(error);
      }
    },
    getFactors: async function () {
      try {
        const response = await axiosInstance.get(`/organizations/factors`);
        this.factors = response.data;
        if (this.factors.length == 0) {
          this.$buefy.snackbar.open({
            message: "There is no factor in the system, create an organization first",
            duration: 5000,
            type: 'is-danger',
            queue: false,
          });
        }
      } catch (error) {
        console.log(error);
      }
    },
    onNext: function () {
      var errors = false;
      switch (this.activeStep) {
        case 0:
          if (this.name == null || this.name == '') {
            this.messageName = 'The name can not be empty.';
            errors = true;
          }
          if (this.type == null) {
            this.messageType = 'Select a type.';
            errors = true;
          }
          if (this.responsible == null) {
            this.messageResponsible = 'Introduce a responsible of business process.';
            errors = true;
          }
          break;
        case 1:
          if (this.indicatorsSelected.length < 3) {
            this.messageIndicators = 'Select at least 3 indicators.'
            errors = true;
          } else {
            this.filteredFactors = this.listFactors();
            this.indicatorsSelected.forEach(ind => {
              if (ind.factor == undefined) {
                ind.factor = null;
              }
            })
          }
          break;
      }
      if (!errors) {
        this.activeStep = this.activeStep + 1;
      }
    },
    onBack: function() {

    },
    editProcess: async function () {
      this.indicatorsSelected.forEach(ind => {
        if (ind.factor == null) {
          this.messageFactors = 'Select one factor for each indicator.';
        }
      })
      if (this.messageFactors != '') {
        return
      }
      try {
        this.isLoading = true;
        // Creamos un clon del array para no mutar el original
        const indicatorsForApi = this.indicatorsSelected.map(ind => ({
          ...ind,
          factor: ind.factor ? ind.factor.id : null,
        }));

        var process = {
          'name': this.name,
          'description': this.description,
          'type': this.type,
          'responsible': this.getIdUser(this.responsible),
          'indicators': indicatorsForApi,
        }

        const response = await axiosInstance.put(`/processes/${this.idProcess}`, process);
        if (response.status == 200) {
          this.isLoading = false;
          this.isModalActive = false;
          await this.getProcesses();
        }
      } catch (error) {
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    getProcessForShow: async function (row) {
      this.action = 'show';
      await this.getIndicators();
      await this.getFactors();
      await this.getProcess(row.id);
    },
    getProcessForEdit: async function (row) {
      this.action = 'edit';
      await this.getIndicators();
      await this.getFactors();
      await this.getProcess(row.id);
    },
    getProcess: async function (id) {
      try {
        const response = await axiosInstance.get(`/processes/${id}`);
        var process = response.data;
        this.name = process.name;
        this.description = process.description;
        this.type = process.type;
        this.responsible = process.responsible;
        this.idProcess = process.id;
        this.selectedOrganizationId = process.organization.id;
        this.selectedOrganizationName = process.organization.name;
        this.indicatorsSelected = process.indicators.map(ind => {
          const found = this.indicatorsRepository.find(i => i.id === ind.id);
          if (found) {
            found.factor = ind.factor || null;
          }
          return found;
        });
        if (this.action === 'show') {
          this.processFields = {
            Name: this.name,
            'Goal type': this.type,
            Responsible: this.responsible,
            Organization: this.selectedOrganizationName,
          }  
        }        
        this.isModalActive = true;
      } catch (error) {
        console.log(error);
      }
    },
    removeSelectedProcesses: async function () {
      try {
        const response = await axiosInstance.delete(`/processes`, {
          data: { ids: this.processesSelected.map(process => process.id) }
        });
        if (response.status == 200) {
          await this.getProcesses();
        }
      } catch (error) {
        console.log(error);
      }
      this.processesSelected = [];
    },
    removeProcess: async function (row) {
      try {
        const response = await axiosInstance.delete(`/processes/${row.id}`);
        if (response.status == 200) {
          await this.getProcesses();
        }
      } catch (error) {
        const message = error.response?.data?.error;
        this.showError(message);
      }
    },
    getProcesses: async function () {
      try {
        const response = await axiosInstance.get(`/processes`, {
          params: {
            page: this.page,
            perPage: this.perPage,
            sortBy: this.sortField,
            sortOrder: this.sortOrder,
          }
        });
        this.currentPage = response.data.currentPage;
        this.total = response.data.total;
        this.processes = response.data?.data;
        this.processes.forEach(proc => {
          if (proc.organization) {
            proc.organization = proc.organization.name;
          }
        });
      } catch (error) {
        console.log(error);
      }
    },
    addProcess: async function () {
      this.indicatorsSelected.forEach(ind => {
        if (ind.factor == null) {
          this.messageFactors = 'Select one factor for each indicator.';
        }
      })
      if (this.messageFactors != '') {
        return
      }
      try {
        this.isLoading = true;

        // Creamos una copia de los indicadores para modificarla sin afectar a la original
        const indicatorsForApi = this.indicatorsSelected.map(ind => ({
          ...ind,
          factor: ind.factor ? ind.factor.id : null, // Solo el ID del factor
        }));

        let process = {
          'name': this.name,
          'description': this.description,
          'type': this.type,
          'responsible': this.getIdUser(this.responsible),
          'indicators': indicatorsForApi,
        }
        const response = await axiosInstance.post(`/processes`, process);
        if (response.status == 201) {
          this.isLoading = false;
          this.isModalActive = false;
          await this.getProcesses();
        }
      } catch (error) {
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    showError: function(error) {
      this.$buefy.snackbar.open({
        message: error,
        type: 'is-danger',
        duration: 5000,
      });
    },
    handleErrors: function (error) {
      if (!error.response) {
        console.error('Network or unexpected error', error);
        return;
      }

      switch (error.response.status) {
        case 406:
          if (error?.response?.data?.errors?.name) {
            this.messageName = error?.response?.data?.errors?.name;
          }
          break;
        case 400:
          if (error?.response?.data?.errors?.name) {
            this.messageName = error?.response?.data?.errors?.name;
          }
          if (error?.response?.data?.errors?.type) {
            this.messageType = error?.response?.data?.errors?.type;
          }
          if (error?.response?.data?.errors?.responsible) {
            this.messageResponsible = error?.response?.data?.errors?.responsible;
          }
          if (error?.response?.data?.errors?.indicators) {
            this.messageIndicators = error?.response?.data?.errors?.indicators;
          }
          if (error?.response?.data?.errors?.description) {
            this.messageDescription = error?.response?.data?.errors?.description;
          }
          if (error?.response?.data?.error){
            this.showError(error?.response?.data?.error)
          } else {
            this.showError("Please, review each step of form, there are errors")
          }
          break;
        case 500:
            this.showError("An internal error occurred. Please try again later.")
          break;
        default:
          break;
      }
    },
    showError: function (error) {
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
  display: flex;
  justify-content: flex-end;
  align-items: end;
  margin-bottom: 30px;
}




.selected-box {
  background-color: #f0f0f0;
  /* Gris claro */
  padding: 5px !important;
  border-radius: 8px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  .ul {
    margin-top: 0px !important;
  }
}

.modal.modal-content {
  min-height: 840px !important;
}


.title {
  margin-top: 30px;
  align-self: flex-start;
  flex-direction: row;
  margin-bottom: 10px;
}

.container {
  flex: 1;
  display: flex;
  grid-template-columns: auto;
  margin: 0 0;
  max-width: 100% !important;
}

.add-button {
  background-color: #98A869 !important;
  color: white !important;
  margin-bottom: 20px;
  width: 40px;
}

.box {
  min-width: 600px !important;
  background: white;
  /* #f5f6f0; */
}

.custom-table {
  flex: 1;
}

.custom-table td {
  word-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  max-width: 250px;
  text-overflow: ellipsis;
}

.custom-table th {
  word-wrap: break-word;
  white-space: normal;
  overflow: hidden;
  max-width: 250px;
}

ul {
  padding-left: 0;
  list-style-type: none;
  margin-top: 0px !important;
}

.custom-footer {
  display: flex;
  justify-content: flex-end;
}

.cf-autocomplete {
  flex: 1;
  min-width: 0;
}

.cf-autocomplete .dropdown-item {
  max-width: 100%;
}

.cf-autocomplete .option-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>

<style lang="scss">
.select {
  display: grid !important;
}

.step-items {
  list-style: none !important;
  margin-left: 0px !important;
  margin-top: 10px !important;
}

ul.pagination-list {
  list-style: none !important;
  margin-left: 0px !important;
  margin-top: 0px !important;
}

.button-field {
  display: grid;
  justify-content: center;
}

.button-next {
  background-color: #98A869 !important;
  color: white !important;
  min-width: 100px;
  margin-right: 10px;
}

.b-checkbox.checkbox {
  padding-left: 15px !important;
  margin-right: 0px !important;
}
</style>
