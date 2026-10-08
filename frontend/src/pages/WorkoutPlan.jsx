import React, { useState, useEffect } from 'react';
import { workoutApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Dumbbell, 
  Sparkles, 
  Flame, 
  Edit3,
  Moon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { dow: 0, name: 'Monday' },
  { dow: 1, name: 'Tuesday' },
  { dow: 2, name: 'Wednesday' },
  { dow: 3, name: 'Thursday' },
  { dow: 4, name: 'Friday' },
  { dow: 5, name: 'Saturday' },
  { dow: 6, name: 'Sunday' },
];

const BODY_PARTS = [
  'chest', 'back', 'legs', 'shoulders', 'biceps', 'triceps', 'core', 'glutes', 'calves', 'forearms'
];

export default function WorkoutPlan() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Add Exercise Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDayDow, setSelectedDayDow] = useState(0);
  const [newExName, setNewExName] = useState('');
  const [newExBodyPart, setNewExBodyPart] = useState('chest');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await workoutApi.getPlans();
      setPlans(res);
      const active = res.find(p => p.active) || res[0];
      setActivePlan(active || null);
    } catch (err) {
      console.error('Failed to load workout plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleActivatePlan = async (planId) => {
    try {
      await workoutApi.activatePlan(planId);
      setFeedback('Plan set as active weekly schedule!');
      setTimeout(() => setFeedback(''), 3000);
      await fetchPlans();
    } catch (err) {
      console.error('Failed to activate plan', err);
    }
  };

  const handleToggleRestDay = (dayDow) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.day_of_week === dayDow) {
        return { ...d, is_rest_day: !d.is_rest_day };
      }
      return d;
    });
    setActivePlan({ ...activePlan, days: updatedDays });
  };

  const handleOpenAddExercise = (dayDow) => {
    setSelectedDayDow(dayDow);
    setNewExName('');
    setNewExBodyPart('chest');
    setNewExSets(3);
    setNewExReps(10);
    setAddModalOpen(true);
  };

  const handleSaveExercise = () => {
    if (!newExName.trim() || !activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.day_of_week === selectedDayDow) {
        const exercises = d.exercises || [];
        return {
          ...d,
          exercises: [
            ...exercises,
            {
              exercise_name: newExName.trim(),
              body_part: newExBodyPart,
              target_sets: parseInt(newExSets) || 3,
              target_reps: parseInt(newExReps) || 10,
              order: exercises.length + 1
            }
          ]
        };
      }
      return d;
    });
    setActivePlan({ ...activePlan, days: updatedDays });
    setAddModalOpen(false);
  };

  const handleDeleteExercise = (dayDow, exIndex) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map(d => {
      if (d.day_of_week === dayDow) {
        const filtered = d.exercises.filter((_, idx) => idx !== exIndex);
        return { ...d, exercises: filtered };
      }
      return d;
    });
    setActivePlan({ ...activePlan, days: updatedDays });
  };

  const handleSavePlanChanges = async () => {
    if (!activePlan) return;
    try {
      setSaving(true);
      // Re-create or update plan
      const payload = {
        name: activePlan.name,
        active: activePlan.active,
        days: activePlan.days.map(d => ({
          day_of_week: d.day_of_week,
          label: d.label,
          is_rest_day: d.is_rest_day,
          order: d.order,
          exercises: (d.exercises || []).map((ex, i) => ({
            exercise_name: ex.exercise_name,
            body_part: ex.body_part,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            order: i + 1
          }))
        }))
      };
      await workoutApi.createPlan(payload);
      setFeedback('Workout plan saved successfully!');
      setTimeout(() => setFeedback(''), 3000);
      await fetchPlans();
    } catch (err) {
      console.error('Failed to save plan', err);
      alert('Failed to save plan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-zinc-900 rounded-xl w-1/3" />
        <div className="h-64 bg-zinc-900 rounded-2xl" />
        <div className="h-64 bg-zinc-900 rounded-2xl" />
      </div>
    );
  }

  // Ensure 7 days are represented in display
  const daysList = DAYS_OF_WEEK.map(({ dow, name }) => {
    const existingDay = activePlan?.days?.find(d => d.day_of_week === dow);
    return existingDay || {
      day_of_week: dow,
      label: dow === 6 ? 'Rest & Recovery' : `Day ${dow + 1}`,
      is_rest_day: dow === 6,
      order: dow,
      exercises: []
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            Weekly Workout Split
            {activePlan?.active && (
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Active Plan
              </span>
            )}
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Customize your 7-day schedule, target volume, and exercises per muscle group.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activePlan && (
            <Button
              onClick={handleSavePlanChanges}
              loading={saving}
              className="gap-1.5"
            >
              <CheckCircle size={16} /> Save Changes
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle size={16} /> {feedback}
        </div>
      )}

      {/* Days Grid */}
      <div className="space-y-4">
        {daysList.map((day) => {
          const dayInfo = DAYS_OF_WEEK.find(d => d.dow === day.day_of_week);
          const isRest = day.is_rest_day;

          return (
            <Card key={day.day_of_week} className="p-4 bg-zinc-900/80 border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isRest ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                    {dayInfo.name.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                      {dayInfo.name}
                      {isRest && (
                        <span className="text-xs font-normal text-zinc-500 flex items-center gap-1">
                          <Moon size={12} /> Rest Day
                        </span>
                      )}
                    </h3>
                    <input
                      type="text"
                      value={day.label || ''}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        const updatedDays = activePlan.days.map(d => 
                          d.day_of_week === day.day_of_week ? { ...d, label: newLabel } : d
                        );
                        setActivePlan({ ...activePlan, days: updatedDays });
                      }}
                      placeholder="e.g. Push, Chest+Triceps, Legs"
                      className="text-xs font-semibold text-emerald-400 bg-transparent border-none p-0 focus:outline-none focus:ring-0 placeholder-zinc-600"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleRestDay(day.day_of_week)}
                    className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all ${
                      isRest 
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700' 
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {isRest ? 'Set as Workout' : 'Mark as Rest'}
                  </button>
                  {!isRest && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenAddExercise(day.day_of_week)}
                      className="gap-1 text-xs"
                    >
                      <Plus size={14} /> Add Exercise
                    </Button>
                  )}
                </div>
              </div>

              {/* Exercises List */}
              {!isRest && (
                <div className="mt-4 pt-3 border-t border-zinc-800/60 space-y-2">
                  {day.exercises && day.exercises.length > 0 ? (
                    day.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-bold flex items-center justify-center">
                            {exIdx + 1}
                          </span>
                          <span className="font-semibold text-zinc-200">{ex.exercise_name}</span>
                          <Badge variant="default" size="xs" className="capitalize">
                            {ex.body_part}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-zinc-400 font-medium">
                            {ex.target_sets} sets × {ex.target_reps} reps
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExercise(day.day_of_week, exIdx)}
                            className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-3 text-xs text-zinc-500 italic">
                      No exercises planned yet for this day. Click "Add Exercise" above.
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={`Add Exercise to ${DAYS_OF_WEEK.find(d => d.dow === selectedDayDow)?.name}`}
        subtitle="Configure target sets, reps and body part"
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="e.g. Incline Dumbbell Press"
            value={newExName}
            onChange={(e) => setNewExName(e.target.value)}
            autoFocus
          />

          <Select
            label="Body Part Group"
            value={newExBodyPart}
            onChange={(e) => setNewExBodyPart(e.target.value)}
          >
            {BODY_PARTS.map(bp => (
              <option key={bp} value={bp} className="capitalize">{bp.toUpperCase()}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Sets"
              type="number"
              min="1"
              max="10"
              value={newExSets}
              onChange={(e) => setNewExSets(e.target.value)}
            />
            <Input
              label="Target Reps / Set"
              type="number"
              min="1"
              max="50"
              value={newExReps}
              onChange={(e) => setNewExReps(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveExercise}
              className="flex-1"
              disabled={!newExName.trim()}
            >
              Add Exercise to Plan
            </Button>
            <Button
              variant="secondary"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
