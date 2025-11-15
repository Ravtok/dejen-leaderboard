import express from "express"
import cors from "cors"

const app = express()
app.use(cors())
app.use(express.json())

let leaderboard = []
let lastUpdate = null

app.post("/update", (req, res) => {
  leaderboard = req.body.data || []
  lastUpdate = new Date().toISOString()
  return res.json({ success: true })
})

app.get("/leaderboard", (req, res) => {
  return res.json({
    updatedAt: lastUpdate,
    data: leaderboard
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("Backend running on", PORT))
