import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, ArrowRight, Sparkles } from 'lucide-react';
import readsLogo from '../../../assets/reads-logo.png';

const WelcomePage = ({ onGetStarted }) => {
  const [currentImageSet, setCurrentImageSet] = useState(0);

  const imageSets = [
    [
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=400&h=400&fit=crop"
    ],
    [
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-503676260728-1c00da094a0b?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop"
    ],
    [
      "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=400&fit=crop",
      "https://images.unsplash.com/photo-1516534775068-ba3e7458af70?w=400&h=400&fit=crop"
    ]
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageSet((prev) => (prev + 1) % imageSets.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-green-50/30 to-orange-50/30">
      {/* ── Hero Section ── */}
      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <img src={readsLogo} alt="$READS" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-xl font-black text-gray-900 tracking-tight">$READS</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-xl bg-[#16a34a] text-white text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
          >
            Sign In
          </button>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Sparkles size={14} className="text-[#16a34a]" />
                <span className="text-[#16a34a] text-sm font-bold">Learn • Earn • Excel</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.1]">
                Master Your Exams,{' '}
                <span className="text-[#16a34a]">Earn Rewards</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed">
                Study for JAMB, WAEC, IELTS & SAT while earning $READS tokens. 
                The more you learn, the more you earn!
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-[#16a34a] text-white font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-base"
                >
                  Get Started Free
                  <ArrowRight size={18} />
                </button>
                <button
                  className="px-8 py-4 rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all border-2 border-gray-200"
                  onClick={() => window.open('https://readstechnet.vercel.app', '_blank')}
                >
                  Learn More
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-6">
                <div>
                  <div className="text-3xl font-black text-[#16a34a]">10K+</div>
                  <div className="text-gray-500 text-sm">Active Learners</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#f97316]">50K+</div>
                  <div className="text-gray-500 text-sm">Lessons Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-blue-600">1M+</div>
                  <div className="text-gray-500 text-sm">Tokens Earned</div>
                </div>
              </div>
            </div>

            {/* Right Content - Student Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((idx) => {
                  const animations = [
                    'animate-slide-in-left',
                    'animate-slide-in-right',
                    'animate-fade-in',
                    'animate-slide-in-bottom'
                  ];
                  const borders = [
                    'border-[#16a34a]',
                    'border-[#f97316]',
                    'border-blue-500',
                    'border-[#16a34a]'
                  ];
                  const spacing = idx === 1 ? 'mt-8' : idx === 2 ? '-mt-4' : '';

                  return (
                    <div
                      key={`img${idx}-${currentImageSet}`}
                      className={`rounded-2xl overflow-hidden border-4 ${borders[idx]} shadow-xl ${spacing} ${animations[idx]}`}
                    >
                      <img
                        src={imageSets[currentImageSet][idx]}
                        alt="Students learning"
                        className="w-full h-64 object-cover transform hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white border-4 border-[#f97316] rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="text-white" size={22} />
                  </div>
                  <div>
                    <div className="text-[#f97316] font-bold text-sm">Earn While You Learn</div>
                    <div className="text-gray-500 text-xs">100 tokens per quiz passed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features Section ── */}
      <div className="bg-white py-20 border-t border-gray-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-gray-900 mb-3">Why Choose $READS?</h2>
            <p className="text-gray-600 text-lg">Everything you need to ace your exams and earn rewards</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                iconBg: 'bg-green-50',
                iconColor: 'text-[#16a34a]',
                border: 'border-green-100',
                title: 'Quality Content',
                desc: 'Access comprehensive study materials for JAMB, WAEC, IELTS, and SAT prepared by expert educators.'
              },
              {
                icon: TrendingUp,
                iconBg: 'bg-orange-50',
                iconColor: 'text-[#f97316]',
                border: 'border-orange-100',
                title: 'Earn Tokens',
                desc: 'Complete lessons and pass quizzes to earn $READS tokens. Your knowledge has real value!'
              },
              {
                icon: Award,
                iconBg: 'bg-blue-50',
                iconColor: 'text-blue-600',
                border: 'border-blue-100',
                title: 'Track Progress',
                desc: 'Monitor your learning journey with detailed analytics and performance tracking.'
              }
            ].map(({ icon: Icon, iconBg, iconColor, border, title, desc }) => (
              <div
                key={title}
                className={`bg-white rounded-2xl p-8 border-2 ${border} hover:shadow-lg transition-all`}
              >
                <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center mb-5`}>
                  <Icon className={iconColor} size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── How It Works Section ── */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-600 text-lg">Start earning in 3 simple steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {[
            { num: 1, title: 'Sign Up Free', desc: 'Create your account and get 50 welcome tokens instantly', color: 'bg-[#16a34a]' },
            { num: 2, title: 'Study & Practice', desc: 'Access lessons and take practice quizzes on your schedule', color: 'bg-[#f97316]' },
            { num: 3, title: 'Earn Rewards', desc: 'Pass quizzes and earn 100 tokens for each success', color: 'bg-blue-600' }
          ].map(({ num, title, desc, color }) => (
            <div key={num} className="text-center">
              <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl font-black text-white shadow-lg`}>
                {num}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Section ── */}
      <div className="bg-gradient-to-br from-[#16a34a] to-green-700 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
            Ready to Start Learning?
          </h2>
          <p className="text-green-50 text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of students earning while they study
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 rounded-xl bg-white text-[#16a34a] font-bold hover:bg-green-50 transition-all shadow-2xl text-lg"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-12 border-t border-gray-800">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <img src={readsLogo} alt="$READS" className="w-7 h-7 rounded-lg object-contain" />
            <span className="text-lg font-black text-white">$READS</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 READS Technologies. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Learn to Earn • Empower Your Future</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
