const moment = require("moment") // You'll need to install moment.js for date calculations

const calculateTimeAgo = (timestamp) => {
  const now = moment()
  const gameMoment = moment(timestamp)

  const diffMinutes = now.diff(gameMoment, "minutes")
  if (diffMinutes < 60) {
    return `${diffMinutes} M`
  }

  const diffHours = now.diff(gameMoment, "hours")
  if (diffHours < 24) {
    return `${diffHours} H`
  }

  const diffDays = now.diff(gameMoment, "days")
  return `${diffDays} D`
}

module.exports = {
  calculateTimeAgo
}
