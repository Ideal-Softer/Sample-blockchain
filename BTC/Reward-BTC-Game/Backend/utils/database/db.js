const db = require("./databaseManager")
const { encrypt } = require("../encryptionUtilities")
const utils = require("../logger.js")
const constants = require("../constants.js")

// --------------------------------------
//                 USERS
// --------------------------------------

const setUserName = async (username, userId) => {
  await db.query(`UPDATE users SET user_name = $1 WHERE user_id = $2;`, [username, userId])
}

const getLeaderboard = async () => {
  const { rows: leaderboard } = await db.query(`SELECT user_id, user_name, public_key, current_position, total_points FROM users WHERE total_points > 0 ORDER BY total_points DESC;`)
  return leaderboard
}

const userInsertion = async (userPublicKey, userName, userCreation, ctx) => {
  const { rows: existingUsers } = await db.query("SELECT * FROM users WHERE public_key=$1", [userPublicKey])

  if (existingUsers.length === 0) {
    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `New user. Registering`)
    const { rows: newlyInsertedUser } = await db.query("INSERT INTO users(public_key, user_name, user_creation) VALUES($1, $2, to_timestamp($3 / 1000.0)) RETURNING user_id", [userPublicKey, userName, userCreation])
    return { user_id: newlyInsertedUser[0].user_id, exists: false }
  } else {
    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `User already registered. Login in`)
    return { user_id: existingUsers[0].user_id, exists: true }
  }
}

const selectUser = async (userId) => {
  const { rows: user } = await db.query("SELECT * FROM users WHERE user_id = $1", [userId])
  return user.length > 0 ? user[0] : null
}

const selectUsers = async () => {
  const { rows: user } = await db.query("SELECT * FROM users")
  return user.length > 0 ? user : null
}

async function selectUserIdByPublicKey(publicKey) {
  const { rows: user_id } = await db.query("SELECT user_id FROM users WHERE public_key = $1", [publicKey])
  return user_id.length > 0 ? user_id[0].user_id : null
}

// Select User Details
const selectUserDetails = async (userId) => {
  const { rows: userDetails } = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  return userDetails[0];
};

// Select User Details
const incrementCounterForUser = async (userId) => {
  const { rows: userDetails } = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
  await db.query('UPDATE users SET btc_derivation_counter = $1 WHERE user_id = $2', [userDetails[0].btc_derivation_counter + 1, userId]);

  userDetails[0].btc_derivation_counter;
};

// Update User Details
const updateUserDetails = async (newTotalPoints, current_streak, userId, current_loss_streak) => {
  await db.query('UPDATE users SET total_points = $1, current_streak = $2, current_loss_streak = $3 WHERE user_id = $4', [newTotalPoints, current_streak, current_loss_streak, userId]);
};

const updateHighestStreak = async (current_streak, userId) => {
  await db.query('UPDATE users SET highest_streak = $1 WHERE user_id = $2', [current_streak, userId]);
};

const updateHighestLostStreak = async (current_loss_streak, userId) => {
  await db.query('UPDATE users SET highest_loss_streak = $1 WHERE user_id = $2', [current_loss_streak, userId]);
};

const insertDailyLogin = async (currentDate, userId) => {
  await db.query('UPDATE users SET last_login = $1 WHERE user_id = $2', [currentDate, userId]);
};

// --------------------------------------
//             REFERRAL_CODES
// --------------------------------------
async function selectReferrerIdByReferralCode(referralCode) {
  const { rows: referrer_id } = await db.query("SELECT referrer_id FROM referral_codes WHERE referral_code = $1", [referralCode])
  return referrer_id.length > 0 ? referrer_id[0].referrer_id : null
}

async function insertReferralCode(referral_code, referrer_id) {
  await db.query("INSERT INTO referral_codes (referral_code, referrer_id) VALUES ($1, $2)", [referral_code, referrer_id])
  return
}

// --------------------------------------
//             REFERRALS
// --------------------------------------
async function insertReferral(referralCode, referrerId, userId) {
  await db.query("INSERT INTO referrals (referral_code, referrer_id, referred_id) VALUES($1, $2, $3);", [referralCode, referrerId, userId])
  return
}

