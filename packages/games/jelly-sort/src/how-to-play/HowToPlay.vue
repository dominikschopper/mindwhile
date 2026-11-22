<script setup lang="ts">
import { HowToExample, HowToHeading, HowToParagraph } from '@mindwhile/game-kit';
import '../common/styles/tokens.css';
import { t } from '../texts';
import PourDemo from './PourDemo.vue';
import WonDemo from './WonDemo.vue';
</script>

<template>
  <div class="how-to-play">
    <HowToHeading>{{ t('howTo.move.heading') }}</HowToHeading>
    <HowToExample>
      <PourDemo />
    </HowToExample>
    <HowToParagraph>{{ t('howTo.move.pick') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.move.rules') }}</HowToParagraph>

    <HowToHeading>{{ t('howTo.goal.heading') }}</HowToHeading>
    <HowToExample :caption="t('howTo.goal.caption')">
      <WonDemo />
    </HowToExample>

    <HowToHeading>{{ t('howTo.score.heading') }}</HowToHeading>
    <HowToParagraph>{{ t('howTo.score.moves') }}</HowToParagraph>
    <HowToParagraph>{{ t('howTo.score.par') }}</HowToParagraph>
  </div>
</template>
