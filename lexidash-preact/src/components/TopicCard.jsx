export default function TopicCard({ topic }) {
  return (
    <div className="w-[72px] h-[100px] sm:w-32 sm:h-20 flex items-center justify-center bg-yellow-300 text-sm sm:text-xl font-bold border-2 sm:border-4 border-yellow-600 rounded-xl shadow-md text-center p-1 sm:p-2">
      {topic}
    </div>
  );
}