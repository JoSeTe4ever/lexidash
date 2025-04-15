export default function TopicCard({ topic }) {
  return (
    <div className="w-32 h-20 flex items-center justify-center bg-yellow-300 text-xl font-bold border-4 border-yellow-600 rounded-xl shadow-md text-center p-2">
      {topic}
    </div>
  );
}