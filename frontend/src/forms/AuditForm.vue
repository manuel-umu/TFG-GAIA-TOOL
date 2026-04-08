<template>
  <b-modal
    v-model="isModalActive"
    close-button-aria-label="Close"
    :can-cancel="[]"

  >
    <header class="modal-card-head">
        <p class="modal-card-title">
          {{ action === 'show' ? 'Audit' : (action === 'edit' ? 'Edit' : 'New') + ' audit' }}
        </p>
      </header>

      <ShowForm
        :action="action" 
        :fields="filteredAuditFields"
      >
        <template #default>
          <b-field  v-if="selectedStrProc.length > 0" label="Strategic Processes">
            <ol class="field-list">
              <li v-for="(proc, i) in selectedStrProc" :key="i">
                {{ proc.endsWith('.') ? proc : proc + '.' }}
              </li>
            </ol>
          </b-field>
          <b-field v-if="selectedKeyProc.length > 0" label="Key Processes">
            <ol class="field-list">
              <li v-for="(proc, i) in selectedKeyProc" :key="i">
                {{ proc.endsWith('.') ? proc : proc + '.' }}
              </li>
            </ol>
          </b-field>
          <b-field v-if="selectedSuppProc.length > 0" label="Support Processes">
            <ol class="field-list">
              <li v-for="(proc, i) in selectedSuppProc" :key="i">
                {{ proc.endsWith('.') ? proc : proc + '.' }}
              </li>
            </ol>
          </b-field>
        </template>
      </ShowForm>

      <section v-if="action != 'show'" class="modal-card-body" >        
      <form>
        <b-loading :is-full-page="false" v-model="isLoading"></b-loading>

        <b-field
          label="Name *"
          for="name"
          :type="messageName != '' ? 'is-danger' : ''"
          :message="messageName"
        >
          <b-input
            id="name"
            v-model="name"
            placeholder="Enter audit's name"
            :icon-right="name != '' && name != null ? 'close-circle' : ''"
            icon-right-clickable
            @icon-right-click="name = ''"
            @input="messageName = ''"
          ></b-input>
        </b-field>

        <b-field label="Description" for="description" :type="messageDescription != '' ? 'is-danger' : ''"
          :message="messageDescription">
          <b-input
            id="description"
            v-model="description"
            placeholder="Enter audit's description"
            type="textarea"
            @input="messageDescription = ''"
          ></b-input>
        </b-field>

        <b-field label="Organization *" for="organization" :type="messageOrganization != '' ? 'is-danger' : ''"
          :message="messageOrganization">
          <b-select id="organization" v-model="organization" placeholder="Select a organization"  @input="messageOrganization = ''">
            <option v-for="(value, index) in organizations" :value="value.id">
              {{ value.name }}
            </option>
          </b-select>
        </b-field>

        <b-field
          label="Auditor *"
          for="auditor"
          :type="messageAuditor != '' ? 'is-danger' : ''"
          :message="messageAuditor"
        >
          <b-select id="auditor" v-model="auditor" placeholder="Select an evaluator auditor" @input="messageAuditor = ''">
            <option v-for="(value, index) in users" :value="value.id">
              {{ value.name }} {{ value.first_second_name }}
            </option>
          </b-select>
        </b-field>

        <div style="display: flex; justify-content: flex-start">
          <b-field label="Init date *" for="init_date" :type="messageInitDate != '' ? 'is-danger' : ''":message="messageInitDate">
            <b-datepicker
              style="min-width: 360px;"
              v-model="init_date"
              :show-week-number="false"
              placeholder="Click to select..."
              icon="calendar-today"
              :icon-right="init_date ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="clearInitDate"
              trap-focus
              @input="messageInitDate = ''"
            ></b-datepicker>
          </b-field>

          <b-field label="End date *" for="end_date" style="margin-left: 100px;" :type="messageEndDate != '' ? 'is-danger' : ''":message="messageEndDate">
            <b-datepicker
              style="min-width: 360px;"
              v-model="end_date"
              :show-week-number="false"
              placeholder="Click to select..."
              icon="calendar-today"
              :icon-right="init_date ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="clearEndDate"
              trap-focus
              @input="messageEndDate = ''"
            ></b-datepicker>
          </b-field>
        </div>

        <b-field
          label="Frequency *"
          for="frequency"
          :type="messageFrequency != '' ? 'is-danger' : ''"
          :message="messageFrequency"
        >
          <b-select id="frequency" v-model="frequency" placeholder="Select a frequency" @input="messageFrequency = ''">
            <option v-for="(value, index) in frequencies" :value="value">
              {{ value }}
            </option>
          </b-select>
        </b-field>
        <span v-if="messageProcesses != ''" style="color: red;"> {{ messageProcesses }}</span>
        <div style="display: flex;">
          <div style="flex: 1; margin: 5px; margin-left: 0px !important;">
              <b-field label="Strategics business processes" for="strategic-process" :type="messageProcStrategic != '' ? 'is-danger' : ''":message="messageProcStrategic">
                <b-autocomplete
                  id="strategic-process"
                  v-model="strategicProcess"
                  :data="filteredStrategicProcesses"
                  placeholder="Search..."
                  icon="magnify"
                  clearable
                  @select="handleStrategSelect"
                  @input="messageProcStrategic = ''; messageProcesses = ''"
                >
                  <template #empty>No results found</template>
                </b-autocomplete>
              </b-field>

              <div class="selected-box">
                <div class="tags" style="display: block; margin-top: 0.5em;">
                  <span
                    v-for="(tag, index) in selectedStrProc"
                    :key="index"
                    class="custom-tag"
                  >
                    <span class="tag-text">{{tag}}</span>
                    <button type="button" class="delete-button" @click="removeStrategicProcess(index)">x</button>
                  </span>
                </div>
              </div>
            </div>
            <div style="flex: 1; margin: 5px;">
              <b-field label="Key business processes" for="key-process" :type="messageProcKey != '' ? 'is-danger' : ''":message="messageProcKey">
                <b-autocomplete
                  id="key-process"
                  v-model="keyProcess"
                  :data="filteredKeyProcesses"
                  placeholder="Search..."
                  icon="magnify"
                  clearable
                  @select="handleKeySelect"
                  @input="messageProcKey = ''; messageProcesses = ''"
                >
                  <template #empty>No results found</template>
                </b-autocomplete>
              </b-field>
              <div class="selected-box">
                <div class="tags" style="display: block; margin-top: 0.5em;">
                  <span
                    v-for="(tag, index) in selectedKeyProc"
                    :key="index"
                    class="custom-tag"
                  >
                    <span class="tag-text">{{tag}}</span>
                    <button type="button" class="delete-button" @click="removeKeyProcess(index)">x</button>
                  </span>
                </div>
              </div>
            </div>

            <div style="flex: 1; margin: 5px; margin-right: 0px !important;">
              <b-field label="Support business processes" for="support-process" :type="messageProcSupport != '' ? 'is-danger' : ''" :message="messageProcSupport">
                <b-autocomplete
                  id="support-process"
                  v-model="supportProcess"
                  :data="filteredSupportProcesses"
                  placeholder="Search..."
                  icon="magnify"
                  clearable
                  @select="handleSuppSelect"
                  @input="messageProcSupport = ''; messageProcesses = ''"
                >
                  <template #empty>No results found</template>
                </b-autocomplete>
              </b-field>
              <div class="selected-box">
                <div class="tags" style="display: block; margin-top: 0.5em;">
                  <span
                    v-for="(tag, index) in selectedSuppProc"
                    :key="index"
                    class="custom-tag"
                  >
                    <span class="tag-text">{{tag}}</span>
                    <button type="button" class="delete-button" @click="removeSuppProcess(index)">x</button>
                  </span>
                </div>
              </div>
            </div>
        </div>
      </form>
    </section>

    <footer class="modal-card-foot custom-footer">
      <div class="footer-right">
        <b-button 
          label="Close" 
          @click="closeModal"
        />
        <b-button
          v-if="action == 'edit'"
          label="Edit"
          type="is-primary"
          @click="editAudit"
        />
        <b-button
          v-if="action == 'add'"
          label="Add"
          type="is-primary"
          @click="addAudit"
        />
      </div>
    </footer>
  </b-modal>
