import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { nutritionApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  Sparkles, 
  Utensils, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Info
} from 'lucide-react';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Nutrition() {
  const { profile } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [nutritionLog, setNutritionLog] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMealType, setAiMealType] = useState('lunch');
  const [aiEstimating, setAiEstimating] = useState(false);
  const [aiEstimateResult, setAiEstimateResult] = useState(null);
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);

  // Editable Estimate Fields in Modal
  const [editCalories, setEditCalories] = useState(0);
  const [editProtein, setEditProtein] = useState(0);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editFat, setEditFat] = useState(0);

  // Manual Meal Modal
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manDesc, setManDesc] = useState('');
  const [manCals, setManCals] = useState('');
  const [manProt, setManProt] = useState('');
  const [manCarbs, setManCarbs] = useState('');
  const [manFat, setManFat] = useState('');
  const [manType, setManType] = useState('lunch');
  const [savingManual, setSavingManual] = useState(false);

  const fetchNutrition = async (d) => {
    try {
      setLoading(true);
      const res = await nutritionApi.getNutrition(d);
      setNutritionLog(res);
    } catch (err) {
      // If 404, empty day
      setNutritionLog({
        log_date: d,
        total_calories: 0,
        total_protein_g: 0,
        total_carbs_g: 0,
        total_fat_g: 0,
        meals: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition(selectedDate);
  }, [selectedDate]);

  const handleAiEstimate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setAiEstimating(true);
      const res = await nutritionApi.aiEstimate(aiPrompt.trim(), aiMealType, selectedDate);
      setAiEstimateResult(res);
      setEditCalories(res.calories);
      setEditProtein(res.protein_g);
      setEditCarbs(res.carbs_g);
      setEditFat(res.fat_g);
      setEstimateModalOpen(true);
      setAiPrompt('');
      await fetchNutrition(selectedDate);
    } catch (err) {
      console.error('AI estimate failed', err);
      alert('AI estimation failed. Please try again.');
    } finally {
      setAiEstimating(false);
    }
  };

  const handleSaveManualMeal = async (e) => {
    e.preventDefault();
    if (!manDesc.trim()) return;

    try {
      setSavingManual(true);
      await nutritionApi.addMeal({
        description: manDesc.trim(),
        calories: parseFloat(manCals) || 0,
        protein_g: parseFloat(manProt) || 0,
        carbs_g: parseFloat(manCarbs) || 0,
        fat_g: parseFloat(manFat) || 0,
        meal_type: manType
      }, selectedDate);

      setManualModalOpen(false);
      setManDesc('');
      setManCals('');
      setManProt('');
      setManCarbs('');
      setManFat('');
      await fetchNutrition(selectedDate);
    } catch (err) {
      console.error('Failed to add manual meal', err);
      alert('Failed to save meal.');
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteMeal = async (mealId) => {
    try {
      await nutritionApi.deleteMeal(mealId);
      await fetchNutrition(selectedDate);
    } catch (err) {
      console.error('Failed to delete meal', err);
    }
  };

  const targetCals = profile?.target_calories || 2200;
  const targetProt = profile?.target_protein || 160;

  const totalCals = nutritionLog?.total_calories || 0;
  const totalProt = nutritionLog?.total_protein_g || 0;
  const totalCarbs = nutritionLog?.total_carbs_g || 0;
  const totalFat = nutritionLog?.total_fat_g || 0;

  const calPercent = Math.min(100, Math.round((totalCals / targetCals) * 100));
  const isOverCalories = totalCals > targetCals;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            Nutrition & Macro Tracker
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Log meals with natural language AI estimation (Indian & global foods supported).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs py-1.5 w-40"
          />
          <Button
            variant="secondary"
            onClick={() => setManualModalOpen(true)}
            className="text-xs gap-1.5 py-2"
          >
            <Plus size={14} /> Manual Log
          </Button>
        </div>
      </div>

      {/* AI Smart Meal Logger Box */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/30 via-zinc-900 to-blue-950/30 border border-emerald-500/30 p-6 shadow-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
          <Sparkles size={16} /> AI Natural Language Food Estimation
        </div>
        <h3 className="text-lg font-bold text-zinc-100 mb-1">
          What did you eat?
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Type freely: <span className="text-zinc-300 italic">"3 rotis, 1 bowl dal, 200g paneer, and a glass of buttermilk"</span>
        </p>

        <form onSubmit={handleAiEstimate} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 2 rotis with yellow dal, 150g chicken curry, 1 banana"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 bg-zinc-950/80 border border-zinc-700/80 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
            <select
              value={aiMealType}
              onChange={(e) => setAiMealType(e.target.value)}
              className="bg-zinc-950/80 border border-zinc-700/80 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-300 capitalize focus:outline-none focus:border-emerald-500 sm:w-36"
            >
              {MEAL_TYPES.map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            loading={aiEstimating}
            className="w-full h-12 text-sm font-bold gap-2"
          >
            <Sparkles size={16} /> Estimate Macros & Log Meal
          </Button>
        </form>
      </div>

      {/* Gentle Over-Target Coach Advice (Non-shaming) */}
      {isOverCalories && (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs leading-relaxed space-y-1.5 flex gap-3 animate-fadeIn">
          <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-300 text-sm">Gentle AI Coach Suggestion:</span>
            <p className="mt-1 text-zinc-300">
              You are {Math.round(totalCals - targetCals)} kcal over your target today for your {profile?.goal || 'cut'} goal. No stress! Fitness is about the weekly average. Simply keep your dinner a bit lighter or take an extra 15-minute post-meal walk. You are still completely on track!
            </p>
          </div>
        </div>
      )}

      {/* Macro Breakdown 4-Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-zinc-900/80">
          <span className="text-xs font-semibold text-zinc-400">Calories</span>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {Math.round(totalCals)} <span className="text-xs font-normal text-zinc-400">/ {targetCals}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{calPercent}% of target</p>
        </Card>

        <Card className="p-4 bg-zinc-900/80">
          <span className="text-xs font-semibold text-zinc-400">Protein</span>
          <div className="mt-2 text-2xl font-black text-blue-400">
            {Math.round(totalProt)}g <span className="text-xs font-normal text-zinc-400">/ {targetProt}g</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{Math.round((totalProt / targetProt) * 100)}% of target</p>
        </Card>

        <Card className="p-4 bg-zinc-900/80">
          <span className="text-xs font-semibold text-zinc-400">Carbs</span>
          <div className="mt-2 text-2xl font-black text-orange-400">
            {Math.round(totalCarbs)}g
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{Math.round(totalCarbs * 4)} kcal energy</p>
        </Card>

        <Card className="p-4 bg-zinc-900/80">
          <span className="text-xs font-semibold text-zinc-400">Fats</span>
          <div className="mt-2 text-2xl font-black text-yellow-400">
            {Math.round(totalFat)}g
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">{Math.round(totalFat * 9)} kcal energy</p>
        </Card>
      </div>

      {/* Logged Meals List */}
      <Card
        title={`Meals Logged for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        subtitle={`${nutritionLog?.meals?.length || 0} meals recorded`}
      >
        {nutritionLog?.meals && nutritionLog.meals.length > 0 ? (
          <div className="space-y-3 mt-3">
            {nutritionLog.meals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-200">{meal.description}</h4>
                      <Badge variant="default" size="xs" className="capitalize">
                        {meal.meal_type}
                      </Badge>
                      {meal.ai_estimated && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                          AI
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                      <span className="text-emerald-400 font-semibold">{Math.round(meal.calories)} kcal</span>
                      <span>• P: {Math.round(meal.protein_g)}g</span>
                      <span>• C: {Math.round(meal.carbs_g)}g</span>
                      <span>• F: {Math.round(meal.fat_g)}g</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="text-zinc-500 hover:text-red-400 p-2 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-zinc-500 space-y-2">
            <Utensils size={24} className="mx-auto text-zinc-600" />
            <p>No meals logged yet for this date. Use the AI logger above!</p>
          </div>
        )}
      </Card>

      {/* Manual Meal Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Manual Meal Entry"
        subtitle="Enter custom macros and descriptions directly"
      >
        <form onSubmit={handleSaveManualMeal} className="space-y-4">
          <Input
            label="Meal Description"
            placeholder="e.g. Grilled Chicken & White Rice"
            value={manDesc}
            onChange={(e) => setManDesc(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Meal Type"
            value={manType}
            onChange={(e) => setManType(e.target.value)}
          >
            {MEAL_TYPES.map(t => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Calories (kcal)"
              type="number"
              value={manCals}
              onChange={(e) => setManCals(e.target.value)}
              required
            />
            <Input
              label="Protein (g)"
              type="number"
              value={manProt}
              onChange={(e) => setManProt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Carbs (g)"
              type="number"
              value={manCarbs}
              onChange={(e) => setManCarbs(e.target.value)}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={manFat}
              onChange={(e) => setManFat(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              loading={savingManual}
              className="flex-1 text-xs"
            >
              Save Meal Entry
            </Button>
            <Button variant="secondary" onClick={() => setManualModalOpen(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
