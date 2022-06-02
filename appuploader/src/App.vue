<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App',
  components: {

  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}

:root {
    background:radial-gradient(ellipse at top left,rgba(255, 255, 255, 1) 40%,rgba(229, 229, 229, .9) 100%);
  	height: 100vh;
  	width: 100vw;
    /* padding: 10px 10px; */
}
</style>
