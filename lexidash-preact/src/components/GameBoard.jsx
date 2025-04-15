import LetterCard from './LetterCard';
import TopicCard from './TopicCard';

export default function GameBoard({ letters, topic, usedIndexes }) {
  const grid = [
    letters[0], letters[1], letters[2],
    letters[3], null,        letters[4],
    letters[5], letters[6], letters[7],
  ];

  return (
    <div className="grid grid-cols-3 gap-4 justify-center items-center mt-8">
      {grid.map((letter, idx) =>
        idx === 4 ? (
          <TopicCard key="topic" topic={topic} />
        ) : letter ? (
          <LetterCard key={idx} letter={letter} animateOut={usedIndexes.includes(idx)} />
        ) : (
          <div key={idx} className="w-16 h-20" />
        )
      )}
    </div>
  );
}