/** Validate and normalize a strike-by-expiration volatility grid. */
export function validateVolatilityData(data) {
  if (!data || typeof data !== 'object') throw new Error('Dataset must be an object.');
  const { strikes, expirations, volatility } = data;
  for (const [name, values] of [['strikes', strikes], ['expirations', expirations]]) {
    if (!Array.isArray(values) || values.length < 2) {
      throw new Error(`${name} must contain at least two numeric values.`);
    }
    values.forEach((value, index) => {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new Error(`${name}[${index}] must be a positive finite number.`);
      }
      if (index && value <= values[index - 1]) {
        throw new Error(`${name} values must be strictly increasing.`);
      }
    });
  }
  if (!Array.isArray(volatility) || volatility.length !== strikes.length) {
    throw new Error('volatility must have one row per strike.');
  }
  volatility.forEach((row, strikeIndex) => {
    if (!Array.isArray(row) || row.length !== expirations.length) {
      throw new Error(`volatility[${strikeIndex}] must have one value per expiration.`);
    }
    row.forEach((iv, expirationIndex) => {
      if (typeof iv !== 'number' || !Number.isFinite(iv) || iv <= 0) {
        throw new Error(`volatility[${strikeIndex}][${expirationIndex}] must be a positive finite decimal.`);
      }
    });
  });
  return data;
}

export async function loadVolatilityData(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load volatility data from ${path}`);
  return validateVolatilityData(await response.json());
}
