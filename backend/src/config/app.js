const express = require("express");
const morgan = require("morgan");
require("dotenv").config();
const admin = require("./administration.js");
const inicial = require("./initialize.js");
var cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const routesOrganization = require("../routes/organization.router.js");
const routesUser = require("../routes/user.router.js");
const routesIndicator = require("../routes/indicator.router.js");
const routesProcess = require("../routes/process.router.js");
const routesAudit = require("../routes/audit.router.js");
const routesMateriality = require("../routes/materiality.router.js");

require('../models/user.model.js');
require('../models/organization.model.js');
require('../models/indicator.model.js');
require('../models/factor.model.js');
require('../models/process.model.js');
require('../models/audit.model.js');
require('../models/process_indicator_factor.model.js');
require('../models/calculated_value_indicator.model.js');
require('../models/calculated_value_process.model.js');
require('../models/calculated_element_matrix_saaty.model.js');
require('../models/associations.js');
require('../models/framework.model.js');
require('../models/framework_version.model.js');
require('../models/standard.model.js');
require('../models/disclosure_requirement.model.js');
require('../models/data_point.model.js');
require('../models/audit_standard.model.js');
require('../models/audit_data_points.model.js');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:5001',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use(express.json()); // para application/json
app.use(express.urlencoded({ extended: true })); // para form-data o x-www-form-urlencoded
app.use(morgan("dev"));
app.use(cookieParser()); 

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v2", routesOrganization);
app.use("/api/v2", routesUser);
app.use("/api/v2", routesIndicator);
app.use("/api/v2", routesProcess);
app.use("/api/v2", routesAudit);
app.use("/api/v2", routesMateriality);

admin.createAdminUser();
inicial.initialize();
admin.checkAudits();

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily audit check at 00:00');
  admin.checkAudits();
});

module.exports = app;