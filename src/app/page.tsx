"use client";

import { useState } from "react";
import {
  Image as ImageIcon,
  ArrowUp,
  Pencil,
  Rocket,
  FileCode,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNewScreen, setShowNewScreen] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isTransitioning) {
      const message = inputValue.trim();
      setSubmittedMessage(message);
      setInputValue("");
      setIsTransitioning(true);

      setTimeout(() => {
        setMessageSent(true);
        setIsTransitioning(false);
        setTimeout(() => {
          setShowNewScreen(true);
        }, 50);
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (messageSent) {
    return (
      <div className="flex min-h-screen flex-col bg-[#faf9f6] font-sans">
        <header className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="text-xl font-semibold text-gray-900">CodeStep</div>
        </header>

        <main
          className={`flex-1 h-[calc(100vh-73px)] transition-opacity duration-500 ease-out ${
            showNewScreen ? "opacity-100" : "opacity-0"
          }`}
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex flex-col h-full bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    <div
                      className={`mb-6 transition-opacity duration-700 delay-100 ${
                        showNewScreen ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Code Review & Analysis
                      </h2>
                      <p className="text-sm text-gray-500 mb-4">
                        {submittedMessage}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div
                        className={`border border-gray-200 rounded-lg p-4 bg-gray-50 transition-opacity duration-700 delay-200 ${
                          showNewScreen ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Analysis Summary
                        </h3>
                        <p className="text-sm text-gray-600">
                          Based on your request, here's a comprehensive analysis
                          of the software architecture. The diagram on the right
                          illustrates the system components and their
                          relationships.
                        </p>
                      </div>

                      <div
                        className={`border border-gray-200 rounded-lg p-4 transition-opacity duration-700 delay-300 ${
                          showNewScreen ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Architecture Overview
                        </h3>
                        <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                          <li>
                            Frontend layer handles user interactions and UI
                            rendering
                          </li>
                          <li>
                            API Gateway manages routing and request handling
                          </li>
                          <li>
                            Authentication service ensures secure access control
                          </li>
                          <li>
                            Business logic layer processes core application
                            functionality
                          </li>
                          <li>
                            Database stores persistent data with ACID compliance
                          </li>
                          <li>
                            Cache layer improves performance with fast data
                            access
                          </li>
                        </ul>
                      </div>

                      <div
                        className={`border border-gray-200 rounded-lg p-4 bg-gray-50 transition-opacity duration-700 delay-400 ${
                          showNewScreen ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900 mb-2">
                          Recommendations
                        </h3>
                        <p className="text-sm text-gray-600">
                          Consider implementing API rate limiting, adding
                          monitoring and logging services, and setting up
                          horizontal scaling for high-traffic scenarios.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="max-w-4xl mx-auto">
                    <div className="relative">
                      <Textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up question..."
                        className="w-full min-h-20 pr-20 rounded-xl border-gray-200 bg-white text-gray-900 placeholder-gray-500 resize-none"
                      />
                      <div className="absolute right-3 bottom-3 flex items-center gap-2">
                        <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                          <ImageIcon size={18} />
                        </button>
                        <button
                          onClick={handleSubmit}
                          className={`p-2 rounded-md transition-colors ${
                            inputValue.trim()
                              ? "bg-black text-white hover:bg-gray-800"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          <ArrowUp size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize={75} minSize={40}>
              <div className="h-full bg-white">
                <div
                  className={`p-4 border-b border-gray-200 transition-opacity duration-700 delay-100 ${
                    showNewScreen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    Software Architecture Diagram
                  </h3>
                </div>
                <div
                  className={`h-[calc(100%-73px)] transition-opacity duration-700 delay-200 ${
                    showNewScreen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <ArchitectureDiagram />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#faf9f6] font-sans transition-opacity duration-300 ease-out ${
        isTransitioning ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <div className="text-xl font-semibold text-gray-900">CodeStep</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center text-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">
              vibe coding for students
            </h1>
            <h2 className="text-base sm:text-lg text-gray-500 font-normal max-w-xl mb-2">
              Your AI-powered coding assistant for school. Get help, learn
              concepts, and build projects with confidence.
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="relative w-full">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your coding assistant to help you learn, build, or debug"
                className="w-full min-h-24 pr-20 rounded-xl border-gray-200 bg-white text-gray-900 placeholder-gray-500 placeholder:text-base resize-none"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className={`p-2 rounded-md transition-all ${
                    inputValue.trim() && !isTransitioning
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  } ${isTransitioning ? "animate-pulse" : ""}`}
                >
                  {isTransitioning ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ArrowUp size={18} />
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="w-full flex flex-col items-center gap-4 mt-8">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Try these examples to get started
            </p>
            <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  if (!isTransitioning) {
                    setInputValue("Write documentation");
                    handleSubmit();
                  }
                }}
                disabled={isTransitioning}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Pencil size={16} />
                <span>Write documentation</span>
              </button>
              <button
                onClick={() => {
                  if (!isTransitioning) {
                    setInputValue("Optimize performance");
                    handleSubmit();
                  }
                }}
                disabled={isTransitioning}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Rocket size={16} />
                <span>Optimize performance</span>
              </button>
              <button
                onClick={() => {
                  if (!isTransitioning) {
                    setInputValue("Find and fix 3 bugs");
                    handleSubmit();
                  }
                }}
                disabled={isTransitioning}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCode size={16} />
                <span>Find and fix 3 bugs</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
