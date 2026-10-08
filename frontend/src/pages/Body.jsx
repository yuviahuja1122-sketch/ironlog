import React, { useState, useEffect } from 'react';
import { bodyApi } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';
import { 
  Scale, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  Upload, 
  Image as ImageIcon,
  Columns,
  CheckCircle2,
  Sliders
} from 'lucide-react';

export default function Body() {
  const [weights, setWeights] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Weight entry form
  const [newWeight, setNewWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [savingWeight, setSavingWeight] = useState(false);
  const [daysRange, setDaysRange] = useState(30);

  // Photo upload form
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoAngle, setPhotoAngle] = useState('front');
  const [photoDate, setPhotoDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Comparison State
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareDate1, setCompareDate1] = useState('');
  const [compareDate2, setCompareDate2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wRes, pRes] = await Promise.all([
        bodyApi.getWeights(daysRange),
        bodyApi.getPhotos(),
      ]);
      setWeights(wRes);
      setPhotos(pRes);
    } catch (err) {
      console.error('Failed to fetch body tracking data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [daysRange]);

  const handleSaveWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || isNaN(parseFloat(newWeight))) return;

    try {
      setSavingWeight(true);
      await bodyApi.logWeight(newWeight, weightDate);
      setNewWeight('');
      await fetchData();
    } catch (err) {
      console.error('Failed to log weight', err);
      alert('Failed to log weight.');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('angle', photoAngle);
      formData.append('photo_date', photoDate);

      await bodyApi.uploadPhoto(formData);
      setUploadModalOpen(false);
      setSelectedFile(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to upload photo', err);
      alert('Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCompareDates = async () => {
    if (!compareDate1 || !compareDate2) return;
    try {
      const res = await bodyApi.comparePhotos(compareDate1, compareDate2);
      setComparisonResult(res);
    } catch (err) {
      console.error('Failed to compare photos', err);
    }
  };

  // Compute 7-day Moving Average for Chart
  const chartData = weights.map((w, index) => {
    const windowSlice = weights.slice(Math.max(0, index - 6), index + 1);
    const avg = windowSlice.reduce((sum, item) => sum + item.weight_kg, 0) / windowSlice.length;
    return {
      date: new Date(w.log_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rawDate: w.log_date,
      weight: w.weight_kg,
      avg: parseFloat(avg.toFixed(2))
    };
  });

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight_kg : null;
  const startWeight = weights.length > 0 ? weights[0].weight_kg : null;
  const totalChange = (latestWeight && startWeight) ? (latestWeight - startWeight).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 flex items-center gap-2">
            Body & Transformation
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Daily weight tracking, 7-day moving averages, and side-by-side photo comparison.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setCompareModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Columns size={15} /> Compare Dates
          </Button>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <Camera size={15} /> Upload Photo
          </Button>
        </div>
      </div>

      {/* Quick Weight Entry & Stats Bar */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2 p-4">
          <form onSubmit={handleSaveWeight} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <Input
                label="Log Weight Today (kg)"
                type="number"
                step="0.1"
                placeholder="e.g. 77.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                required
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                label="Date"
                type="date"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              loading={savingWeight}
              className="h-10 px-5 text-xs font-bold shrink-0 w-full sm:w-auto"
            >
              Save Weight
            </Button>
          </form>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-zinc-400">Total Change ({daysRange}d)</span>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-zinc-100">
              {parseFloat(totalChange) > 0 ? `+${totalChange}` : totalChange} <span className="text-xs font-normal text-zinc-400">kg</span>
            </div>
            {parseFloat(totalChange) < 0 ? (
              <Badge variant="success" size="sm" className="gap-1">
                <TrendingDown size={13} /> {Math.abs(totalChange)} kg
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="gap-1">
                <TrendingUp size={13} /> +{totalChange} kg
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Weight Trend Chart */}
      <Card
        title="Weight Trend & 7-Day Moving Average"
        subtitle="Moving average filters out water weight fluctuations"
        action={
          <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
            {[14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDaysRange(d)}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  daysRange === d ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>
        }
      >
        <div className="h-72 w-full mt-4 -ml-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  stroke="#71717a" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f4f4f5'
                  }}
                  formatter={(val, name) => [`${val} kg`, name === 'weight' ? 'Daily Weight' : '7d Moving Average']}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ fill: '#10b981', r: 3 }} 
                  name="weight"
                />
                <Line 
                  type="monotone" 
                  dataKey="avg" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false} 
                  name="avg"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
              No weight data logged for this period.
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Daily Logged Weight</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-500"></span>
            <span>7-Day Moving Avg</span>
          </div>
        </div>
      </Card>

      {/* Progress Photos Gallery */}
      <Card 
        title="Transformation Photo Gallery" 
        subtitle="Visual proof of physique recomposition over time"
      >
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {photos.map((p) => (
              <div key={p.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[3/4]">
                <img
                  src={`http://localhost:8000/${p.file_path}`}
                  alt={`${p.angle} view on ${p.photo_date}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.fallback-placeholder').style.display = 'flex';
                  }}
                />
                <div className="fallback-placeholder hidden absolute inset-0 bg-zinc-900 flex-col items-center justify-center text-zinc-500 p-2 text-center">
                  <Camera size={24} className="mb-1 text-zinc-600" />
                  <span className="text-[10px] capitalize">{p.angle} Angle</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent p-2.5 flex justify-between items-end">
                  <div>
                    <Badge variant="info" size="xs" className="capitalize">
                      {p.angle}
                    </Badge>
                    <p className="text-[10px] text-zinc-300 font-semibold mt-1">
                      {new Date(p.photo_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <Camera size={24} />
            </div>
            <p className="text-xs text-zinc-400">No progress photos uploaded yet.</p>
            <Button size="sm" variant="secondary" onClick={() => setUploadModalOpen(true)}>
              Upload First Photo
            </Button>
          </div>
        )}
      </Card>

      {/* Upload Photo Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Progress Photo"
        subtitle="Store photos locally to track your muscle definition"
      >
        <form onSubmit={handleUploadPhoto} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Select Image File</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30"
              required
            />
          </div>

          <Select
            label="Angle / Pose"
            value={photoAngle}
            onChange={(e) => setPhotoAngle(e.target.value)}
          >
            <option value="front">Front View</option>
            <option value="side">Side Profile</option>
            <option value="back">Back View</option>
          </Select>

          <Input
            label="Date Taken"
            type="date"
            value={photoDate}
            onChange={(e) => setPhotoDate(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              loading={uploadingPhoto}
              disabled={!selectedFile}
              className="flex-1 text-xs"
            >
              Upload & Save Photo
            </Button>
            <Button variant="secondary" onClick={() => setUploadModalOpen(false)} className="text-xs">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Side-by-Side Date Compare Modal */}
      <Modal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        title="Physique Transformation Comparison"
        subtitle="Compare photos side-by-side between any two dates"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date 1 (Before)"
              type="date"
              value={compareDate1}
              onChange={(e) => setCompareDate1(e.target.value)}
            />
            <Input
              label="Date 2 (After)"
              type="date"
              value={compareDate2}
              onChange={(e) => setCompareDate2(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCompareDates}
            disabled={!compareDate1 || !compareDate2}
            className="w-full text-xs"
          >
            Compare Side-by-Side
          </Button>

          {comparisonResult && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 text-center uppercase tracking-wider">
                  {comparisonResult.date1.date}
                </h4>
                {comparisonResult.date1.photos.length > 0 ? (
                  comparisonResult.date1.photos.map((p, i) => (
                    <img
                      key={i}
                      src={`http://localhost:8000/${p.file_path}`}
                      alt={p.angle}
                      className="w-full rounded-xl aspect-[3/4] object-cover border border-zinc-800"
                    />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-8">No photos for this date</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-400 text-center uppercase tracking-wider">
                  {comparisonResult.date2.date}
                </h4>
                {comparisonResult.date2.photos.length > 0 ? (
                  comparisonResult.date2.photos.map((p, i) => (
                    <img
                      key={i}
                      src={`http://localhost:8000/${p.file_path}`}
                      alt={p.angle}
                      className="w-full rounded-xl aspect-[3/4] object-cover border border-zinc-800"
                    />
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-8">No photos for this date</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
