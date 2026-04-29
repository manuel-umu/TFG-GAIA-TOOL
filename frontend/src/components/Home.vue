<template>
<section class="custom-section" v-if="!isMobile">
  <div class="grid-container">
    <div class="grid-item">
      <div class="custome-card" @click="onOrganizations">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">ORGANIZATIONS MANAGEMENT</h1>
        <p class="description-card">Managing and controlling the data of organizations to be assessed during the audit process.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onIndicators">
        <img class="img-card" id="img-indicators" src="../assets/images/indicadores.png" width="50" height="50">
        <h1 class="title-card">SUSTAINABILITY INDICATORS REPOSITORY</h1>
        <p class="description-card">Managing enviromental, economic, social, institutional and technological indicators of sustainability.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onBusiness"> 
        <img class="img-card" id="img-processes" src="../assets/images/businessprocess.png" width="50" height="50">
        <h1 class="title-card little-title">BUSINESS PROCESSES MANAGEMENT</h1>
        <p class="description-card little-description">Managing the strategic, key and support processes of organizations.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onAudits">
        <img class="img-card" id="img-organisation" src="../assets/images/auditorias.png" width="50" height="50">
        <h1 class="title-card">AUDITS MANAGEMENT</h1>
        <p class="description-card">Performance of audits, evaluating the sustainainability indicators in the business processes.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onFrameworks">
        <img class="img-card" src="../assets/images/reportes.png" width="50" height="50">
        <h1 class="title-card">REGULATORY FRAMEWORKS</h1>
        <p class="description-card">Explore and manage CSRD/ESRS normative frameworks, standards, disclosure requirements and data points.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onReports">
        <img class="img-card" id="img-organisation" src="../assets/images/reportes.png" width="50" height="50">
        <h1 class="title-card">AUDITS REPORTS MANAGEMENT</h1>
        <p class="description-card">Managing sustainability audit reports to know the mains issues related to assessment of sustainability indicators in the business processes.</p>
      </div>
    </div>
    <div class="grid-item">
      <div class="custome-card" @click="onStatistics">
        <img class="img-card" id="img-organisation" src="../assets/images/estadisticas.png" width="50" height="50">
        <h1 class="title-card" style="margin-top: 10px;">STATISTICS MANAGEMENT</h1>
        <p class="description-card">Managing statistics to analyse the trends about the sustainability economic, social, individual, enviromental and technical in the organisations.</p>
      </div>
    </div>
  </div>
</section>
<section class="section" v-else>
  <div class="grid-container">
    <div class="grid-item">
      <div class="mobile-card" @click="onOrganizations">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE ORGANIZACIONES</h1>
      </div>
    </div>
    <div class="grid-item">
      <div class="mobile-card" @click="onBusinessProcess">
        <img class="img-card" id="img-businessprocess" src="../assets/images/businessprocess.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE PROCESOS DE NEGOCIO</h1>
      </div>
    </div>
    <div class="grid-item">
      <div class="mobile-card">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE ORGANIZACIONES</h1>
      </div>
    </div>
    <div class="grid-item">
      <div class="mobile-card">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE ORGANIZACIONES</h1>
      </div>
    </div>
    <div class="grid-item">
      <div class="mobile-card">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE ORGANIZACIONES</h1>
      </div>
    </div>
    <div class="grid-item">
      <div class="mobile-card">
        <img class="img-card" id="img-organisation" src="../assets/images/organisation.png" width="50" height="50">
        <h1 class="title-card">GESTÍON DE ORGANIZACIONES</h1>
      </div>
    </div>
  </div>
</section>
</template>

<script>

export default {
  name: 'Home',
  data() {
    return {
      isMobile: null,
    };
  },
  watch: {

  },
  components: {

  },
  methods: {
    onOrganizations: function() {
      this.$router.push("/organizations").catch(() => {});
    },
    onIndicators: function() {
      this.$router.push("/indicators").catch(() => {});
    },
    onBusiness: function() {
      this.$router.push("/businessprocesses").catch(() => {});
    },    
    onAudits: function() {
      this.$router.push("/audits").catch(() => {});
    },
    onFrameworks: function() {
      this.$router.push("/frameworks").catch(() => {});
    },
    onReports: function() {
      this.$router.push("/reports").catch(() => {});
    },
    onStatistics: function() {
      this.$router.push("/statistics").catch(() => {});
    },
    smallScreen: function() {
      (window.innerWidth <=420) ? this.isMobile = true : this.isMobile = false;
    },
  },
  mounted() {
    (window.innerWidth <=420) ? this.isMobile = true : this.isMobile = false;
    window.addEventListener('resize', this.smallScreen);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.smallScreen);
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

.mobile-card {
  height: 80px;
  min-width: 300px;
  border-radius: 30px;
  border-width: 1px;
  border-style: solid;
  border-color: #d6dcc3;
  box-shadow: 14px 14px 20px 0 rgba(20, 20, 20, 0.3);

  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  text-align: center;

  .img-card {
    padding-right: 15px;
  }

  .title-card {
    padding-top: 5px;
    font-size: 1rem;
  }
}


.grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto auto;
  gap: 20px;
  padding: 20px;
}

.grid-item {
  display: flex;
  justify-content: center;
}

.custome-card {
  flex: 1;
  align-self: center;
  border-radius: 30px;
  border-width: 1px;
  border-style: solid;
  border-color: #d6dcc3;
  padding: 20px;
  box-shadow: 14px 14px 20px 0 rgba(20, 20, 20, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  text-align: center;
  min-height: 235px !important;

  .img-card {
    padding-top:5px;
  }

  .title-card {
    padding-top: 5px;
    font-size: 1.3rem;
  }

  .description-card {
    padding-bottom: 10px;
  }
}

.little-title {
  padding-top: 10px !important;
  margin-top: 0px !important;
}

.little-description {
  margin-bottom: 15px !important;
}

.custome-card:hover {
  background-color: white;
  border-color: #98A869;
  transform: translateY(-.5em); 
}

.mobile-card:hover {
  background-color: white;
  border-color: #98A869;
  transform: translateY(-.5em); 
}

@media only screen and (max-width: 1565px) {
  .grid-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto auto auto;
  }
}

@media only screen and (max-width: 900px) {
  .grid-container {
    grid-template-columns: repeat(1, 1fr);
    grid-template-rows: auto auto auto auto;
  }
}

</style>

<style>
.custom-section {
  display: flex; 
  flex: 1;
  border-top: 2px !important;
  border-left: 2px !important;
  box-shadow: inset -6px 6px 8px rgba(0, 0, 0, 0.2), inset 6px -6px 8px rgba(0, 0, 0, 0.2) !important;
}
</style>