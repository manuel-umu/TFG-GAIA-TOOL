<template>
  <section id="login">
    <h1 class="title">Log in</h1>
    <form class="box">
      <div style="display: flex; justify-content: flex-end; align-items: flex-start; gap: 15px;">
        <label class="label">Choose how to log in</label>
        <b-switch 
          v-model="typeLogin"
          true-value="Username"
          false-value="Email"
          >
            {{ typeLogin }}  
        </b-switch>
      </div>
      <b-field v-if="typeLogin == 'Username'"
        label="Username" 
        for="username"
        :type="messageUsername != '' || messagePassword != '' ? 'is-danger': ''"
        :message=messageUsername>
        <b-input
          id="username"
          v-model="username"
          placeholder="Enter your username"
          type="username"
          icon="account"
          icon-pack="mdi"
          :icon-right="username != '' && username != null ? 'close-circle' : ''"
          icon-right-clickable
          @icon-right-click="username=''"
          @input="clearErrorUsername"
        ></b-input>
      </b-field>
      <b-field v-else
        label="Email" 
        for="email"
        :type="messageEmail != '' || messagePassword != '' ? 'is-danger': ''"
        :message=messageEmail>
        <b-input
          id="email"
          v-model="email"
          placeholder="Enter your email"
          type="email"
          icon="email"
          icon-pack="mdi"
          :icon-right="email != '' && email != null ? 'close-circle' : ''"
          icon-right-clickable
          @icon-right-click="email=''"
          @input="clearErrorEmail"
        ></b-input>
      </b-field>
      <b-field 
        label="Password" 
        for="password"
        :type="messagePassword != '' ? 'is-danger': ''"
        :message=messagePassword>
        <b-input 
          id="password"
          v-model="password"
          placeholder="Enter your password" 
          type="password"
          password-reveal
          @input="clearErrorPassword">
        </b-input>
      </b-field>
      <b-field>
        <a href="#" @click.prevent="openModal()" class="forgot-link">Have you forgotten your password?</a>
      </b-field>
      <b-field
      class="button-field">
        <b-button :inverted=true class="button-success" type="is-primary" @click="handleLogin">Continue</b-button>
      </b-field>
      <b-loading :is-full-page=false v-model="isLoading"></b-loading>
      <hr class="rounded">
      <b-field
      class="field-register">
        <div class="text">If you haven't registered yet, you can do here</div>
        <b-button :inverted=true class="button-register" type="is-primary" @click="onRegister">Register</b-button>
      </b-field>
    </form>
    <b-modal v-model="showModal" :can-cancel="['escape','x']">
      <header class="modal-card-head">Recover password</header>
      <section class="modal-card-body">
        <b-field 
          label="Email" 
          for="email-recover"
          :type="messageEmailRecover != '' ? 'is-danger': ''"
          :message=messageEmailRecover
          >
          <b-input 
            id="email-recover"
            v-model="emailRecover"
            placeholder="Enter your email"
            @input="messageEmailRecover = ''"
            >
          </b-input>
        </b-field>
        <b-field
          v-if="codeSent"
          label="Code" 
          for="code-recover"
          :type="messageCodeRecover != '' ? 'is-danger': ''"
          :message=messageCodeRecover
          >
          <b-input
            id="code-recover"
            v-model="codeRecover"
            placeholder="Enter the code sent to your email" 
            type="text"
            @input="messageCodeRecover = ''"
            >
          </b-input>
        </b-field>
        <b-field 
          v-if="codeSent"
          label="Password" 
          for="new-password"
          :type="messagePasswordRecover != '' ? 'is-danger': ''"
          :message=messagePasswordRecover
          >
          <b-input 
            id="new-password"
            v-model="newPassword"
            placeholder="Enter a new password" 
            type="password"
            password-reveal
            @input="messagePasswordRecover = ''"
            >
          </b-input>
        </b-field>
        <p v-if="codeSent && !expired" class="timer">
          Code expires in <strong>{{ formattedTime }}</strong>
        </p>
        <div v-if="expired" class="error">
          Code has expired. Please, request a new one.
        </div>
      </section>
      <footer class="modal-card-foot custom-footer">
        <b-button @click="showModal = false">Cancel</b-button>
        <b-button class="is-primary" v-if="!codeSent" @click="sendCode()">Send code</b-button>
        <b-button class="is-primary" v-if="codeSent" @click="recoverPassword()">Recover password</b-button>
      </footer>
    </b-modal>
  </section>
</template>

<script>
import axiosInstance from '@/services/axiosInstance';

