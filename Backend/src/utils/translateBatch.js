const translationCache = new Map();

const translateBatch = async (
  texts,
  sourceLanguage,
  targetLanguage,
  retryCount = 0
) => {
  // Maximum 3 retries
  const MAX_RETRIES = 3;

  // Log input text
  console.log("Text before translation:", JSON.stringify(texts));
  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);

  try {
    // Process input: Extract actual text content from objects
    let processedInputs = [];

    if (Array.isArray(texts)) {
      if (
        texts.length > 0 &&
        typeof texts[0] === "object" &&
        "source" in texts[0]
      ) {
        // Extract each source text separately
        processedInputs = texts.map((item) => item.source);
      } else {
        // For array of strings
        processedInputs = texts;
      }
    } else {
      // For single string
      processedInputs = [texts];
    }

    // Check cache first
    const cacheKey = JSON.stringify({
      texts,
      sourceLanguage,
      targetLanguage,
    });

    if (translationCache.has(cacheKey)) {
      const cachedResult = translationCache.get(cacheKey);
      console.log("Using cached translation result");
      return cachedResult;
    }

    // Translate each input separately to preserve structure
    const translations = [];

    // Process each input text separately
    for (let i = 0; i < processedInputs.length; i++) {
      const inputText = processedInputs[i];

      // Skip empty inputs
      if (!inputText || inputText.trim().length === 0) {
        translations.push("");
        continue;
      }

      // Modify very short text inputs to avoid API errors
      // The API often responds with 403 for very short inputs
      let modifiedInput = inputText;
      if (inputText.length < 5) {
        // Add a period to very short texts to avoid 403 errors
        modifiedInput = inputText + ".";
        console.log(
          `Modified short input "${inputText}" to "${modifiedInput}" to avoid API errors`
        );
      }

      try {
        // Make API request
        const response = await fetch(
          "https://admin.models.ai4bharat.org/inference/translate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
            body: JSON.stringify({
              sourceLanguage: sourceLanguage,
              targetLanguage: targetLanguage,
              input: modifiedInput,
              task: "translation",
              serviceId: "ai4bharat/indictrans--gpu-t4",
              track: true,
            }),
          }
        );

        // Handle rate limiting
        if (response.status === 429) {
          if (retryCount < MAX_RETRIES) {
            console.log(
              `Rate limit hit (429). Retry attempt ${
                retryCount + 1
              } of ${MAX_RETRIES}`
            );

            // Wait a bit before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retryCount) * 1000)
            );

            return translateBatch(
              texts,
              sourceLanguage,
              targetLanguage,
              retryCount + 1
            );
          }
          throw new Error(`Translation API error: ${response.status}`);
        }

        // Handle 403 errors (usually auth issues or unsupported language pairs)
        if (response.status === 403) {
          console.log(
            `AUTH ERROR (403) translating "${inputText}". Using original text.`
          );
          // For 403 errors, use the original text rather than failing completely
          translations.push(inputText);
          continue;
        }

        if (!response.ok) {
          console.log(
            `Error ${response.status} translating "${inputText}". Using original text.`
          );
          // For other errors, use the original text rather than failing
          translations.push(inputText);
          continue;
        }

        // Parse response
        const data = await response.json();

        // Extract translated text
        let translatedText = "";
        if (data.output) {
          if (typeof data.output === "string") {
            translatedText = data.output;
          } else if (Array.isArray(data.output) && data.output.length > 0) {
            translatedText = data.output[0].target || "";
          }
        }

        // If we modified the input by adding a period, remove it from the output if necessary
        if (
          inputText.length < 5 &&
          modifiedInput !== inputText &&
          translatedText.endsWith(".")
        ) {
          translatedText = translatedText.slice(0, -1);
        }

        // Store the translation
        translations.push(translatedText || inputText);
      } catch (error) {
        console.error(`Error translating "${inputText}":`, error);
        // Use original text in case of errors
        translations.push(inputText);
      }
    }

    // Format the output to match expected structure
    const result = {
      taskType: "translation",
      output:
        Array.isArray(texts) &&
        texts.length > 0 &&
        typeof texts[0] === "object" &&
        "source" in texts[0]
          ? texts.map((item, index) => ({
              source: item.source,
              target: translations[index] || item.source, // fallback to source if no translation
            }))
          : translations.map((translation, index) => ({
              source: Array.isArray(texts) ? texts[index] : texts,
              target:
                translation || (Array.isArray(texts) ? texts[index] : texts), // fallback to source
            })),
      config: null,
    };

    // Log translated text
    console.log("Text after translation:", JSON.stringify(result));

    // Cache the result
    translationCache.set(cacheKey, result);

    // Limit cache size
    if (translationCache.size > 100) {
      // Delete oldest entry
      const firstKey = translationCache.keys().next().value;
      translationCache.delete(firstKey);
    }

    return result;
  } catch (error) {
    console.error("Translation API error:", error);

    // For errors other than those we've already handled retry logic for
    if (!error.message.includes("429") || retryCount >= MAX_RETRIES) {
      // Create a fallback result that uses the original text instead of empty strings
      const fallbackResult = {
        taskType: "translation",
        output:
          Array.isArray(texts) &&
          texts.length > 0 &&
          typeof texts[0] === "object" &&
          "source" in texts[0]
            ? texts.map((item) => ({
                source: item.source,
                target: item.source, // Use source text as fallback
              }))
            : [
                {
                  source: Array.isArray(texts) ? texts.join(" ") : texts,
                  target: Array.isArray(texts) ? texts.join(" ") : texts, // Use source text
                },
              ],
        config: null,
      };

      console.log(
        "Text after translation (fallback):",
        JSON.stringify(fallbackResult)
      );
      return fallbackResult;
    }

    // Try again for other errors with exponential backoff
    console.log(
      `Error occurred. Retry attempt ${retryCount + 1} of ${MAX_RETRIES}`
    );

    // Wait before retrying
    await new Promise((resolve) =>
      setTimeout(resolve, Math.pow(2, retryCount) * 1000)
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
