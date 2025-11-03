import dataService from './dataService';

/**
 * Creates test data for demonstrating habit and routine features
 * - 1 routine with 3 habits with different duration configurations
 * - 7 days of routine completion data showing different patterns
 * - Includes perfect days, partial days, excused days, missed days, and varied completion times
 * - Perfect for testing Reports, History, and Statistics views
 */
export async function createTestData() {
  try {
    console.log('Starting test data creation...');

    // ===== CREATE ROUTINE =====
    const routine = await dataService.addRoutine({
      name: 'Morning Ritual',
      description: 'Daily morning routine',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      timeOfDay: '6:00 AM',
      habits: [], // Will add habits after creation
    });
    console.log('Created Routine (Morning Ritual):', routine);

    // ===== HABIT 1: Exercise (Within routine, 20-30 min range) =====
    const habit1 = await dataService.addSingleHabit({
      name: 'Exercise',
      description: 'Morning workout - running, weights, or yoga',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: routine.id,
      excusable: true,
      expectedDuration: 25 * 60 * 1000, // 25 minutes expected
    });
    console.log('Created Habit 1 (Exercise):', habit1);

    // ===== HABIT 2: Cold Shower (10-15 min, quick) =====
    const habit2 = await dataService.addSingleHabit({
      name: 'Cold Shower',
      description: 'Invigorating cold water shower',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: routine.id,
      excusable: false, // Not excusable
      expectedDuration: 10 * 60 * 1000, // 10 minutes expected
    });
    console.log('Created Habit 2 (Cold Shower):', habit2);

    // ===== HABIT 3: Journaling (5-10 min, very quick) =====
    const habit3 = await dataService.addSingleHabit({
      name: 'Journaling',
      description: 'Write thoughts and intentions for the day',
      trackingType: 'timer',
      duration: null,
      expectedCompletionTime: null,
      routineId: routine.id,
      excusable: true,
      expectedDuration: 7 * 60 * 1000, // 7 minutes expected
    });
    console.log('Created Habit 3 (Journaling):', habit3);

    // ===== ADD HABITS TO ROUTINE =====
    await dataService.updateRoutine(routine.id, {
      habits: [habit1.id, habit2.id, habit3.id],
    });
    console.log('Added habits to routine');

    const today = new Date();
    const todayString = dataService.getTodayString();

    // ===== CREATE 7 DAYS OF ROUTINE COMPLETION DATA =====
    // Pattern:
    // - Days 6,5: Perfect completions (all 3 habits)
    // - Day 4: Partial (Exercise + Journaling, Shower excused)
    // - Day 3: Partial (Exercise + Cold Shower, Journaling missed)
    // - Day 2: Completely missed (no completions)
    // - Day 1: Perfect completion (all 3 habits)
    // - Day 0: Partial (only Exercise)
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateString = formatDate(date);

      console.log(`\nCreating routine data for ${dateString}...`);

      // Get existing daily data or create new
      let dailyData = await dataService.getTodayData(dateString);
      if (!dailyData) {
        dailyData = {
          date: dateString,
          habitCompletions: {},
          routineCompletions: {},
        };
      }

      // Base start time for routine (6 AM)
      const baseStartMs = new Date(date.getTime() + 6 * 60 * 60 * 1000).getTime();

      // ===== DAY LOGIC =====
      if (daysAgo === 2) {
        // Day 2: Completely missed routine - no habit completions
        console.log(`  Day ${7 - daysAgo}: MISSED (no completion)`);
      } else if (daysAgo === 4) {
        // Day 4: Partial - Exercise + Journaling, Shower excused
        console.log(`  Day ${7 - daysAgo}: PARTIAL (Exercise + Journal, Shower excused)`);

        // Exercise: 23 minutes
        const habit1StartMs = baseStartMs;
        const habit1DurationMs = 23 * 60 * 1000;
        const habit1EndMs = habit1StartMs + habit1DurationMs;
        dailyData.habitCompletions[habit1.id] = {
          completed: true,
          completedAt: new Date(habit1EndMs).toISOString(),
          duration: habit1DurationMs,
          startTime: new Date(habit1StartMs).toISOString(),
          endTime: new Date(habit1EndMs).toISOString(),
          notes: '',
        };

        // Cold Shower: EXCUSED (Work Conflict)
        dailyData.habitCompletions[habit2.id] = {
          completed: false,
          completedAt: null,
          duration: null,
          startTime: null,
          endTime: null,
          notes: '',
          excused: true,
          excuseReason: 'Work Conflict',
        };

        // Journaling: 6 minutes
        const habit3StartMs = habit1EndMs + 2 * 60 * 1000; // 2 min break
        const habit3DurationMs = 6 * 60 * 1000;
        const habit3EndMs = habit3StartMs + habit3DurationMs;
        dailyData.habitCompletions[habit3.id] = {
          completed: true,
          completedAt: new Date(habit3EndMs).toISOString(),
          duration: habit3DurationMs,
          startTime: new Date(habit3StartMs).toISOString(),
          endTime: new Date(habit3EndMs).toISOString(),
          notes: '',
        };
      } else if (daysAgo === 3) {
        // Day 3: Partial - Exercise + Shower, Journaling missed
        console.log(`  Day ${7 - daysAgo}: PARTIAL (Exercise + Shower, Journal missed)`);

        // Exercise: 26 minutes
        const habit1StartMs = baseStartMs;
        const habit1DurationMs = 26 * 60 * 1000;
        const habit1EndMs = habit1StartMs + habit1DurationMs;
        dailyData.habitCompletions[habit1.id] = {
          completed: true,
          completedAt: new Date(habit1EndMs).toISOString(),
          duration: habit1DurationMs,
          startTime: new Date(habit1StartMs).toISOString(),
          endTime: new Date(habit1EndMs).toISOString(),
          notes: '',
        };

        // Cold Shower: 12 minutes
        const habit2StartMs = habit1EndMs + 1 * 60 * 1000; // 1 min break
        const habit2DurationMs = 12 * 60 * 1000;
        const habit2EndMs = habit2StartMs + habit2DurationMs;
        dailyData.habitCompletions[habit2.id] = {
          completed: true,
          completedAt: new Date(habit2EndMs).toISOString(),
          duration: habit2DurationMs,
          startTime: new Date(habit2StartMs).toISOString(),
          endTime: new Date(habit2EndMs).toISOString(),
          notes: '',
        };

        // Journaling: MISSED (no entry)
      } else if (daysAgo === 0) {
        // Day 0 (Today): Partial - Only Exercise so far
        console.log(`  Day ${7 - daysAgo}: PARTIAL (Exercise only, in progress)`);

        // Exercise: 25 minutes (completed)
        const habit1StartMs = baseStartMs;
        const habit1DurationMs = 25 * 60 * 1000;
        const habit1EndMs = habit1StartMs + habit1DurationMs;
        dailyData.habitCompletions[habit1.id] = {
          completed: true,
          completedAt: new Date(habit1EndMs).toISOString(),
          duration: habit1DurationMs,
          startTime: new Date(habit1StartMs).toISOString(),
          endTime: new Date(habit1EndMs).toISOString(),
          notes: 'Great workout!',
        };

        // Cold Shower and Journaling: not started
      } else {
        // Days 6, 5, 1: Perfect completions (all 3 habits)
        console.log(`  Day ${7 - daysAgo}: PERFECT (all 3 habits)`);

        // Vary times to show different durations
        let exerciseDuration, showerDuration, journalDuration;
        if (daysAgo === 6) {
          exerciseDuration = 22 * 60 * 1000; // Under average
          showerDuration = 11 * 60 * 1000;
          journalDuration = 6 * 60 * 1000;
        } else if (daysAgo === 5) {
          exerciseDuration = 28 * 60 * 1000; // Over average
          showerDuration = 9 * 60 * 1000;
          journalDuration = 8 * 60 * 1000;
        } else {
          // Day 1: Exact averages
          exerciseDuration = 25 * 60 * 1000;
          showerDuration = 10 * 60 * 1000;
          journalDuration = 7 * 60 * 1000;
        }

        // Exercise
        const habit1StartMs = baseStartMs;
        const habit1EndMs = habit1StartMs + exerciseDuration;
        dailyData.habitCompletions[habit1.id] = {
          completed: true,
          completedAt: new Date(habit1EndMs).toISOString(),
          duration: exerciseDuration,
          startTime: new Date(habit1StartMs).toISOString(),
          endTime: new Date(habit1EndMs).toISOString(),
          notes: '',
        };

        // Cold Shower
        const habit2StartMs = habit1EndMs + 1 * 60 * 1000;
        const habit2EndMs = habit2StartMs + showerDuration;
        dailyData.habitCompletions[habit2.id] = {
          completed: true,
          completedAt: new Date(habit2EndMs).toISOString(),
          duration: showerDuration,
          startTime: new Date(habit2StartMs).toISOString(),
          endTime: new Date(habit2EndMs).toISOString(),
          notes: '',
        };

        // Journaling
        const habit3StartMs = habit2EndMs + 1 * 60 * 1000;
        const habit3EndMs = habit3StartMs + journalDuration;
        dailyData.habitCompletions[habit3.id] = {
          completed: true,
          completedAt: new Date(habit3EndMs).toISOString(),
          duration: journalDuration,
          startTime: new Date(habit3StartMs).toISOString(),
          endTime: new Date(habit3EndMs).toISOString(),
          notes: '',
        };
      }

      // ===== CREATE ROUTINE COMPLETION DATA =====
      // Create routine completion for any day that isn't completely missed
      // Completely missed = day 2 (daysAgo === 2)
      if (daysAgo !== 2) {
        // Get all habit completions for this day
        const habit1Completion = dailyData.habitCompletions[habit1.id];
        const habit2Completion = dailyData.habitCompletions[habit2.id];
        const habit3Completion = dailyData.habitCompletions[habit3.id];

        // Find earliest start time and latest end time from completed habits
        const completedTimes = [habit1Completion, habit2Completion, habit3Completion]
          .filter(c => c && c.completed && c.startTime && c.endTime);

        if (completedTimes.length > 0) {
          const startTimeMs = Math.min(...completedTimes.map(c => new Date(c.startTime!).getTime()));
          const endTimeMs = Math.max(...completedTimes.map(c => new Date(c.endTime!).getTime()));
          const totalDurationMs = endTimeMs - startTimeMs;

          // Build habitTimes only for completed habits
          const habitTimes: any = {};
          if (habit1Completion?.completed && habit1Completion.startTime && habit1Completion.endTime) {
            habitTimes[habit1.id] = {
              startTime: habit1Completion.startTime,
              endTime: habit1Completion.endTime,
              duration: habit1Completion.duration || 0,
            };
          }
          if (habit2Completion?.completed && habit2Completion.startTime && habit2Completion.endTime) {
            habitTimes[habit2.id] = {
              startTime: habit2Completion.startTime,
              endTime: habit2Completion.endTime,
              duration: habit2Completion.duration || 0,
            };
          }
          if (habit3Completion?.completed && habit3Completion.startTime && habit3Completion.endTime) {
            habitTimes[habit3.id] = {
              startTime: habit3Completion.startTime,
              endTime: habit3Completion.endTime,
              duration: habit3Completion.duration || 0,
            };
          }

          dailyData.routineCompletions[routine.id] = {
            completed: true,
            completedAt: new Date(endTimeMs).toISOString(),
            totalDuration: totalDurationMs,
            startTime: new Date(startTimeMs).toISOString(),
            endTime: new Date(endTimeMs).toISOString(),
            habitTimes,
          };
          console.log(`  Recorded routine completion: ${formatTime(Math.floor(totalDurationMs / 1000))}`);
        }
      }

      // Save daily data
      await dataService.updateDailyData(dateString, dailyData);
      console.log(`  Saved data for ${dateString}`);
    }

    // ===== UPDATE HABIT AGGREGATES =====
    // Habit 1 (Exercise): 6/7 completions
    // Durations: Day 6: 22, Day 5: 28, Day 4: 23, Day 3: 26, Day 1: 25, Day 0: 25 (missed day 2)
    const habit1Sum = (22 + 28 + 23 + 26 + 25 + 25) * 60 * 1000;
    await dataService.updateHabit(habit1.id, {
      totalDurationSum: habit1Sum,
      completionCount: 6,
    });
    console.log(`\nUpdated Habit 1 (Exercise): 6/7 completions, avg ${(habit1Sum / 6000 / 60).toFixed(1)} min`);

    // Habit 2 (Cold Shower): 4/7 completions (missed days 0, 2, 4)
    // Durations: Day 6: 11, Day 5: 9, Day 3: 12, Day 1: 10
    const habit2Sum = (11 + 9 + 12 + 10) * 60 * 1000;
    await dataService.updateHabit(habit2.id, {
      totalDurationSum: habit2Sum,
      completionCount: 4,
    });
    console.log(`Updated Habit 2 (Cold Shower): 4/7 completions, avg ${(habit2Sum / 4000 / 60).toFixed(1)} min`);

    // Habit 3 (Journaling): 5/7 completions (missed days 2, 3)
    // Durations: Day 6: 6, Day 5: 8, Day 4: 6, Day 1: 7, Day 0: 7 (missed days 2, 3)
    const habit3Sum = (6 + 8 + 6 + 7 + 7) * 60 * 1000;
    await dataService.updateHabit(habit3.id, {
      totalDurationSum: habit3Sum,
      completionCount: 5,
    });
    console.log(`Updated Habit 3 (Journaling): 5/7 completions, avg ${(habit3Sum / 5000 / 60).toFixed(1)} min`);

    // ===== UPDATE ROUTINE AGGREGATES =====
    // Routine (Morning Ritual): 3 perfect completions (days 6, 5, 1)
    // Routine times: Day 6: 39 min, Day 5: 45 min, Day 1: 42 min
    const routineSum = (39 + 45 + 42) * 60 * 1000;
    await dataService.updateRoutine(routine.id, {
      totalDurationSum: routineSum,
      completionCount: 3,
    });
    console.log(`Updated Routine (Morning Ritual): 3/7 perfect completions, avg ${(routineSum / 3000 / 60).toFixed(1)} min`);

    console.log('\n✅ Test data created successfully!');
    console.log('\nTest Data Summary:');
    console.log('==================');
    console.log('\nRoutine: Morning Ritual');
    console.log('  Habits: Exercise, Cold Shower, Journaling');
    console.log('  Days: Every day (all 7 days)');
    console.log('  Time: 6:00 AM');
    console.log('\nCompletion Breakdown (7 days):');
    console.log('  Day 6: Perfect (all 3 habits) - 39 min');
    console.log('  Day 5: Perfect (all 3 habits) - 45 min');
    console.log('  Day 4: Partial (Exercise + Journal, Shower excused) - 29 min');
    console.log('  Day 3: Partial (Exercise + Shower, Journal missed) - 38 min');
    console.log('  Day 2: Missed (no completions) - 0 min');
    console.log('  Day 1: Perfect (all 3 habits) - 42 min');
    console.log('  Day 0: Partial (Exercise only, in progress) - 25 min');
    console.log('\nHabit Stats:');
    console.log('  Exercise: 6/7 completed (86%) - avg 25 min');
    console.log('  Cold Shower: 4/7 completed (57%) - avg 10.5 min');
    console.log('  Journaling: 5/7 completed (71%) - avg 6.8 min');
    console.log('\nRoutine Stats:');
    console.log('  Perfect days: 3/7 (43%) - avg 42 min per complete day');
    console.log('\nPerfect for testing:');
    console.log('  ✓ Reports view with varying habit times');
    console.log('  ✓ History view with completion patterns');
    console.log('  ✓ Statistics with partial completions');
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
 * Formats seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Deletes the test data (the routine and 3 test habits)
 */
export async function deleteTestData() {
  try {
    console.log('Deleting test data...');

    const [routines, habits] = await Promise.all([
      dataService.getRoutines(),
      dataService.getHabits(),
    ]);

    // Find the test routine and habits by name
    const testRoutine = routines.find(r => r.name === 'Morning Ritual');
    const testHabitNames = ['Exercise', 'Cold Shower', 'Journaling'];
    const testHabits = habits.filter(h => testHabitNames.includes(h.name));

    let deletedCount = 0;

    // Delete the test routine
    if (testRoutine) {
      await dataService.deleteRoutine(testRoutine.id);
      console.log(`Deleted routine: ${testRoutine.name}`);
      deletedCount++;
    }

    // Delete each test habit
    for (const habit of testHabits) {
      await dataService.deleteHabit(habit.id);
      console.log(`Deleted habit: ${habit.name}`);
      deletedCount++;
    }

    if (deletedCount === 0) {
      console.log('No test data found to delete');
    } else {
      console.log(`\n✅ Deleted ${deletedCount} items (1 routine + ${testHabits.length} habits)`);
    }
  } catch (error) {
    console.error('Error deleting test data:', error);
    throw error;
  }
}
