<template>
  <section class="custom-section">
    <Header
      title="Organizations"
      :perPage="perPage"
      :showAdd="isAdmin"
      :showActions="isAdmin"
      :showRemove="true"
      :showImport="false"
      :showExport="false"
      @update:perPage="perPage = $event"
      @add="openAddModal"
      @bulk-remove="removeSelectedOrganizations"
    />

    <Table
      :data="organizations"
      :columns="columns"
      :actions="rowActions"
      :checkable="isAdmin"
      :selected.sync="organizationsSelected"
      @show="getOrganizationForShow"
      @edit="getOrganizationForEdit"
      @remove="removeOrganization"
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
          {{ action === 'show' ? 'Organization' : (action === 'edit' ? 'Edit' : 'New') + ' organization' }}
        </p>
      </header>

      <ShowForm 
        :action="action" 
        :fields="filteredOrganizationFields"
      >
        <template #default>
          <b-field label="Organization's Strategic Goals">
            <ol class="field-list">
              <li v-for="(goal, i) in goals" :key="i">
                {{ goal.endsWith('.') ? goal : goal + '.' }}
              </li>
            </ol>
          </b-field>

          <b-field label="Critical Success Factors">
            <ol class="field-list">
              <li v-for="(factor, i) in factors" :key="i">
                {{ factor.endsWith('.') ? factor : factor + '.' }}
              </li>
            </ol>
          </b-field>
        </template>
      </ShowForm>

      <section v-if="action != 'show'" class="modal-card-body" >            
        <form @submit.prevent>
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
              placeholder="Enter organization's name"
              :icon-right="name != '' && name != null ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="name=''"
              @input="messageName = ''"
            >
            </b-input>
          </b-field>

          <b-field 
            label="Description" 
            for="description"
            :type="messageDescription != '' ? 'is-danger': ''"
            :message=messageDescription
          >
            <b-input 
              id="description"
              v-model="description"
              placeholder="Enter organization's description" 
              type="textarea"
              @input="messageDescription = ''"
            >
            </b-input>
          </b-field>
          <b-field 
            label="Country *" 
            for="country"            
            :type="messageCountry != '' ? 'is-danger': ''"
            :message=messageCountry
          >
            <b-select 
              id="country"
              v-model="country"
              placeholder="Search or select a country"
              icon="earth"
              @input="messageCountry=''"
              expanded 
              filterable
              >
                <optgroup label="Popular Countries">
                  <option v-for="(country, index) in popularCountries" :value="country">
                    {{ country }}
                  </option>
                </optgroup>
                  <optgroup label="All Countries">
                    <option v-for="(country, index) in countries" :value="country">
                    {{ country }}
                  </option>
                </optgroup>
            </b-select>
          </b-field>
          <b-field 
            label="Sector *" 
            for="sector"
            :type="messageSector != '' ? 'is-danger': ''"
            :message=messageSector
          >
            <b-select 
              id="sector"
              v-model="sector"
              placeholder="Select a sector"
              icon="domain"
              @input="messageSector = ''"
              >
              <option 
                  v-for="(value, index) in sectors"
                  :value="value"
                >
                  {{ value }}
                </option>
            </b-select>
          </b-field>
          <b-field 
            label="Number of employees" 
            for="employees"
          >
            <b-select 
              id="employees"
              v-model="rangeEmployees"
              placeholder="Select number of employees in the organization"
              icon="account"
              >
                <option 
                  v-for="(value, index) in rangesEmployees"
                  :value="value"
                >
                  {{ value }}
                </option>
            </b-select>
          </b-field>
          <b-field
            label="Website *"
            for="website"
            :type="messageWebsite != '' ? 'is-danger': ''"
            :message=messageWebsite
          >
            <b-input 
              id="website"
              v-model="website"
              placeholder="Enter organization's site web" 
              type="text"
              icon="web"
              :icon-right="website != '' && website != null ? 'close-circle' : ''"
              icon-right-clickable
              @icon-right-click="website=''"
              @input="messageWebsite = ''"
              >
            </b-input>
          </b-field>
          <div>
            <label style="font-weight: 700;">Organization's Strategic Goals *</label>
            <div class="tags" style="display: block; margin-top: 0.5em;">
              <span
                v-for="(tag, index) in goals"
                :key="index"
                class="custom-tag"
              >
                <span class="tag-text">{{ index + 1 }}. {{ tag }}{{ tag.endsWith('.') ? '' : '.' }}</span>
                <button type="button" class="delete-button" @click="removeTag('goal', index)">x</button>
              </span>
            </div>
            <div style="display: flex; margin-top: 0.5em;">
              <b-field style="flex: 1"  :type="messageGoals != '' ? 'is-danger' : ''" :message="messageGoals">
                <b-input 
                  id="goals"
                  style="flex: 1;"
                  v-model="osGoals" 
                  placeholder="Enter an organization's strategic goal"  
                  @keyup.enter.native="clickAddGoal"
                  @input="messageGoals = ''">
                </b-input>
              </b-field>
              <b-button class="button-plus" icon-right="plus" @click="clickAddGoal"/>
            </div>
          </div>
          <div>
            <label style="font-weight: 700;">Critical Success Factors *</label>
            <div class="tags" style="display: block; margin-top: 0.5em;">
              <span
                v-for="(tag, index) in factors"
                :key="index"
                class="custom-tag"
              >
                <span class="tag-text">{{ index + 1 }}. {{ tag }}{{ tag.endsWith('.') ? '' : '.' }}</span>
                <button type="button" class="delete-button" @click="removeTag('factor', index)">x</button>
              </span>
            </div>
            <div style="display: flex;  margin-top: 0.5em;">
              <b-field style="flex: 1" :type="messageFactors != '' ? 'is-danger' : ''" :message="messageFactors">
                <b-input 
                  style="flex: 1;"
                  v-model="csFactor" 
                  placeholder="Enter an organization's critical success factor" 
                  @keyup.enter.native="clickAddFactor"
                  @input="messageFactors = ''">
                </b-input>
              </b-field>
              <b-button class="button-plus" icon-right="plus" @click="clickAddFactor"/>
            </div>
          </div>          
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
          @click="editOrganization" />
        <b-button
          v-if="action == 'add'"
          label="Add"
          type="is-primary"
          @click="addOrganization" />
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
import countriesData from '@/assets/countries.json';

