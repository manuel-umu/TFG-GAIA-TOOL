<template>
  <div class="welcome-page">
    <div class="presentation">
      <span><strong>Gaia Tool</strong> is a tool with which you could perform and manage sustainability audits in order to
        evaluate the level of sustainability of the organization you want.</span>
    </div>
    <div class="carousel">
      <b-carousel>
        <b-carousel-item v-for="(item, i) in 5" :key="i">
          <b-image class="image" :src="getImgUrl(i)"></b-image>
        </b-carousel-item>
      </b-carousel>
    </div>
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

.presentation {
  /* Revisar paddings en todas las anchuras !!!!!! */
  margin-top: 50px;
  margin-bottom: 50px;
  margin-left: 300px;
  margin-right: 300px;
  font-size: 1.5rem;
  text-align: center;
}

.is-active .al img {
  filter: grayscale(0%);
}

/* Mirar a ver como se puede hacer el margen responsiveee */
@media only screen and (max-width: 1500px) {
  .presentation {
    margin-left: 200px;
    margin-right: 200px;
    margin-top: 40px;
    margin-bottom: 40px;
  }
}

@media only screen and (max-width: 1280px) {
  .presentation {
    margin-top: 30px;
    margin-bottom: 40px;
  }
}

@media only screen and (max-width: 985px) {
  .presentation {
    margin-left: 100px;
    margin-right: 100px;
    margin-top: 80px;
    margin-bottom: 40px;
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
    margin-top: 80px;
    margin-left: 50px;
    margin-right: 50px;
    margin-bottom: 60px;
  }
}

@media only screen and (max-width: 465px) {
  .presentation {
    margin-bottom: 0px;
    margin-top: 100px;
    font-size: 1.2rem;
    margin-bottom: 40px;
  }
  .carousel {
    margin-bottom: 20px;
    margin-top: 20px;
  }
}
</style>
