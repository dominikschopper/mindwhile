export const en = {
  'game.name': 'Spillit',
  'challenge.a': '6×6 · 4 colors',
  'challenge.b': '10×10 · 5 colors',
  'challenge.c': '14×14 · 6 colors',
  'counter.moves': 'Moves {moves}',
  'counter.par': 'Par {par}',
  'board.summary': 'Board {size} by {size}, {regionCount} cells in your region',
  'color.0': 'Orange',
  'color.1': 'Sky blue',
  'color.2': 'Bluish green',
  'color.3': 'Yellow',
  'color.4': 'Blue',
  'color.5': 'Vermillion',
  'mark.0': 'infinity',
  'mark.1': 'alert',
  'mark.2': 'pulse',
  'mark.3': 'plane',
  'mark.4': 'sun and moon',
  'mark.5': 'apple',
  'colorButton.label': '{color}, {mark}',
  'round.solved': 'Solved!',
  'score.summary': '{points} points · {detail}',
  'score.onPar': 'On par',
  'score.underPar': {
    one: '{count} move under par',
    other: '{count} moves under par',
  },
  'score.overPar': {
    one: '{count} move over par',
    other: '{count} moves over par',
  },
  'howTo.rules.goal':
    'Your goal is to turn the whole board into a single color. There is no move limit.',
  'howTo.rules.pick':
    'Pick a color. Your region, which starts in the top left corner, takes that color.',
  'howTo.rules.swallow':
    'The region swallows every neighbor cell that already has the new color and keeps growing.',
  'howTo.more': 'More',
  'howTo.less': 'Less',
  'howTo.example.heading': 'Example',
  'howTo.example.before': 'Before: the region is the single top left cell.',
  'howTo.example.after': 'After picking {mark}: the region took three more cells.',
  'howTo.example.row': 'Row {row}: {marks}',
  'howTo.counter.heading': 'Moves and par',
  'howTo.counter.moves': 'The move counter shows how many colors you have picked.',
  'howTo.counter.par':
    'Par is the number of moves a simple greedy method needs. It picks the color that swallows the most new cells in every step.',
  'howTo.counter.approximation':
    'Par is an approximation, not the best possible solution. You can beat it.',
  'howTo.score.heading': 'Your score',
  'howTo.score.points':
    'Your score is points: the base value of the challenge times par divided by your moves, rounded down to tens. Par gives the base value, fewer moves give more points, more moves fewer.',
  'howTo.score.negative':
    'You can beat par. Par comes from a simple greedy method, so fewer moves than par give more than the base points.',
  'howTo.marks.heading': 'Marks',
  'howTo.marks.text':
    'Every color has a fixed mark in its cells and on its button, so colors never depend on sight alone. The marks are small icons, in this order: infinity, alert, pulse, plane, sun and moon, apple. A challenge uses as many marks as it has colors.',
} as const
