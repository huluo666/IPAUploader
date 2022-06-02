<template>
  <div class="main">
    <div class="item">
      <div class="name">Name:</div>
      <div class="value">{{ IPAInfo.CFBundleDisplayName }}</div>
    </div>
    <div class="item">
      <div class="name">BundleId:</div>
      <div class="value">{{ IPAInfo.CFBundleIdentifier }}</div>
    </div>
    <div class="item">
      <div class="name">Version(Build):</div>
      <div class="value">{{ IPAInfo.CFBundleVersion }} ({{IPAInfo.CFBundleShortVersionString}})</div>
    </div>
    <div class="item">
      <div class="name">MinimumOSVersion:</div>
      <div class="value">{{ IPAInfo.MinimumOSVersion }}</div>
    </div>
  </div>
</template>

<script>
  export default {
	  name: 'AppInfoPage',
    data () {
      return {
        name: "AppInfoPage",
      }
    },
	 props:['IPAInfo']
  }
</script>

<style>
  .main {
    /* background-color: aquamarine; */
    margin-top: -20px;
    margin-left: 10px;
  }

  .smallImage {
	  margin-left: 10px;
  }
  .items { margin-top: 5px; }

  .item {
    display: flex;
    margin-bottom: 6px;
  }

  .item .name {
    color: #35495E;
    margin-right: 6px;
  }

  .item .value {
    color: #35495e;
    font-weight: bold;
  }
</style>
