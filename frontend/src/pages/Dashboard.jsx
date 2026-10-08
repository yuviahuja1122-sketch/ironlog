import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, sorenessApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Utensils, 
  Scale, 
  Sparkles, 
  ChevronRight, 
  AlertTriangle, 
  Dumbbell, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Minus,
  RefreshCw,
  Plus
} from 'lucide-react';

const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'glutes', 'calves'
];

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Soreness Modal State
  const [soreModalOpen, setSoreModalOpen] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState(['chest']);
  const [severity, setSeverity] = useState(3);
  const [replanLoading, setReplanLoading] = useState(false);
  const [replanProposal, setReplanProposal] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard', err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleMuscle = (muscle) => {
    if (selectedMuscles.includes(muscle)) {
      setSelectedMuscles(selectedMuscles.filter(m => m !== muscle));
    } else {
      setSelectedMuscles([...selectedMuscles, muscle]);
    }
  };

  const handleRequestReplan = async () => {
    if (selectedMuscles.length === 0) return;
    try {
      setReplanLoading(true);
      // Log soreness
      await sorenessApi.logSoreness(selectedMuscles, severity);
      // Replan workout
      const res = await sorenessApi.replan(selectedMuscles, severity);
      setReplanProposal(res);
    } catch (err) {
      console.error('Replanning failed', err);
      alert('AI replanning failed. Please try again.');
    } finally {
      setReplanLoading(false);
    }
  };

  const handleAcceptReplan = () => {
    setSoreModalOpen(false);
    // Navigate to workout logger with the replanned exercises preloaded
    navigate('/workout', { state: { replannedWorkout: replanProposal } });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-zinc-900 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-zinc-900 rounded-2xl" />
          <div className="h-24 bg-zinc-900 rounded-2xl" />
          <div className="h-24 bg-zinc-900 rounded-2xl" />
          <div className="h-24 bg-zinc-900 rounded-2xl" />
        </div>
        <div className="h-56 bg-zinc-900 rounded-3xl" />
      </div>
    );
  }

  const todayPlan = data?.today_plan;
  const isRestDay = todayPlan?.is_rest_day || !todayPlan?.exercises || todayPlan?.exercises?.length === 0;

  const targetCals = data?.target_calories || profile?.target_calories || 2200;
  const todayCals = data?.today_calories || 0;
  const calPercent = Math.min(100, Math.round((todayCals / targetCals) * 100));

  const targetProt = data?.target_protein || profile?.target_protein || 160;
  const todayProt = data?.today_protein || 0;
  const protPercent = Math.min(100, Math.round((todayProt / targetProt) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome & Motivational AI Quote */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-blue-950/30 border border-zinc-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Daily Briefing
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-100">
              Welcome back, {profile?.name || 'Athlete'}!
            </h1>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl italic font-serif pt-1">
              "{data?.message_of_the_day || 'Consistency is the engine of transformation. Keep pushing!'}"
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/coach">
              <Button variant="accent" size="sm" className="gap-2 text-xs">
                <Sparkles size={15} /> Talk to Coach
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Streak */}
        <Card className="flex flex-col justify-between p-4 bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Streak</span>
            <Flame className="text-orange-500" size={18} />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-100">{data?.streak || 0} <span className="text-xs font-normal text-zinc-400">days</span></div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Consecutive logged</p>
          </div>
        </Card>

        {/* Weekly Completed */}
        <Card className="flex flex-col justify-between p-4 bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">This Week</span>
            <Calendar className="text-emerald-500" size={18} />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-100">{data?.week_workouts || 0} <span className="text-xs font-normal text-zinc-400">sessions</span></div>
            <p className="text-[11px] text-emerald-400 mt-0.5">On track with split</p>
          </div>
        </Card>

        {/* PRs */}
        <Card className="flex flex-col justify-between p-4 bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">New PRs</span>
            <Trophy className="text-yellow-500" size={18} />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-zinc-100">{data?.prs_this_week?.length || 0}</div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Records this week</p>
          </div>
        </Card>

        {/* Weight */}
        <Card className="flex flex-col justify-between p-4 bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Weight</span>
            <Scale className="text-blue-400" size={18} />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-zinc-100">{data?.latest_weight ? `${data.latest_weight}` : '--'} <span className="text-xs font-normal text-zinc-400">kg</span></div>
            {data?.weight_trend === 'down' && <TrendingDown size={18} className="text-emerald-400" />}
            {data?.weight_trend === 'up' && <TrendingUp size={18} className="text-orange-400" />}
            {data?.weight_trend === 'stable' && <Minus size={18} className="text-zinc-500" />}
          </div>
        </Card>
      </div>

      {/* Main Section: Today's Workout + Soreness Handler */}
      <Card 
        title="Today's Training" 
        subtitle={todayPlan?.label || (isRestDay ? 'Scheduled Rest Day' : 'Active Plan')}
        action={
          <Link to="/plan" className="text-xs text-zinc-400 hover:text-emerald-400 font-medium flex items-center gap-1">
            View Split <ChevronRight size={14} />
          </Link>
        }
      >
        {isRestDay ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-200">Rest & Recovery Day</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
                Your muscles grow when resting. Focus on hydration, getting 8 hours of sleep, and hitting your protein goal!
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/workout">
                <Button variant="secondary" size="sm">Log Extra Session</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-2.5 mt-2">
              {todayPlan?.exercises?.map((ex, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">{ex.exercise_name}</h4>
                      <p className="text-[11px] text-zinc-500 capitalize">{ex.body_part}</p>
                    </div>
                  </div>
                  <Badge variant="default" size="xs">
                    {ex.target_sets} sets × {ex.target_reps}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-zinc-800/80">
              <Link to="/workout" className="flex-1">
                <Button className="w-full h-11 text-sm font-bold gap-2">
                  <Dumbbell size={18} /> Start & Log Workout
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                onClick={() => {
                  setReplanProposal(null);
                  setSoreModalOpen(true);
                }}
                className="gap-2 text-sm border-zinc-700"
              >
                <AlertTriangle size={16} className="text-yellow-500" />
                I'm Sore (Replan with AI)
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/workout" className="group">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-850 transition-all text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Dumbbell size={20} />
            </div>
            <div className="text-xs font-bold text-zinc-200">Log Workout</div>
          </div>
        </Link>

        <Link to="/nutrition" className="group">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-850 transition-all text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Utensils size={20} />
            </div>
            <div className="text-xs font-bold text-zinc-200">Log Food / AI</div>
          </div>
        </Link>

        <Link to="/body" className="group">
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-850 transition-all text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <Scale size={20} />
            </div>
            <div className="text-xs font-bold text-zinc-200">Body & Photos</div>
          </div>
        </Link>
      </div>

      {/* Nutrition Summary Bar */}
      <Card 
        title="Today's Nutrition" 
        subtitle="Tracking toward your target macros"
        action={
          <Link to="/nutrition" className="text-xs text-zinc-400 hover:text-emerald-400 font-medium flex items-center gap-1">
            Details <ChevronRight size={14} />
          </Link>
        }
      >
        <div className="grid sm:grid-cols-2 gap-6 mt-3">
          {/* Calories bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Calories</span>
              <span className="text-zinc-400">
                <span className="text-emerald-400 font-bold">{todayCals}</span> / {targetCals} kcal
              </span>
            </div>
            <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${calPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 flex justify-between">
              <span>{calPercent}% consumed</span>
              <span>{Math.max(0, targetCals - todayCals)} kcal remaining</span>
            </div>
          </div>

          {/* Protein bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-300">Protein Target</span>
              <span className="text-zinc-400">
                <span className="text-blue-400 font-bold">{todayProt}</span> / {targetProt} g
              </span>
            </div>
            <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${protPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-zinc-500 flex justify-between">
              <span>{protPercent}% target</span>
              <span>{Math.max(0, Math.round(targetProt - todayProt))}g remaining</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Soreness AI Replanning Modal */}
      <Modal
        isOpen={soreModalOpen}
        onClose={() => setSoreModalOpen(false)}
        title="Soreness-Aware AI Replanning"
        subtitle="Tell IronLog what is sore. We will swap exercises and rebalance your week."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          {!replanProposal ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Which muscle groups are sore today?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((muscle) => {
                    const isSelected = selectedMuscles.includes(muscle);
                    return (
                      <button
                        key={muscle}
                        type="button"
                        onClick={() => handleToggleMuscle(muscle)}
                        className={`capitalize px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/10'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {muscle} {isSelected && '✕'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-zinc-300">Soreness Severity (1 to 5)</span>
                  <span className="text-yellow-400 font-bold">{severity} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Mild stiffness</span>
                  <span>Moderate ache</span>
                  <span>Severe (Cannot contract)</span>
                </div>
              </div>

              <Button
                onClick={handleRequestReplan}
                className="w-full h-12 text-sm font-bold gap-2"
                loading={replanLoading}
                disabled={selectedMuscles.length === 0}
              >
                <Sparkles size={16} /> Rebuild Today's Workout with AI
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                  <CheckCircle2 size={16} /> AI Proposal Ready
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {replanProposal.reason || 'Sore muscle groups bypassed. Replacement exercises selected based on undertrained volume.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Proposed Substitute Exercises:
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {replanProposal.exercises?.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                      <div>
                        <span className="font-bold text-zinc-200">{ex.exercise_name}</span>
                        <span className="ml-2 text-zinc-500 capitalize">({ex.body_part})</span>
                      </div>
                      <Badge variant="info" size="xs">
                        {ex.sets} sets × {ex.reps} reps
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAcceptReplan}
                  className="flex-1 h-11 text-xs font-bold"
                >
                  Accept & Log This Workout
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setReplanProposal(null)}
                  className="h-11 text-xs"
                >
                  Change Soreness
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