</template>

<script>

import axiosInstance from '@/services/axiosInstance';
import ShowForm from '@/forms/ShowForm.vue';

export default {
  props: {
    action: String,
    id_audit: Number,
  },
  components: {
    ShowForm,
  },
  data() {
    return {
      userId: null,
      isLoading: false,
      isModalActive: false,

      name: null,
      description: null,
      auditor: null,
      manager: null,
      init_date: null,
      end_date: null,
      frequency: null,
      state: null,
      organization: null,
      messageName: '',
      messageDescription: '',
      messageAuditor: '',
      messageManager: '',
      messageInitDate: '',
      messageEndDate: '',
      messageFrequency: '',
      messageOrganization: '', 
      messageProcStrategic: '',  // Mensaje para procesos estratégicos
      messageProcKey: '',       // Mensaje para procesos clave
      messageProcSupport: '', 
      messageProcesses: '',  

      allUsers: [],
      users: [], // Usuarios posibles auditores
      organizations: [], // Organizaciones disponibles
      frequencies: ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"],
      processes: [], // Procesos de negocio
      
      strategicProcesses: [], // Todos los procesos de negocio estrategicos
      strategicProcess: '', // El seleccionado para incluirlo en la lista
      selectedStrProc: [], // Todos los procesos de este tipo seleccionados

      keyProcesses: [],
      keyProcess: '',
      selectedKeyProc: [],

      supportProcesses: [],
      supportProcess: '',
      selectedSuppProc: [],

      auditFields: {
        Name: this.name,
        Description: this.description,
        Organization: this.organization,
        Auditor: this.auditor,
        Manager: this.manager,
        'Init date': this.init_date,
        'End date': this.end_date,
        Frequency: this.frequency,
        State: this.state,
      },
    };
  },
  watch: {
    id_audit: async function(newId) {
      if (this.action != '') {
        await this.getProcesses(true);
        await this.getAudit(newId);
      }
    },
    action: async function(newVal) {
      if (newVal == 'add') {
          await this.getProcesses(false);
          this.isModalActive = true;
      }
    },
    isModalActive: function(newVal){
        if (!newVal) {
            this.name = null;
            this.description = null;
            this.auditor = null;
            this.manager = null;
            this.init_date = null;
            this.end_date = null;
            this.frequency = null;
            this.state = null;
            this.organization = null;
            this.messageName = '';
            this.messageAuditor = '';
            this.messageManager = '';
            this.messageInitDate = '';
            this.messageEndDate = '';
            this.messageFrequency = '';
            this.messageOrganization = '';  
            this.messageDescription = '';
            this.messageProcKey = '';
            this.messageProcStrategic = '';
            this.messageProcSupport = '';
            this.messageProcesses = '';

            this.selectedKeyProc = [];
            this.selectedStrProc = [];
            this.selectedSuppProc = [];
            this.keyProcess = '';
            this.strategicProcess = '';
            this.supportProcess = '';
        }
    },
  },
  computed: {
    filteredStrategicProcesses() {
      return this.strategicProcesses.filter(p => {
        return p.toString().toLowerCase().indexOf(this.strategicProcess.toLowerCase()) >= 0;
      })
    },
    filteredKeyProcesses() {
      return this.keyProcesses.filter(p => {
        return p.toString().toLowerCase().indexOf(this.keyProcess.toLowerCase()) >= 0;
      })
    },
    filteredSupportProcesses() {
      return this.supportProcesses.filter(p => {
        return p.toString().toLowerCase().indexOf(this.supportProcess.toLowerCase()) >= 0;
      })
    },
    filteredAuditFields() {
      let filteredFields = {};
      for (let key in this.auditFields) {
        const value = this.auditFields[key];
        if (value) {
          filteredFields[key] = value;
        }
      }
      return filteredFields;
    }, 
  },
  mounted: async function() {
    this.userId = localStorage.getItem('id');
    await this.getOrganizations();
    await this.getUsers();
  },
  methods: {
    getUsers: async function() {
      try {
        const response = await axiosInstance.get('/users');
        this.allUsers = response.data; // Los usuarios no están paginados por eso no hay que coger el data del data
        if (this.allUsers && this.allUsers.length > 0) {
          this.users = response.data.filter(user => user.id != this.userId && user.role !== 'admin' && user.role !== 'chief_auditor');
        }
      } catch (error) {
        error = true;
      }
    },
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
    getProcesses: async function(withDeleted) {
      try {
        let params = '';
        if (withDeleted) {
          params = '?includeDeleted=true';
        }
        const response = await axiosInstance.get(`/processes${params}`, {
          params: {
            page: 1,
            perPage: 10000,
            sortBy: "id",
            sortOrder: "asc",
          }
        });
        this.processes = response.data?.data;
        if (this.processes && this.processes.length > 0){
          this.strategicProcesses = this.processes.filter(p => p.type == "Strategic").map(p => p.name);
          this.keyProcesses = this.processes.filter(p => p.type == "Key").map(p => p.name);
          this.supportProcesses = this.processes.filter(p => p.type == "Support").map(p => p.name);
        }
      } catch (error) {
        console.log(error);
      }
    },
    handleStrategSelect: function(option){
      if (option!= '' && option != null && !this.selectedStrProc.includes(option)) {
        this.selectedStrProc.push(option);
        this.$nextTick(() => {
          this.strategicProcess = '';  // Limpiar el input
        });
      }
    },
    handleKeySelect: function(option){
      if (option!= '' && option != null && !this.selectedKeyProc.includes(option)) {
        this.selectedKeyProc.push(option);
        this.$nextTick(() => {
          this.keyProcess = ''; // Limpiar el input
        });
      }
    },
    handleSuppSelect: function(option){
      if (option!= '' && option != null && !this.selectedSuppProc.includes(option)) {
        this.selectedSuppProc.push(option);
        this.$nextTick(() => {
          this.supportProcess = ''; // Limpiar el input
        });
      }
    },
    clearInitDate() {
      this.init_date = null;
    },
    clearEndDate() {
      this.end_date = null;
    },
    getAudit: async function(id) {
      try {
        this.isLoading = true;
        const response = await axiosInstance.get(`/audits/${id}`);
        if (this.action != 'show' && (new Date(response.data?.audit?.init_date) < new Date())){
            this.$buefy.dialog.alert({
                title: "Error",
                message:
                    "You can't modify this audit because the audit period has already started.",
                type: "is-danger",
                hasIcon: true,
            });
            this.isLoading = false;
            this.closeModal();
            return;
        }
        const audit = response.data.audit;
        this.name = audit.name;
        this.description = audit.description;
        this.auditor = audit.auditor;
        this.manager = audit.manager;
        this.init_date = new Date(audit.init_date);
        this.end_date = new Date(audit.end_date);
        this.frequency = audit.frequency;
        this.organization = audit.organization;
        const proc = audit.processes;
        for (const p of proc) {
            const foundProcess = this.processes.find(it => it.id == p);
            if (foundProcess) {
                if (foundProcess.type === "Strategic") {
                this.selectedStrProc.push(foundProcess.name);
                } else if (foundProcess.type === "Key") {
                this.selectedKeyProc.push(foundProcess.name);
                } else if (foundProcess.type === "Support") {
                this.selectedSuppProc.push(foundProcess.name);
                }
            }
        }

        if (this.action === 'show') {
          this.auditFields = {
            Name: this.name,
            Description: this.description,
            Organization: this.organizations.find(org => org.id == this.organization)?.name || this.organization,
            Auditor: this.allUsers.find(user => user.id == this.auditor)?.name || this.auditor,
            Manager: this.allUsers.find(user => user.id == this.manager)?.name || this.manager,
            'Init date': audit.init_date,
            'End date': audit.end_date,
            Frequency: this.frequency,
            State: this.state,
          };
        }
        this.isModalActive = true;
        this.isLoading = false;
      }catch(error) {
        console.log(error);
        this.isLoading = false;
      }
    },
    addAudit: async function() {
      const count = this.selectedStrProc.length + this.selectedKeyProc.length + this.selectedSuppProc.length;
      if (count == 0){
        this.messageProcesses = 'Select at least one process to audit.';
      }

      try {
          this.isLoading = true;
          var selectedProcesses = this.selectedStrProc;
          selectedProcesses = selectedProcesses.concat(this.selectedKeyProc);
          selectedProcesses = selectedProcesses.concat(this.selectedSuppProc);
          var proc = this.processes.filter(p => selectedProcesses.some(pSel => pSel == p.name));
          proc = proc.map(p => p.id);// Para enviar los ids de los procesos directamente

          if (this.init_date instanceof Date) {
            const localDate = new Date(this.init_date.getTime() - this.init_date.getTimezoneOffset() * 60000);
            this.init_date = localDate.toISOString();
          }

          if (this.end_date instanceof Date) {
            const localDate = new Date(this.end_date.getTime() - this.end_date.getTimezoneOffset() * 60000);
            this.end_date = localDate.toISOString();
          }

          const response = await axiosInstance.post(`/audits`, {
            'name': this.name,
            'description': this.description,
            'auditor': this.auditor,
            'manager': parseInt(this.userId, 10),
            'init_date': this.init_date,
            'end_date': this.end_date,
            'state': 'Pending',
            'frequency': this.frequency,
            'organization': this.organization,
            'processes': proc,
          });
          this.isLoading = false;
          this.closeModal();
      } catch (error) {
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    editAudit: async function() {
      try {
          this.isLoading = true;
          var selectedProcesses = this.selectedStrProc;
          selectedProcesses = selectedProcesses.concat(this.selectedKeyProc);
          selectedProcesses = selectedProcesses.concat(this.selectedSuppProc);
          var proc = this.processes.filter(p => selectedProcesses.some(pSel => pSel == p.name));
          proc = proc.map(p => p.id);// Para enviar los ids de los procesos directamente


          if (this.init_date instanceof Date) {
            const localDate = new Date(this.init_date.getTime() - this.init_date.getTimezoneOffset() * 60000);
            this.init_date = localDate.toISOString();
          }

          if (this.end_date instanceof Date) {
            const localDate = new Date(this.end_date.getTime() - this.end_date.getTimezoneOffset() * 60000);
            this.end_date = localDate.toISOString();
          }

          const response = await axiosInstance.put(`/audits/${this.id_audit}`, {
            'name': this.name,
            'description': this.description,
            'auditor': this.auditor,
            'manager': parseInt(this.userId, 10),
            'init_date': this.init_date,
            'end_date': this.end_date,
            'state': 'Pending',
            'frequency': this.frequency,
            'organization': this.organization,
            'processes': proc,
          });
          this.isLoading = false;
          this.closeModal();
      } catch (error) {
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
          if (error?.response?.data?.errors?.name) {
            this.messageName = error?.response?.data?.errors?.name;
          }
          break;
        case 400:
          if (error?.response?.data?.errors?.name) {
            this.messageName = error?.response?.data?.errors?.name;
          }
          if (error?.response?.data?.errors?.auditor) {
            this.messageAuditor = error?.response?.data?.errors?.auditor;
          }
          if (error?.response?.data?.errors?.description) {
            this.messageDescription = error?.response?.data?.errors?.description;
          }
          if (error?.response?.data?.errors?.init_date) {
            this.messageInitDate = error?.response?.data?.errors?.init_date;
          }
          if (error?.response?.data?.errors?.end_date) {
            this.messageEndDate = error?.response?.data?.errors?.end_date;
          }
          if (error?.response?.data?.errors?.frequency) {
            this.messageFrequency = error?.response?.data?.errors?.frequency;
          }
          if (error?.response?.data?.errors?.organization) {
            this.messageOrganization = error?.response?.data?.errors?.organization;
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
    },
    showError: function(error) {
      this.$buefy.snackbar.open({
        message: error,
        type: 'is-danger',
        duration: 5000,
      });
    },
    removeStrategicProcess: function(index) {
      this.selectedStrProc.splice(index, 1);
    },
    removeKeyProcess(index) {
      this.selectedKeyProc.splice(index, 1); 
    },
    removeSuppProcess(index) {
      this.selectedSuppProc.splice(index, 1);
    },
    closeModal: function() {
      this.isModalActive = false;
      this.$emit('remove-action');
      this.$emit('remove-id-audit');
      this.$emit('finished-actions-for-audit');
    },
  },
};
</script>

<style scoped lang="scss">

.selected-box {
  overflow-y: auto;
  height: 120px;
  background-color: #f0f0f0; /* Gris claro */
  padding: 5px !important;
  border-style: solid;
  border-width: thin;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1);
  border-color: #e0e0e0;
}

.custom-footer {
  display: flex;
  justify-content: flex-end;
}

.tags {
  display: block;
  gap: 0.5em;
}

.custom-tag {
  display: flex;
  align-items: center;
  margin-bottom: 0.3em;
  gap: 0.5em;
}

.tag-text {
  background-color: #cce6f8f1;
  padding: 0.25em 0.5em;
  border-radius: 4px;
  white-space: normal;
  word-break: break-word;
}

.delete-button {
  background: transparent;
  border: none;
  color: #666;
  font-weight: bold;
  cursor: pointer;
}

</style>