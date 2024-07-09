const db = require('./database/db')
const utils = require("./logger.js")
const constants = require("./constants.js")

async function processReferralAndSystemBonuses(userId, amount, requestId) {
    const referrerId = await db.selectReferrerIdByReferredId(userId);

    if (referrerId) {
        const referralBonus = amount * 0.01; // 1% of the bet amount
        const systemBonus = amount * 0.02; // 2% of the bet amount

        utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Allocating referral bonus of ${referralBonus} to user ${referrerId}`);
        await db.updateUserBalanceBonus(referralBonus, referrerId, "referral", requestId);

        utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Allocating system fees of ${systemBonus} to system account`);
        await db.updateSystemBalance(systemBonus, requestId);
    } else {
        const systemBonus = amount * 0.03; // 3% of the bet amount
        utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Allocating system fees of ${systemBonus} to system account`);
        await db.updateSystemBalance(systemBonus, requestId);
    }
}

module.exports = { processReferralAndSystemBonuses };
