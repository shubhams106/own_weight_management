'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Exercise {
  id: string;
  name: 'boxing' | 'cycle' | 'gym' | 'walk' | 'swimming';
  intensity: 'low' | 'moderate' | 'high';
  duration: number; // minutes
  date: string;
  time: string;
}

const EXERCISE_DATA = {
  boxing: { low: 8, moderate: 12, high: 16 },
  cycle: { low: 8, moderate: 12, high: 16 },
  gym: { low: 6, moderate: 10, high: 14 },
  walk: { low: 3, moderate: 5, high: 8 },
  swimming: { low: 9, moderate: 12, high: 15 },
};

const EXERCISE_LABELS = {
  boxing: '🥊 Boxing',
  cycle: '🚴 Cycling',
  gym: '🏋️ Gym',
  walk: '🚶 Walking',
  swimming: '🏊 Swimming',
};

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const isSameMonth = (left: Date, right: Date) => {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
};

const isFutureDate = (dateStr: string) => {
  const date = parseLocalDate(dateStr);
  return date > startOfToday();
};

const calculateDailyCalories = (profile: { height: number; weight: number; age: number; gender: 'male' | 'female'; activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' }) => {
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

const getProgressColor = (percent: number) => {
  if (percent < 50) return '#ef4444';
  if (percent < 90) return '#eab308';
  return '#22c55e';
};

const getProgressTextColor = (percent: number) => {
  if (percent < 50) return '#ffffff';
  if (percent < 90) return '#1e293b';
  return '#ffffff';
};

export default function MonthlyView() {
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('exercises');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [selectedExercise, setSelectedExercise] = useState<'boxing' | 'cycle' | 'gym' | 'walk' | 'swimming'>('gym');
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const todayKey = formatLocalDate(startOfToday());
  // Initial exercises are loaded via lazy useState initializer to avoid
  // calling setState synchronously inside an effect.

  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  const addExercise = () => {
    if (isFutureDate(selectedDate)) {
      return;
    }
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const newExercise: Exercise = {
      id: `${Date.now()}`,
      name: selectedExercise,
      intensity: selectedIntensity,
      duration: selectedDuration,
      date: selectedDate,
      time,
    };
    setExercises(currentExercises => [...currentExercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(currentExercises => currentExercises.filter(e => e.id !== id));
  };

  const calculateCalories = (exercise: Exercise) => {
    const caloriesPerMinute = EXERCISE_DATA[exercise.name][exercise.intensity];
    return caloriesPerMinute * exercise.duration;
  };

  const getExercisesByDate = (date: string) => {
    return exercises.filter(e => e.date === date);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(formatLocalDate(date));
    }
    return days;
  };

  const getTotalCaloriesForDate = (date: string) => {
    return getExercisesByDate(date).reduce((sum, ex) => sum + calculateCalories(ex), 0);
  };

  const selectedDateExercises = getExercisesByDate(selectedDate);
  const totalCaloriesSelected = selectedDateExercises.reduce((sum, ex) => sum + calculateCalories(ex), 0);

  const getDailyProgressForDate = (dateStr: string) => {
    if (typeof window === 'undefined') return 0;

    try {
      const savedProfile = localStorage.getItem('currentUser');
      if (!savedProfile) return 0;

      const profile = JSON.parse(savedProfile) as {
        email: string;
        height: number;
        weight: number;
        age: number;
        gender: 'male' | 'female';
        activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
      };

      const savedNutritionLogs = localStorage.getItem(`nutritionLogs_${profile.email}`);
      const savedWaterLogs = localStorage.getItem(`waterLogs_${profile.email}`);
      const nutritionLogs = savedNutritionLogs ? JSON.parse(savedNutritionLogs) : [];
      const waterLogs = savedWaterLogs ? JSON.parse(savedWaterLogs) : [];

      const dailyCalories = calculateDailyCalories(profile);
      const dailyWater = Math.round(profile.weight * 35);
      const proteinGoal = Math.round(profile.weight * 1.6);
      const carbsGoal = Math.round((dailyCalories * 0.45) / 4);
      const fatGoal = Math.round((dailyCalories * 0.3) / 9);

      const dayNutritionLogs = nutritionLogs.filter((log: any) => formatLocalDate(new Date(log.timestamp)) === dateStr);
      const dayWaterLogs = waterLogs.filter((log: any) => formatLocalDate(new Date(log.timestamp)) === dateStr);

      const totalProtein = dayNutritionLogs.reduce((sum: number, log: any) => sum + log.item.protein, 0);
      const totalCarbs = dayNutritionLogs.reduce((sum: number, log: any) => sum + log.item.carbs, 0);
      const totalFat = dayNutritionLogs.reduce((sum: number, log: any) => sum + log.item.fat, 0);
      const totalCaloriesForDay = dayNutritionLogs.reduce((sum: number, log: any) => sum + log.item.calories, 0);
      const totalWater = dayWaterLogs.reduce((sum: number, log: any) => sum + log.amount, 0);

      const proteinPercent = Math.min((totalProtein / proteinGoal) * 100, 100);
      const carbsPercent = Math.min((totalCarbs / carbsGoal) * 100, 100);
      const fatPercent = Math.min((totalFat / fatGoal) * 100, 100);
      const caloriesPercent = Math.min((totalCaloriesForDay / dailyCalories) * 100, 100);
      const waterPercent = Math.min((totalWater / dailyWater) * 100, 100);

      return (proteinPercent + carbsPercent + fatPercent + caloriesPercent + waterPercent) / 5;
    } catch {
      return 0;
    }
  };

  const selectedDateProgress = getDailyProgressForDate(selectedDate);
  const selectedDateHasProgress = selectedDateProgress > 0;
  const selectedProgressColor = selectedDateHasProgress ? getProgressColor(selectedDateProgress) : '#cbd5e1';
  const selectedProgressTextColor = selectedDateHasProgress ? getProgressTextColor(selectedDateProgress) : '#1e293b';

  const days = getDaysInMonth();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthYearDisplay = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = isSameMonth(currentMonth, new Date());
  const goToPreviousMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToCurrentMonth = () => {
    setCurrentMonth(new Date());
    setSelectedDate(todayKey);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Monthly Exercise Tracker</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-800">{monthYearDisplay}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  ← Last month
                </button>
                <button
                  onClick={resetToCurrentMonth}
                  className="px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  disabled={isCurrentMonth}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    isCurrentMonth
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Next month →
                </button>
              </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center font-semibold text-slate-600 py-2 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((dateStr, index) => {
                if (!dateStr) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }
                const dayExercises = getExercisesByDate(dateStr);
                const totalCalories = getTotalCaloriesForDate(dateStr);
                const dayProgress = getDailyProgressForDate(dateStr);
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayKey;
                const future = isFutureDate(dateStr);
                const progressColor = dayProgress > 0 ? getProgressColor(dayProgress) : undefined;
                const progressTextColor = dayProgress > 0 ? getProgressTextColor(dayProgress) : undefined;

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (!future) {
                        setSelectedDate(dateStr);
                        router.push(`/?date=${dateStr}`);
                      }
                    }}
                    disabled={future}
                    style={
                      !future && dayProgress > 0
                        ? {
                            backgroundColor: progressColor,
                            color: progressTextColor,
                          }
                        : undefined
                    }
                    className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                      future
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 cursor-pointer'
                        : isToday
                        ? 'border-green-500 cursor-pointer'
                        : 'border-slate-200 cursor-pointer hover:border-blue-400'
                    }`}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div className={`text-base font-bold ${future ? 'text-slate-400' : dayProgress > 0 && !isSelected ? '' : 'text-slate-800'}`}>
                        {dateStr.split('-')[2]}
                      </div>
                      {dayProgress > 0 && (
                        <div
                          className="rounded-full px-1.5 py-0.5 text-[16px] font-bold"
                          style={{
                            backgroundColor: dayProgress > 0 ? 'rgba(255, 255, 255, 0.4)' : undefined,
                            color: progressTextColor,
                          }}
                        >
                          {Math.round(dayProgress)}%
                        </div>
                      )}
                      {totalCalories > 0 && (
                        <div className={`text-[12px] font-semibold mt-2 ${future ? 'text-slate-400' : dayProgress > 0 && !isSelected ? '' : 'text-orange-600'}`}>
                          {totalCalories} cal
                        </div>
                      )}
                      
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise Entry */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Exercise</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={todayKey}
                  max={todayKey}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Only today and past dates can be logged.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Exercise Type</label>
                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="boxing">🥊 Boxing</option>
                  <option value="cycle">🚴 Cycling</option>
                  <option value="gym">🏋️ Gym</option>
                  <option value="walk">🚶 Walking</option>
                  <option value="swimming">🏊 Swimming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Intensity</label>
                <div className="flex gap-2">
                  {(['low', 'moderate', 'high'] as const).map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setSelectedIntensity(intensity)}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                        selectedIntensity === intensity
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Math.max(5, parseInt(e.target.value) || 5))}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="py-2 px-3 bg-slate-100 rounded-lg text-sm font-medium text-slate-700">
                    min
                  </span>
                </div>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(dur => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`flex-1 py-1 px-2 rounded text-sm font-medium transition-all ${
                        selectedDuration === dur
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-slate-600 mb-1">Estimated Calories Burned</div>
                <div className="text-2xl font-bold text-blue-600">
                  {EXERCISE_DATA[selectedExercise][selectedIntensity] * selectedDuration}
                </div>
              </div>

              <button
                onClick={addExercise}
                disabled={isFutureDate(selectedDate)}
                className={`w-full font-semibold py-2 px-4 rounded-lg transition-colors ${
                  isFutureDate(selectedDate)
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Add Exercise
              </button>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Exercises for {parseLocalDate(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Daily progress</span>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: selectedProgressColor, color: selectedProgressTextColor }}
              >
                {selectedDateHasProgress ? `${Math.round(selectedDateProgress)}%` : 'No data'}
              </span>
            </div>
          </div>
          {totalCaloriesSelected > 0 && (
            <div className="mb-4 text-2xl font-bold text-orange-600">
              {totalCaloriesSelected} cal
            </div>
          )}

          {selectedDateExercises.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No exercises logged for this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedDateExercises.map(exercise => {
                const calories = calculateCalories(exercise);
                return (
                  <div key={exercise.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {EXERCISE_LABELS[exercise.name].split(' ')[0]}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {EXERCISE_LABELS[exercise.name]}
                          </div>
                          <div className="text-sm text-slate-600">
                            {exercise.duration} min • {exercise.intensity.charAt(0).toUpperCase() + exercise.intensity.slice(1)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-lg font-bold text-orange-600">{calories}</div>
                      <div className="text-xs text-slate-600">calories</div>
                    </div>
                    <div className="text-sm text-slate-600 mr-4">{exercise.time}</div>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold px-3 py-1 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Total Exercises This Month</h4>
            <div className="text-3xl font-bold text-slate-800">{exercises.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Total Calories Burned</h4>
            <div className="text-3xl font-bold text-orange-600">
              {exercises.reduce((sum, ex) => sum + calculateCalories(ex), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-semibold text-slate-600 mb-2">Average Duration</h4>
            <div className="text-3xl font-bold text-blue-600">
              {exercises.length > 0 ? Math.round(exercises.reduce((sum, ex) => sum + ex.duration, 0) / exercises.length) : 0}
              <span className="text-lg text-slate-600 ml-1">min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