export default {
  name: 'Login',
  data() {
    return {
      typeLogin: 'Username',
      username: '',
      email: '',
      password: '',
      messageUsername: '',
      messageEmail: '',
      messagePassword: '',
      name: '',
      codeRecover: '',
      isLoading: false,
      showModal: false,
      messageEmailRecover: '',
      messagePasswordRecover: '',
      messageCodeRecover: '',
      emailRecover: '',
      codeSent: false,
      showPassword: false,
      newPassword: '',
      timeLeft: 600,
      timer: null,
    };
  },
  computed: {
    formattedTime() {
      const minutes = Math.floor(this.timeLeft / 60)
      const seconds = this.timeLeft % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    expired() {
      return this.timeLeft <= 0
    }
  },
  watch: {
    codeSent: function(newVal) {
      if (!newVal && newVal.length == 6) {
        this.showPassword = true;
      }
    }
  },
  methods: {
    openModal: function() {
      this.showModal = true;
      this.codeRecover = '';
      this.newPassword = '';
      this.emailRecover = '';
      this.codeSent = false;
      this.messageEmailRecover = '';
      this.messagePasswordRecover = '';
      this.messageCodeRecover = '';
    },
    clearErrorUsername: function() {
      this.messageUsername = '';
      this.messagePassword = '';
    },
    clearErrorEmail: function() {
      this.messageEmail = '';
      this.messagePassword = '';
    },
    clearErrorPassword: function() {
      this.messagePassword = '';
    },
    onRegister: function() {
      this.$router.push('/signup')
    },
    hasParamError: function(param) {
      if(param == 'username' && this.username == '') {
        this.messageUsername='Enter your username.'
        return true;
      } else if (param == 'email' && this.email == '') {
        this.messageEmail='Enter your email.'
        return true;
      } else if (param == 'password' && this.password == '') {
        this.messagePassword='Enter your password.'
        return true;
      }
      return false;
    },
    handleLogin: async function() {
      var params = {}
      if (this.typeLogin == 'Username') {
        var errorUser = this.hasParamError('username');
        this.username = this.username.trim();
        params = { username: this.username, password: this.password };
      } else {
        var errorEmail = this.hasParamError('email');
        params = { email: this.email, password: this.password };
      }
      var errorPass = this.hasParamError('password');

      try {
        if (errorPass || (this.typeLogin == 'Username' && errorUser) || (!this.typeLogin == 'Email' && errorEmail)) {
          return;
        }
        this.isLoading = true;
        const response = await axiosInstance.post('/login', params);
        localStorage.setItem('id', response.data.id);
        localStorage.setItem('username', this.username);
        localStorage.setItem('name', response.data.name);
        localStorage.setItem('role', response.data.role);
        this.isLoading = false;
        this.$emit('logged');
      } catch (error) {
        this.isLoading = false;
        switch (error.response.status) {
          case 401:
            this.messagePassword = error.response.data.error;
            break;
          default:
            console.log(error.response);
            break;
        }
      }
    },
    sendCode: async function() {
      try {
        console.log(this.email)
        this.isLoading = true;
        const response = await axiosInstance.post('/users/password/recovered', { email: this.emailRecover });
        this.codeSent = true;
        this.timeLeft = 600;
        this.timer = null;
        this.startTimer();
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        this.messageEmailRecover = error.response.data.error;
      }
    },
    recoverPassword: async function() {
      try {
        this.isLoading = true;
        const response = await axiosInstance.post('/users/password/code', {
          email: this.emailRecover,
          code: this.codeRecover,
          password: this.newPassword
        });
        this.isLoading = false;
        this.showModal = false;
        this.$buefy.snackbar.open({
          message: `Password recovered successfully`,
          duration: 5000,
        });
      } catch (error) {
        this.isLoading = false;
        if (error.response.data.error == "Invalid recovery code") {
          this.messageCodeRecover = error.response.data.error;
        } else if (error.response.data.error.includes("Password must be")) {
          this.messagePasswordRecover = error.response.data.error;
        } else {
          this.$buefy.snackbar.open({
            message: `${error.response.data.error}`,
            duration: 5000,
          });
        }
      }
    },
    startTimer() {
      this.stopTimer()
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
        } else {
          this.stopTimer()
        }
      }, 1000)
    },
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
  },
};
</script>

<style scoped>

#login {
  margin-top: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.box {
  min-width: 600px !important;
  margin-left: 20%;
  margin-right: 20%;
  background: #f5f6f0;
}

.button-field {
  display: grid;
  margin-top: 30px; 
  justify-content: center;
}

.field-register {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto;
  justify-content: center;
}

.button-register {
  align-self: center;
  background-color: #98A869 !important;
  color: white !important;
  width: fit-content;
  margin-left: 20px;
}

.text {
  align-self: center;
}

.rounded {
  border-top: 3px solid white;
  border-radius: 5px;
}

.button-success { 
  background-color: #98A869 !important;
  color: white !important;
  min-width: 100px;
}

.custom-footer {
  justify-content: flex-end;
}

.forgot-link {
  text-decoration: underline;
}

@media only screen and (max-width: 900px) {
  .box {
    min-width: 500px !important;
  }
}

@media only screen and (max-width: 670px) {
  .box {
    min-width: 400px !important;
  }
}

@media only screen and (max-width: 430px) {
  #login {
    margin-top: 20px !important;
  }
}

</style>
  