<template>
<section class="custom-section" v-if="user">
  <div class="profile">
    <b-field
      label="Username"
      for="username"
      :type="messageUsername != '' ? 'is-danger': ''"
      :message=messageUsername
      >
      <b-input
        id="username"
        v-model="user.username"
        type="username"
        icon="account"
        icon-pack="mdi"
        :icon-right="user.username != '' && user.username != null ? 'close-circle' : ''"
        icon-right-clickable
        @icon-right-click="user.username=''"
        @input="clearErrorUsername"
        ></b-input>
    </b-field>
    <b-field
      label="Name"
      for="name"
      :type="messageName != '' ? 'is-danger': ''"
      :message=messageName
      >
      <b-input
        id="name"
        v-model="user.name"
        type="text"
        icon="account-box"
        icon-pack="mdi"
        :icon-right="user.name != '' && user.name != null ? 'close-circle' : ''"
        icon-right-clickable
        @icon-right-click="user.name=''"
        @input="clearErrorName"
        ></b-input>
    </b-field>
    <b-field
      label="Last name"
      for="lastname"
      >
      <b-input
        id="lastname"
        v-model="user.lastname"
        type="text"
        icon="account-box-outline"
        icon-pack="mdi"
        :icon-right="user.lastname != '' && user.lastname != null ? 'close-circle' : ''"
        icon-right-clickable
        @icon-right-click="user.lastname=''"
        ></b-input>
    </b-field>
    <b-field
      label="Email"
      for="email"
      :type="messageEmail != '' ? 'is-danger': ''"
      :message=messageEmail
      >
      <b-input
        id="email"
        v-model="user.email"
        type="email"
        icon="email"
        icon-pack="mdi"
        :icon-right="user.email != '' && user.email != null ? 'close-circle' : ''"
        icon-right-clickable
        @icon-right-click="user.email=''"
        @input="clearErrorEmail"
        ></b-input>
    </b-field>
    <b-button @click="updateUser()" class="is-primary" style="margin-top:20px;">
      Save changes
    </b-button>
    <div class="border-grey-top">
      <b-button v-if="!showNewPassword" @click="showNewPassword = true">
        Change password
      </b-button>
      <b-field
        v-if="showNewPassword"
        label="Old password"
        for="old-password"
        :type="messageOldPassword != '' ? 'is-danger': ''"
        :message=messageOldPassword
        >
        <b-input
          id="password"
          v-model="oldPassword"
          type="password"
          password-reveal
          ></b-input>
      </b-field>
      <b-field
        v-if="showNewPassword"
        label="New password"
        for="new-password"
        >
        <b-input
          id="new-password"
          v-model="newPasword"
          type="password"
          password-reveal
          ></b-input>
      </b-field>
      <b-button v-if="showNewPassword" @click="updatePassword()" class="is-primary" style="margin-top:20px;">
        Save new password
      </b-button>
    </div>
  </div>
</section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'ProfileView',
  data() {
    return {
      user: null,
      messageUsername: '',
      messageName: '',
      messageLastName: '',
      messageEmail: '',
      oldPassword: '',
      messageOldPassword: '',
      newPasword: '',
      showNewPassword: false,
    };
  },
  watch: {

  },
  components: {

  },
  mounted: async function() {
    this.userId = localStorage.getItem('id');
    try {
      const response =  await axiosInstance.get(`/users/${this.userId}`);
      this.user = response.data;
    } catch (error) {
      console.error(error);
    }
  },
  methods: {
    clearErrorUsername: function() {
      this.messageUsername = '';
    },
    clearErrorEmail: function() {
      this.messageEmail = '';
    },
    clearErrorName: function() {
      this.messageName = '';
    },
    updateUser: function() {
      axiosInstance.put(`/users/${this.userId}`, this.user)
      .then((response) => {
        if (response.status == 200){
          this.$buefy.snackbar.open({
            message: `User updated successfully`,
            actionText: 'OK',
            duration: 5000,
            queue: false,
          })
        }
      })
      .catch((error) => {
        console.error(error);
        this.$buefy.snackbar.open({
          message: `${error.response.data.error}`,
          duration: 5000,
          queue: false,
          type: "is-danger",
        })
      });
    },
    updatePassword: function() {
      axiosInstance.put(`/users/${this.userId}/password`, {
        old_password: this.oldPassword,
        new_password: this.newPasword 
      })
      .then((response) => {
        if (response.status == 200){
          this.$buefy.snackbar.open({
            message: `Password updated successfully`,
            actionText: 'OK',
            duration: 5000,
            queue: false,
          })
          this.showNewPassword = false;
          this.newPasword = '';
          axiosInstance.get(`/users/${this.userId}`)
          .then((resp) => {
            this.user = resp.data;
          });
        }
      })
      .catch((error) => {
        console.error(error);
        if (error.response.status == 401 && error.response.data.error.includes("Invalid old password")){
          this.messageOldPassword = "Invalid old password";
        } else {
          this.$buefy.snackbar.open({
            message: `${error.response.data.error}`,
            duration: 5000,
            queue: false,
            type: "is-danger",
          })
        }
      });
    },
  },
};

</script>

<style scoped>

.section {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 1.5rem 1.5rem;
}

.profile {
  width: 400px;
  margin-top: 30px;
  margin-left: 30px;
  padding-left: 30px;
}  

.border-grey-top {
  border-top: 2px solid grey;
  padding-top: 20px;
  margin-top: 20px;
}

.custom-section {
  display: grid;
  flex-direction: column;
  grid-template-columns: auto;
  border-top: 2px !important;
  border-left: 2px !important;
  box-shadow: inset -6px 6px 8px rgba(0, 0, 0, 0.2), inset 6px -6px 8px rgba(0, 0, 0, 0.2) !important;
}

</style>
