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
  ChevronDown,
  ChevronUp,
  Info,
  Cog,
  Lightbulb,
  Sparkles,
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
import QuizInterface from "@/components/quiz-interface";

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
  const [showAllSteps, setShowAllSteps] = useState(false);

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
            file: item.file,
            content: item.starter_code,
            purpose: item.purpose,
          })) || [];

        const projectState = {
          idea: submittedMessage,
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
            idea: message,
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
        idea: submittedMessage,
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

  // Calculate progress value for the bar
  const totalStepsCount = Math.max(developmentSteps.length, 1);
  const questionsCount = Math.max(questions.length, 1);
  let progressValue = 0;

  if (quizAccepted) {
    if (!codeTabEnabled) {
      // Quiz Phase: 5% to 20%
      progressValue = 5 + (currentQuestionIndex / questionsCount) * 15;
    } else {
      // Development Phase: 20% to 100%
      progressValue = 20 + (currentStep / totalStepsCount) * 80;
    }
  } else if (messageSent) {
    progressValue = 2;
  }

  // Cap at 100
  progressValue = Math.min(100, Math.max(0, progressValue));

  if (messageSent && showNewScreen && architectureData) {
    return (
      <div className="flex h-screen flex-col bg-[#faf9f6] font-sans overflow-hidden relative">
        {/* Background Blobs */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-rose-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[20%] right-[20%] h-[50%] rounded-full bg-orange-500/20 blur-[120px] pointer-events-none" />

        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 relative z-10 bg-white/50 backdrop-blur-sm">
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
          className={`flex-1 min-h-0 transition-opacity duration-500 ease-out relative z-10 ${
            showNewScreen ? "opacity-100" : "opacity-0"
          }`}
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="flex flex-col h-full bg-white/60 backdrop-blur-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 shrink-0">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-md transition-colors ${
                          progressValue > 0
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Lightbulb size={14} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Idea
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                          isProjectComplete ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        App
                      </span>
                      <div
                        className={`p-1.5 rounded-md transition-colors ${
                          isProjectComplete
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Rocket size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner ring-1 ring-gray-200/50">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressValue}%` }}
                      transition={{
                        type: "spring",
                        damping: 20,
                        stiffness: 100,
                      }}
                    >
                      <div
                        className="absolute inset-0 bg-white/20"
                        style={{
                          backgroundImage:
                            "linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)",
                          backgroundSize: "1rem 1rem",
                        }}
                      />
                      <motion.div
                        className="absolute top-0 right-0 h-full w-0.5 bg-white/60 shadow-[0_0_10px_2px_rgba(255,255,255,0.5)]"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>

                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-[10px] font-medium text-gray-400">
                      {Math.round(progressValue)}% complete
                    </span>
                    {progressValue >= 100 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider"
                      >
                        <Sparkles size={10} />
                        Done
                      </motion.div>
                    )}
                  </div>
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
                        isGeneratingArchitecture ? null : showNextStep ? (
                        <div className="w-full max-w-3xl mx-auto text-left flex flex-col h-full">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 space-y-6"
                          >
                            <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
                              <div className="flex items-center justify-between">
                                <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold tracking-wide uppercase">
                                  Step{" "}
                                  {nextStepData
                                    ? nextStepData.step_number
                                    : currentStep + 1}
                                </span>
                                {isLoadingNextStep || !nextStepData ? (
                                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    <Loader2
                                      size={12}
                                      className="animate-spin"
                                    />
                                    Generating Code...
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                    <CheckCircle2 size={12} />
                                    Code Ready
                                  </div>
                                )}
                              </div>
                              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                                {nextStepData
                                  ? developmentSteps.find(
                                      (s: any) =>
                                        s.step === nextStepData.step_number
                                    )?.title || "Next step"
                                  : developmentSteps.find(
                                      (s: any) => s.step === currentStep + 1
                                    )?.title || "Next step"}
                              </h1>
                            </div>

                            {isLoadingNextStep && !nextStepData ? (
                              <div className="w-full">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                                  Generating code...
                                </h2>
                                <div className="space-y-3 max-w-2xl">
                                  <Skeleton className="h-4 w-full" />
                                  <Skeleton className="h-4 w-[90%]" />
                                  <Skeleton className="h-4 w-[95%]" />
                                </div>
                              </div>
                            ) : nextStepData ? (
                              <div className="w-full space-y-6">
                                {nextStepData.explanation && (
                                  <div className="space-y-3">
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                      What we're doing
                                    </h2>
                                    <div
                                      className="text-base text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html: nextStepData.explanation
                                          .replace(
                                            /`([^`]+)`/g,
                                            '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800 border border-gray-200">$1</code>'
                                          )
                                          .replace(/\n/g, "<br />"),
                                      }}
                                    />
                                  </div>
                                )}

                                {nextStepData.file_changes &&
                                  nextStepData.file_changes.length > 0 && (
                                    <div className="space-y-4">
                                      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        Files Changed
                                      </h2>
                                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                          <h3 className="font-medium text-xs uppercase tracking-wider text-gray-500">
                                            File System
                                          </h3>
                                          <span className="text-xs font-medium text-gray-400">
                                            {nextStepData.file_changes.length}{" "}
                                            files
                                          </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                          {nextStepData.file_changes.map(
                                            (change: any, idx: number) => {
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
                                                    f.name === change.file
                                                );
                                              const originalContent =
                                                originalFile?.content || "";
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
                                                change.change_type === "replace"
                                              ) {
                                                addedLines = newLines;
                                                removedLines = originalLines;
                                              } else if (
                                                change.change_type === "append"
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

                                              const isNewFile = !originalFile;
                                              let changeLabel = "Update";
                                              let changeColorClass =
                                                "bg-blue-50 text-blue-700 border-blue-200";

                                              if (isNewFile) {
                                                changeLabel = "New File";
                                                changeColorClass =
                                                  "bg-emerald-50 text-emerald-700 border-emerald-200";
                                              } else {
                                                switch (change.change_type) {
                                                  case "replace":
                                                    changeLabel = "Rewrite";
                                                    changeColorClass =
                                                      "bg-amber-50 text-amber-700 border-amber-200";
                                                    break;
                                                  case "append":
                                                    changeLabel = "Append";
                                                    changeColorClass =
                                                      "bg-violet-50 text-violet-700 border-violet-200";
                                                    break;
                                                  default: // insert, insert_after, insert_before
                                                    changeLabel = "Update";
                                                    changeColorClass =
                                                      "bg-blue-50 text-blue-700 border-blue-200";
                                                }
                                              }

                                              return (
                                                <div
                                                  key={idx}
                                                  className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                                  onClick={() => {
                                                    setSelectedFile(
                                                      change.file
                                                    );
                                                    setActiveTab("code");
                                                  }}
                                                >
                                                  <div className="flex items-center gap-3 min-w-0">
                                                    <FileCode
                                                      size={16}
                                                      className="text-gray-400 group-hover:text-blue-600 transition-colors shrink-0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 font-mono truncate">
                                                      {change.file}
                                                    </span>
                                                    <span
                                                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${changeColorClass}`}
                                                    >
                                                      {changeLabel}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-3 text-xs font-medium pl-4 shrink-0">
                                                    <div className="flex items-center gap-2">
                                                      {addedLines > 0 && (
                                                        <span className="text-green-600">
                                                          +{addedLines}
                                                        </span>
                                                      )}
                                                      {removedLines > 0 && (
                                                        <span className="text-red-600">
                                                          -{removedLines}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <ChevronRight
                                                      size={14}
                                                      className="text-gray-300 group-hover:text-gray-500 transition-colors"
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                              </div>
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
                                onClick={() => setShowCongratulations(true)}
                              >
                                <FileCode size={16} className="mr-2" />
                                Export
                              </Button>
                            )}
                          </div>
                          <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-100">
                            {developmentSteps.map(
                              (step: any, index: number) => {
                                // Identify the current active step index (first uncompleted step)
                                const activeStepIndex =
                                  developmentSteps.findIndex(
                                    (s: any) => !s.completed
                                  );
                                const safeActiveIndex =
                                  activeStepIndex === -1
                                    ? developmentSteps.length - 1
                                    : activeStepIndex;

                                const isCurrent = index === safeActiveIndex;

                                // Find index of current step for collapsing logic
                                const currentIndex = developmentSteps.findIndex(
                                  (s: any) =>
                                    !s.completed &&
                                    (s.step === 0 ||
                                      developmentSteps.find(
                                        (p: any) => p.step === s.step - 1
                                      )?.completed)
                                );
                                const activeIndex =
                                  currentIndex === -1
                                    ? developmentSteps.length - 1
                                    : currentIndex;

                                // Hide steps if they are more than 1 step behind current and showAllSteps is false
                                const shouldHide =
                                  !showAllSteps && index < activeIndex - 1;

                                if (shouldHide) {
                                  // Only render the toggle button once, at the position of the first hidden step
                                  if (index === 0) {
                                    const hiddenCount = activeIndex - 1;
                                    return (
                                      <div
                                        key="hidden-steps-toggle"
                                        className="relative"
                                      >
                                        <div className="absolute -left-[34px] w-8 h-8 rounded-full border-4 border-gray-50 bg-white flex items-center justify-center z-10">
                                          <div className="w-1 h-1 rounded-full bg-gray-300" />
                                        </div>
                                        <button
                                          onClick={() => setShowAllSteps(true)}
                                          className="w-full p-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                          <ChevronDown size={14} />
                                          Show {hiddenCount} previous steps
                                        </button>
                                      </div>
                                    );
                                  }
                                  return null;
                                }

                                return (
                                  <div key={step.step} className="relative">
                                    <div
                                      className={`absolute -left-[34px] w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 bg-white transition-colors ${
                                        step.completed
                                          ? "border-green-100"
                                          : isCurrent
                                          ? "border-indigo-100"
                                          : "border-gray-50"
                                      }`}
                                    >
                                      <div
                                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                          step.completed
                                            ? "bg-green-500"
                                            : isCurrent
                                            ? "bg-indigo-500 animate-pulse"
                                            : "bg-gray-300"
                                        }`}
                                      />
                                    </div>

                                    <div
                                      className={`rounded-xl border transition-all ${
                                        step.completed
                                          ? "bg-white border-gray-200/60 opacity-70 hover:opacity-100 p-3"
                                          : isCurrent
                                          ? "bg-white border-indigo-200 shadow-sm ring-4 ring-indigo-50/50 p-5"
                                          : "bg-gray-50/50 border-gray-200/60 opacity-60 p-3"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span
                                              className={`text-xs font-bold uppercase tracking-wider ${
                                                step.completed
                                                  ? "text-green-600"
                                                  : isCurrent
                                                  ? "text-indigo-600"
                                                  : "text-gray-400"
                                              }`}
                                            >
                                              {step.step === 0
                                                ? "Preparation"
                                                : `Step ${step.step}`}
                                            </span>
                                            {step.completed && (
                                              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-medium">
                                                <CheckCircle2 size={10} />
                                                Done
                                              </div>
                                            )}
                                          </div>

                                          <h3
                                            className={`text-base font-bold ${
                                              step.completed
                                                ? "text-gray-700 truncate"
                                                : isCurrent
                                                ? "text-gray-900 mb-2"
                                                : "text-gray-500 truncate"
                                            }`}
                                          >
                                            {step.title}
                                          </h3>

                                          {isCurrent && (
                                            <p className="text-sm leading-relaxed text-gray-600">
                                              {step.goal}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                            {showAllSteps && (
                              <div className="relative">
                                <div className="absolute -left-[34px] w-8 h-8 flex items-center justify-center"></div>
                                <button
                                  onClick={() => setShowAllSteps(false)}
                                  className="w-full p-2 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
                                >
                                  <ChevronUp size={12} />
                                  Hide previous steps
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <motion.div
                          key={`question-${currentQuestionIndex}`}
                          initial={{ opacity: 0, x: -100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          transition={{ duration: 0.5 }}
                          className="w-full h-full flex flex-col"
                        >
                          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                            <QuizInterface
                              quizAccepted={quizAccepted}
                              setQuizAccepted={setQuizAccepted}
                              questions={questions}
                              currentQuestionIndex={currentQuestionIndex}
                              isLoading={isLoading}
                              showFeedback={showFeedback}
                              evaluationResult={evaluationResult}
                              inputValue={inputValue}
                              setInputValue={setInputValue}
                              setShowFeedback={setShowFeedback}
                              setEvaluationResult={setEvaluationResult}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {showNextStep && (
                    <div className="border-t border-gray-200 p-6 shrink-0">
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
                  <div className="border-t border-gray-200 p-4">
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
                          `Continue to Step ${currentStep + 1}`
                        )}
                      </Button>
                    </div>
                  </div>
                ) : !showNextStep &&
                  !showCongratulations &&
                  (!showFeedback || !evaluationResult) &&
                  quizAccepted ? (
                  <div className="border-t border-gray-200 p-4">
                    <div className="max-w-4xl mx-auto">
                      <div className="relative">
                        <Textarea
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            questions.length > 0 &&
                            currentQuestionIndex < questions.length
                              ? "Write your answer..."
                              : "All questions completed!"
                          }
                          disabled={
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
                              isLoading ||
                              showFeedback ||
                              !inputValue.trim() ||
                              questions.length === 0 ||
                              currentQuestionIndex >= questions.length
                            }
                            className={`p-2 rounded-md transition-colors ${
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
