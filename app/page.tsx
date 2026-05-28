'use client';

import { useState, useEffect } from 'react';

interface FoodItem {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface LogEntry {
  id: string;
  item: FoodItem;
  time: string;
  timestamp: number;
  type: 'food';
}

interface WaterEntry {
  id: string;
  amount: number;
  time: string;
  timestamp: number;
  type: 'water';
}

type CombinedEntry = LogEntry | WaterEntry;

interface UserProfile {
  email: string;
  height: number;
  weight: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

const FOOD_DATABASE: FoodItem[] = [
  { name: 'Banana (1 medium)', protein: 1.3, carbs: 27, fat: 0.3, calories: 105 },
  { name: 'Peanut Butter (32g)', protein: 8, carbs: 7, fat: 16, calories: 188 },
  { name: 'Apple (1 medium)', protein: 0.3, carbs: 25, fat: 0.2, calories: 95 },
  { name: 'Milk (250ml)', protein: 8, carbs: 12, fat: 5, calories: 149 },
  { name: 'Almonds (10g)', protein: 2, carbs: 3, fat: 10, calories: 104 },
  { name: 'Eggs (2 large)', protein: 12, carbs: 1.1, fat: 10, calories: 155 },
  { name: 'Rice (200ml cooked)', protein: 4, carbs: 45, fat: 0.3, calories: 206 },
  { name: 'Lentils (200ml cooked)', protein: 18, carbs: 40, fat: 0.8, calories: 230 },
  { name: 'Bread (40g slice)', protein: 4, carbs: 14, fat: 1, calories: 79 },
  { name: 'Oats (50g dry)', protein: 10, carbs: 54, fat: 8, calories: 300 },
  { name: 'Yogurt Greek (100ml)', protein: 17, carbs: 6, fat: 0.4, calories: 100 },
  { name: 'Pasta (200ml cooked)', protein: 8, carbs: 43, fat: 1.1, calories: 220 },
  { name: 'Cheese (30g)', protein: 7, carbs: 1.3, fat: 9.4, calories: 120 },
  { name: 'Sweet Potato (150g)', protein: 2, carbs: 24, fat: 0.1, calories: 103 },
  { name: 'Watermelon (200ml)', protein: 0.6, carbs: 11, fat: 0.3, calories: 46 },
  { name: 'Tomato (1 medium)', protein: 0.9, carbs: 3.9, fat: 0.2, calories: 18 },
  { name: 'Orange (1 medium)', protein: 0.7, carbs: 12, fat: 0.3, calories: 47 },
];

const calculateBMI = (height: number, weight: number) => {
  return weight / ((height / 100) ** 2);
};

const calculateCalories = (profile: UserProfile) => {
  const { height, weight, age, gender, activityLevel } = profile;
  let bmr = 0;
  
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  const activityFactors = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };
  
  return Math.round(bmr * activityFactors[activityLevel]);
};

const calculateWaterIntake = (weight: number) => {
  return Math.round(weight * 35);
};

const getFormattedTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  });
};

