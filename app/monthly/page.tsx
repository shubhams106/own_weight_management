'use client';

import { useState, useEffect } from 'react';

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

export default function MonthlyView() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // const [exercises, setExercises] = useState<Exercise[]>(() => {
  //   const saved = localStorage.getItem('exercises');
  //   return saved ? JSON.parse(saved) : [];
  // });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExercise, setSelectedExercise] = useState<'boxing' | 'cycle' | 'gym' | 'walk' | 'swimming'>('gym');
  const [selectedIntensity, setSelectedIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [selectedDuration, setSelectedDuration] = useState(30);
  useEffect(() => {
  const saved = localStorage.getItem('exercises');
  if (saved) {
    setExercises(JSON.parse(saved));
  }
}, []);

  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  const addExercise = () => {
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
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(e => e.id !== id));
  };

  const calculateCalories = (exercise: Exercise) => {
    const caloriesPerMinute = EXERCISE_DATA[exercise.name][exercise.intensity];
    return caloriesPerMinute * exercise.duration;
  };

  const getExercisesByDate = (date: string) => {
    return exercises.filter(e => e.date === date);
  };

  const getDaysInMonth = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push(dateStr);
    }
    return days;
  };

  const getTotalCaloriesForDate = (date: string) => {
    return getExercisesByDate(date).reduce((sum, ex) => sum + calculateCalories(ex), 0);
  };

  const getMonthYearDisplay = () => {
    const today = new Date();
    return today.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const selectedDateExercises = getExercisesByDate(selectedDate);
  const totalCaloriesSelected = selectedDateExercises.reduce((sum, ex) => sum + calculateCalories(ex), 0);

  const days = getDaysInMonth();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Monthly Exercise Tracker</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">{getMonthYearDisplay()}</h2>

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
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === new Date().toISOString().split('T')[0];

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : isToday
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 bg-white'
                    } hover:border-blue-400`}
                  >
                    <div className="h-full flex flex-col justify-between">
                      <div className="text-sm font-semibold text-slate-800">
                        {dateStr.split('-')[2]}
                      </div>
                      {totalCalories > 0 && (
                        <div className="text-xs font-semibold text-orange-600">
                          {totalCalories} cal
                        </div>
                      )}
                      {dayExercises.length > 0 && (
                        <div className="text-xs text-slate-600">
                          {dayExercises.length} {dayExercises.length === 1 ? 'exercise' : 'exercises'}
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
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
              Exercises for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            {totalCaloriesSelected > 0 && (
              <div className="text-2xl font-bold text-orange-600">
                {totalCaloriesSelected} cal
              </div>
            )}
          </div>

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
