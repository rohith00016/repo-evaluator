const express = require("express");
const bodyParser = require("body-parser");
const evaluate = require("./evaluate");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
  })
);

app.post("/evaluate", async (req, res) => {
  const { url } = req.body;
  try {
    const result = await evaluate(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to evaluate repository" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
