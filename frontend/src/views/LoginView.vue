<template>
  <div>
    <Login 
      v-if="this.$route.path == '/login'"
      @logged="$emit('logged')"
    />
    <Signup 
      v-else
      @registered="$emit('logged')"
    />
  </div>
</template>

<script>
import Login from "/src/components/Login.vue";
import Signup from "/src/components/Signup.vue";

export default {
  name: "LoginView",
  data() {
    return {};
  },
  components: {
    Login,
    Signup,
  },
};
</script>

<style lang="scss" scoped>

</style>
