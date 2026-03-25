import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';

interface Topic {
  id: string;
  title: string;
  question: string;
  image: string;
  gradient: string;
  tags: string[];
  ageRange: [number, number];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const allTopics: Topic[] = [
  {
    id: 'space',
    title: 'Space & Stars',
    question: 'Why do stars twinkle?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361354544_0094eeb4.jpg',
    gradient: 'from-indigo-600 to-purple-700',
    tags: ['Science', 'Physics', 'Astronomy'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'ocean',
    title: 'Ocean Life',
    question: 'How do octopuses change color?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361394752_f8075c7b.png',
    gradient: 'from-cyan-500 to-blue-600',
    tags: ['Biology', 'Marine Science', 'Nature'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'egypt',
    title: 'Ancient Egypt',
    question: 'How did they build the pyramids without machines?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361413696_020d5cda.jpg',
    gradient: 'from-amber-500 to-orange-600',
    tags: ['History', 'Engineering', 'Culture'],
    ageRange: [8, 18],
    difficulty: 'intermediate',
  },
  {
    id: 'robotics',
    title: 'Robotics & AI',
    question: 'Can robots actually think for themselves?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361433485_2e6a04f2.jpg',
    gradient: 'from-blue-500 to-indigo-600',
    tags: ['Technology', 'Engineering', 'Computer Science'],
    ageRange: [8, 18],
    difficulty: 'intermediate',
  },
  {
    id: 'cooking',
    title: 'Cooking Science',
    question: 'Why does popcorn pop?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361461048_129ca7cc.jpg',
    gradient: 'from-rose-500 to-pink-600',
    tags: ['Chemistry', 'Science', 'Life Skills'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'dinosaurs',
    title: 'Dinosaurs',
    question: 'What really killed the dinosaurs?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361480134_bd356bd9.jpg',
    gradient: 'from-green-600 to-emerald-700',
    tags: ['Paleontology', 'Science', 'History'],
    ageRange: [6, 14],
    difficulty: 'beginner',
  },
  {
    id: 'volcanoes',
    title: 'Volcanoes',
    question: 'What makes a volcano suddenly erupt?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361508806_157734af.jpg',
    gradient: 'from-red-600 to-orange-700',
    tags: ['Geology', 'Earth Science', 'Nature'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'brain',
    title: 'The Human Brain',
    question: 'How does your brain create dreams?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361527876_5092550e.jpg',
    gradient: 'from-violet-600 to-purple-700',
    tags: ['Neuroscience', 'Biology', 'Psychology'],
    ageRange: [10, 18],
    difficulty: 'intermediate',
  },
  {
    id: 'music',
    title: 'Music & Sound',
    question: 'Why do some songs get stuck in your head?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361556030_3a5c9eba.jpg',
    gradient: 'from-fuchsia-500 to-pink-600',
    tags: ['Physics', 'Arts', 'Psychology'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'weather',
    title: 'Wild Weather',
    question: 'How does lightning know where to strike?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361580568_b350c9b8.jpg',
    gradient: 'from-slate-600 to-blue-700',
    tags: ['Meteorology', 'Physics', 'Earth Science'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
  {
    id: 'minecraft',
    title: 'Minecraft Physics',
    question: 'Could you actually build a Minecraft world in real life?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361599656_83e7ff94.jpg',
    gradient: 'from-green-500 to-lime-600',
    tags: ['Physics', 'Math', 'Computer Science'],
    ageRange: [6, 16],
    difficulty: 'beginner',
  },
  {
    id: 'math-patterns',
    title: 'Math in Nature',
    question: 'Why do sunflowers follow the Fibonacci sequence?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361620631_efbee656.jpg',
    gradient: 'from-yellow-500 to-amber-600',
    tags: ['Math', 'Nature', 'Patterns'],
    ageRange: [8, 18],
    difficulty: 'intermediate',
  },
  {
    id: 'rome',
    title: 'Ancient Rome',
    question: 'How did gladiators actually fight?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361647523_f7e0b05c.jpg',
    gradient: 'from-stone-600 to-amber-700',
    tags: ['History', 'Culture', 'Social Studies'],
    ageRange: [10, 18],
    difficulty: 'intermediate',
  },
  {
    id: 'art',
    title: 'Art & Creativity',
    question: 'Why do optical illusions trick your brain?',
    image: 'https://d64gsuwffb70l.cloudfront.net/69c189586866362256234858_1774361673479_47633be2.jpg',
    gradient: 'from-pink-500 to-rose-600',
    tags: ['Arts', 'Psychology', 'Design'],
    ageRange: [6, 18],
    difficulty: 'beginner',
  },
];

const ExplorePage: React.FC = () => {
  const { setCurrentPage, studentProfile } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const categories = useMemo(() => {
    const allTags = new Set<string>();
    allTopics.forEach(t => t.tags.forEach(tag => allTags.add(tag)));
    return ['All', ...Array.from(allTags).sort()];
  }, []);

  // Filter topics by age, category, and search
  const filteredTopics = useMemo(() => {
    const age = studentProfile.age || 12;
    return allTopics.filter(topic => {
      const ageMatch = age >= topic.ageRange[0] && age <= topic.ageRange[1];
      const categoryMatch = selectedCategory === 'All' || topic.tags.includes(selectedCategory);
      const searchMatch = !searchQuery || 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return ageMatch && categoryMatch && searchMatch;
    });
  }, [studentProfile.age, selectedCategory, searchQuery]);

  const handleTopicClick = (topic: Topic) => {
    // Navigate to chat with the topic question pre-loaded
    setCurrentPage('chat');
    window.scrollTo({ top: 0 });
    // Store the topic in sessionStorage so AIChatPage can pick it up
    sessionStorage.setItem('explore_topic', JSON.stringify({
      title: topic.title,
      question: topic.question,
    }));
  };

  const handleSurpriseMe = () => {
    const randomTopic = filteredTopics[Math.floor(Math.random() * filteredTopics.length)];
    if (randomTopic) {
      handleTopicClick(randomTopic);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal via-teal-dark to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => { setCurrentPage('student'); window.scrollTo({ top: 0 }); }}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-body text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Dashboard
            </button>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span className="font-body text-sm font-semibold">Discover Something Amazing</span>
            </div>
            <h1 className="font-heading font-bold text-3xl lg:text-5xl mb-3">
              What Are You Curious About?
            </h1>
            <p className="font-body text-white/70 text-lg mb-8">
              Pick a topic that fascinates you, and let's go on an adventure together. Every topic secretly teaches you real-world skills!
            </p>

            {/* Search bar */}
            <div className="relative max-w-lg mx-auto mb-6">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/15 border border-white/20 font-body text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all"
              />
            </div>

            {/* Surprise Me button */}
            <button
              onClick={handleSurpriseMe}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-dark font-body font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
              Surprise Me!
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-teal text-white shadow-md'
                  : 'bg-white text-charcoal/60 hover:bg-teal-50 hover:text-teal border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Topics Grid */}
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3 className="font-heading font-bold text-charcoal mb-2">No topics found</h3>
            <p className="font-body text-sm text-charcoal/40">Try a different search or category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTopics.map((topic, index) => {
              const isLarge = index === 0 || index === 5;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  className={`group relative overflow-hidden rounded-2xl text-left transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-teal/30 ${
                    isLarge ? 'sm:col-span-2 sm:row-span-2' : ''
                  }`}
                  style={{ minHeight: isLarge ? '360px' : '220px' }}
                >
                  {/* Background image */}
                  <img
                    src={topic.image}
                    alt={topic.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${topic.gradient} opacity-60 group-hover:opacity-70 transition-opacity`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-5 lg:p-6 text-white">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {topic.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full font-body text-[10px] font-semibold uppercase tracking-wider">
                          {tag}
                        </span>
                      ))}
                      {topic.difficulty !== 'beginner' && (
                        <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-semibold uppercase tracking-wider ${
                          topic.difficulty === 'advanced' ? 'bg-red-500/30' : 'bg-amber-500/30'
                        }`}>
                          {topic.difficulty}
                        </span>
                      )}
                    </div>

                    <h3 className={`font-heading font-bold text-white mb-1 ${isLarge ? 'text-2xl lg:text-3xl' : 'text-lg'}`}>
                      {topic.title}
                    </h3>
                    <p className={`font-body text-white/80 ${isLarge ? 'text-base' : 'text-sm'}`}>
                      {topic.question}
                    </p>

                    {/* Hover CTA */}
                    <div className={`mt-3 flex items-center gap-2 transition-all duration-300 ${
                      hoveredTopic === topic.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}>
                      <span className="px-4 py-2 bg-white text-charcoal font-body font-bold text-xs rounded-lg shadow-lg">
                        Start Exploring
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-teal-50 to-indigo-50 rounded-2xl p-8 border border-teal/10">
          <h3 className="font-heading font-bold text-xl text-charcoal mb-2">Don't see what you're looking for?</h3>
          <p className="font-body text-sm text-charcoal/50 mb-4">
            You can ask Mentor about literally anything. Just type your question and start exploring!
          </p>
          <button
            onClick={() => { setCurrentPage('chat'); window.scrollTo({ top: 0 }); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal hover:bg-teal-dark text-white font-body font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Chat with Mentor
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
