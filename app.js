const express = require("express");
const app = express();

// Routes
const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const commandesRoutes = require('./routes/commandes');
const pricingsRoutes = require('./routes/pricings');
const employeesRoutes = require('./routes/employees');
const transportTypesRoutes = require('./routes/transportTypes');
const packageTypesRoutes = require('./routes/packageTypes');
const measureUnitRoutes = require('./routes/measureUnits');
const countryRoutes = require('./routes/countries');
const dashboardRoutes = require('./routes/dashboard');
const productsRoutes = require('./routes/products');

app.use('/auth', authRoutes);
app.use('/clients', clientsRoutes);
app.use('/commandes', commandesRoutes);
app.use('/pricings', pricingsRoutes);
app.use('/employees', employeesRoutes);
app.use('/transportTypes', transportTypesRoutes);
app.use('/packageTypes', packageTypesRoutes);
app.use('/measureUnits', measureUnitRoutes);
app.use('/countries', countryRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/products', productsRoutes);

app.get('/', (req, res) => {
    res.send('Hello NODE API');
});

app.get('/blog', (req, res) => {
    res.send('Hello Blog');
});

module.exports = app;
