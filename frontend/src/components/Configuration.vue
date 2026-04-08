<template>
  <section class="custom-section">
    <h1 class="title">Role's assignment</h1>
    <b-table
      :data="users_modified"
      hover
      striped
      :sticky-header="true"
      >
      <b-table-column field="id" label="ID" numeric sortable sticky headerClass='is-sticky-header' v-slot="props">
        {{ props.row.id }}
      </b-table-column>
      <b-table-column field="username" label="Username" sortable sticky headerClass='is-sticky-header' v-slot="props">
        {{ props.row.username }}
      </b-table-column>
      <b-table-column field="name" label="Name" sortable sticky headerClass='is-sticky-header' v-slot="props">
        {{ props.row.name }}
      </b-table-column>
      <b-table-column field="role" label="Role" sortable sticky headerClass='is-sticky-header' v-slot="props">
        <b-select placeholder="Select a role" v-model="props.row.role" @input="markUser(props.row)">
          <option
          v-for="op in options"
          :key="op.option_db"
          :value="op.option_db">
          {{ op.option }}
          </option>
        </b-select>
      </b-table-column>
    </b-table>
    <div style="display: flex; justify-content: flex-end; align-items: center;">
    <b-button
        class="button-green"
        label="Update roles" 
        style="margin-bottom:20px; width: 300px;"
        @click="updateUsers()"/>
    </div>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'Configuration',
  data() {
    return {
      isMobile: null,
      users: [],
      options: [
        { 'option_db': 'admin', 'option': 'admin' },
        { 'option_db': 'chief_auditor', 'option': 'chief auditor' },
        { 'option_db': 'evaluator_auditor', 'option': 'evaluator auditor' },
      ]
    };
  },
  watch: {

  },
  computed: {
    users_modified() {
      return this.users.map(user => ({...user}));
    },
  },
  methods: {
    markUser: function(user) {
      const original = this.users.find(u => u.id === user.id);
      if (original && original.role !== user.role) {
        user.modificado = true;
      } else {
        user.modificado = false;
      }
    },
    obtainUserModified() {
      return this.users_modified.filter(user => user.modificado);
    },
    getUsers: async function() {
      try {
        const response = await axiosInstance.get('/users');
        this.users = response.data;
      } catch (error) {
        console.log(error.message);
      }
    },
    updateUsers: async function () {
      const users = this.obtainUserModified();
      for (let i=0; i< users.length; i++) {
        try {
          console.log(users[i])
          const response = await axiosInstance.put(`/users/${users[i].id}/permission`, {role: users[i].role });
          this.$buefy.snackbar.open({
            message: `User ${users[i].name} updated successfully`,
            actionText: 'OK',
            duration: 5000,
            queue: false,
        })
        } catch (error) {
          console.log(error.message);
        }
      }
    }
  },
  mounted() {
    (window.innerWidth <=420) ? this.isMobile = true : this.isMobile = false;
    window.addEventListener('resize', this.smallScreen);
    this.getUsers();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.smallScreen);
  },
};

</script>

<style scoped>

.section {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 1.5rem 1.5rem;
}

.custom-section {
  display: grid; 
  grid-template-columns: auto;
  padding: 0 50px;
  border-top: 2px !important;
  border-left: 2px !important;
  width: calc(100% - 100px);
  box-shadow: inset -6px 6px 8px rgba(0, 0, 0, 0.2), inset 6px -6px 8px rgba(0, 0, 0, 0.2) !important;
}

.title{
  margin-top: 30px;  
  align-self: flex-start;
  flex-direction: row;
}


.button-green{
  background-color: #98A869 !important;
  color: white !important;
}

</style>
