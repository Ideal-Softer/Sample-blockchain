const { Pool } = require("pg")

const productionPool = new Pool({
  // user: "arcade",
  // host: "arcade.caycskgmqc2g.us-east-1.rds.amazonaws.com",
  // database: "arcade",
  // password: "TN0OoZNhWYP2csl2xxWEXPpW7wzgJQMs",
  // port: 5432,
  // max: 200, // Set max pool size to 20
  // ssl: {
  //   rejectUnauthorized: false
  // }
})

const testPool = new Pool({
  // user: "postgres",
  // host: "postgres",
  // database: "postgres",
  // password: "postgres",
  // port: 5432,
  // max: 20 // Set max pool size to 20
})

module.exports = process.env.NODE_ENV === "production" ? productionPool : testPool
