"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizInterfaceProps {
  quizAccepted: boolean;
  setQuizAccepted: (value: boolean) => void;
  questions: Array<{
    question: string;
    context: string;
    file?: string;
    code_snippet?: string;
  }>;
  currentQuestionIndex: number;
  isLoading: boolean;
  showFeedback: boolean;
  evaluationResult: {
    score: number;
    understood: boolean;
    feedback: string;
    hints?: string | string[];
  } | null;
  inputValue: string;
  setInputValue: (value: string) => void;
  setShowFeedback: (value: boolean) => void;
  setEvaluationResult: (value: any) => void;
}

export default function QuizInterface({
  quizAccepted,
  setQuizAccepted,
  questions,
  currentQuestionIndex,
  isLoading,
  showFeedback,
  evaluationResult,
  inputValue,
  setInputValue,
  setShowFeedback,
  setEvaluationResult,
}: QuizInterfaceProps) {
  if (!quizAccepted) {
    return (
      <motion.div
        key="quiz"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <CheckCircle2 className="text-green-600 mx-auto mb-6" size={64} />
        <h1 className="text-3xl font-semibold text-gray-900 mb-4">
          Architecture Generated
        </h1>
        <p className="text-base text-gray-600 mb-8 max-w-lg mx-auto">
          We'll make you a quiz about it to ensure you understand the structure
          before we start coding.
        </p>
        <Button
          onClick={() => setQuizAccepted(true)}
          size="lg"
          className="bg-black text-white hover:bg-gray-800 w-48"
        >
          Start the Quiz
        </Button>
      </motion.div>
    );
  }

  if (questions.length === 0 || currentQuestionIndex >= questions.length) {
    return null;
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 text-gray-600"
      >
        <Loader2 size={32} className="animate-spin" />
        <span className="text-base">Checking your answer...</span>
      </motion.div>
    );
  }

  if (showFeedback && evaluationResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        {evaluationResult.understood ? (
          <>
            <CheckCircle2 className="text-green-600 mx-auto mb-4" size={48} />
            <h1 className="text-4xl font-semibold text-green-900 mb-4">
              Correct answer
            </h1>
            <h2 className="text-2xl font-medium text-gray-700 mb-6">
              Score: {evaluationResult.score}/100
            </h2>
          </>
        ) : (
          <>
            <XCircle className="text-red-600 mx-auto mb-4" size={48} />
            <h1 className="text-4xl font-semibold text-red-900 mb-4">
              Incorrect answer
            </h1>
            <h2 className="text-2xl font-medium text-gray-700 mb-6">
              Score: {evaluationResult.score}/100
            </h2>
            {evaluationResult.hints && (
              <div className="mt-6 max-w-2xl mx-auto space-y-3 text-left">
                <div className="flex items-center gap-2 text-amber-600 font-medium text-sm uppercase tracking-wide ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Here's a hint
                </div>
                <div className="relative bg-amber-50/80 border border-amber-200/60 rounded-xl p-5 shadow-sm">
                  <div className="absolute -top-1.5 left-6 w-3 h-3 bg-amber-50 border-t border-l border-amber-200/60 transform rotate-45" />
                  {Array.isArray(evaluationResult.hints) ? (
                    <ul className="space-y-3">
                      {evaluationResult.hints.map((hint, idx) => (
                        <li key={idx} className="flex gap-3 text-gray-700">
                          <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-base leading-relaxed">
                            {hint}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base text-gray-700 leading-relaxed">
                      {evaluationResult.hints}
                    </p>
                  )}
                </div>
              </div>
            )}
            <Button
              onClick={() => {
                setShowFeedback(false);
                setEvaluationResult(null);
                setInputValue("");
              }}
              size="lg"
              className="mt-8 bg-gray-900 text-white hover:bg-gray-800 w-full max-w-xs h-12 text-base font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Try Again
            </Button>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
        {questions[currentQuestionIndex].question}
      </h1>

      <p className="text-base text-gray-500 max-w-2xl mx-auto">
        Don't worry if you don't know something, try to guess it.
      </p>
    </div>
  );
}
