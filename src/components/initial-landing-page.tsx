"use client";

import {
  Image as ImageIcon,
  ArrowUp,
  Pencil,
  Rocket,
  FileCode,
  Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { Info } from "lucide-react";

interface InitialLandingPageProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isGeneratingArchitecture: boolean;
  userLevel: "beginner" | "intermediate" | "advanced";
  setUserLevel: (value: "beginner" | "intermediate" | "advanced") => void;
  allowDatabase: boolean;
  setAllowDatabase: (value: boolean) => void;
  handleInitialSubmit: (e?: React.FormEvent) => void;
}

export default function InitialLandingPage({
  inputValue,
  setInputValue,
  isGeneratingArchitecture,
  userLevel,
  setUserLevel,
  allowDatabase,
  setAllowDatabase,
  handleInitialSubmit,
}: InitialLandingPageProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInitialSubmit();
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#faf9f6] font-sans overflow-hidden">
      <header className="flex items-center px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="text-xl font-semibold text-gray-900">CodeStep</div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 min-h-0 overflow-y-auto">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <div className="flex flex-col items-center text-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 leading-tight">
              vibe coding for students
            </h1>
            <h2 className="text-md sm:text-lg text-gray-500 font-normal max-w-2xl mb-2">
              Teaches students in schools how to vibe code. Our AI guides them
              step-by-step, explains everything simply, and helps them build
              real projects.
            </h2>
          </div>

          <form
            onSubmit={handleInitialSubmit}
            className="w-full flex flex-col gap-4"
          >
            <div className="relative w-full">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGeneratingArchitecture}
                placeholder="Ask your coding assistant to help you learn, build, or debug"
                className="w-full min-h-32 pr-20 pb-20 rounded-xl border-gray-200 bg-white text-gray-900 placeholder-gray-500 placeholder:text-base resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="absolute left-3 bottom-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="user-level"
                    className="text-xs font-medium text-gray-600"
                  >
                    Level:
                  </label>
                  <Select
                    value={userLevel}
                    onValueChange={(
                      value: "beginner" | "intermediate" | "advanced"
                    ) => setUserLevel(value)}
                    disabled={isGeneratingArchitecture}
                  >
                    <SelectTrigger
                      id="user-level"
                      className="w-[110px] h-7 text-xs"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="allow-database"
                    checked={allowDatabase}
                    onCheckedChange={setAllowDatabase}
                    disabled={isGeneratingArchitecture}
                    className="scale-75"
                  />
                  <label
                    htmlFor="allow-database"
                    className="text-xs font-medium text-gray-600 cursor-pointer"
                  >
                    Database
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Info size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Enable this if your app idea needs to store and retrieve
                        data. The AI will include database setup and explain how
                        it works in your project.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isGeneratingArchitecture}
                  className={`p-2 rounded-md transition-all ${
                    inputValue.trim() && !isGeneratingArchitecture
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {isGeneratingArchitecture ? (
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
                  if (!isGeneratingArchitecture) {
                    setInputValue("Discord clone in terminal");
                  }
                }}
                disabled={isGeneratingArchitecture}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] sm:min-w-[240px]"
              >
                <FileCode size={16} />
                <span>Discord clone in terminal</span>
              </button>
              <button
                onClick={() => {
                  if (!isGeneratingArchitecture) {
                    setInputValue("Simple calculator app");
                  }
                }}
                disabled={isGeneratingArchitecture}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] sm:min-w-[240px]"
              >
                <Rocket size={16} />
                <span>Simple calculator app</span>
              </button>
              <button
                onClick={() => {
                  if (!isGeneratingArchitecture) {
                    setInputValue("Snake game with Pygame");
                  }
                }}
                disabled={isGeneratingArchitecture}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px] sm:min-w-[240px]"
              >
                <Pencil size={16} />
                <span>Snake game with Pygame</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
