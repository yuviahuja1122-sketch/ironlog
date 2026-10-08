import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { workoutApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, TextArea, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  Check, 
  Plus, 
  Trash2, 
  History, 
  Clock, 
  Trophy, 
  Copy, 
  CheckCircle2, 
  Sparkles,
  Dumbbell,
  ArrowLeft
} from 'lucide-react';

const DIFFICULTIES = ['easy', 'moderate', 'hard', 'failure'];
const BODY_PARTS = ['chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'glutes', 'calves', 'forearms'];

export default function WorkoutLogger() {
  const location = useLocation();
  const navigate = useNavigate();

  const [workoutName, setWorkoutName] = useState('Daily Training');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(55);
  const [planDayId, setPlanDayId] = useState(null);

  const [exercises, setExercises] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add Exercise Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [customExName, setCustomExName] = useState('');
  const [customExBodyPart, setCustomExBodyPart] = useState('chest');

  // Load today's plan or replanned workout
  useEffect(() => {
    const initWorkout = async () => {
      // Check if replanned workout was passed from dashboard
      if (location.state?.replannedWorkout) {
        const replanned = location.state.replannedWorkout;
        setWorkoutName('AI Replanned Workout');
        const exList = (replanned.exercises || []).map((ex, idx) => ({
          id: `ex-${Date.now()}-${idx}`,
          exercise_name: ex.exercise_name,
          body_part: ex.body_part,
          difficulty: 'moderate',
          notes: '',
          order: idx + 1,
          sets: Array.from({ length: ex.sets || 3 }, (_, sIdx) => ({
            id: `set-${Date.now()}-${idx}-${sIdx}`,
            set_number: sIdx + 1,
            weight_kg: 50,
            reps: ex.reps || 10,
            difficulty: 'moderate',
            completed: false
          }))
        }));
        setExercises(exList);
        fetchHistoriesFor(exList);
        return;
      }

      // Otherwise fetch today's plan from backend
      try {
        const todayPlan = await workoutApi.getTodayPlan();
        if (todayPlan && todayPlan.exercises && todayPlan.exercises.length > 0) {
          setWorkoutName(todayPlan.label || 'Today\'s Workout');
          setPlanDayId(todayPlan.plan_day_id);
          const exList = todayPlan.exercises.map((ex, idx) => ({
            id: `ex-${Date.now()}-${idx}`,
            exercise_name: ex.exercise_name,
            body_part: ex.body_part,
            difficulty: 'moderate',
            notes: '',
            order: idx + 1,
            sets: Array.from({ length: ex.target_sets || 3 }, (_, sIdx) => ({
              id: `set-${Date.now()}-${idx}-${sIdx}`,
              set_number: sIdx + 1,
              weight_kg: 60,
              reps: ex.target_reps || 10,
              difficulty: 'moderate',
              completed: false
            }))
          }));
          setExercises(exList);
          fetchHistoriesFor(exList);
        } else {
          // Default empty workout
          setExercises([
            {
              id: 'ex-1',
              exercise_name: 'Barbell Bench Press',
              body_part: 'chest',
              difficulty: 'moderate',
              notes: '',
              order: 1,
              sets: [
                { id: 's-1', set_number: 1, weight_kg: 70, reps: 8, difficulty: 'moderate', completed: false },
                { id: 's-2', set_number: 2, weight_kg: 75, reps: 8, difficulty: 'moderate', completed: false },
                { id: 's-3', set_number: 3, weight_kg: 80, reps: 6, difficulty: 'hard', completed: false }
              ]
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to get today plan', err);
      }
    };

    initWorkout();
  }, [location.state]);

  const fetchHistoriesFor = async (exList) => {
    for (const ex of exList) {
      if (ex.exercise_name) {
        try {
          setLoadingHistory(prev => ({ ...prev, [ex.exercise_name]: true }));
          const hist = await workoutApi.getPreviousExercise(ex.exercise_name);
          setExerciseHistory(prev => ({ ...prev, [ex.exercise_name]: hist }));
        } catch (e) {
          console.error('Failed to fetch history for', ex.exercise_name);
        } finally {
          setLoadingHistory(prev => ({ ...prev, [ex.exercise_name]: false }));
        }
      }
    }
  };

  const handleCopyLastSession = (exIndex, exName) => {
    const hist = exerciseHistory[exName];
    if (!hist?.last_session?.sets || hist.last_session.sets.length === 0) {
      alert(`No previous session logged for ${exName} yet.`);
      return;
    }

    const updated = [...exercises];
    const newSets = hist.last_session.sets.map((s, idx) => ({
      id: `set-${Date.now()}-${idx}`,
      set_number: idx + 1,
      weight_kg: s.weight_kg,
      reps: s.reps,
      difficulty: s.difficulty || 'moderate',
      completed: true
    }));
    updated[exIndex].sets = newSets;
    setExercises(updated);
  };

  const handleAddSet = (exIndex) => {
    const updated = [...exercises];
    const currentSets = updated[exIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];
    const newSet = {
      id: `set-${Date.now()}-${currentSets.length}`,
      set_number: currentSets.length + 1,
      weight_kg: lastSet ? lastSet.weight_kg : 60,
      reps: lastSet ? lastSet.reps : 10,
      difficulty: lastSet ? lastSet.difficulty : 'moderate',
      completed: false
    };
    updated[exIndex].sets = [...currentSets, newSet];
    setExercises(updated);
  };

  const handleDeleteSet = (exIndex, setIdx) => {
    const updated = [...exercises];
    updated[exIndex].sets = updated[exIndex].sets
      .filter((_, idx) => idx !== setIdx)
      .map((s, idx) => ({ ...s, set_number: idx + 1 }));
    setExercises(updated);
  };

  const handleSetChange = (exIndex, setIdx, field, val) => {
    const updated = [...exercises];
    updated[exIndex].sets[setIdx] = {
      ...updated[exIndex].sets[setIdx],
      [field]: val
    };
    setExercises(updated);
  };

  const handleToggleCompleted = (exIndex, setIdx) => {
    const updated = [...exercises];
    const cur = updated[exIndex].sets[setIdx].completed;
    updated[exIndex].sets[setIdx].completed = !cur;
    setExercises(updated);
  };

  const handleAddCustomExercise = () => {
    if (!customExName.trim()) return;
    const newEx = {
      id: `ex-${Date.now()}`,
      exercise_name: customExName.trim(),
      body_part: customExBodyPart,
      difficulty: 'moderate',
      notes: '',
      order: exercises.length + 1,
      sets: [
        { id: `s-${Date.now()}-1`, set_number: 1, weight_kg: 50, reps: 10, difficulty: 'moderate', completed: false },
        { id: `s-${Date.now()}-2`, set_number: 2, weight_kg: 50, reps: 10, difficulty: 'moderate', completed: false },
        { id: `s-${Date.now()}-3`, set_number: 3, weight_kg: 50, reps: 10, difficulty: 'moderate', completed: false },
      ]
    };
    const updated = [...exercises, newEx];
    setExercises(updated);
    fetchHistoriesFor([newEx]);
    setAddModalOpen(false);
    setCustomExName('');
  };

  const handleDeleteExercise = (exIndex) => {
    setExercises(exercises.filter((_, idx) => idx !== exIndex));
  };

  const handleSaveWorkout = async () => {
    if (exercises.length === 0) {
      alert('Please add at least one exercise.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        log_date: logDate,
        notes: notes || null,
        duration_minutes: parseInt(durationMinutes) || 60,
        plan_day_id: planDayId,
        exercises: exercises.map((ex, i) => ({
          exercise_name: ex.exercise_name,
          body_part: ex.body_part,
          difficulty: ex.difficulty,
          notes: ex.notes || null,
          order: i + 1,
          sets: ex.sets.map((s, sIdx) => ({
            set_number: sIdx + 1,
            reps: parseInt(s.reps) || 0,
            weight_kg: parseFloat(s.weight_kg) || 0,
            difficulty: s.difficulty || 'moderate'
          }))
        }))
      };

      await workoutApi.logWorkout(payload);
      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to log workout', err);
      alert('Failed to log workout. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (savedSuccess) {
    return (
      <div className="text-center py-16 space-y-6 max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-bounce">
          <Trophy className="text-zinc-950" size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-zinc-100">Workout Crushed! 🔥</h2>
          <p className="text-sm text-zinc-400">
            Your sets, volume, and progressive overload metrics have been saved. Keep building that momentum!
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={() => navigate('/')} className="h-12 text-sm font-bold">
            Back to Dashboard
          </Button>
          <Button variant="secondary" onClick={() => setSavedSuccess(false)} className="h-12 text-sm">
            Log Another Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1 mb-1"
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="text-2xl font-black text-zinc-100 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
          />
          <p className="text-zinc-400 text-xs mt-0.5">Quick logging with pre-filled history and minimal typing</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs text-zinc-300">
            <Clock size={14} className="text-emerald-400" />
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-10 bg-transparent border-none p-0 text-center font-bold focus:outline-none"
            />
            <span>mins</span>
          </div>
          <Input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="py-1 text-xs w-36"
          />
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-5">
        {exercises.map((ex, exIdx) => {
          const hist = exerciseHistory[ex.exercise_name];
          const pb = hist?.personal_best_kg;
          const lastSession = hist?.last_session;

          return (
            <Card key={ex.id} className="p-0 overflow-hidden bg-zinc-900 border-zinc-800">
              {/* Exercise Header */}
              <div className="p-4 bg-zinc-900/90 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center">
                    {exIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-100">{ex.exercise_name}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                      <span className="capitalize text-zinc-400 font-medium">{ex.body_part}</span>
                      {pb && (
                        <span className="text-yellow-400 font-semibold flex items-center gap-1">
                          <Trophy size={11} /> PB: {pb} kg
                        </span>
                      )}
                      {lastSession && (
                        <span className="text-zinc-400">
                          • Last: {lastSession.sets.map(s => `${s.weight_kg}kg×${s.reps}`).slice(0, 3).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lastSession && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopyLastSession(exIdx, ex.exercise_name)}
                      className="text-xs gap-1.5 py-1"
                    >
                      <Copy size={13} /> Copy Last
                    </Button>
                  )}
                  <button
                    onClick={() => handleDeleteExercise(exIdx)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Sets Table */}
              <div className="p-4 bg-zinc-950/60 space-y-2.5">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-zinc-400 px-2 uppercase tracking-wider">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-3 text-center">Weight (kg)</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-3 text-center">Difficulty</div>
                  <div className="col-span-1 text-center"><Check size={13} className="mx-auto" /></div>
                </div>

                {ex.sets.map((set, sIdx) => (
                  <div 
                    key={set.id} 
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      set.completed 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-zinc-900/80 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="col-span-2 text-center font-bold text-xs text-zinc-400">
                      {sIdx + 1}
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.5"
                        value={set.weight_kg}
                        onChange={(e) => handleSetChange(exIdx, sIdx, 'weight_kg', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-9 text-center text-xs font-bold text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(e) => handleSetChange(exIdx, sIdx, 'reps', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-9 text-center text-xs font-bold text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-3">
                      <select
                        value={set.difficulty}
                        onChange={(e) => handleSetChange(exIdx, sIdx, 'difficulty', e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg h-9 px-1 text-center text-[11px] font-semibold text-zinc-300 capitalize focus:border-emerald-500 focus:outline-none"
                      >
                        {DIFFICULTIES.map(d => (
                          <option key={d} value={d} className="capitalize">{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(exIdx, sIdx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          set.completed 
                            ? 'bg-emerald-500 text-zinc-950 font-black' 
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAddSet(exIdx)}
                    className="flex-1 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-dashed border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold text-zinc-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus size={14} /> Add Set
                  </button>
                  {ex.sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSet(exIdx, ex.sets.length - 1)}
                      className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      Remove Set
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Add Exercise Button */}
        <Button
          variant="secondary"
          onClick={() => setAddModalOpen(true)}
          className="w-full h-12 border-dashed border-zinc-700 text-sm gap-2"
        >
          <Plus size={16} /> Add Exercise to Workout
        </Button>
      </div>

      {/* Workout Notes */}
      <Card title="Workout Notes">
        <TextArea
          placeholder="How did this session feel? Form notes, fatigue, energy levels..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSaveWorkout}
        loading={saving}
        className="w-full h-14 text-base font-black gap-2 shadow-xl shadow-emerald-500/20"
      >
        <Dumbbell size={20} /> Finish & Save Workout
      </Button>

      {/* Add Custom Exercise Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Exercise to Active Session"
        subtitle="Choose name and target muscle group"
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="e.g. Incline Dumbbell Curl"
            value={customExName}
            onChange={(e) => setCustomExName(e.target.value)}
            autoFocus
          />

          <Select
            label="Body Part"
            value={customExBodyPart}
            onChange={(e) => setCustomExBodyPart(e.target.value)}
          >
            {BODY_PARTS.map(bp => (
              <option key={bp} value={bp} className="capitalize">{bp.toUpperCase()}</option>
            ))}
          </Select>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddCustomExercise} className="flex-1" disabled={!customExName.trim()}>
              Add to Workout
            </Button>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
