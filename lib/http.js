async function getText(url, params) {
  const target = new URL(url);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      target.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(target);
  if (!response.ok) {
    throw new Error(`Request to ${target} failed with status ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function getJson(url, params) {
  return JSON.parse(await getText(url, params));
}

module.exports = { getText, getJson };
