<template>
  <section id="signup">
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; margin-bottom: 20px;">
      <b-button :inverted=true class="button-login" type="is-primary" @click="onLogin"><span class="mdi mdi-arrow-left-bold" style="font-size: 40px;"></span></b-button>
      <h1 class="title">Register</h1>
    </div>
    <form class="box">
      <b-field 
        label="Username" 
        for="username" 
        :type="messageUsername != '' ? 'is-danger' : ''" 
        :message=messageUsername
      >
        <b-input 
          id="username" 
          v-model="lowercaseUsername"
          placeholder="Enter your username" 
          type="username" 
          icon="account"
          icon-pack="mdi" 
          :icon-right="username != '' && username != null ? 'close-circle' : ''" 
          icon-right-clickable
          @icon-right-click="username = ''" 
          @input="clearErrorUsername"
        ></b-input>
      </b-field>

      <b-field 
        label="Password" 
        for="password" 
        :type="messagePassword != '' ? 'is-danger' : ''" 
        :message=messagePassword
      >
        <b-input 
          id="password" 
          v-model="password" 
          placeholder="Enter your password" 
          type="password" 
          password-reveal
          @input="clearErrorPassword"
        >
        </b-input>
      </b-field>
      <b-field 
        label="Name" 
        for="name" 
        :type="messageName != '' ? 'is-danger' : ''" 
        :message=messageName
      >
        <b-input 
          id="name" 
          v-model="name" 
          placeholder="Enter your name" 
          icon-pack="mdi"
          :icon-right="name != '' && name != null ? 'close-circle' : ''" 
          icon-right-clickable
          @icon-right-click="name = ''" 
          @input="clearErrorName"
        ></b-input>
      </b-field>

      <b-field 
        label="Last name" 
        for="lastname"
      >
        <b-input 
          id="lastname" 
          v-model="lastname" 
          placeholder="Enter your last name" 
          icon-pack="mdi"
          :icon-right="lastname != '' && lastname != null ? 'close-circle' : ''" 
          icon-right-clickable
          @icon-right-click="lastname = ''"
        ></b-input>
      </b-field>

      <b-field 
        label="Email" 
        for="email" 
        :type="messageEmail != '' ? 'is-danger' : ''" 
        :message=messageEmail
      >
        <b-input 
          id="email" 
          v-model="lowercaseEmail"
          placeholder="Enter your email" 
          icon-pack="mdi"
          :icon-right="email != '' && email != null ? 'close-circle' : ''" 
          icon-right-clickable
          @icon-right-click="email = ''" 
          @input="clearErrorEmail"
        ></b-input>
      </b-field>
      <b-field
      class="button-field">
        <b-button
          class="button-next"  
          icon='chevron-right'
          @click="handleRegister"
          >
          Sign up
        </b-button>
      </b-field>
      <b-loading :is-full-page=false v-model="isLoading"></b-loading>
    </form>
  </section>
</template>


<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'Signup',
  data() {
    return {
      username: '',
      password: '',
      name: '',
      lastname: '',
      email: '',

      messageUsername: '',
      messagePassword: '',
      messageName: '',
      messageEmail: '',

      isLoading: false,
    };
  },
  computed: {
    lowercaseUsername: {
      get(){
        return this.username;
      },
      set(value) {
        this.username = value.toLowerCase();
      }
    },
    lowercaseEmail: {
      get(){
        return this.email;
      },
      set(value) {
        this.email = value.toLowerCase();
      }
    }
  },
  methods: {
    onLogin: function() {
      this.$router.push('/login')
    },
    clearErrorUsername: function() {
      this.messageUsername = '';
    },
    clearErrorPassword: function() {
      this.messagePassword = '';
    },
    clearErrorName: function() {
      this.messageName = '';
    },
    clearErrorEmail: function() {
      this.messageEmail = '';
    },
    handleRegister: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.post('/register', {
          username: this.username,
          password: this.password,
          name: this.name,
          first_second_name: this.lastname,
          email: this.email,
        });
        this.isLoading = false;
        localStorage.setItem('id', response.data.id);
        localStorage.setItem('username', this.username);
        localStorage.setItem('name', this.name);
        localStorage.setItem('role', response.data.role);
        this.$emit('registered');
      } catch (error) {
        this.isLoading = false;
        switch (error.response.status) {
          case 400:
            if (error.response.data.errors.username) {
              this.messageUsername = error.response.data.errors.username;
            }
            if (error.response.data.errors.password) {
              this.messagePassword = error.response.data.errors.password;
            }
            if (error.response.data.errors.name) {
              this.messageName = error.response.data.errors.name;
            }
            if (error.response.data.errors.email) {
              this.messageEmail = error.response.data.errors.email;
            }
            break;
          default:
            console.log(error.response)
            break;
        }  
      }
    },
  },
};
</script>

<style scoped>

#signup {
  margin-top: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.box {
  min-width: 752px !important;
  margin-left: 20%;
  margin-right: 20%;
  background: #f5f6f0;
}

.button-field {
  display: grid;
  margin-top: 30px; 
  justify-content: center;
}

.button-next { 
  background-color: #98A869 !important;
  color: white !important;
  min-width: 100px;
  margin-right: 10px;
}

.button-login {
  align-self: center;
  background-color: white !important;
  color: #98A869 !important;
  width: fit-content;
  margin-left: 20px;
}

.button-custom {
  margin-top: 25px;
  min-width: 100%;
}

@media only screen and (max-width: 1070px) {

  .box {
    min-width: 600px !important;
  }

}

@media only screen and (max-width: 985px) {
  .box {
    min-width: 600px !important;
  }

}

@media only screen and (max-width: 900px) {
  .box {
    min-width: 500px !important;
  }

}

@media only screen and (max-width: 770px) {

}

@media only screen and (max-width: 670px) {
  .box {
    min-width: 400px !important;
  }
}

@media only screen and (max-width: 430px) {
  #signup {
    margin-top: 20px !important;
  }
}

</style>
  