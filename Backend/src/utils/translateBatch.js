let successfulRequestsCount = 0;

// Generate multiple different user agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 11; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
];

// Generate random user agent
const getRandomUserAgent = () => {
  // Increment index for each request to use a different agent each time
  const index = successfulRequestsCount % userAgents.length;
  return userAgents[index];
};

// Generate random IP
const getRandomIP = () => {
  return Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
    .join(".");
};

// Create different request IDs
const getRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Simple in-memory cache
const translationCache = new Map();

const translateBatch = async (
  texts,
  sourceLanguage,
  targetLanguage,
  retryCount = 0
) => {
  // Maximum 3 retries
  const MAX_RETRIES = 3;

  try {
    // Check if we have this exact translation in cache
    const cacheKey = JSON.stringify({ texts, sourceLanguage, targetLanguage });
    if (translationCache.has(cacheKey)) {
      console.log("Using cached translation result");
      return translationCache.get(cacheKey);
    }

    const requestId = getRequestId();
    const randomIP = getRandomIP();
    const userAgent = getRandomUserAgent();

    const response = await fetch(
      "https://demo-api.models.ai4bharat.org/inference/translation/v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": randomIP,
          "X-Request-ID": requestId,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          controlConfig: {
            dataTracking: true,
          },
          input: texts,
          config: {
            serviceId: "",
            language: {
              sourceLanguage: sourceLanguage,
              targetLanguage: targetLanguage,
              targetScriptCode: null,
              sourceScriptCode: null,
            },
          },
        }),
      }
    );

    if (response.status === 429) {
      // If we haven't exceeded max retries, try again
      if (retryCount < MAX_RETRIES) {
        console.log(
          `Rate limit hit (429). Retry attempt ${
            retryCount + 1
          } of ${MAX_RETRIES}`
        );

        // Try again with incremented retry count
        return translateBatch(
          texts,
          sourceLanguage,
          targetLanguage,
          retryCount + 1
        );
      }

      throw new Error(`Translation API error: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    // Request was successful
    successfulRequestsCount++;
    const data = await response.json();

    // Cache the result
    translationCache.set(cacheKey, data);

    // Limit cache size (optional)
    if (translationCache.size > 100) {
      // Delete oldest entry
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }

    return data;
  } catch (error) {
    console.error("Translation API error:", error);

    // For errors other than those we've already handled retry logic for
    if (!error.message.includes("429") || retryCount >= MAX_RETRIES) {
      return { output: [] }; // Return an empty array to prevent crashes
    }

    // Try again for other errors
    console.log(
      `Error occurred. Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`
    );
    return translateBatch(
      texts,
      sourceLanguage,
      targetLanguage,
      retryCount + 1
    );
  }
};

module.exports = translateBatch;
