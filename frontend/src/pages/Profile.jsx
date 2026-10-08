import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { 
  User, 
  Target, 
  Flame, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Scale, 
  ShieldCheck 
} from 'lucide-react';

const GOALS = [
  { value: 'cut', label: 'Cut (Fat Loss & Lean Preservation: TDEE - 500 kcal)' },
  { value: 'bulk', label: 'Bulk (Muscle Hypertrophy Surplus: TDEE + 300 kcal)' },
  { value: 'maintain', label: 'Maintain (Energy Balance & Performance: TDEE)' },
  { value: 'recomp', label: 'Body Recomposition (Slight Deficit: TDEE - 100 kcal)' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Desk job, minimal exercise: ×1.20)' },
  { value: 'light', label: 'Lightly Active (1-3 gym days/week: ×1.375)' },
  { value: 'moderate', label: 'Moderately Active (3-5 gym days/week: ×1.55)' },
  { value: 'active', label: 'Very Active (6-7 intense gym days/week: ×1.725)' },
  { value: 'very_active', label: 'Extremely Active (Athlete / physical job: ×1.90)' },
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner (< 1 year lifting)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years lifting)' },
  { value: 'advanced', label: 'Advanced (3+ years lifting)' },
];

export default function Profile() {
  const { profile, refreshProfile } = useAuth();

  const [form, setForm] = useState({
    name: '',
    age: 25,
    height_cm: 175,
    weight_kg: 78,
    goal: 'cut',
    target_weight_kg: 72,
    activity_level: 'moderate',
    experience_level: 'intermediate',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        age: profile.age || 25,
        height_cm: profile.height_cm || 175,
        weight_kg: profile.weight_kg || 78,
        goal: profile.goal || 'cut',
        target_weight_kg: profile.target_weight_kg || 72,
        activity_level: profile.activity_level || 'moderate',
        experience_level: profile.experience_level || 'intermediate',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === 'age' || name === 'height_cm' || name === 'weight_kg' || name === 'target_weight_kg')
        ? (parseFloat(value) || 0)
        : value
    }));
  };

  // Real-time client preview calculation
  const bmr = Math.round(10 * form.weight_kg + 6.25 * form.height_cm - 5 * form.age + 5);
  const multMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const tdee = Math.round(bmr * (multMap[form.activity_level] || 1.2));

  let calcCals = tdee;
  let calcProt = Math.round(form.weight_kg * 1.8);
  if (form.goal === 'cut') {
    calcCals = tdee - 500;
    calcProt = Math.round(form.weight_kg * 2.2);
  } else if (form.goal === 'bulk') {
    calcCals = tdee + 300;
    calcProt = Math.round(form.weight_kg * 2.0);
  } else if (form.goal === 'recomp') {
    calcCals = tdee - 100;
    calcProt = Math.round(form.weight_kg * 2.2);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await profileApi.saveProfile(form);
      await refreshProfile();
      setSuccessMsg('Profile and calculated energy targets updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
          Profile & Target Calculations
        </h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          Scientific BMR (Mifflin-St Jeor) and TDEE calorie & protein target engine.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Profile Edit Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card title="Athlete Metrics & Goal Selection">
            <form onSubmit={handleSave} className="space-y-4 mt-2">
              <Input
                label="Full Name / Display Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Age (years)"
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  name="height_cm"
                  value={form.height_cm}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Current Weight (kg)"
                  type="number"
                  step="0.1"
                  name="weight_kg"
                  value={form.weight_kg}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Target Goal Weight (kg)"
                  type="number"
                  step="0.1"
                  name="target_weight_kg"
                  value={form.target_weight_kg}
                  onChange={handleChange}
                  required
                />
              </div>

              <Select
                label="Primary Fitness Goal"
                name="goal"
                value={form.goal}
                onChange={handleChange}
                options={GOALS}
              />

              <Select
                label="Activity Level (Weekly Training Frequency)"
                name="activity_level"
                value={form.activity_level}
                onChange={handleChange}
                options={ACTIVITY_LEVELS}
              />

              <Select
                label="Lifting Experience"
                name="experience_level"
                value={form.experience_level}
                onChange={handleChange}
                options={EXPERIENCE_LEVELS}
              />

              <Button
                type="submit"
                loading={saving}
                className="w-full h-12 text-sm font-bold gap-2 mt-4"
              >
                <CheckCircle2 size={16} /> Save & Recalculate Targets
              </Button>
            </form>
          </Card>
        </div>

        {/* Live Auto-Calculated Targets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card 
            title="Auto-Calculated Energy Targets" 
            subtitle="Mifflin-St Jeor scientific formula"
            className="bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-500/30"
          >
            <div className="space-y-4 mt-3">
              <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold">BMR (Basal Metabolic Rate)</span>
                  <p className="text-[11px] text-zinc-500">Base calorie burn at full rest</p>
                </div>
                <div className="text-xl font-black text-zinc-100">
                  {bmr} <span className="text-xs font-normal text-zinc-400">kcal</span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold">TDEE (Daily Energy Burn)</span>
                  <p className="text-[11px] text-zinc-500">Maintenance calories with workouts</p>
                </div>
                <div className="text-xl font-black text-zinc-100">
                  {tdee} <span className="text-xs font-normal text-zinc-400">kcal</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Daily Calorie Target
                  </span>
                  <Badge variant="success" size="xs" className="capitalize">
                    {form.goal}
                  </Badge>
                </div>
                <div className="text-3xl font-black text-emerald-400">
                  {calcCals} <span className="text-xs font-normal text-zinc-300">kcal / day</span>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Daily Protein Target
                  </span>
                  <Badge variant="info" size="xs">
                    {form.goal === 'cut' ? '2.2 g/kg' : '2.0 g/kg'}
                  </Badge>
                </div>
                <div className="text-3xl font-black text-blue-400">
                  {calcProt} <span className="text-xs font-normal text-zinc-300">grams / day</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
            <div className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400" /> Multi-User Ready Architecture
            </div>
            <p className="text-[11px] text-zinc-500">
              Your profile data is isolated per JWT user account, ready for multi-tenant scaling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
