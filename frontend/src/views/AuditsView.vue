<template>
  <section class="custom-section">
    <div v-if="action != 'evaluate'">
      <Header
        title="Audits"
        :perPage="perPage"
        :showAdd="isAdmin && activeTab == 1"
        :showActions="false"
        @update:perPage="perPage = $event"
        @add="formAuditForAdd"
      />

      <b-tabs v-model="activeTab">

        <b-tab-item label="All audits">
          <Table
            :data="allAudits"
            :columns="columnsAllAudits"
            :actions="rowActionsAllAudits"
            :checkable="false"
            @show="formAuditForShow"
          />
          <Pagination
            class="custom-pagination"
            :total="totalAll"
            :perPage="perPage"
            :currentPage="currentPageAll"
            @change="onPageChangeAll"
          />
        </b-tab-item>

        <b-tab-item label="My audits" v-if="isAdmin">
          <Table
            :data="myAudits"
            :columns="columnsMyAudits"
            :actions="rowMyActions"
            :checkable="false"
            @show="formAuditForShow"
            @edit="formAuditForEdit"
            @remove="removeAudit"
            @close="closeAudit"
          />
          <Pagination
            class="custom-pagination"
            :total="totalMine"
            :perPage="perPage"
            :currentPage="currentPageMine"
            @change="onPageChangeMine"
          />
        </b-tab-item>

        <b-tab-item label="Assigned audits" v-if="!isAdmin">
          <Table
            :data="pendingAudits"
            :columns="columnsPendingAudits"
            :actions="rowPendingActions"
            :checkable="false"
            @show="formAuditForShow"
            @evaluate="evaluate"
          />
          <Pagination
            class="custom-pagination"
            :total="totalPending"
            :perPage="perPage"
            :currentPage="currentPagePending"
            @change="onPageChangePending"
          />
        </b-tab-item>
      </b-tabs>
      <AuditForm
        :action="action"
        :id_audit="id_audit"
        @remove-action="action = ''"
        @remove-id-audit="id_audit = null"
        @finished-actions-for-audit="calculateAuditsChange"
      />
    </div>
    <div v-else>
      <EvaluationForm
        :action="action"
        :id_audit="id_audit"
        @remove-action="action = ''"
        @remove-id-audit="id_audit = null"
        @finished-actions-for-audit="getPendingAudits"
      />
    </div>
  </section>
</template>

<script>
import Header from '@/components/Header.vue';
import Table from '@/components/Table.vue';
import Pagination from '@/components/Pagination.vue';
import axiosInstance from '@/services/axiosInstance';
import AuditForm from '@/forms/AuditForm.vue';
import EvaluationForm from '@/forms/EvaluationForm.vue';

