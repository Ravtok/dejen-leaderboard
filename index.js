import express from "express"
import cors from "cors"
import puppeteer from "puppeteer"

const app = express()
app.use(cors())

// URL della pagina referrals
const DEJEN_URL = "https://www.dejen.com/profile?view=affiliates"

// Variabile ambiente che metterai su Render
const COOKIE_STRING = process.env.DEJEN_COOKIE || ""

let leaderboardCache = []
let lastUpdated = null

// Funzione che converte la stringa dei cookie in oggetti Puppeteer
function parseCookieString(str) {
  return str.split(";").map(c => {
    const [name, ...rest] = c.trim().split("=")
    return {
      name,
      value: rest.join("="),
      domain: ".dejen.com",
      path: "/"
    }
  })
}

async function scrapeLeaderboard() {
  if (!COOKIE_STRING) {
    console.log("⚠ Nessun cookie impostato. Impostare la variabile DEJEN_COOKIE.")
    return
  }

  console.log("Scraping Dejen...")

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  })

  try {
    const page = await browser.newPage()

    const cookies = parseCookieString(COOKIE_STRING)
    await page.setCookie(...cookies)

    await page.goto(DEJEN_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    })

    // aspetta che la tabella esista
    await page.waitForSelector("table", { timeout: 20000 })

    const data = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("table tbody tr"))
      return rows.map(row => {
        const cells = row.querySelectorAll("td")
        return {
          username: cells[0]?.innerText.trim() || "",
          referredAt: cells[1]?.innerText.trim() || "",
          totalWagered: cells[2]?.innerText.trim() || "",
          totalDeposits: cells[3]?.innerText.trim() || ""
        }
      })
    })

    leaderboardCache = data
    lastUpdated = new Date().toISOString()
    console.log("Leaderboard aggiornata — Righe:", data.length)
  } catch (err) {
    console.error("Errore scraping:", err)
  } finally {
    await browser.close()
  }
}

// API pubblica
app.get("/leaderboard", (req, res) => {
  res.json({
    updatedAt: lastUpdated,
    data: leaderboardCache
  })
})

// Avvia server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Server avviato sulla porta", PORT)
})

// Aggiorna ogni 30 secondi
scrapeLeaderboard()
setInterval(scrapeLeaderboard, 30000)
