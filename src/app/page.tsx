"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Image as ImageIcon,
  ArrowUp,
  Pencil,
  Rocket,
  FileCode,
  Loader2,
  CheckCircle2,
  XCircle,
  Folder,
  ChevronRight,
  Info,
  Cog,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import InitialLandingPage from "@/components/initial-landing-page";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNewScreen, setShowNewScreen] = useState(false);
  const [architectureAccepted, setArchitectureAccepted] = useState(false);
  const [quizAccepted, setQuizAccepted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<{
    score: number;
    understood: boolean;
    feedback: string;
    hints?: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"architecture" | "code">(
    "architecture"
  );
  const [codeTabEnabled, setCodeTabEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [srcFolderOpen, setSrcFolderOpen] = useState(true);
  const [architectureData, setArchitectureData] = useState<any>(null);
  const [isGeneratingArchitecture, setIsGeneratingArchitecture] =
    useState(false);
  const [allowDatabase, setAllowDatabase] = useState(false);
  const [userLevel, setUserLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [currentStep, setCurrentStep] = useState(1);
  const [nextStepData, setNextStepData] = useState<any>(null);
  const [isLoadingNextStep, setIsLoadingNextStep] = useState(false);
  const [showNextStep, setShowNextStep] = useState(false);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [fileChanges, setFileChanges] = useState<Map<string, any>>(new Map());
  const [isProjectComplete, setIsProjectComplete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);

  // Use projectFiles if available, otherwise fall back to architectureData
  const pythonFiles =
    projectFiles.length > 0
      ? projectFiles.reduce((acc: any, file: any) => {
          acc[file.name] = file.content;
          return acc;
        }, {})
      : architectureData?.architecture_item?.reduce((acc: any, item: any) => {
          acc[item.file] = item.starter_code;
          return acc;
        }, {}) || {};

  const questions =
    architectureData?.initial_question_item?.map((item: any) => ({
      question: item.text,
      context: item.context, // 'architecture', 'file', 'code_snippet', or 'behavior'
      file: item.file, // Required if context is 'file' or 'code_snippet'
      code_snippet: item.code_snippet, // Required if context is 'code_snippet'
    })) || [];

  // Get development steps with "Understand architecture and generate initial code" as first completed step
  const developmentSteps = architectureData?.learning_plan_item
    ? [
        {
          step: 0,
          title: "Understand architecture and generate initial code",
          goal: "Review the software architecture, answer questions about it, and generate the initial code structure",
          completed: codeTabEnabled, // Completed when questions are done
        },
        ...architectureData.learning_plan_item.map((item: any) => ({
          ...item,
          completed: item.step < currentStep,
        })),
      ]
    : [];

  // Check if we're on the last step
  // developmentSteps includes step 0 (initial architecture) + learning plan steps
  // When currentStep equals the last step number (developmentSteps.length - 1), we're on the last step
  const isLastStep =
    developmentSteps.length > 0 && currentStep >= developmentSteps.length - 1;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading && !showFeedback) {
      const answer = inputValue.trim();
      setUserAnswers([...userAnswers, answer]);
      setIsLoading(true);
      setInputValue("");

      try {
        const currentQuestion = questions[currentQuestionIndex];

        // Build question context based on context type
        const questionContext: any = {
          type: currentQuestion.context || "architecture",
        };

        if (
          currentQuestion.context === "file" ||
          currentQuestion.context === "code_snippet"
        ) {
          questionContext.file = currentQuestion.file;
        }

        if (currentQuestion.context === "code_snippet") {
          questionContext.code_snippet = currentQuestion.code_snippet;
        }

        // Build project state
        const projectFiles =
          architectureData?.architecture_item?.map((item: any) => ({
            name: item.file,
            content: item.starter_code,
            purpose: item.purpose,
          })) || [];

        const projectState = {
          user_prompt: submittedMessage,
          files: projectFiles,
          current_step: currentQuestionIndex + 1,
          recent_interactions: userAnswers.map((ans, idx) => ({
            question: questions[idx]?.question,
            answer: ans,
          })),
        };

        // Call evaluate-answer API
        const response = await fetch("/api/evaluate-answer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question_text: currentQuestion.question,
            question_context: questionContext,
            user_answer: answer,
            project_state: projectState,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to evaluate answer");
        }

        const data = await response.json();
        setEvaluationResult(data);
        setIsCorrect(data.understood);
        setIsLoading(false);
        setShowFeedback(true);

        // If understood (score >= 80), proceed after showing feedback
        if (data.understood) {
          setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
              setShowFeedback(false);
              setEvaluationResult(null);
              setInputValue("");
            } else {
              // All questions completed, enable code tab and switch to it
              setCodeTabEnabled(true);
              setShowFeedback(false);
              setEvaluationResult(null);
              setInputValue("");
              setTimeout(() => {
                setActiveTab("code");
              }, 1000);
            }
          }, 3000);
        }
        // If not understood, wait for user to read hints/feedback before allowing retry
      } catch (error) {
        console.error("Error evaluating answer:", error);
        setIsLoading(false);
        // Fallback to simple feedback
        setIsCorrect(false);
        setShowFeedback(true);
        setEvaluationResult({
          score: 0,
          understood: false,
          feedback:
            "There was an error evaluating your answer. Please try again.",
        });
      }
    }
  };

  const handleInitialSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isGeneratingArchitecture) {
      const message = inputValue.trim();
      setSubmittedMessage(message);
      setInputValue("");
      setIsGeneratingArchitecture(true);

      try {
        const response = await fetch("/api/generate-architecture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_prompt: message,
            user_level: userLevel,
            allow_database: allowDatabase,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate architecture");
        }

        const data = await response.json();
        console.log("Architecture data received:", data);
        console.log("Architecture items:", data?.architecture_item);
        setArchitectureData(data);

        // Initialize project files
        if (data.architecture_item && data.architecture_item.length > 0) {
          const files = data.architecture_item.map((item: any) => ({
            name: item.file,
            content: item.starter_code,
            purpose: item.purpose,
          }));
          setProjectFiles(files);
          setSelectedFile(data.architecture_item[0].file);
        }

        setIsGeneratingArchitecture(false);
        setArchitectureAccepted(true); // Auto-accept architecture, go directly to quiz
        setMessageSent(true);
        setTimeout(() => {
          setShowNewScreen(true);
        }, 50);
      } catch (error) {
        console.error("Error generating architecture:", error);
        setIsGeneratingArchitecture(false);
      }
    }
  };

  const handleNextStep = async () => {
    if (isLoadingNextStep || !architectureData) return;

    setIsLoadingNextStep(true);
    setNextStepData(null);
    setShowNextStep(true);
    setActiveTab("code"); // Switch to code tab immediately
    setFileChanges(new Map()); // Clear previous step's highlights

    try {
      // Build project state
      const projectState = {
        user_prompt: submittedMessage,
        files:
          projectFiles.length > 0
            ? projectFiles.map((f) => ({
                file: f.name,
                content: f.content,
              }))
            : architectureData.architecture_item.map((item: any) => ({
                file: item.file,
                content: item.starter_code,
              })),
        current_step: currentStep + 1,
        allow_database: allowDatabase,
        learning_plan: developmentSteps
          .filter((step: any) => step.step > 0)
          .map((step: any) => ({
            step: step.step,
            title: step.title,
            goal: step.goal,
          })),
        recent_interactions: userAnswers.map((ans, idx) => {
          // Only include score/understood for the last answer (current evaluation)
          const isLastAnswer = idx === userAnswers.length - 1;
          return {
            type: "answer",
            text: ans,
            ...(isLastAnswer && evaluationResult
              ? {
                  score: evaluationResult.score,
                  understood: evaluationResult.understood,
                }
              : {}),
          };
        }),
        step_constraints: {
          max_lines: 30,
          explain_level: userLevel,
        },
      };

      const response = await fetch("/api/next-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_state: projectState,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate next step");
      }

      const data = await response.json();
      setNextStepData(data);

      // Store file changes for highlighting in code editor (before applying changes)
      const changesMap = new Map<string, any>();
      const originalFiles =
        projectFiles.length > 0
          ? [...projectFiles]
          : architectureData.architecture_item.map((item: any) => ({
              name: item.file,
              content: item.starter_code,
              purpose: item.purpose,
            }));

      if (data.file_changes && data.file_changes.length > 0) {
        data.file_changes.forEach((change: any) => {
          const originalFile = originalFiles.find(
            (f: any) => f.name === change.file
          );
          const originalContent = originalFile?.content || "";

          // Calculate insertion line for insert_after and insert_before
          let calculatedLineNumber: number | undefined = undefined;

          if (change.change_type === "insert_after" && change.insert_after) {
            const lines = originalContent.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(change.insert_after)) {
                calculatedLineNumber = i + 2; // After the matched line (1-based)
                break;
              }
            }
          } else if (
            change.change_type === "insert_before" &&
            change.insert_before
          ) {
            const lines = originalContent.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes(change.insert_before)) {
                calculatedLineNumber = i + 1; // Before the matched line (1-based)
                break;
              }
            }
          }

          changesMap.set(change.file, {
            ...change,
            originalContent,
            calculatedLineNumber, // Store calculated line for highlighting
          });
        });
      }
      setFileChanges(changesMap);

      // Apply file changes
      if (data.file_changes && data.file_changes.length > 0) {
        const updatedFiles = [...originalFiles];
        let newFileAdded = false;
        let firstNewFileName = "";

        data.file_changes.forEach((change: any) => {
          const fileIndex = updatedFiles.findIndex(
            (f: any) => f.name === change.file
          );
          if (fileIndex >= 0) {
            // Update existing file
            const currentContent = updatedFiles[fileIndex].content;
            let newContent = "";

            if (change.change_type === "replace") {
              newContent = change.content;
            } else if (change.change_type === "append") {
              newContent = currentContent + "\n" + change.content;
            } else if (change.change_type === "insert") {
              const lines = currentContent.split("\n");
              const insertIndex = (change.line_number || 1) - 1;
              // Split the content by newlines and insert each line
              const contentLines = change.content.split("\n");
              lines.splice(insertIndex, 0, ...contentLines);
              newContent = lines.join("\n");
            } else if (change.change_type === "insert_after") {
              // Find the line containing the pattern and insert after it
              const lines = currentContent.split("\n");
              const pattern = change.insert_after;
              let insertIndex = -1;

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(pattern)) {
                  insertIndex = i + 1; // Insert after this line
                  break;
                }
              }

              if (insertIndex === -1) {
                // Pattern not found, fallback to append
                console.warn(
                  `Pattern "${pattern}" not found in ${change.file}, appending instead`
                );
                newContent = currentContent + "\n" + change.content;
              } else {
                // Split the content by newlines and insert each line
                const contentLines = change.content.split("\n");
                lines.splice(insertIndex, 0, ...contentLines);
                newContent = lines.join("\n");
              }
            } else if (change.change_type === "insert_before") {
              // Find the line containing the pattern and insert before it
              const lines = currentContent.split("\n");
              const pattern = change.insert_before;
              let insertIndex = -1;

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(pattern)) {
                  insertIndex = i; // Insert before this line
                  break;
                }
              }

              if (insertIndex === -1) {
                // Pattern not found, fallback to append
                console.warn(
                  `Pattern "${pattern}" not found in ${change.file}, appending instead`
                );
                newContent = currentContent + "\n" + change.content;
              } else {
                // Split the content by newlines and insert each line
                const contentLines = change.content.split("\n");
                lines.splice(insertIndex, 0, ...contentLines);
                newContent = lines.join("\n");
              }
            }

            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              content: newContent,
            };
          } else {
            // Create new file
            newFileAdded = true;
            if (!firstNewFileName) {
              firstNewFileName = change.file;
            }
            updatedFiles.push({
              name: change.file,
              content: change.content,
              purpose: "", // New files don't have a purpose yet
            });
          }
        });
        setProjectFiles(updatedFiles);

        // If a new file was added, select it in the editor
        if (newFileAdded && firstNewFileName) {
          setSelectedFile(firstNewFileName);
        }
      }

      // Update current step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Check if we've completed all steps
      // developmentSteps.length includes step 0, so when nextStep >= length, we're done
      if (nextStep >= developmentSteps.length) {
        handleProjectComplete();
      }
    } catch (error) {
      console.error("Error generating next step:", error);
    } finally {
      setIsLoadingNextStep(false);
    }
  };

  const handleProjectComplete = () => {
    setIsProjectComplete(true);
    setShowCongratulations(true);

    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  const handleExportProject = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // Generate project name from user prompt
      const projectName =
        submittedMessage
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .substring(0, 50) || "my-project";

      const files =
        projectFiles.length > 0
          ? projectFiles.map((f: any) => ({
              file: f.name,
              content: f.content,
            }))
          : architectureData?.architecture_item?.map((item: any) => ({
              file: item.file,
              content: item.starter_code,
            })) || [];

      const response = await fetch("/api/export-project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_name: projectName,
          files: files,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to export project");
      }

      const { download_url } = await response.json();

      // Download the ZIP file
      const zipResponse = await fetch(download_url);
      const blob = await zipResponse.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting project:", error);
      alert(
        error instanceof Error ? error.message : "Failed to export project"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (messageSent) {
        handleSubmit();
      } else {
        handleInitialSubmit();
      }
    }
  };

  if (messageSent && showNewScreen && architectureData) {
    return (
      <div className="flex h-screen flex-col bg-[#faf9f6] font-sans overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="text-xl font-semibold text-gray-900">CodeStep</div>
          {showCongratulations && (
            <Button
              variant="outline"
              onClick={() => setShowCongratulations(false)}
              className="text-sm"
            >
              Go back to steps
            </Button>
          )}
        </header>

        <main
          className={`flex-1 min-h-0 transition-opacity duration-500 ease-out ${
            showNewScreen ? "opacity-100" : "opacity-0"
          }`}
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full bg-white overflow-hidden">
                <div className="px-6 pt-6 pb-4 shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Idea
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      Ready app
                    </span>
                  </div>
                  <Progress
                    value={
                      !quizAccepted
                        ? 0
                        : ((1 + currentQuestionIndex + 1) / 6) * 100
                    }
                    className="h-2"
                  />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div
                    className={`flex-1 overflow-y-auto overflow-x-hidden p-6 ${
                      codeTabEnabled
                        ? "flex items-start justify-start"
                        : "flex items-center justify-center"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {showCongratulations ? (
                        <motion.div
                          key="congratulations"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="w-full max-w-3xl mx-auto text-center space-y-8 flex flex-col items-center justify-center h-full"
                        >
                          <CheckCircle2 className="text-green-600" size={96} />
                          <div>
                            <h1 className="text-4xl font-semibold text-gray-900 mb-4">
                              🎉 Congratulations!
                            </h1>
                            <p className="text-xl text-gray-600">
                              You have finished your project! You can now export
                              it.
                            </p>
                          </div>
                          <Button
                            size="lg"
                            className="bg-green-600 text-white hover:bg-green-700 px-8 py-6 text-lg"
                            onClick={handleExportProject}
                            disabled={isExporting}
                          >
                            {isExporting ? (
                              <>
                                <Loader2
                                  size={20}
                                  className="animate-spin mr-2"
                                />
                                Exporting...
                              </>
                            ) : (
                              <>
                                <FileCode size={20} className="mr-2" />
                                Export Project
                              </>
                            )}
                          </Button>
                        </motion.div>
                      ) : !architectureData ||
                        isGeneratingArchitecture ? null : !quizAccepted ? (
                        <motion.div
                          key="quiz"
                          initial={{ opacity: 0, x: -100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ duration: 0.5 }}
                          className="text-center"
                        >
                          <CheckCircle2
                            className="text-green-600 mx-auto mb-6"
                            size={64}
                          />
                          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                            Architecture Generated
                          </h1>
                          <p className="text-base text-gray-600 mb-8 max-w-lg mx-auto">
                            We'll make you a quiz about it to ensure you
                            understand the structure before we start coding.
                          </p>
                          <Button
                            onClick={() => setQuizAccepted(true)}
                            size="lg"
                            className="bg-black text-white hover:bg-gray-800 w-48"
                          >
                            Start the Quiz
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`question-${currentQuestionIndex}`}
                          initial={{ opacity: 0, x: -100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ duration: 0.5 }}
                          className="text-center"
                        >
                          {questions.length > 0 &&
                            currentQuestionIndex < questions.length && (
                              <>
                                {isLoading ? (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-3 text-gray-600"
                                  >
                                    <Loader2
                                      size={32}
                                      className="animate-spin"
                                    />
                                    <span className="text-base">
                                      Checking your answer...
                                    </span>
                                  </motion.div>
                                ) : showFeedback && evaluationResult ? (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-center"
                                  >
                                    {evaluationResult.understood ? (
                                      <>
                                        <CheckCircle2
                                          className="text-green-600 mx-auto mb-4"
                                          size={48}
                                        />
                                        <h1 className="text-4xl font-semibold text-green-900 mb-4">
                                          Correct answer
                                        </h1>
                                        <h2 className="text-2xl font-medium text-gray-700 mb-6">
                                          Score: {evaluationResult.score}/100
                                        </h2>
                                      </>
                                    ) : (
                                      <>
                                        <XCircle
                                          className="text-red-600 mx-auto mb-4"
                                          size={48}
                                        />
                                        <h1 className="text-4xl font-semibold text-red-900 mb-4">
                                          Incorrect answer
                                        </h1>
                                        <h2 className="text-2xl font-medium text-gray-700 mb-6">
                                          Score: {evaluationResult.score}/100
                                        </h2>
                                        {evaluationResult.hints && (
                                          <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg max-w-3xl mx-auto">
                                            <p className="text-lg font-semibold text-yellow-900 mb-3">
                                              Hints:
                                            </p>
                                            {Array.isArray(
                                              evaluationResult.hints
                                            ) ? (
                                              <ul className="list-disc list-inside space-y-2 text-base text-yellow-800">
                                                {evaluationResult.hints.map(
                                                  (hint, idx) => (
                                                    <li key={idx}>{hint}</li>
                                                  )
                                                )}
                                              </ul>
                                            ) : (
                                              <p className="text-base text-yellow-800">
                                                {evaluationResult.hints}
                                              </p>
                                            )}
                                          </div>
                                        )}
                                        <Button
                                          onClick={() => {
                                            setShowFeedback(false);
                                            setEvaluationResult(null);
                                            setInputValue("");
                                          }}
                                          size="lg"
                                          className="mt-8 bg-gray-900 text-white hover:bg-gray-800 w-64 h-12 text-lg"
                                        >
                                          Try Again
                                        </Button>
                                      </>
                                    )}
                                  </motion.div>
                                ) : showNextStep ? (
                                  <div className="w-full max-w-3xl mx-auto text-left flex flex-col h-full">
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="flex-1 space-y-6"
                                    >
                                      <div className="flex items-center gap-3">
                                        {isLoadingNextStep || !nextStepData ? (
                                          <Cog
                                            className="text-gray-700 animate-spin"
                                            size={24}
                                          />
                                        ) : (
                                          <CheckCircle2
                                            className="text-green-600"
                                            size={24}
                                          />
                                        )}
                                        <h1 className="text-3xl font-semibold text-gray-900">
                                          {nextStepData ? (
                                            <>
                                              Step {nextStepData.step_number}:{" "}
                                              {developmentSteps.find(
                                                (s: any) =>
                                                  s.step ===
                                                  nextStepData.step_number
                                              )?.title || "Next step"}
                                            </>
                                          ) : (
                                            <>
                                              Step {currentStep + 1}:{" "}
                                              {developmentSteps.find(
                                                (s: any) =>
                                                  s.step === currentStep + 1
                                              )?.title || "Next step"}
                                            </>
                                          )}
                                        </h1>
                                      </div>

                                      {isLoadingNextStep && !nextStepData ? (
                                        <div>
                                          <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                            What we're adding:
                                          </h2>
                                          <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                          </div>
                                        </div>
                                      ) : nextStepData ? (
                                        <>
                                          {nextStepData.explanation && (
                                            <div>
                                              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                                What we're adding:
                                              </h2>
                                              <div
                                                className="text-base text-gray-700 prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    nextStepData.explanation
                                                      .replace(
                                                        /`([^`]+)`/g,
                                                        '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>'
                                                      )
                                                      .replace(/\n/g, "<br />"),
                                                }}
                                              />
                                            </div>
                                          )}

                                          {nextStepData.file_changes &&
                                            nextStepData.file_changes.length >
                                              0 && (
                                              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                                  Files Changed:
                                                </h2>
                                                <div className="space-y-1">
                                                  {nextStepData.file_changes.map(
                                                    (
                                                      change: any,
                                                      idx: number
                                                    ) => {
                                                      const originalFiles =
                                                        projectFiles.length > 0
                                                          ? projectFiles
                                                          : architectureData.architecture_item.map(
                                                              (item: any) => ({
                                                                name: item.file,
                                                                content:
                                                                  item.starter_code,
                                                              })
                                                            );
                                                      const originalFile =
                                                        originalFiles.find(
                                                          (f: any) =>
                                                            f.name ===
                                                            change.file
                                                        );
                                                      const originalContent =
                                                        originalFile?.content ||
                                                        "";
                                                      const originalLines =
                                                        originalContent.split(
                                                          "\n"
                                                        ).length;
                                                      const newLines =
                                                        change.content.split(
                                                          "\n"
                                                        ).length;

                                                      let addedLines = 0;
                                                      let removedLines = 0;

                                                      if (
                                                        change.change_type ===
                                                        "replace"
                                                      ) {
                                                        addedLines = newLines;
                                                        removedLines =
                                                          originalLines;
                                                      } else if (
                                                        change.change_type ===
                                                        "append"
                                                      ) {
                                                        addedLines = newLines;
                                                        removedLines = 0;
                                                      } else if (
                                                        change.change_type ===
                                                          "insert" ||
                                                        change.change_type ===
                                                          "insert_after" ||
                                                        change.change_type ===
                                                          "insert_before"
                                                      ) {
                                                        addedLines = newLines;
                                                        removedLines = 0;
                                                      }

                                                      return (
                                                        <div
                                                          key={idx}
                                                          className="flex items-center gap-2 text-sm font-mono"
                                                        >
                                                          <button
                                                            onClick={() => {
                                                              setSelectedFile(
                                                                change.file
                                                              );
                                                              setActiveTab(
                                                                "code"
                                                              );
                                                            }}
                                                            className="text-gray-700 hover:underline cursor-pointer"
                                                          >
                                                            {change.file}
                                                          </button>
                                                          {addedLines > 0 && (
                                                            <span className="text-green-600 font-semibold">
                                                              +{addedLines}
                                                            </span>
                                                          )}
                                                          {removedLines > 0 && (
                                                            <span className="text-red-600 font-semibold">
                                                              -{removedLines}
                                                            </span>
                                                          )}
                                                        </div>
                                                      );
                                                    }
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </>
                                      ) : null}
                                    </motion.div>
                                  </div>
                                ) : codeTabEnabled ? (
                                  <div className="w-full max-w-3xl mx-auto text-left">
                                    <div className="flex items-center justify-between mb-6">
                                      <h1 className="text-3xl font-semibold text-gray-900">
                                        Development Steps
                                      </h1>
                                      {isProjectComplete && (
                                        <Button
                                          size="sm"
                                          className="bg-green-600 text-white hover:bg-green-700"
                                          onClick={() =>
                                            setShowCongratulations(true)
                                          }
                                        >
                                          <FileCode
                                            size={16}
                                            className="mr-2"
                                          />
                                          Export
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {developmentSteps.map((step: any) => (
                                        <div
                                          key={step.step}
                                          className={`p-3 rounded-lg border-2 transition-all ${
                                            step.completed
                                              ? "bg-green-50 border-green-300"
                                              : "bg-white border-gray-200"
                                          }`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            {step.completed ? (
                                              <CheckCircle2
                                                size={20}
                                                className="text-green-600 mt-0.5 shrink-0"
                                              />
                                            ) : (
                                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-0.5 shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p
                                                className={`text-sm font-semibold mb-0.5 ${
                                                  step.completed
                                                    ? "text-green-900"
                                                    : "text-gray-900"
                                                }`}
                                              >
                                                {step.step === 0
                                                  ? step.title
                                                  : `Step ${step.step}: ${step.title}`}
                                              </p>
                                              <p
                                                className={`text-xs ${
                                                  step.completed
                                                    ? "text-green-700"
                                                    : "text-gray-600"
                                                }`}
                                              >
                                                {step.goal}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                                      {questions[currentQuestionIndex].question}
                                    </h1>
                                    <p className="text-base text-gray-500 mb-8 max-w-2xl mx-auto">
                                      Don't worry if you don't know something,
                                      try to guess it.
                                    </p>
                                  </>
                                )}
                              </>
                            )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {showNextStep && (
                    <div className="border-t border-gray-200 p-6 bg-white shrink-0">
                      <div className="max-w-3xl mx-auto">
                        <Button
                          size="lg"
                          className="w-full bg-black text-white hover:bg-gray-800"
                          onClick={() => {
                            setShowNextStep(false);
                            setNextStepData(null);
                            setIsLoadingNextStep(false);
                            setFileChanges(new Map()); // Clear highlights when going back
                          }}
                          disabled={isLoadingNextStep}
                        >
                          Back to steps
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {codeTabEnabled && !showNextStep && !showCongratulations ? (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="max-w-4xl mx-auto">
                      <Button
                        size="lg"
                        className="w-full bg-black text-white hover:bg-gray-800"
                        onClick={
                          isLastStep ? handleProjectComplete : handleNextStep
                        }
                        disabled={isLoadingNextStep}
                      >
                        {isLoadingNextStep ? (
                          <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Building next step...
                          </>
                        ) : isLastStep ? (
                          "Finish and export"
                        ) : (
                          "Continue to next step"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : !showNextStep &&
                  !showCongratulations &&
                  (!showFeedback || !evaluationResult) ? (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    <div className="max-w-4xl mx-auto">
                      <div className="relative">
                        <Textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            !quizAccepted
                              ? "Click Start to begin"
                              : questions.length > 0 &&
                                currentQuestionIndex < questions.length
                              ? "Write your answer..."
                              : "All questions completed!"
                          }
                          disabled={
                            !quizAccepted ||
                            isLoading ||
                            (showFeedback && evaluationResult?.understood) ||
                            questions.length === 0 ||
                            currentQuestionIndex >= questions.length
                          }
                          className="w-full min-h-20 pr-20 rounded-xl border-gray-200 bg-white text-gray-900 placeholder-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <ImageIcon size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                              !quizAccepted ||
                              isLoading ||
                              showFeedback ||
                              !inputValue.trim() ||
                              questions.length === 0 ||
                              currentQuestionIndex >= questions.length
                            }
                            className={`p-2 rounded-md transition-colors ${
                              quizAccepted &&
                              inputValue.trim() &&
                              !isLoading &&
                              !showFeedback &&
                              questions.length > 0 &&
                              currentQuestionIndex < questions.length
                                ? "bg-black text-white hover:bg-gray-800"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {isLoading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <ArrowUp size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={75} minSize={40}>
              <div className="flex flex-col h-full bg-white overflow-hidden">
                <div
                  className={`border-b border-gray-200 shrink-0 transition-opacity duration-700 delay-100 ${
                    showNewScreen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("architecture")}
                      className={`px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === "architecture"
                          ? "text-gray-900 border-b-2 border-gray-900 bg-white"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Architecture
                    </button>
                    <button
                      onClick={() => setActiveTab("code")}
                      disabled={!codeTabEnabled}
                      className={`px-4 py-3 text-sm font-medium transition-all ${
                        activeTab === "code"
                          ? "text-gray-900 border-b-2 border-gray-900 bg-white"
                          : !codeTabEnabled
                          ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Code
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeTab === "architecture" ? (
                      <motion.div
                        key="architecture"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 min-h-0"
                      >
                        <ArchitectureDiagram
                          architectureItems={
                            architectureData?.architecture_item || []
                          }
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="code"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 min-h-0 flex"
                      >
                        <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                          <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                              Files
                            </h3>
                            <div className="space-y-1">
                              <button
                                onClick={() => setSrcFolderOpen(!srcFolderOpen)}
                                className="w-full px-3 py-2 text-sm text-gray-700 flex items-center hover:bg-gray-100 rounded-md transition-colors"
                              >
                                <ChevronRight
                                  size={14}
                                  className={`mr-1 transition-transform ${
                                    srcFolderOpen ? "rotate-90" : ""
                                  }`}
                                />
                                <Folder size={16} className="mr-2" />
                                src
                              </button>
                              {srcFolderOpen && (
                                <div className="ml-7 space-y-1 border-l-2 border-gray-300 pl-2">
                                  {Object.keys(pythonFiles).length > 0 ? (
                                    Object.keys(pythonFiles).map((filename) => (
                                      <button
                                        key={filename}
                                        onClick={() =>
                                          setSelectedFile(filename)
                                        }
                                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                          selectedFile === filename
                                            ? "bg-gray-200 text-gray-900 font-medium"
                                            : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                      >
                                        <FileCode
                                          size={16}
                                          className="inline mr-2"
                                        />
                                        {filename}
                                      </button>
                                    ))
                                  ) : (
                                    <p className="px-3 py-2 text-sm text-gray-400">
                                      No files yet
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto bg-white">
                          {selectedFile && pythonFiles[selectedFile] ? (
                            <div className="relative">
                              <SyntaxHighlighter
                                language="python"
                                style={oneLight}
                                customStyle={{
                                  margin: 0,
                                  padding: "1rem",
                                  background: "#ffffff",
                                  fontSize: "14px",
                                }}
                                showLineNumbers
                              >
                                {pythonFiles[selectedFile]}
                              </SyntaxHighlighter>
                              {fileChanges.has(selectedFile) &&
                                (() => {
                                  const change = fileChanges.get(selectedFile);
                                  const fileContent = pythonFiles[selectedFile];
                                  const lines = fileContent.split("\n");
                                  const totalLines = lines.length;

                                  if (totalLines === 0) {
                                    return null;
                                  }

                                  let highlightStartLine = 0;
                                  let highlightEndLine = 0;

                                  if (change.change_type === "replace") {
                                    // For replace, highlight the entire file (all new content)
                                    highlightStartLine = 0;
                                    highlightEndLine = totalLines;
                                  } else if (change.change_type === "append") {
                                    // Append: highlight from the end of original content to the end
                                    const originalContent =
                                      change.originalContent || "";
                                    const originalLines =
                                      originalContent.split("\n").length;
                                    highlightStartLine = originalLines;
                                    highlightEndLine = totalLines;
                                  } else if (change.change_type === "insert") {
                                    // Insert: highlight at the specified line_number (1-based)
                                    // line_number is 1-based, so line 1 = index 0
                                    const insertLine = change.line_number || 1;
                                    const newCodeLines =
                                      change.content.split("\n").length;
                                    // Insert at line_number means the new content starts at that line
                                    highlightStartLine = insertLine - 1; // Convert to 0-based
                                    highlightEndLine =
                                      highlightStartLine + newCodeLines;
                                  } else if (
                                    change.change_type === "insert_after" ||
                                    change.change_type === "insert_before"
                                  ) {
                                    // Use calculated line number from when we stored the change
                                    const insertLine =
                                      change.calculatedLineNumber || 1;
                                    const newCodeLines =
                                      change.content.split("\n").length;
                                    highlightStartLine = insertLine - 1; // Convert to 0-based
                                    highlightEndLine =
                                      highlightStartLine + newCodeLines;
                                  }

                                  // Only show overlay if there's something to highlight
                                  if (
                                    highlightEndLine <= highlightStartLine ||
                                    highlightStartLine < 0 ||
                                    highlightEndLine > totalLines
                                  ) {
                                    return null;
                                  }

                                  // Calculate percentages based on line numbers
                                  // We need to account for the fact that each line takes up space
                                  const startPercent =
                                    (highlightStartLine / totalLines) * 100;
                                  const endPercent =
                                    (highlightEndLine / totalLines) * 100;

                                  return (
                                    <div
                                      className="absolute inset-0 pointer-events-none"
                                      style={{
                                        background:
                                          change.change_type === "replace"
                                            ? "rgba(34, 197, 94, 0.1)"
                                            : `linear-gradient(to bottom, transparent 0%, transparent ${startPercent}%, rgba(34, 197, 94, 0.15) ${startPercent}%, rgba(34, 197, 94, 0.15) ${endPercent}%, transparent ${endPercent}%, transparent 100%)`,
                                      }}
                                    />
                                  );
                                })()}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <p>Select a file to view code</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    );
  }

  return (
    <InitialLandingPage
      inputValue={inputValue}
      setInputValue={setInputValue}
      isGeneratingArchitecture={isGeneratingArchitecture}
      userLevel={userLevel}
      setUserLevel={setUserLevel}
      allowDatabase={allowDatabase}
      setAllowDatabase={setAllowDatabase}
      handleInitialSubmit={handleInitialSubmit}
    />
  );
}
