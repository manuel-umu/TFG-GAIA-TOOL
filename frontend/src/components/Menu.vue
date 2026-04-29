<template>
  <section v-if="!isMobile" id="menu" :class="menuClass">
    <div 
      :class=" isCollapsed ? 'collapsed-menu' : 'custom-menu'">
      <b-button class="button-navigation" @click="wantSmall = !wantSmall">
        <b-icon
          class="custom-icon"
          :icon="isCollapsed ?'mdi mdi-menu-close' : 'mdi mdi-menu-open'"
          size="is-medium"
        >
        </b-icon>
      </b-button>
      <b-menu>
      <b-menu-list class="menu-list">
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Home' ? true : false"
            :label="isCollapsed ? '' : 'Home'" 
            icon="mdi mdi-home"
            @click="selectItem({ label: 'Home', path: '/home'})"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Organizations' ? true : false"
            :label="isCollapsed ? '' : 'Organizations'" 
            icon="mdi mdi-office-building"
            @click="selectItem({ label: 'Organizations', path: '/organizations' })"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Repository' ? true : false"
            :label="isCollapsed ? '' : 'Indicators Repository'" 
            icon="mdi mdi-button-pointer"
            @click="selectItem({ label: 'Repository', path: '/indicators'})"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Business Processes' ? true : false"
            :label="isCollapsed ? '' : 'Business Processes'" 
            icon="mdi mdi-handshake"
            @click="selectItem({ label: 'Business Processes', path: '/businessprocesses' })"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Audits' ? true : false"
            :label="isCollapsed ? '' : 'Audits'" 
            icon="mdi mdi-clipboard-text-search"
            @click="selectItem({ label: 'Audits', path: '/audits' })"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Frameworks' ? true : false"
            :label="isCollapsed ? '' : 'Frameworks'"
            icon="mdi mdi-file-document-multiple-outline"
            @click="selectItem({ label: 'Frameworks', path: '/frameworks' })"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Reports' ? true : false"
            :label="isCollapsed ? '' : 'Reports'"
            icon="mdi mdi-file-check"
            @click="selectItem({ label: 'Reports', path: '/reports'})"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            :active="selectedItem.label === 'Statistics' ? true : false"
            :label="isCollapsed ? '' : 'Statistics'" 
            icon="mdi mdi-finance"
            @click="selectItem({ label: 'Statistics', path: '/statistics'})"
          >
          </b-menu-item>
          <b-menu-item
            class="custom-item"
            v-if="role == 'admin'"
            :active="selectedItem.label === 'Settings' ? true : false"
            :label="isCollapsed ? '' : 'Settings'" 
            icon="mdi mdi-cog-outline"
            @click="selectItem({ label: 'Settings', path: '/settings' })"
          >
          </b-menu-item>
        </b-menu-list>
      </b-menu>
    </div>
  </section>
</template>

<script>

export default {
  name: 'Menu',
  data() {
    return {
      selectedItem: { label: 'Home', path: '/home' },
      isSmall: null,
      wantSmall: true,
      isMobile: null,
      role: null,
    };
  },
  watch: {
    '$route'(to, from) {
      this.whatPath(to.path);
    }
  },
  components: {

  },
  computed: {
    isCollapsed() {
      return (this.isSmall == true || this.wantSmall == true);
    },
    menuClass() {
      return this.isCollapsed ? 'collapsed-menu' : 'custom-menu';
    }
  },
  methods: {
    whatPath: function(path) {
      if(path == '/home'){
        this.selectedItem = { label: 'Home', path: '/home' };
      } else if(path == '/organizations'){
        this.selectedItem = { label: 'Organizations', path: '/organizations' };
      } else if (path == '/indicators'){
        this.selectedItem = { label: 'Repository', path: '/indicators' };
      } else if (path == '/businessprocesses'){
        this.selectedItem = { label: 'Business Processes', path: '/businessprocesses' };
      } else if (path == '/audits'){
        this.selectedItem = { label: 'Audits', path: '/audits'};
      } else if (path == '/settings'){
        this.selectedItem = { label: 'Settings', path: '/settings' };
      } else if (path == '/profile'){
        this.selectedItem = { label: 'Profile', path: '/profile' };
      } else if (path == '/frameworks'){
        this.selectedItem = { label: 'Frameworks', path: '/frameworks' };
      } else if (path == '/reports'){
        this.selectedItem = { label: 'Reports', path: '/reports' };
      } else if (path == '/statistics'){
        this.selectedItem = { label: 'Statistics', path: '/statistics' };
      }
    },
    selectItem(item) {
      this.selectedItem = item;
      this.$router.push(item.path).catch(()=>{});
    },
    smallScreen: function() {
      (window.innerWidth <=710) ? this.isSmall = true : this.isSmall = false;
      (window.innerWidth <=420) ? this.isMobile = true : this.isMobile = false;
    },
  },
  mounted() {
    this.whatPath(this.$route.fullPath);
    (window.innerWidth <=710) ? this.isSmall = true : this.isSmall = false;
    (window.innerWidth <=420) ? this.isMobile = true : this.isMobile = false;
    window.addEventListener('resize', this.smallScreen);
    this.role = localStorage.getItem('role');
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.smallScreen);
  },
};

</script>

<style>

#menu{
  flex: 1;
  display: flex;
  flex-direction: row;
  border-top: 2px !important;
  box-shadow: inset 0 4px 6px rgba(0, 0, 0, 0.2) !important;
  padding-top: 8px !important;
}


.custom-menu {
  width: 250px;
  max-width: 250px;
  font-size: 24px !important;
}

.collapsed-menu {
  width: 67px !important;
  max-width: 67px !important;
}

.custom-item {
  padding: 0.3em 0.75em;
  border-radius: 1px;
  align-items: center;
  .icon-text {
    display: flex; 
    align-items: center;
    gap: 10px;
    min-height: 40px;
  }
  .mdi {
    font-size: x-large;
  }
}

.custom-icon {
  margin-left: 16px;
  margin-top: 6px;
}

.button-navigation {
  margin-left: 13px;
  margin-top: 6px;
  padding-bottom: 0px !important;
  border: none !important;
  box-shadow: none !important;
}

@media only screen and (max-width: 710px) {
 /* Colapsar */
 .custom-menu {
    min-width: 50px;
 }
}

</style>