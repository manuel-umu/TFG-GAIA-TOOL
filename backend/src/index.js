const app = require("./config/app.js");

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`----------- Server is running on port ${port}`);
});