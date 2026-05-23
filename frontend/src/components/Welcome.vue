<template>
  <div class="welcome-page">
    <div class="badge-row">
      <span class="csrd-badge">
        <span class="stars"> ★ ★ ★ ★ ★</span>
        <span class="badge-text">CSRD-ready · ESRS Set 1</span>
      </span>
      <span class="ai-badge">
        <i class="mdi mdi-robot"></i> AI-assisted
      </span>
    </div>
    <div class="presentation">
      <h1 class="main-title">Sustainability auditing &amp; CSRD reporting</h1>
      <span>
        <strong>Gaia Tool</strong> lets you run sustainability audits over your
        organization's business processes using the AHP/Saaty engine, and
        generate reports aligned with the EU
        <strong>Corporate Sustainability Reporting Directive</strong>
        (Directive 2022/2464) and the
        <strong>European Sustainability Reporting Standards</strong> (ESRS)
        developed by EFRAG, with the assistance of an AI agent.
      </span>
    </div>
    <div class="carousel">
      <b-carousel>
        <b-carousel-item v-for="(item, i) in 5" :key="i">
          <b-image class="image" :src="getImgUrl(i)"></b-image>
        </b-carousel-item>
      </b-carousel>
    </div>
    <p class="disclaimer">
      <i class="mdi mdi-information-outline"></i>
      Aligned with EU Directive 2022/2464 and the ESRS framework by EFRAG.
      GaiaTool assists with reporting; formal compliance requires external assurance.
    </p>

  </div>
</template>

<script>
export default {
  name: 'Welcome',
  data() {
    return {
      images: [0, 1, 2]
    };
  },
  methods: {
    // getImgUrl(value) {
    //   return `https://picsum.photos/id/43${value}/1230/500`
    // }
    getImgUrl(index) {
      return require(`/src/assets/images/image${index}.png`);
    }
  }
}
</script>

<style scoped>

.welcome-page {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.badge-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}
.csrd-badge {
  background: #003399; 
  color: #FFCC00;     
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.csrd-badge .stars { letter-spacing: -2px; font-size: 0.7rem; }
.csrd-badge .badge-text { color: #ffffff; }
.ai-badge {
  background: #98A869;
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.presentation {
  margin-top: 24px;
  margin-bottom: 40px;
  margin-left: 300px;
  margin-right: 300px;
  font-size: 1.2rem;
  text-align: center;
}
.main-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: #2c3e50;
}
.disclaimer {
  max-width: 900px;
  margin: 30px auto 40px;
  padding: 16px 20px 0;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}
.disclaimer .mdi { color: #98A869; margin-right: 6px; }

.is-active .al img {
  filter: grayscale(0%);
}

/* Mirar a ver como se puede hacer el margen responsiveee */
@media only screen and (max-width: 1500px) {
  .presentation {
    margin-left: 200px;
    margin-right: 200px;
    margin-top: 20px;
    margin-bottom: 30px;
  }
}

@media only screen and (max-width: 1280px) {
  .presentation {
    margin-top: 16px;
    margin-bottom: 30px;
  }
}

@media only screen and (max-width: 985px) {
  .presentation {
    margin-left: 100px;
    margin-right: 100px;
    margin-top: 20px;
    margin-bottom: 30px;
  }
}


@media only screen and (max-width: 670px) {
  .header {
    grid-template-columns: auto;
    grid-template-rows: auto auto;
  }
  .header-right {
    justify-self: center;
  }
  .header-left {
    justify-self: center;
  }
  .button-right {
    margin-top: 20px;
  }
  .presentation {
    margin-top: 30px;
    margin-left: 50px;
    margin-right: 50px;
    margin-bottom: 40px;
  }
  .main-title { font-size: 1.4rem; }
}

@media only screen and (max-width: 465px) {
  .presentation {
    margin-bottom: 30px;
    margin-top: 30px;
    font-size: 1.0rem;
  }
  .carousel {
    margin-bottom: 20px;
    margin-top: 20px;
  }
  .main-title { font-size: 1.2rem; }
}
</style>
