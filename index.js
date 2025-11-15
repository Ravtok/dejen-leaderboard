import express from "express";

const app = express();
app.use(express.json());

let leaderboardData = {
  updatedAt: null,
  data: []
};

app.get("/leaderboard", (req, res) => {
  res.json(leaderboardData);
});

app.post("/leaderboard", (req, res) => {
  leaderboardData = {
    updatedAt: new Date().toISOString(),
    data: req.body.data
  };
  res.json({ success: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server avviato su porta " + port));