export default {
  name: 'AuditsView',
    components: {
    Header,
    Table,
    Pagination,
    AuditForm,
    EvaluationForm,
  },
  data() {
    return {
      userRole: localStorage.getItem('role'),

      action: null,
      activeTab: 0, // Tab activo

      allAudits: [], // todas las auditorias
      myAudits: [],
      pendingAudits: [],
      id_audit: null,

      isLoading: false,
      processes: [], // Procesos de negocio
            
      perPage: 5,

      totalAll: 1,
      pageAll: 1,
      currentPageAll: 1,
      sortFieldAll: "id",
      sortOrderAll: "asc",

      totalMine: 1,
      pageMine: 1,
      currentPageMine: 1,
      sortFieldMine: "id",
      sortOrderMine: "asc",

      totalPending: 1,
      pagePending: 1,
      currentPagePending: 1,
      sortFieldPending: "id",
      sortOrderPending: "asc",

      columnsAllAudits: [
        { field: 'id', label: 'ID', sortable: true, render: row => `A${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'organization', label: 'Organization' },
        { field: 'auditor', label: 'Evaluator auditor'},
        { field: 'manager', label: 'Manager' },
        { field: 'init_date', label: 'Init date', sortable: true },
        { field: 'end_date', label: 'End date', sortable: true },
        { field: 'state', label: 'State', sortable: true  },
      ],
      columnsMyAudits: [
        { field: 'id', label: 'ID', sortable: true, render: row => `A${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'organization', label: 'Organization' },
        { field: 'auditor', label: 'Evaluator auditor'},
        { field: 'init_date', label: 'Init date', sortable: true },
        { field: 'end_date', label: 'End date', sortable: true },
        { field: 'state', label: 'State', sortable: true  },
      ],
      columnsPendingAudits: [
        { field: 'id', label: 'ID', sortable: true, render: row => `A${row.id}` },
        { field: 'name', label: 'Name', sortable: true },
        { field: 'organization', label: 'Organization' },
        { field: 'auditor', label: 'Evaluator auditor'},
        { field: 'init_date', label: 'Init date', sortable: true },
        { field: 'end_date', label: 'End date', sortable: true },
        { field: 'state', label: 'State', sortable: true  },
      ],
    }
  },
  watch: {
    activeTab: async function() {
      if (this.activeTab == 0){
        await this.getAudits();
      } else if (this.isAdmin){
        if (this.activeTab == 1) {
          await this.getMyAudits();
        } else if (this.activeTab == 2) {
          await this.getPendingAudits();
        }
      } else {
        if (this.activeTab == 1){
          await this.getPendingAudits();
        }
      }
    },
    perPage: async function() {
      if (this.activeTab == 0) {
        await this.getAudits();
      } else if (this.activeTab == 1){
        await this.getMyAudits();
      } else if (this.activeTab == 2){
        await this.getPendingAudits();
      }
    }
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin' || this.userRole === 'chief_auditor';
    },
    rowActionsAllAudits() {
      return [
        { icon: 'mdi mdi-eye', event: 'show' },
      ]
    },
    rowMyActions() {
      return [
        { icon: 'mdi mdi-eye', event: 'show' },
        { 
          icon: 'mdi mdi-pencil', 
          event: 'edit',
          disabledCondition: (row) => row.state !== 'Not started',
        },
        { icon: 'mdi mdi-delete', event: 'remove' },
        { 
          icon: 'mdi mdi-lock', 
          event: 'close',
          disabledCondition: (row) => row.state !== 'Evaluated'
        }
      ]
    },
    rowPendingActions() {
      return [
        { icon: 'mdi mdi-eye', event: 'show' },
        { 
          event: 'evaluate',
          disabledCondition: (row) => (row.state === 'Closed' || row.state === 'Not started' || row.state === 'Not evaluated'),
          icon: 'mdi mdi-file-document-edit',
        },
      ]
    },       
  },
  mounted: async function()  {
    await this.getAudits();
  },
  methods: {
    calculateAuditsChange: async function() {
      if (this.activeTab == 0){
        await this.getAudits();
      } else if (this.isAdmin){
        if (this.activeTab == 1) {
          await this.getMyAudits();
        } else if (this.activeTab == 2) {
          await this.getPendingAudits();
        }
      } else {
        if (this.activeTab == 1){
          await this.getPendingAudits();
        }
      }
    },
    onPageChangeAll: async function(page) {
      this.pageAll = page;
      await this.getAudits();
    },
    onPageChangeMine: async function(page) {
      this.pageMine = page;
      await this.getMyAudits();
    },
    onPageChangePending: async function(page) {
      this.pagePending = page;
      await this.getPendingAudits();
    },
    formAuditForShow: async function(row) {
      this.action = 'show';
      this.id_audit = row.id;
    },    
    formAuditForAdd: async function() {
      this.action = 'add';
    },
    formAuditForEdit: async function(row) {
      this.action = 'edit';
      this.id_audit = row.id;
    },
    evaluate: function(row) {
      this.action = 'evaluate';
      this.id_audit = row.id;
    },
    getAudits: async function() {
      try {
        const response = await axiosInstance.get(`/audits`, {
          params: {
            page: this.pageAll,
            perPage: this.perPage,
            sortBy: this.sortFieldAll,
            sortOrder: this.sortOrderAll,
          }
        });
        this.allAudits = response.data?.data;
        this.currentPageAll = response.data?.currentPage;
        this.totalAll = response.data?.total;
      } catch (error) {
        console.log(error);
      }
    },
    getMyAudits: async function() {
      try {
        const response = await axiosInstance.get(`/audits/mine`, {
          params: {
            page: this.pageMine,
            perPage: this.perPage,
            sortBy: this.sortFieldMine,
            sortOrder: this.sortOrderMine,
          }
        });
        this.myAudits = response.data?.data;
        this.currentPageMine = response.data?.currentPage;
        this.totalMine = response.data?.total;
      } catch (error) {
        console.log(error);
      }
    },
    getPendingAudits: async function() {
      try {
        const response = await axiosInstance.get(`/audits/assigned`, {
          params: {
            page: this.pagePending,
            perPage: this.perPage,
            sortBy: this.sortFieldPending,
            sortOrder: this.sortOrderPending,
          }
        });
        this.pendingAudits = response.data?.data;
        this.currentPagePending = response.data?.currentPage;
        this.totalPending = response.data?.total;
      } catch (error) {
        console.log(error);
      }
    },
    removeAudit: async function(row) {
      try {
        const response = await axiosInstance.delete(`/audits/${row.id}`)
        if (response.status == 200) {
          await this.getMyAudits();
        }
      } catch (error) {
        console.log(error);
      }     
    },
    closeAudit: async function(row) {
      try {
        const response = await axiosInstance.post(`/audits/${row.id}/close`)
        if (response.status == 200) {
          await this.getMyAudits();
        }
      } catch (error) {
        console.log(error);
      }
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

</style>

<style lang="scss">

.content ul{
 margin-top: 0px !important;
}

</style>