async function selectReferrerIdByReferredId(userId) {
  const { rows: referrer_id } = await db.query("SELECT referrer_id FROM referrals WHERE referred_id = $1", [userId])
  return referrer_id.length > 0 ? referrer_id[0].referrer_id : null
}

// --------------------------------------
//                 GAME
// --------------------------------------
// TODO: Ensure that the GameNonce is not already taken.
const insertNewGame = async (gameVRN, gameNonce, secretNonce, commitmentTimestamp, commitment, userId, requestId) => {
  try {
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Encrypting VRN`)
    const encryptedVRN = await encrypt(gameVRN)
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Encrypting nonce`)
    const encryptedSecretNonce = await encrypt(secretNonce)
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Pushing Game data to DB`)
    const { rows: result } = await db.query("INSERT INTO games(user_id, game_nonce, bet_amount, choice, vrn, secret_nonce, commitment, commitmentTimestamp, status) VALUES($1, $2, $3, $4, $5, $6, $7, to_timestamp($8 / 1000.0), 'pending') RETURNING game_nonce", [userId, gameNonce, 0, true, encryptedVRN, encryptedSecretNonce, commitment, commitmentTimestamp])
    if (result.length) {
      const { rows: gameNonces } = await db.query("SELECT * FROM games WHERE game_nonce = $1", [gameNonce])
      if (!gameNonces.length) {
        await insertNewGame(gameVRN, gameNonce, secretNonce, commitmentTimestamp, commitment, userId, requestId)
      }
    }

  } catch (e) {
  }

  return
}

const selectGameDataByNonce = async (gameNonce) => {
  const { rows: game } = await db.query("SELECT * FROM games WHERE game_nonce=$1", [gameNonce])
  return game.length > 0 ? game[0] : null
}

const updateGameOutcome = async (outcome, didWin, betAmout, gameNonce, outcomeHash, signedMessage, choice, revealTimestamp, status) => {
  try {
    const { rows: game } = await db.query("UPDATE games SET outcome=$1, did_win=$2, bet_amount=$3, signedGameNonce=$4, outcomeHash=$5, choice = $6, revealTimestamp=to_timestamp($7 / 1000.0), status=$9 WHERE game_nonce=$8 RETURNING *", [outcome, didWin, betAmout, signedMessage, outcomeHash, choice, revealTimestamp, gameNonce, status])
    return game;
  } catch (e) {
    throw e
  } finally {
  }
}

const deleteGame = async (gameNonce) => {
  await db.query(`
    DELETE FROM games
    WHERE game_nonce = $1;
  `, [gameNonce])
}
const selectGames = async () => {
  const { rows: games } = await db.query(
    `SELECT g.*, u.user_name, u.public_key
     FROM games g
     JOIN users u ON g.user_id = u.user_id
     ORDER BY g.commitmentTimestamp DESC 
     LIMIT 30`
  )
  return games.length > 0 ? games : null
}

const selectLatestGameByUserId = async (userId) => {
  const { rows: game } = await db.query(
    `SELECT g.*, u.user_name, u.public_key
     FROM games g
     JOIN users u ON g.user_id = u.user_id
     WHERE g.user_id = $1
     ORDER BY g.commitmentTimestamp DESC
     LIMIT 1`,
    [userId]
  )
  return game.length > 0 ? game[0] : null
}

const selectGameDataByUserId = async (userId) => {
  const { rows: game } = await db.query(`
  SELECT * 
  FROM games 
  WHERE user_id=$1
  ORDER BY commitmentTimestamp DESC 
  `, [userId])
  return game.length > 0 ? game : null
}

// --------------------------------------
//              user_balances
// --------------------------------------
const insertInitialBalance = async (userId) => {
  const { rows: existingUsers } = await db.query("SELECT * FROM users WHERE user_id=$1", [userId])

  if (existingUsers.length === 0) {
    utils.logEvent(ctx.state.requestId, constants.LOG_LEVELS.warn, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `New user. Registering`)
    const { rows: newlyInsertedUser } = await db.query("INSERT INTO users(public_key, user_name, user_creation) VALUES($1, $2, to_timestamp($3 / 1000.0)) RETURNING user_id", [userPublicKey, userName, userCreation])
    const client = await db.connect()

    try {
      await client.query("BEGIN")
      await db.query("INSERT INTO user_balances(user_id, balance, pending) VALUES($1, 420, '[]')", [newlyInsertedUser[0].user_id])
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
  } else {
    const client = await db.connect()

    try {
      await client.query("BEGIN")
      await db.query("INSERT INTO user_balances(user_id, balance, pending) VALUES($1, 420, '[]')", [existingUsers[0].user_id])
      await client.query("COMMIT")
    } catch (e) {
      await client.query("ROLLBACK")
      throw e
    } finally {
      client.release()
    }
  }
}

const selectBalance = async (userId) => {
  try {
    const { rows: balance } = await db.query("SELECT * FROM user_balances WHERE user_id=$1", [userId])
    if (balance.length > 0) {
      let amount = parseFloat(balance[0].balance)
      for (let i = 0; i < balance[0].pending?.length; i++) {
        if (balance[0].pending[i].availableBalance > 0) {
          amount += parseFloat(balance[0].pending[i].availableBalance);
        }
      }
      return { balance: amount }
    }
    else {
      return null
    }
  } catch (e) {
    throw e
  }
}

async function updateUserBalance(bet, amount, user_id, type, requestId) {
  let _status = 'completed'
  let transaction_id = null

  try {
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Get user balance
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Getting user balance`);
    const { rows: balance } = await db.query("SELECT * FROM user_balances WHERE user_id=$1", [user_id]);
    if (balance.length > 0) {
      let userBalance = parseFloat(balance[0].balance);
      let missingAmount = bet - userBalance;

      if (missingAmount <= 0) {
        await db.query("UPDATE user_balances SET balance = balance + $1 WHERE user_id = $2", [formattedAmount, user_id]);
      } else {
        let updates = [];
        balance[0].pending.forEach((pendingTx, index) => {
          if (pendingTx.availableBalance > 0) {
            let amountToSubtract = Math.min(missingAmount, parseFloat(pendingTx.availableBalance));
            missingAmount -= amountToSubtract;
            balance[0].pending[index].availableBalance = Math.max(0, parseFloat(pendingTx.availableBalance) - amountToSubtract);
            updates.push({
              transactionId: pendingTx.transactionId,
              availableBalance: balance[0].pending[index].availableBalance
            });
          }
        });

        if (updates.length > 0) {
          await db.query("UPDATE user_balances SET balance = 0, pending = $1 WHERE user_id = $2", [JSON.stringify(balance[0].pending), user_id]);
          _status = 'pending';
          transaction_id = updates[0].transactionId; // Assuming we take the first transaction's ID
        }

        if (missingAmount > 0) {
          utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Insufficient Balance`);
        }
      }
    }

    // Add transaction
    await db.query("INSERT INTO transactions (user_id, type, amount, status, tx_id) VALUES ($1, $2, $3, $4, $5)", [user_id, type, formattedAmount, _status, transaction_id]);
  } catch (e) {
    throw e;
  }

  const newTotalBalance = await selectBalance(user_id);
  return { newTotalBalance, gameStatus: _status };
}


async function updateSystemBalance(amount, requestId) {
  let updatedBalance;
  try {
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Log transaction creation and insert it in a single step
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Adding fee tx to database`);
    await db.query(
      "INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)",
      [2, 'referral', formattedAmount, 'completed']
    );

    // Update system balance and fetch the new balance in a single query
    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Update and fetch system balance`);
    const { rows } = await db.query(
      "UPDATE user_balances SET balance = balance + $1 WHERE user_id = $2 RETURNING balance",
      [formattedAmount, 1]
    );

    updatedBalance = rows[0]?.balance;

  } catch (e) {
    throw e;
  } finally {
  }
  return updatedBalance;
}


async function updateUserBalanceBonus(amount, user_id, type, requestId) {
  let updatedBalance;

  try {
    const formattedAmount = parseFloat(amount).toFixed(2);

    utils.logEvent(requestId, constants.LOG_LEVELS.info, constants.RESPONSE_CODES.LOG_MESSAGE_ONLY, `Processing transaction`);

    // Combine INSERT and UPDATE in a single operation
    const transactionQuery = `
      WITH inserted AS (
        INSERT INTO transactions (user_id, type, amount, status) 
        VALUES ($1, $2, $3, 'completed')
        RETURNING id
      )
      UPDATE user_balances 
      SET balance = balance + $4 
      WHERE user_id = $5
      RETURNING balance;
    `;
    const res = await db.query(transactionQuery, [user_id, type, formattedAmount, formattedAmount, user_id]);
    updatedBalance = res.rows[0]?.balance;
  } catch (e) {
    throw e;
  } finally {
  }

  return updatedBalance;
}


// --------------------------------------
//           transactions
// --------------------------------------
const selectReferredUsersAndEarnings = async (userId) => {
  // Check if the user exists and get their referral code
  const { rows: userReferralCode } = await db.query(
    `
    SELECT referral_code FROM referral_codes WHERE referrer_id = $1;
  `,
    [userId]
  )

  if (userReferralCode.length === 0) {
    return null // User does not exist or has no referral code
  }

  // Fetch referral and earnings data
  const { rows: results } = await db.query(
    `
    SELECT 
      r.referrer_id,
      COUNT(DISTINCT r.referred_id) AS total_number_of_users_referred,
      SUM(DISTINCT bt.amount ) AS total_earned_through_referrals
    FROM referrals r
    LEFT JOIN (
        SELECT user_id, SUM(amount ) AS amount 
        FROM transactions
        WHERE type = 'referral'
        GROUP BY user_id
    ) AS bt ON bt.user_id = r.referrer_id
    WHERE r.referrer_id = $1
    GROUP BY r.referrer_id;
    `,
    [userId]
  )

  if (results.length > 0) {
    return {
      ...results[0],
      referral_code: userReferralCode[0].referral_code
    }
  } else {
    // User exists but has no referrals
    return {
      referrer_id: userId,
      referral_code: userReferralCode[0].referral_code,
      total_number_of_users_referred: 0,
      total_earned_through_referrals: 0
    }
  }
}

// --------------------------------------
//               deposits
// --------------------------------------
// Get all pending transactions from btc_deposits table
const selectPendingTransactions = async () => {
  const { rows: pendingTransactions } = await db.query("SELECT * FROM btc_deposits WHERE status != $1 AND status != $2 AND transaction_id IS NOT NULL", ["confirmed", "expired"]);
  return pendingTransactions.length > 0 ? pendingTransactions : null;
}

// Update the status of a BTC deposit transaction to "analyzing"
const updateConfirmingTransaction = async (transactionId) => {
  await db.query("UPDATE btc_deposits SET status = $2 WHERE transaction_id = $1", [transactionId, "analyzing"]);
  return;
}

// Update the status of a BTC deposit transaction to "invalid"
const updateAnalyzingTransactionInvalid = async (transactionId) => {
  await db.query("UPDATE btc_deposits SET status = $2 WHERE transaction_id = $1", [transactionId, "expired"]);
  return;
}


// --------------------------------------
//                  IPFS
// --------------------------------------

const selectIpfsDataByNonce = async (gameNonce) => {
  const { rows: cid } = await db.query("SELECT commitment, selection, outcome FROM ipfs WHERE game_nonce = $1", [gameNonce]);
  return cid[0];  // Assuming that each game_nonce has only one corresponding row in the ipfs table
}

const insertCommitmentByNonce = async (gameNonce, newCommitmentCID) => {
  await db.query("INSERT INTO ipfs (game_nonce, commitment) VALUES ($1, $2)", [gameNonce, newCommitmentCID]);
  return;
}

const updateSelectionByNonce = async (gameNonce, newSelectionCID) => {
  await db.query("UPDATE ipfs SET selection = $2 WHERE game_nonce = $1", [gameNonce, newSelectionCID]);
  return;
}

const updateOutcomeByNonce = async (gameNonce, newOutcomeCID) => {
  await db.query("UPDATE ipfs SET outcome = $2 WHERE game_nonce = $1", [gameNonce, newOutcomeCID]);
  return;
}


const beginTransaction = async () => {
  const client = await db.connect()
  await client.query("BEGIN")
  return client
}

const commitTransaction = async (client) => {
  await client.query("COMMIT")
  client.release()
}

const rollbackTransaction = async (client) => {
  await client.query("ROLLBACK")
  client.release()
}

// Insert User Achievements
const insertAchievements = async (userId, gameId, achievements, currentTime, _status) => {
  for (let achievement of achievements) {
    await db.query(
      'INSERT INTO user_achievements (user_id, achievement_id, game_nonce, date_earned, status) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0), $5)',
      [userId, achievement, gameId, currentTime, _status]
    );
  }
};

async function updateTransactionIdForAddress(userId, address, txId) {
  await db.query(
    'UPDATE btc_deposits SET transaction_id = $1 WHERE user_id = $2 AND deposit_address = $3',
    [txId, userId, address]
  );
}

const selectAchievements = async (userId) => {
  const { rows: achievements } = await db.query(
    `
    SELECT 
      a.achievement_name,
      a.description,
    COUNT(ua.achievement_id) AS achievement_count
    FROM 
        user_achievements ua
    JOIN 
        achievements a ON ua.achievement_id = a.achievement_id
    WHERE 
        ua.user_id = $1
    GROUP BY 
        a.achievement_name, a.description
    ORDER BY 
        achievement_count DESC, a.achievement_name;
      `,
    [userId]
  );
  return achievements;
};

const selectLastLogin = async (userId) => {
  const { rows: lastLoginDetails } = await db.query('SELECT last_login FROM users WHERE user_id = $1', [userId]);
  return lastLoginDetails[0]?.last_login;
};

// Insert Daily Logins
const insertDailyLogins = async (currentDate, userId) => {
  await db.query('INSERT INTO daily_logins (user_id, login_date) VALUES ($1, $2) ON CONFLICT (user_id, login_date) DO NOTHING', [userId, currentDate]);
};

const points = async (userId, currentDate) => {
  try {
    // Fetch user details and last login in a single query
    const userDetailsAndLoginQuery = `
    SELECT *
    FROM users WHERE user_id = $1;
    `;
    const userDetailsAndLoginResult = await db.query(userDetailsAndLoginQuery, [userId]);

    // Insert into daily_logins
    const insertLoginQuery = `
    INSERT INTO daily_logins (user_id, login_date) 
    VALUES ($1, $2) 
    ON CONFLICT (user_id, login_date) DO NOTHING;
`;
    await db.query(insertLoginQuery, [userId, currentDate]);

    // Calculate weekly and monthly streaks in one query
    const streakQuery = `
    SELECT 
        SUM(CASE WHEN login_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE THEN 1 ELSE 0 END) AS week_streak,
        SUM(CASE WHEN login_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE THEN 1 ELSE 0 END) AS month_streak
    FROM daily_logins
    WHERE user_id = $1;
`;
    const streakResult = await db.query(streakQuery, [userId]);

    // Commit transaction
    return {
      userDetails: userDetailsAndLoginResult[0].rows[0], // Assuming there is always one user detail row
      lastLogin: userDetailsAndLoginResult[0].rows[0].last_login,
      weekStreak: parseInt(streakResult[0].rows[0].week_streak),
      monthStreak: parseInt(streakResult[1].rows[0].month_streak)
    };
  } catch (error) {
    // Rollback transaction in case of error
    throw error;
  }
};

const getStreakCounts = async (userId) => {
  const query = `
    SELECT
      COUNT(CASE WHEN login_date BETWEEN CURRENT_DATE - INTERVAL '7 days' AND CURRENT_DATE THEN 1 END) AS week_streak,
      COUNT(CASE WHEN login_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE THEN 1 END) AS month_streak
    FROM daily_logins
    WHERE user_id = $1
  `;

  const { rows } = await db.query(query, [userId]);

  if (rows.length > 0) {
    return { week: rows[0].week_streak, month: rows[0].month_streak };
  } else {
    return { week: 0, month: 0 };
  }
};

const getLatestUnspentDepositAddress = async (userId, address) => {
  const { rows: latestUnspentDepositAddress } = await db.query('SELECT * FROM btc_deposits WHERE user_id = $1 AND deposit_address=$2', [userId, address]);

  return latestUnspentDepositAddress.length > 0 ? latestUnspentDepositAddress[0] : null
}

const insertDepositAddress = async (userId, address) => {
  // Insert the BTC deposit transaction into the database
  await db.query(`INSERT INTO btc_deposits (user_id, deposit_address) VALUES ($1, $2);`, [userId, address])
}

const updateVerificationStatus = async (userId, gameNonce, status, time) => {
  await db.query('UPDATE games SET verified = $1, verificationTimestamp = to_timestamp($2 / 1000.0) WHERE user_id = $3 AND game_nonce = $4', [status, time, userId, gameNonce]);
};
const insertSelectionTimestamp = async (game_nonce, time) => {
  await db.query('UPDATE games SET selectionTimestamp = to_timestamp($1 / 1000.0) WHERE game_nonce = $2', [time, game_nonce]);
}

const updateBalance = async (userId, newPendingBalance) => {
  const { rows: userBalance } = await db.query("SELECT * FROM  user_balances WHERE user_id = $1", [userId])
  let pendingBalance = userBalance[0].pending
  let check = false
  let balance = 0
  // The issue here is that it takes too short to process this shit. so we have a race condition to 
  for (let i = 0; i < pendingBalance.length; i++) {
    if (pendingBalance[i].transactionId === newPendingBalance) {
      balance = pendingBalance[i].availableBalance
      pendingBalance.splice(i, 1); // Remove the element at index i
      await db.query("UPDATE user_balances SET balance = balance + $2, pending=$3 WHERE user_id = $1", [userId, balance, JSON.stringify(pendingBalance)])
      check = true
      break;
    }
  }
  if (check == false) {
    console.error("Youre either the luckiest person in the world, aka managed to your transaction confirmed in the same millisecond you sent to the mempool or we fucked up so massively, chances are this is on us though")
  }

  return
}

const updatePendingBalance = async (userId, newPendingBalance) => {
  const { rows: userBalance } = await db.query("SELECT * FROM  user_balances WHERE user_id = $1", [userId])
  let pendingBalance = userBalance[0].pending
  let check = false

  for (let i = 0; i < pendingBalance.length; i++) {
    if (pendingBalance[i].transactionId === newPendingBalance.transactionId) {
      check = true
      break
    }
  }
  if (check == false) {
    pendingBalance.push(newPendingBalance)
    await db.query("UPDATE user_balances SET pending= $2 WHERE user_id = $1", [userId, JSON.stringify(pendingBalance)])
  }
  return
}

// Update the amount_received and set the status to "completed" for a BTC deposit transaction
const updateBtcAnalyzingTransaction = async (transactionId, amount, status) => {
  const { rows: transactions } = await db.query("SELECT * FROM btc_deposits WHERE transaction_id = $1 AND amount_received IS NOT NULL", [transactionId]);
  if (transactions.length === 1) {
    await db.query("UPDATE btc_deposits SET amount_received = $2, status = $3 WHERE transaction_id = $1", [transactionId, amount, status]);
  }
  return;
}

module.exports = {
  points,
  getLeaderboard,
  updateBalance,
  updatePendingBalance,
  insertSelectionTimestamp,
  getLatestUnspentDepositAddress,
  updateTransactionIdForAddress,
  selectUserDetails,
  selectAchievements,
  selectLastLogin,
  updateUserDetails,
  insertAchievements,
  insertDailyLogins,
  getStreakCounts,
  selectIpfsDataByNonce,
  insertCommitmentByNonce,
  updateSelectionByNonce,
  updateOutcomeByNonce,
  selectGames,
  selectGameDataByUserId,
  insertReferralCode,
  updateSystemBalance,
  selectReferrerIdByReferredId,
  selectUserIdByPublicKey,
  insertNewGame,
  selectGameDataByNonce,
  updateGameOutcome,
  userInsertion,
  insertInitialBalance,
  selectBalance,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  selectPendingTransactions,
  updateConfirmingTransaction,
  updateBtcAnalyzingTransaction,
  updateAnalyzingTransactionInvalid,
  selectUser,
  selectReferrerIdByReferralCode,
  insertReferral,
  updateUserBalance,
  selectUsers,
  selectReferredUsersAndEarnings,
  insertDailyLogin,
  updateHighestStreak,
  updateHighestLostStreak,
  insertDepositAddress,
  incrementCounterForUser,
  setUserName,
  updateVerificationStatus,
  updateUserBalanceBonus,
  deleteGame,
  selectLatestGameByUserId
}