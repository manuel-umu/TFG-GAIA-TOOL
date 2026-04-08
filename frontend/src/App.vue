<template>
  <div id="app">
    <header class="first-header">
      <h1 class="custom-title"> {{ tittle }} </h1>
    </header>
    <header class="second-header">
      <div class="header-left">
        <img class="clickable-image" id="logo" src="./assets/images/logo.png" width="110" height="70" alt="Logo"
          @click="onLogo">
      </div>
      <div class="header-right">
        <b-button v-if="!isLogged" class="button-right" @click="onLogin">
          <b-icon class="icon-account" icon="mdi mdi-account-circle-outline" size="is-medium"></b-icon>
        </b-button>
        <div class="bar-right" v-else>
          <h1>
            {{ this.name }}
          </h1>
          <b-dropdown class="custom-dropdown" aria-role="list" position="is-bottom-left" :mobile-modal=false>
            <template #trigger>
              <b-button class="button-right">
                <b-icon class="icon-account" icon="mdi mdi-account-circle-outline" size="is-medium"></b-icon>
              </b-button>
            </template>
            <b-dropdown-item aria-role="listitem" @click="onProfile">Profile</b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="logout">Logout</b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
    </header>
    <main class="page" v-if="!isLogged || this.$route.path == '/welcome'">
      <router-view class="page" @logged="afterLogin"></router-view>
    </main>
    <main class="page-rows" v-else>
      <Menu />
      <router-view class="content" @logged="afterLogin"></router-view>
    </main>
    <footer class="footer custom-footer">
      <div class="grid-footer" style="margin-left: 20px;">
        <img id="logo-umu" src="./assets/images/SelloUMU-white.png" width="80" alt="Logo UMU">
      </div>
      <div class="grid-footer">
        <span><strong>Universidad de Murcia</strong></span>
        <a href="https://www.um.es/web/informatica/" class="link">Facultad de informática</a>
        <a href="https://www.um.es/web/siu/" class="link">Servicio de Información Universitario</a>
      </div>
      <div class="grid-footer">
        <span><strong>Contacto</strong></span>
        <span>Avda. Teniente Flomesta, 5 - 30003 (Espinardo, Murcia)</span>
        <span>Teléfono: +34 868 88 88 88</span>
      </div>
    </footer>
  </div>
</template>


<script>
import WelcomeView from './views/WelcomeView.vue';
import HomeView from './views/HomeView.vue';
import LoginView from './views/LoginView.vue';
import Menu from './components/Menu.vue';
import { NavigationFailureType, isNavigationFailure } from 'vue-router';
import axiosInstance from '@/services/axiosInstance';
import { isAuthenticated } from '@/services/auth';

export default {
  name: 'App',
  data() {
    return {
      tittle: "Sustainability audit tool: Technological tool for sustainability audit's management",
      isLogged: false,
      isMobile: false,
      username: null,
      name: null,
      id: null,
      role: null,
    };
  },
  components: {
    WelcomeView,
    HomeView,
    LoginView,
    Menu,
  },
  watch: {
    '$route.path': async function(newPath) {
      this.isLogged = await isAuthenticated().then(auth => auth.authenticated);
    }
  },
  methods: {
    loadUserData() {
      this.name = localStorage.getItem("name");
      this.username = localStorage.getItem("username");
      this.id = localStorage.getItem("id");
      this.role = localStorage.getItem("role");
    },
    clearUserData() {
      ['id', 'name', 'username', 'role'].forEach(k => localStorage.removeItem(k));
      this.name = this.username = this.id = this.role = null;
    },
    updateScreenProperties() {
      this.isMobile = window.innerWidth <= 420;
      this.tittle = window.innerWidth <= 1072
        ? "SUSTAINABILITY AUDIT TOOL"
        : "Sustainability audit tool: Technological tool for sustainability audit's management";
    },
    navigateTo(path) {
      this.$router.push(path).catch(error => this.manageError(error));
    },
    manageError(error) {
      if (isNavigationFailure(error, NavigationFailureType.redirected)) {
        console.log("Redirection handled");
      } else if (isNavigationFailure(error, NavigationFailureType.duplicated)) {
        console.log("Navigation duplicated");
      } else if (isNavigationFailure(error, NavigationFailureType.cancelled)) {
        console.log("Navigation cancelled");
      } else {
        console.error("Unexpected navigation error:", error);
      }
    },
    onLogo() { 
      this.isLogged ? this.onHome() : this.onWelcome(); 
    },
    onWelcome() { 
      this.navigateTo("/welcome"); 
    },
    onHome() { 
      this.navigateTo("/home"); 
    },
    onLogin() { 
      this.navigateTo("/login"); 
    },
    onRegister() { 
      this.navigateTo("/signup"); 
    },
    onProfile() { 
      this.navigateTo("/profile"); 
    },
    async logout() {
      try{
        const response = await axiosInstance.post(`/logout`);
        if (response.status === 200) {
          this.clearUserData();
          this.isLogged = false;
          this.navigateTo("/welcome");
        }
      } catch (error) {
        console.log(error.message);
      }
    },
    afterLogin() {
      this.isLogged = true;
      this.loadUserData();
      this.$router.push('/home').catch(() => {})
    }
  },
  mounted: async function () {
    window.addEventListener('resize', this.updateScreenProperties);
    this.updateScreenProperties();
    const auth = await isAuthenticated();
    this.isLogged = auth.authenticated;
    if (this.isLogged) {
      this.loadUserData();
    } else {
      this.clearUserData();
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateScreenProperties);
  },
};
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.page-rows {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  background-color: #f5f6f0;
}

.footer {
  background-color: #98A869 !important;
  color: white !important;
  text-align: center;
  font-size: 20px;
  height: 90px !important;
  padding: 0px !important;
}


.first-header {
  background-color: #98A869;
  padding: 5px;
  padding-left: 10px;
}

.custom-title {
  color: white !important;
  font-size: 1.3rem !important;
}


.second-header {
  display: flex;
  justify-content: space-between;
}

.header-left {
  display: flex;
  justify-self: flex-start;
  align-items: center;
  padding: 5px;
}

.header-right {
  display: flex;
  justify-self: flex-end;
  align-items: center;
}

.button-right {
  margin-right: 30px !important;
  color: #98A869 !important;
  padding: 0px !important;
  border: none !important;
  box-shadow: none !important;
}

.icon-account {
  padding-top: 20px !important;
}

.custom-dropdown:click {
  display: block !important;
}

.dropdown-item {
  padding-right: 1rem !important;
}

.dropdown-content {
  box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.15) !important;
}

.bar-right {
  display: flex;
  flex-direction: row !important;

  h1 {
    align-self: center;
    margin-right: 25px;
  }
}

.clickable-image {
  cursor: pointer;
}

.custom-footer {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 0.8rem;
}

.grid-footer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 10px;
}

@media only screen and (max-width: 670px) {
  .custom-title {
    text-align: center;
  }
}

@media only screen and (max-width: 430px) {
  .custom-title {
    text-align: center;
  }

  .button-right {
    margin-right: 20px !important;
  }

  .second-header {
    border-bottom: none;
  }
}

.link {
  color: #ffffff;
  text-decoration: underline;
}
</style>
