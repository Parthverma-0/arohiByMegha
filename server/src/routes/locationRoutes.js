import { Router } from 'express';
import { Country, State, City } from 'country-state-city';

// Country → state → city lists for the checkout address dropdowns. The data
// is static, so let browsers and the CDN cache it for a day.
const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=86400');
  next();
});

router.get('/countries', (req, res) => {
  res.json({ success: true, countries: Country.getAllCountries().map((c) => ({ code: c.isoCode, name: c.name })) });
});

router.get('/countries/:country/states', (req, res) => {
  const states = State.getStatesOfCountry(req.params.country).map((s) => ({ code: s.isoCode, name: s.name }));
  res.json({ success: true, states });
});

router.get('/countries/:country/states/:state/cities', (req, res) => {
  const cities = City.getCitiesOfState(req.params.country, req.params.state).map((c) => c.name);
  res.json({ success: true, cities: [...new Set(cities)] });
});

export default router;
