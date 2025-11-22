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
    <div className="flex h-screen flex-col bg-[#faf9f6] font-sans overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-rose-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] right-[20%] h-[50%] rounded-full bg-orange-500/20 blur-[120px] pointer-events-none" />

      <header className="flex items-center px-6 py-4 shrink-0 relative z-10">
        <div className="text-xl font-semibold text-gray-900">CodeStep</div>
      </header>

      <main className="flex-1 overflow-y-auto relative z-10 scroll-smooth">
        <div className="flex flex-col items-center w-full">
          <div className="min-h-[calc(100vh-80px)] w-full max-w-4xl flex flex-col items-center justify-center gap-8 px-4 py-12">
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
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
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
                          Enable this if your app idea needs to store and
                          retrieve data. The AI will include database setup and
                          explain how it works in your project.
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
          </div>

          <div className="w-full max-w-4xl flex flex-col items-center gap-6 px-4 pb-16 -mt-16">
            <div className="flex items-center gap-2 text-gray-500">
              <span className="h-px w-16 bg-black"></span>
              <p className="text-sm font-medium text-black">Try an example</p>
              <span className="h-px w-16 bg-black"></span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {[
                {
                  icon: FileCode,
                  text: "Discord clone",
                  sub: "in terminal",
                },
                {
                  icon: Rocket,
                  text: "Simple calculator",
                  sub: "basic logic",
                },
                {
                  icon: Pencil,
                  text: "Snake game",
                  sub: "with Pygame",
                },
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!isGeneratingArchitecture) {
                      setInputValue(`${example.text} ${example.sub}`);
                    }
                  }}
                  disabled={isGeneratingArchitecture}
                  className="group flex flex-col items-start gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:-translate-y-0.5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-gray-100 transition-colors">
                    <example.icon size={18} />
                  </div>
                  <div>
                    <span className="block font-medium text-gray-900 text-sm">
                      {example.text}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {example.sub}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
