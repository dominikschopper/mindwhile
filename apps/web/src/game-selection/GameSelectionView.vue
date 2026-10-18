<script setup lang="ts">
import { discoverGames } from './discoverGames'

const games = discoverGames()
</script>

<template>
  <main>
    <ul>
      <li v-for="game in games" :key="game.id">{{ game.id }}</li>
    </ul>
  </main>
</template>
