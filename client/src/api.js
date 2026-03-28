import axios from "axios";

const SERVER = "http://localhost:3001";

const NOT_RUNNABLE = ["html", "css", "markdown", "json", "yaml", "dockerfile"];

export const executeCode = async (language, sourceCode) => {
  if (NOT_RUNNABLE.includes(language)) {
    return {
      run: {
        output: `⚠️ Limbajul "${language}" nu poate fi executat direct.`,
        stderr: "",
      },
    };
  }

  const response = await axios.post(`${SERVER}/api/execute`, {
    language,
    code: sourceCode,
  });

  return response.data;
};