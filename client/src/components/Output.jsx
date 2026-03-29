import { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { executeCode } from "../api";
import styles from "./Output.module.css";

const WIDTHS = ["20%", "30%", "40%"];
const LABELS = ["S", "M", "L"];

const Output = ({ editorRef, language }) => {
  const toast = useToast();
  const [output, setOutput]       = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError]     = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth]         = useState("40%");

  const runCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;
    setCollapsed(false);
    setIsLoading(true);
    try {
      const result = await executeCode(language, sourceCode);
      const run = result?.run;
      if (!run) { setOutput(["Eroare: răspuns invalid"]); setIsError(true); return; }
      const text = run.output || run.stderr || "";
      setOutput(text.split("\n"));
      setIsError(!!run.stderr && !run.output);
    } catch (error) {
      toast({ title: "Eroare la rulare", description: error.message, status: "error", duration: 4000 });
      setOutput([`Eroare: ${error.message}`]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={styles.container}
      style={{
        width: collapsed ? "28px" : width,
        minWidth: collapsed ? "28px" : "160px",
        maxWidth: collapsed ? "28px" : "50%",
      }}
    >
      <div className={styles.header}>
        {!collapsed && <span className={styles.headerTitle}>iTECify</span>}
        <div className={styles.headerControls}>
          {!collapsed && WIDTHS.map((w, i) => (
            <button key={i}
              className={`${styles.sizeBtn} ${width === w ? styles.sizeBtnActive : ""}`}
              onClick={() => setWidth(w)}>
              {LABELS[i]}
            </button>
          ))}
          <button className={styles.collapseBtn}
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? "Deschide" : "Închide"}>
            {collapsed ? "«" : "»"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className={styles.runBtnWrapper}>
            <button
              className={`${styles.runBtn} ${isLoading ? styles.runBtnLoading : ""}`}
              onClick={runCode}
              disabled={isLoading}
            >
              {isLoading ? "Running..." : "Run"}
            </button>
          </div>

          <div className={`${styles.outputContent} ${isError ? styles.outputError : ""}`}>
            {output ? (
              output.map((line, i) => (
                <p key={i} className={styles.outputLine}>{line || " "}</p>
              ))
            ) : (
              <p className={styles.placeholder}>Run the code to see output here</p>
            )}
          </div>
        </>
      )}

      {collapsed && (
        <div className={styles.collapsedLabel} onClick={() => setCollapsed(false)}>
          Output
        </div>
      )}
    </div>
  );
};

export default Output;