export async function loadVolatilityData(path) {

  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(
      `Unable to load volatility data from ${path}`
    );
  }

  return await response.json();
}