export default {
  name: 'OrganizationView',
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

      organizations: [],
      organizationsSelected: [],
      idOrganization: null,

      name: null,
      description: null,
      country: null,
      sector: null,
      rangeEmployees: null,
      website: null,
      goals: [],
      factors: [],
      osGoals: null,
      csFactor: null,
      messageName: '',
      messageCountry: '',
      messageSector: '',
      messageWebsite: '',
      messageGoals: '',
      messageFactors: '',
      messageDescription: '',

      isLoading: false,
      countries: countriesData.countries,
      popularCountries: ["Spain", "Cuba", "United Kingdom", "United States of America"],
      sectors: ["Agriculture", "ICT company", "Manufacturing", "Educational", "Health service", "Service", "Transport"],
      rangesEmployees: ["0", "From 1 to 9", "From 10 to 49", "From 50 to 249", "From 250 to 999", "+ 1000"],

      total: 1,
      page: 1,
      perPage: 5,
      currentPage: 1,
      sortField: "id",
      sortOrder: "asc",

      columns: [
        { field: 'id', label: 'ID', sortable: true, render: row => `O${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'country', label: 'Country', sortable: true },
        { field: 'sector', label: 'Sector', sortable: true },
        { field: 'rangeEmployees', label: 'Employees' },
        { field: 'website', label: 'Website' }
      ],

      organizationFields: {
        Name: this.name,
        Description: this.description,
        Country: this.country,
        Sector: this.sector,
        "Number of employees": this.rangeEmployees,
        Website: this.website,
      },
    };
  },
  watch: {
    isModalActive() {
      if (this.isModalActive == false) {
        this.name = null;
        this.description = null;
        this.country = null;
        this.sector = null;
        this.rangeEmployees = null;
        this.website = null;
        this.goals = [];
        this.osGoals = null,
        this.factors = [];
        this.csFactor = null;
        this.action = null;
        this.messageName = '';
        this.messageCountry = '';
        this.messageSector = '';
        this.messageWebsite = '';
        this.messageGoals = '';
        this.messageDescription = '';
        this.messageFactors = '';
        this.organizationsSelected = [];
        this.idOrganization= null;
      }
    },
    perPage: async function() {
      await this.getOrganizations();
    },
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin' || this.userRole === 'chief_auditor';
    },
    rowActions() {
      return [
        { icon: 'mdi mdi-eye', event: 'show' },
        { icon: 'mdi mdi-pencil', event: 'edit', if: () => this.isAdmin },
        { icon: 'mdi mdi-delete', event: 'remove', if: () => this.isAdmin }
      ]
    },
    filteredOrganizationFields() {
      let filteredFields = {};
      for (let key in this.organizationFields) {
        const value = this.organizationFields[key];
        if (value) {
          filteredFields[key] = value;
        }
      }
      return filteredFields;
    },
  },
  mounted: async function() {
    await this.getOrganizations();
  },
  methods: {
    openAddModal() {
      this.action = 'add';
      this.isModalActive = true;
    },
    getOrganization: async function(id) {
      try {
          const response = await axiosInstance.get(`/organizations/${id}`);
          var org = response.data;
          this.name = org.name;
          this.description = org.description;
          this.country = org.country;
          this.sector = org.sector;
          this.rangeEmployees = org.rangeEmployees;
          this.website = org.website;
          this.goals = org.goals.split(";");
          this.factors = org.factors.split(";");
          this.idOrganization = org.id;

          if (this.action === 'show') {
            this.organizationFields = {
              Name: this.name,
              Description: this.description,
              Country: this.country,
              Sector: this.sector,
              "Number of employees": this.rangeEmployees,
              Website: this.website,
            };
          }

          this.isModalActive = true;
        } catch (error) {
          console.log(error);
        }
    },
    getOrganizationForShow: async function(row) {
      this.action = 'show';
      await this.getOrganization(row.id);
    },
    getOrganizationForEdit: async function(row) {
      this.action = 'edit';
      await this.getOrganization(row.id);
    },
    removeSelectedOrganizations: async function() {
      try {
        this.$buefy.dialog.confirm({
          title: 'Remove Organization',
          message: 'Are you sure you want to remove the selected organizations?',
          confirmText: 'Yes, remove',
          cancelText: 'No, cancel',
          type: 'is-danger',
          onConfirm: async () => {
            const response = await axiosInstance.delete(`/organizations`, {
              data: {ids: this.organizationsSelected.map(org => org.id)}
            });
            if (response.status == 200){
              await this.getOrganizations();
            }
            this.organizationsSelected = [];
          }
        });
      } catch(error) {
        this.$buefy.snackbar.open({
          message: error.response.data.error || 'Error removing organization',
          duration: 5000,
          type: 'is-danger',
        });
      }
    },
    removeOrganization: async function(row) {
      try {
        this.$buefy.dialog.confirm({
          title: 'Remove Organization',
          message:`Are you sure you want to remove ${row.name}?`,
          confirmText: 'Yes, remove',
          cancelText: 'No, cancel',
          type: 'is-danger',
          onConfirm: async () => {
            const response = await axiosInstance.delete(`/organizations/${row.id}`);
            if (response.status == 200){
              await this.getOrganizations();
            }
          }
        });
      } catch(error) {
        this.$buefy.snackbar.open({
          message: error.response.data.error || 'Error removing organization',
          duration: 5000,
          type: 'is-danger',
        });
      }
    },
    removeTag: function(tagtype, index) {
      if (tagtype == 'goal')
        this.goals.splice(index, 1);
      else 
        this.factors.splice(index, 1);
    },
    onPageChange: async function(page) {
      this.page = page;
      await this.getOrganizations();
    },
    getOrganizations: async function() {
      try {
        const response = await axiosInstance.get(`/organizations`, {
          params: {
            page: this.page,
            perPage: this.perPage,
            sortBy: this.sortField,
            sortOrder: this.sortOrder,
          }
        });
        this.currentPage = response.data.currentPage;
        this.total = response.data.total;
        this.organizations = [];
        this.organizations = response.data.data.map(org => {
          org.goals = org.goals.split(";").map(g => g.trim());
          org.factors = org.factors.split(";").map(f => f.trim());
          return org;
        });
      } catch (error) {
        console.log(error);
      }
    },
    clickAddGoal: function()  {
      if (this.osGoals != null && this.osGoals != ''){
        this.goals.push(this.osGoals);
        this.osGoals= null;
      }
    },
    clickAddFactor: function()  {
      if (this.csFactor != null && this.csFactor != ''){
        this.factors.push(this.csFactor);
        this.csFactor= null;
      }
    },
    addOrganization: async function() {
      try {
          this.action = 'add';
          this.isLoading = true;
          const response = await axiosInstance.post(`/organizations`, {
            name: this.name,
            description: this.description,
            country: this.country,
            sector: this.sector,
            rangeEmployees: this.rangeEmployees,
            website: this.website,
            goals: this.goals,
            factors: this.factors,
          });
          await this.getOrganizations();
          this.isLoading = false;
          this.isModalActive = false;
      } catch (error) {
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    editOrganization: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.put(`/organizations/${this.idOrganization}`, {
          name: this.name,
          description: this.description,
          country: this.country,
          sector: this.sector,
          rangeEmployees: this.rangeEmployees,
          website: this.website,
          goals: this.goals,
          factors: this.factors,
        });
        this.isLoading = false;
        this.isModalActive = false;
        await this.getOrganizations();
      } catch(error){
        this.isLoading = false;
        this.handleErrors(error);
      }
    },
    handleErrors: function(error) {
      switch(error.response.status) {
        case 406:
          if (error?.response?.data?.errors?.name){
            this.messageName = error?.response?.data?.errors?.name;
          }
          break;
        case 400:
          if (error?.response?.data?.errors?.name) {
            this.messageName = error?.response?.data?.errors?.name;
          }
          if (error?.response?.data?.errors?.country) {
            this.messageCountry = error?.response?.data?.errors?.country;
          }
          if (error?.response?.data?.errors?.sector) {
            this.messageSector = error?.response?.data?.errors?.sector;
          }
          if (error?.response?.data?.errors?.website) {
            this.messageWebsite = error?.response?.data?.errors?.website;
          }
          if (error?.response?.data?.errors?.goals) {
            this.messageGoals = error?.response?.data?.errors?.goals;
          }
          if (error?.response?.data?.errors?.factors) {
            this.messageFactors = error?.response?.data?.errors?.factors;
          }
          if (error?.response?.data?.errors?.description) {
            this.messageDescription = error?.response?.data?.errors?.description;
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
  }
}
</script>

<style scoped>
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
  background-color: #f0f0f0;
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

.button-plus {
  padding-left: 17px;
  padding-right: 17px;
}

ul {
  margin-left: 10px !important; 
  list-style-type: none !important;
  margin-top: 0px !important;
}

.custom-footer {
  justify-content: flex-end;
}

.field-list {
  padding-left: 1.25em;
  margin-top: 0.25em;
  line-height: 1.5;
}

.modal-card-body b-field {
  margin-bottom: 0.5em;
}

</style>
