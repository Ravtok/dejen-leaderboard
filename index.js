import express from "express"
import cors from "cors"
import axios from "axios"
import * as cheerio from "cheerio"

const app = express()
app.use(cors())

const DEJEN_URL = "https://www.dejen.com/profile?view=affiliates"

// Cookie da Render
const COOKIE_STRING = process.env.DEJEN_COOKIE || ""

let leaderboardCache = []
let lastUpdated = null

async function scrapeLeaderboard() {
  if (!COOKIE_STRING) {
    console.log("⚠️ Nessun cookie DEJEN_COOKIE impostato")
    return
  }

  try {
    console.log("Scraping...")

    const response = await axios.get(DEJEN_URL, {
      headers: {
        "Cookie": COOKIE_STRING,
        "User-Agent": "Mozilla/5.0"
      }
    })

    const html = response.data
    const $ = cheerio.load(html)

    let rows = []

    $("table tbody tr").each((i, el) => {
      const cells = $(el).find("td")

      rows.push({
        username: $(cells[0]).text().trim(),
        referredAt: $(cells[1]).text().trim(),
        totalWagered: $(cells[2]).text().trim(),
        totalDeposits: $(cells[3]).text().trim()
      })
    })

    leaderboardCache = rows
    lastUpdated = new Date().toISOString()

    console.log("✔️ Leaderboard aggiornata. Righe:", rows.length)

  } catch (e) {
    console.log("❌ Errore scrape:", e.message)
  }
}

// API pubblica
app.get("/leaderboard", (req, res) => {
  res.json({
    updatedAt: lastUpdated,
    data: leaderboardCache
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Server avviato sulla porta", PORT)
})

// aggiorna ogni 30 secondi
scrapeLeaderboard()
setInterval(scrapeLeaderboard, 30000)
