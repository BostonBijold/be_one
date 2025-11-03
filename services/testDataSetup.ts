import dataService from './dataService';

/**
 * Creates test data for demonstrating habit features
 * - 3 habits with different duration configurations
 * - 7 days of completion data showing different patterns
 * - Includes excused days, missed days, and varied completion times
 */
export async function createTestData() {
  try {
    console.log('Starting test data creation...');

    // ===== HABIT 1: Morning Walk (No duration specified, defaults to 10 min) =====
    const habit1 = await dataService.addSingleHabit({
      name: 'Morning Walk',
      description: 'Take a 30-minute walk to start the day',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: null,
      excusable: true,
      // No expectedDuration specified - will default to 10 min
    });
    console.log('Created Habit 1 (Morning Walk):', habit1);

    // ===== HABIT 2: Read (15 min expected, with average duration) =====
    const habit2 = await dataService.addSingleHabit({
      name: 'Read',
      description: 'Read a chapter of a book',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: null,
      excusable: true,
      expectedDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    });
    console.log('Created Habit 2 (Read):', habit2);

    // ===== HABIT 3: Meditate (5 min expected, with varied times) =====
    const habit3 = await dataService.addSingleHabit({
      name: 'Meditate',
      description: 'Daily meditation practice',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: null,
      excusable: true,
      expectedDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
    });
    console.log('Created Habit 3 (Meditate):', habit3);

    const today = new Date();
    const todayString = dataService.getTodayString();

    // ===== CREATE 7 DAYS OF DATA =====
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateString = formatDate(date);

      console.log(`\nCreating data for ${dateString}...`);

      // Get existing daily data or create new
      let dailyData = await dataService.getTodayData(dateString);
      if (!dailyData) {
        dailyData = {
          date: dateString,
          habitCompletions: {},
          routineCompletions: {},
        };
      }

      // ===== HABIT 1: 100% completion (all 7 days) =====
      const habit1StartMs = new Date(date.getTime() + 8 * 60 * 60 * 1000).getTime(); // 8 AM
      const habit1DurationMs = 25 * 60 * 1000; // 25 minutes
      const habit1EndMs = habit1StartMs + habit1DurationMs;

      dailyData.habitCompletions[habit1.id] = {
        completed: true,
        completedAt: new Date(habit1EndMs).toISOString(),
        duration: habit1DurationMs,
        startTime: new Date(habit1StartMs).toISOString(),
        endTime: new Date(habit1EndMs).toISOString(),
        notes: '',
      };

      // ===== HABIT 2: 75% (5/7 completed, 1/7 excused, 1/7 missed) =====
      if (daysAgo === 4) {
        // Day 4: Excused (Sick Day)
        dailyData.habitCompletions[habit2.id] = {
          completed: false,
          completedAt: null,
          duration: null,
          startTime: null,
          endTime: null,
          notes: '',
          excused: true,
          excuseReason: 'Sick Day',
        };
      } else if (daysAgo === 2) {
        // Day 2: Missed (no entry)
        // Don't add anything for this day
      } else {
        // Days 0,1,3,5,6: Completed with varied times
        const habit2StartMs = new Date(date.getTime() + 19 * 60 * 60 * 1000).getTime(); // 7 PM
        // Vary duration: some under 15 min, some over
        let habit2DurationMs;
        if (daysAgo === 6) habit2DurationMs = 12 * 60 * 1000; // 12 min (under)
        else if (daysAgo === 5) habit2DurationMs = 18 * 60 * 1000; // 18 min (over)
        else if (daysAgo === 3) habit2DurationMs = 14 * 60 * 1000; // 14 min (under)
        else if (daysAgo === 1) habit2DurationMs = 20 * 60 * 1000; // 20 min (over)
        else habit2DurationMs = 15 * 60 * 1000; // 15 min (exact)

        const habit2EndMs = habit2StartMs + habit2DurationMs;

        dailyData.habitCompletions[habit2.id] = {
          completed: true,
          completedAt: new Date(habit2EndMs).toISOString(),
          duration: habit2DurationMs,
          startTime: new Date(habit2StartMs).toISOString(),
          endTime: new Date(habit2EndMs).toISOString(),
          notes: '',
        };
      }

      // ===== HABIT 3: 50% (3/7 completed with varied times) =====
      if (daysAgo === 6 || daysAgo === 3 || daysAgo === 0) {
        // Complete on days 0, 3, 6
        const habit3StartMs = new Date(date.getTime() + 6 * 60 * 60 * 1000).getTime(); // 6 AM
        // Vary duration: some way under, some way over 5 min
        let habit3DurationMs;
        if (daysAgo === 6) habit3DurationMs = 3 * 60 * 1000; // 3 min (way under)
        else if (daysAgo === 3) habit3DurationMs = 7 * 60 * 1000; // 7 min (way over)
        else habit3DurationMs = 5 * 60 * 1000; // 5 min (exact)

        const habit3EndMs = habit3StartMs + habit3DurationMs;

        dailyData.habitCompletions[habit3.id] = {
          completed: true,
          completedAt: new Date(habit3EndMs).toISOString(),
          duration: habit3DurationMs,
          startTime: new Date(habit3StartMs).toISOString(),
          endTime: new Date(habit3EndMs).toISOString(),
          notes: '',
        };
      }
      // Otherwise missed (no entry)

      // Save daily data
      await dataService.updateDailyData(dateString, dailyData);
      console.log(`Saved data for ${dateString}`);
    }

    // ===== UPDATE HABIT AGGREGATES =====
    // Habit 1: 7 completions, all 25 min
    const habit1Sum = 25 * 60 * 1000 * 7;
    await dataService.updateHabit(habit1.id, {
      totalDurationSum: habit1Sum,
      completionCount: 7,
    });
    console.log(`\nUpdated Habit 1 aggregates: 7 completions, avg ${(habit1Sum / 7000 / 60).toFixed(1)} min`);

    // Habit 2: 5 completions (excused day doesn't count)
    // Durations: 12, 18, 14, 20, 15 minutes
    const habit2Durations = [12, 18, 14, 20, 15];
    const habit2Sum = (12 + 18 + 14 + 20 + 15) * 60 * 1000;
    await dataService.updateHabit(habit2.id, {
      totalDurationSum: habit2Sum,
      completionCount: 5,
    });
    console.log(`Updated Habit 2 aggregates: 5 completions, avg ${(habit2Sum / 5000 / 60).toFixed(1)} min`);

    // Habit 3: 3 completions
    // Durations: 3, 7, 5 minutes
    const habit3Sum = (3 + 7 + 5) * 60 * 1000;
    await dataService.updateHabit(habit3.id, {
      totalDurationSum: habit3Sum,
      completionCount: 3,
    });
    console.log(`Updated Habit 3 aggregates: 3 completions, avg ${(habit3Sum / 3000 / 60).toFixed(1)} min`);

    console.log('\n✅ Test data created successfully!');
    console.log('\nSummary:');
    console.log('--------');
    console.log('Habit 1 (Morning Walk): 7/7 completed (100%) - avg 25 min');
    console.log('Habit 2 (Read): 5/7 completed, 1 excused, 1 missed (75%) - avg 15.8 min');
    console.log('Habit 3 (Meditate): 3/7 completed, 4 missed (50%) - avg 5 min');
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}

/**
 * Formats a date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deletes the test data (the 3 test habits)
 */
export async function deleteTestData() {
  try {
    console.log('Deleting test data...');

    const habits = await dataService.getHabits();

    // Find the test habits by name
    const testHabitNames = ['Morning Walk', 'Read', 'Meditate'];
    const testHabits = habits.filter(h => testHabitNames.includes(h.name));

    if (testHabits.length === 0) {
      console.log('No test habits found to delete');
      return;
    }

    // Delete each test habit
    for (const habit of testHabits) {
      await dataService.deleteHabit(habit.id);
      console.log(`Deleted habit: ${habit.name}`);
    }

    console.log(`✅ Deleted ${testHabits.length} test habits`);
  } catch (error) {
    console.error('Error deleting test data:', error);
    throw error;
  }
}
