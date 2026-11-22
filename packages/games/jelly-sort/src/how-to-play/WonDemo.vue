<script setup lang="ts">
import { solvedBoard } from '../common/board/board';
import TrayGlass from '../play/components/TrayGlass.vue';
import { demoTrayLabel } from './tray-label';

// Static picture of a won board: every glass full of one color, one glass empty.
const board = solvedBoard(2, 4, 1);
</script>

<template>
  <div class="won-demo">
    <TrayGlass
      v-for="(layers, index) in board.trays"
      :key="index"
      :layers="layers"
      :capacity="board.capacity"
      :selected="false"
      :label="demoTrayLabel(layers, index, board.capacity)"
      disabled
    />
  </div>
</template>

<style scoped>
.won-demo {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: var(--spacing-md);
  padding-top: 0.5rem;
}
</style>
