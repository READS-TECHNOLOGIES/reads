import React from 'react';
import { BookOpen, TrendingUp, Award, ArrowRight, CheckCircle } from 'lucide-react';
import readsLogo from '../../../assets/reads-logo.png';

const WelcomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-navy via-dark-card to-primary-navy-dark overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={readsLogo} alt="$READS Logo" className="w-10 h-10 rounded-lg object-contain" />
            <span className="text-2xl font-bold text-card-light">$READS</span>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 font-bold hover:bg-yellow-500/30 transition-colors border border-yellow-500/40"
          >
            Sign In
          </button>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block px-4 py-2 bg-cyan/20 rounded-full border border-cyan/40">
                <span className="text-cyan text-sm font-semibold">🎓 Learn • Earn • Grow</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 leading-tight">
                Master Your Exams,
                <span className="text-card-light"> Earn Rewards</span>
              </h1>
              
              <p className="text-xl text-card-muted leading-relaxed">
                Study for JAMB, WAEC, IELTS & SAT while earning $READS tokens. 
                The more you learn, the more you earn!
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 rounded-xl bg-cyan text-primary-navy font-bold hover:bg-cyan-dark transition-all shadow-lg shadow-cyan/50 flex items-center gap-2 text-lg"
                >
                  Get Started Free <ArrowRight size={20} />
                </button>
                <button
                  className="px-8 py-4 rounded-xl bg-transparent text-card-light font-bold hover:bg-white/10 transition-colors border-2 border-card-light/30"
                >
                  Learn More
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-yellow-400">10K+</div>
                  <div className="text-card-muted text-sm">Active Learners</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan">50K+</div>
                  <div className="text-card-muted text-sm">Lessons Completed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange">1M+</div>
                  <div className="text-card-muted text-sm">Tokens Earned</div>
                </div>
              </div>
            </div>

            {/* Right Content - Student Images */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Student Image 1 */}
                <div className="rounded-2xl overflow-hidden border-4 border-cyan/30 shadow-2xl transform hover:scale-105 transition-transform">
                  <img 
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=400&fit=crop" 
                    alt="Students studying together" 
                    className="w-full h-64 object-cover"
                  />
                </div>
                
                {/* Student Image 2 */}
                <div className="rounded-2xl overflow-hidden border-4 border-yellow-400/30 shadow-2xl transform hover:scale-105 transition-transform mt-8">
                  <img 
                    src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=400&fit=crop" 
                    alt="Student celebrating success" 
                    className="w-full h-64 object-cover"
                  />
                </div>
                
                {/* Student Image 3 */}
                <div className="rounded-2xl overflow-hidden border-4 border-orange/30 shadow-2xl transform hover:scale-105 transition-transform -mt-4">
                  <img 
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=400&fit=crop" 
                    alt="Group study session" 
                    className="w-full h-64 object-cover"
                  />
                </div>
                
                {/* Student Image 4 */}
                <div className="rounded-2xl overflow-hidden border-4 border-cyan/30 shadow-2xl transform hover:scale-105 transition-transform">
                  <img 
                    src="https://images.unsplash.com/photo-1529390079861-591de354faf5?w=400&h=400&fit=crop" 
                    alt="Student using laptop" 
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-primary-navy border-4 border-yellow-400 rounded-2xl p-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Award className="text-primary-navy" size={24} />
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold">Earn While You Learn</div>
                    <div className="text-card-muted text-sm">100 tokens per quiz passed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-dark-card py-20 border-t border-cyan/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-yellow-400 mb-4">Why Choose $READS?</h2>
            <p className="text-card-muted text-lg">Everything you need to ace your exams and earn rewards</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-primary-navy rounded-2xl p-8 border border-cyan/20 hover:border-cyan/50 transition-all">
              <div className="w-16 h-16 bg-cyan/20 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="text-cyan" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Quality Content</h3>
              <p className="text-card-muted leading-relaxed">
                Access comprehensive study materials for JAMB, WAEC, IELTS, and SAT prepared by expert educators.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-primary-navy rounded-2xl p-8 border border-yellow-400/20 hover:border-yellow-400/50 transition-all">
              <div className="w-16 h-16 bg-yellow-400/20 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Earn Tokens</h3>
              <p className="text-card-muted leading-relaxed">
                Complete lessons and pass quizzes to earn $READS tokens. Your knowledge has real value!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-primary-navy rounded-2xl p-8 border border-orange/20 hover:border-orange/50 transition-all">
              <div className="w-16 h-16 bg-orange/20 rounded-xl flex items-center justify-center mb-6">
                <Award className="text-orange" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Track Progress</h3>
              <p className="text-card-muted leading-relaxed">
                Monitor your learning journey with detailed analytics and performance tracking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-yellow-400 mb-4">How It Works</h2>
          <p className="text-card-muted text-lg">Start earning in 3 simple steps</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-cyan rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-primary-navy">
              1
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Sign Up Free</h3>
            <p className="text-card-muted">Create your account and get 50 welcome tokens instantly</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-primary-navy">
              2
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Study & Practice</h3>
            <p className="text-card-muted">Access lessons and take practice quizzes on your schedule</p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-orange rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-primary-navy">
              3
            </div>
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Earn Rewards</h3>
            <p className="text-card-muted">Pass quizzes and earn 100 tokens for each success</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-cyan via-cyan-dark to-cyan py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-6">
            Ready to Start Learning?
          </h2>
          <p className="text-card-light text-xl mb-8">
            Join thousands of students earning while they study
          </p>
          <button
            onClick={onGetStarted}
            className="px-12 py-5 rounded-xl bg-primary-navy text-yellow-400 font-bold hover:bg-primary-navy-dark transition-all shadow-2xl text-lg"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-navy-dark py-12 border-t border-cyan/20">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={readsLogo} alt="$READS Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-bold text-card-light">$READS</span>
          </div>
          <p className="text-card-muted text-sm">© 2025 READS Technologies. All rights reserved.</p>
          <p className="text-card-muted text-sm mt-2">Learn to Earn • Empower Your Future</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;