export default function DailyTracker() {
  const getPersistedProfile = () => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('currentUser');
    if (!saved) return null;
    try {
      return JSON.parse(saved) as UserProfile;
    } catch {
      return null;
    }
  };

  const getInitialShowProfileModal = () => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('currentUser');
    if (!saved) return true;
    try {
      JSON.parse(saved);
      return false;
    } catch {
      return true;
    }
  };

  const [profile, setProfile] = useState<UserProfile | null>(() => getPersistedProfile());
  const [showProfileModal, setShowProfileModal] = useState(() => getInitialShowProfileModal());
  const [formData, setFormData] = useState<UserProfile>({
    email: 'singlas106@gmail.com',
    height: 175,
    weight: 75,
    age: 30,
    gender: 'male',
    activityLevel: 'lightly_active',
  });

  const getStorageKey = (key: string) => {
    return profile ? `${key}_${profile.email}` : key;
  };

  const [logs, setLogs] = useState<LogEntry[]>(() => {
    if (typeof window === 'undefined' || !profile) return [];
    const saved = localStorage.getItem(getStorageKey('nutritionLogs'));
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      return parsed
        .filter((log: any) => new Date(log.timestamp).toDateString() === today)
        .map((log: any) => ({
          id: log.id,
          item: log.item,
          time: log.time,
          timestamp: log.timestamp,
          type: 'food',
        }));
    } catch {
      return [];
    }
  });

  const [waterLogs, setWaterLogs] = useState<WaterEntry[]>(() => {
    if (typeof window === 'undefined' || !profile) return [];
    const saved = localStorage.getItem(getStorageKey('waterLogs'));
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      const today = new Date().toDateString();
      return parsed.filter((log: any) => new Date(log.timestamp).toDateString() === today);
    } catch {
      return [];
    }
  });

  const [selectedFood, setSelectedFood] = useState<FoodItem>(FOOD_DATABASE[0]);
  const [foodTiming, setFoodTiming] = useState('now');
  const [waterTiming, setWaterTiming] = useState('now');

  useEffect(() => {
    if (!profile) return;
    const allLogs = localStorage.getItem(getStorageKey('nutritionLogs'));
    const parsed = allLogs ? JSON.parse(allLogs) : [];
    const filtered = parsed.filter((log: any) => 
      logs.some(l => l.id === log.id)
    );
    const newLogs = logs.filter(l => 
      !parsed.some((log: any) => log.id === l.id)
    ).map(log => ({
      id: log.id,
      item: log.item,
      time: log.time,
      timestamp: log.timestamp,
      type: 'food' as const,
    }));
    localStorage.setItem(getStorageKey('nutritionLogs'), JSON.stringify([...filtered, ...newLogs]));
  }, [logs, profile]);

  useEffect(() => {
    if (!profile) return;
    const allWaterLogs = localStorage.getItem(getStorageKey('waterLogs'));
    const parsed = allWaterLogs ? JSON.parse(allWaterLogs) : [];
    const filtered = parsed.filter((log: any) => 
      waterLogs.some(l => l.id === log.id)
    );
    const newLogs = waterLogs.filter(l => 
      !parsed.some((log: any) => log.id === l.id)
    );
    localStorage.setItem(getStorageKey('waterLogs'), JSON.stringify([...filtered, ...newLogs]));
  }, [waterLogs, profile]);

  const saveProfile = () => {
    if (!formData.email.trim()) {
      alert('Please enter an email address');
      return;
    }
    setProfile(formData);
    localStorage.setItem('currentUser', JSON.stringify(formData));
    setShowProfileModal(false);
    setLogs([]);
    setWaterLogs([]);
  };

  const switchUser = () => {
    setProfile(null);
    setShowProfileModal(true);
  };

  const getTimestamp = (timing: string) => {
    const now = new Date();
    if (timing === 'now') return now.getTime();
    
    const minutes = parseInt(timing);
    return now.getTime() - (minutes * 60 * 1000);
  };

  const addFood = () => {
    const timestamp = getTimestamp(foodTiming);
    const logTime = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newLog: LogEntry = {
      id: `${Date.now()}`,
      item: selectedFood,
      time: logTime,
      timestamp,
      type: 'food',
    };
    setLogs([...logs, newLog]);
  };

  const addWater = (amount: number) => {
    const timestamp = getTimestamp(waterTiming);
    const logTime = new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newLog: WaterEntry = {
      id: `${Date.now()}`,
      amount,
      time: logTime,
      timestamp,
      type: 'water',
    };
    setWaterLogs([...waterLogs, newLog]);
  };

  const removeFood = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  const removeWater = (id: string) => {
    setWaterLogs(waterLogs.filter(log => log.id !== id));
  };

  const removeCombinedEntry = (id: string, type: string) => {
    if (type === 'food') removeFood(id);
    else removeWater(id);
  };

  const getCombinedLogs = (): CombinedEntry[] => {
    const combined: CombinedEntry[] = [
      ...logs,
      ...waterLogs,
    ];
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Health Profile Setup</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
              <select
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sedentary">Sedentary (little exercise)</option>
                <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                <option value="very_active">Very Active (6-7 days/week)</option>
                <option value="extremely_active">Extremely Active (athlete)</option>
              </select>
            </div>
            <button
              onClick={saveProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(profile.height, profile.weight);
  const dailyCalories = calculateCalories(profile);
  const dailyWater = calculateWaterIntake(profile.weight);

  const dailyGoals = {
    protein: Math.round(profile.weight * 1.6),
    carbs: Math.round((dailyCalories * 0.45) / 4),
    fat: Math.round((dailyCalories * 0.3) / 9),
    calories: dailyCalories,
    water: dailyWater,
  };

  const totalProtein = logs.reduce((sum, log) => sum + log.item.protein, 0);
  const totalCarbs = logs.reduce((sum, log) => sum + log.item.carbs, 0);
  const totalFat = logs.reduce((sum, log) => sum + log.item.fat, 0);
  const totalCalories = logs.reduce((sum, log) => sum + log.item.calories, 0);
  const totalWater = waterLogs.reduce((sum, log) => sum + log.amount, 0);

  const proteinPercent = Math.min((totalProtein / dailyGoals.protein) * 100, 100);
  const carbsPercent = Math.min((totalCarbs / dailyGoals.carbs) * 100, 100);
  const fatPercent = Math.min((totalFat / dailyGoals.fat) * 100, 100);
  const caloriesPercent = Math.min((totalCalories / dailyGoals.calories) * 100, 100);
  const waterPercent = Math.min((totalWater / dailyGoals.water) * 100, 100);

  const getColor = (percent: number) => {
    if (percent < 50) return 'bg-red-500';
    if (percent < 90) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (percent: number) => {
    if (percent < 50) return 'text-red-600';
    if (percent < 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal Weight', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  const overallPercent = (proteinPercent + carbsPercent + fatPercent + caloriesPercent + waterPercent) / 5;
  const statusColor = overallPercent < 50 ? 'bg-red-100' : overallPercent < 90 ? 'bg-yellow-100' : 'bg-green-100';
  const statusBorder = overallPercent < 50 ? 'border-red-500' : overallPercent < 90 ? 'border-yellow-500' : 'border-green-500';

  const combinedLogs = getCombinedLogs();
  const totalLogCount = logs.length + waterLogs.length;

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Daily Nutrition Tracker</h1>
            <p className="text-sm text-slate-600 mt-1">👤 {profile.email}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={switchUser}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Switch User
            </button>
          </div>
        </div>

        <div className={`${statusColor} border-4 ${statusBorder} rounded-lg p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Today&apos;s Progress</h2>
              <div className="text-3xl font-bold text-slate-700">
                {Math.round(overallPercent)}%
              </div>
              <div className="text-sm text-slate-600 mt-2">
                BMI: <span className={`font-bold ${getBMICategory(bmi).color}`}>{bmi.toFixed(1)}</span> ({getBMICategory(bmi).category})
              </div>
            </div>
            <div className="w-32 h-32 rounded-full border-8 flex items-center justify-center" 
                 style={{ borderColor: overallPercent < 50 ? '#ef4444' : overallPercent < 90 ? '#eab308' : '#22c55e' }}>
              <span className={`text-2xl font-bold ${getStatusColor(overallPercent)}`}>
                {Math.round(overallPercent)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Macronutrients</h3>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Protein</span>
                  <span className="text-sm font-semibold text-slate-800">{Math.round(totalProtein)}/{dailyGoals.protein}g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColor(proteinPercent)} transition-all`}
                    style={{ width: `${proteinPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Carbs</span>
                  <span className="text-sm font-semibold text-slate-800">{Math.round(totalCarbs)}/{dailyGoals.carbs}g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColor(carbsPercent)} transition-all`}
                    style={{ width: `${carbsPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Fat</span>
                  <span className="text-sm font-semibold text-slate-800">{Math.round(totalFat)}/{dailyGoals.fat}g</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColor(fatPercent)} transition-all`}
                    style={{ width: `${fatPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Calories</span>
                  <span className="text-sm font-semibold text-slate-800">{Math.round(totalCalories)}/{dailyGoals.calories}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColor(caloriesPercent)} transition-all`}
                    style={{ width: `${caloriesPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💧 Water Intake</h3>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Daily Goal</span>
                  <span className="text-sm font-semibold text-slate-800">{totalWater}/{dailyGoals.water}ml</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getColor(waterPercent)} transition-all`}
                    style={{ width: `${waterPercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Timing</label>
                  <select
                    value={waterTiming}
                    onChange={(e) => setWaterTiming(e.target.value)}
                    className="w-full px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="now">Now</option>
                    <option value="30">30 mins ago</option>
                    <option value="60">1 hour ago</option>
                    <option value="120">2 hours ago</option>
                    <option value="180">3 hours ago</option>
                    <option value="240">4 hours ago</option>
                    <option value="300">5 hours ago</option>
                    <option value="360">6 hours ago</option>
                    <option value="420">7 hours ago</option>
                    <option value="480">8 hours ago</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => addWater(250)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-2 py-2 rounded text-xs"
                  >
                    +250ml
                  </button>
                  <button
                    onClick={() => addWater(500)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-2 py-2 rounded text-xs"
                  >
                    +500ml
                  </button>
                  <button
                    onClick={() => addWater(1000)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-2 py-2 rounded text-xs"
                  >
                    +1L
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Remaining</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Protein:</span>
                  <span className="font-semibold text-slate-800">{Math.max(0, Math.round(dailyGoals.protein - totalProtein))}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Carbs:</span>
                  <span className="font-semibold text-slate-800">{Math.max(0, Math.round(dailyGoals.carbs - totalCarbs))}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Fat:</span>
                  <span className="font-semibold text-slate-800">{Math.max(0, Math.round(dailyGoals.fat - totalFat))}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Calories:</span>
                  <span className="font-semibold text-slate-800">{Math.max(0, Math.round(dailyGoals.calories - totalCalories))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Water:</span>
                  <span className="font-semibold text-slate-800">{Math.max(0, dailyGoals.water - totalWater)}ml</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-blue-900 mb-3">💪 Healthy Living Tips</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Drink water before, during, and after meals</li>
                <li>• Eat protein at every meal</li>
                <li>• Include fiber-rich foods</li>
                <li>• Limit processed foods</li>
                <li>• Exercise regularly</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Food</h3>
              <div className="space-y-4">
                <select
                  value={selectedFood.name}
                  onChange={(e) => {
                    const item = FOOD_DATABASE.find(f => f.name === e.target.value);
                    if (item) setSelectedFood(item);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FOOD_DATABASE.map((food) => (
                    <option key={food.name} value={food.name}>
                      {food.name}
                    </option>
                  ))}
                </select>

                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-700 mb-3">{selectedFood.name}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600">Protein:</span>
                      <span className="ml-2 font-semibold text-slate-800">{selectedFood.protein}g</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Carbs:</span>
                      <span className="ml-2 font-semibold text-slate-800">{selectedFood.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Fat:</span>
                      <span className="ml-2 font-semibold text-slate-800">{selectedFood.fat}g</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Calories:</span>
                      <span className="ml-2 font-semibold text-slate-800">{selectedFood.calories}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Timing</label>
                  <select
                    value={foodTiming}
                    onChange={(e) => setFoodTiming(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="now">Now</option>
                    <option value="30">30 mins ago</option>
                    <option value="60">1 hour ago</option>
                    <option value="120">2 hours ago</option>
                    <option value="180">3 hours ago</option>
                  </select>
                </div>

                <button
                  onClick={addFood}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Add to Today
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Today&apos;s Log ({totalLogCount})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {combinedLogs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No logs yet. Add food or water to get started!</p>
                ) : (
                  combinedLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        entry.type === 'food'
                          ? 'bg-slate-50 border-slate-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex-1">
                        {entry.type === 'food' ? (
                          <>
                            <div className="font-medium text-slate-800">{entry.item.name}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              P: {entry.item.protein}g | C: {entry.item.carbs}g | F: {entry.item.fat}g | {entry.item.calories} cal
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium text-blue-800">💧 Water</div>
                            <div className="text-xs text-blue-600 mt-1">
                              {entry.amount}ml
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-sm font-medium mr-3" style={entry.type === 'food' ? { color: '#64748b' } : { color: '#0369a1' }}>
                        {getFormattedTime(entry.timestamp)}
                      </div>
                      <button
                        onClick={() => removeCombinedEntry(entry.id, entry.type)}
                        className={`font-semibold px-3 py-1 rounded text-sm transition-colors ${
                          entry.type === 'food'
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-red-100 hover:bg-red-200 text-red-600'
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{profile ? 'Edit' : 'Create'} Health Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sedentary">Sedentary (little exercise)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (athlete)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveProfile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
