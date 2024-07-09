const db = require('./database/db')
const utils = require("./logger.js")
const constants = require("./constants.js")

let current_streak = 0;
let current_loss_streak = 0;
const points = async (ctx, userId, didWin, betAmount, _status) => {
    try {
        let achievements = [];
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Calculating points`)
        // Fetch user details from the database
        const userResult = await db.selectUserDetails(userId)
        const last_login = userResult.last_login

        if (!userResult) {
            return 'User or last login not found';
        }

        const currentTime = new Date();
        const lastLoginTime = last_login ? new Date(last_login) : new Date();

        let { total_points, highest_streak, highest_loss_streak } = userResult;
        current_streak = userResult.current_streak
        current_loss_streak = userResult.current_loss_streak
        let pointsEarned = 0

        let promises = [
            winningStreakAchievements(ctx, didWin, achievements, pointsEarned),
            losingStreakAchievements(ctx, didWin, achievements, pointsEarned),
            betAmountsAchievements(ctx, betAmount, achievements, pointsEarned),
            dayAchievements(ctx, lastLoginTime, currentTime, achievements, pointsEarned),
            activityAchievements(ctx, currentTime, achievements, pointsEarned, userId)
        ];

        let results = await Promise.all(promises);

        // Combine the points earned from all the achievements
        pointsEarned = results.reduce((total, currentPoints) => total + currentPoints, 0);

        // Update total points and current streak in users table
        const newTotalPoints = total_points + pointsEarned;

        db.updateUserDetails(newTotalPoints, current_streak, userId, current_loss_streak);

        if (highest_streak < current_streak) {
            db.updateHighestStreak(current_streak, userId)
        }
        if (highest_loss_streak < current_loss_streak) {
            db.updateHighestLostStreak(current_loss_streak, userId)
        }

        return { achievements, pointsEarned, newTotalPoints };

    } catch (err) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.error, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, err)

        return 'Error occurred';
    }
}

const winningStreakAchievements = async (ctx, didWin, achievements, pointsEarned) => {

    if (didWin) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +10, First win!`)
        current_loss_streak = 0;
        pointsEarned = 10;
        achievements.push(1);
        current_streak++;

        if (current_streak === 2) {
            pointsEarned += 5;
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +5, Current streak 2`)
        }

        if (current_streak === 3) {
            pointsEarned += 10;
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +10, Current Streak 3`)

            achievements.push(2);
        }

        if (current_streak === 4) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +20, Current Streak 4`)
            pointsEarned += 20;
        }

        if (current_streak >= 5) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +50, Current Streak 5`)

            pointsEarned += 50;
            achievements.push(3);
        }

        if (current_streak >= 12) {
            pointsEarned += 1000;
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +1000, Current Streak 12`)

            achievements.push(4);
        }
    }
    return pointsEarned;
}

const losingStreakAchievements = async (ctx, didWin, achievements, pointsEarned) => {
    // Handle points and streaks
    if (!didWin) {
        current_streak = 0
        pointsEarned = 10;
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +10, First loss`)
        console.log(achievements)
        achievements.push(5);
        current_loss_streak++;

        if (current_loss_streak === 2) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +5, Current Streak 2`)
            pointsEarned += 5;
        }
        if (current_loss_streak === 3) {
            pointsEarned += 10;
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +10, Current Streak 3`)
            achievements.push(6);
        }
        if (current_loss_streak === 4) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +20, Current Streak 4`)
            pointsEarned += 20;
        }
        if (current_loss_streak >= 5) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +50, Current Streak 5`)
            pointsEarned += 50;
            achievements.push(7);
        }
        if (current_loss_streak >= 12) {
            utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +1000, Current Streak 12`)
            pointsEarned += 1000;
            achievements.push(8);
        }
    }
    return pointsEarned;
}

const betAmountsAchievements = async (ctx, betAmount, achievements, pointsEarned) => {
    // Handle bet-based achievements
    if (betAmount >= 100) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +30, High roller`)
        pointsEarned += 30;
        achievements.push(9);
    }
    if (betAmount >= 10 && betAmount < 100) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +20, Risk taker`)

        pointsEarned += 20;
        achievements.push(10);
    }
    if (betAmount <= 1) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +10, Underdog`)

        pointsEarned += 10;
        achievements.push(11);
    }

    return pointsEarned
}

const dayAchievements = async (ctx, lastLoginTime, currentTime, achievements, pointsEarned) => {
    if (lastLoginTime.toDateString() !== currentTime.toDateString()) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +20, Daily Player`)
        pointsEarned += 20;
        achievements.push(12);
    }
    if (currentTime.getHours() < 6) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +30, Early Bird`)
        pointsEarned += 30;
        achievements.push(13);
    }
    if (currentTime.getHours() >= 12) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +30, Night Owl`)
        pointsEarned += 30;
        achievements.push(14);
    }
    return pointsEarned
}

const activityAchievements = async (ctx, currentTime, achievements, pointsEarned, userId) => {
    // Time-Based Achievements
    const currentDate = currentTime.toISOString().split('T')[0];  // Extract YYYY-MM-DD format

    // Use the new function to insert today's login into daily_logins table (catch duplicates)
    db.insertDailyLogins(currentDate, userId);

    // Use the new function to get the streak counts
    const { week, month } = await db.getStreakCounts(userId);

    if (week >= 7) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +70, 7 Day Streak`)
        achievements.push(15);
        pointsEarned += 70;  // Add some points for 7-day streak
    }

    if (month >= 30) {
        utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Points +300, 30 day streak`)
        achievements.push(16);
        pointsEarned += 300;  //Add some points for 30-day streak
    }

    return pointsEarned;
}

module.exports = {
    points
}