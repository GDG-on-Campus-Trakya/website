"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";

const WORD_BANKS = {
  tr: [
    "bir", "ve", "bu", "ne", "için", "ile", "olan", "de", "da", "mi", "ben", "sen", "o", "biz", "siz", "onlar", "şu", "gibi", "var", "yok",
    "çok", "daha", "en", "her", "hiç", "nasıl", "neden", "nerede", "kim", "hangi", "şey", "zaman", "yer", "kişi", "gün", "yıl", "ay", "hafta", "saat", "dakika",
    "iyi", "kötü", "büyük", "küçük", "yeni", "eski", "uzun", "kısa", "hızlı", "yavaş", "güzel", "çirkin", "kolay", "zor", "az", "fazla", "önemli", "gereksiz", "doğru", "yanlış",
    "yapmak", "olmak", "etmek", "gelmek", "gitmek", "almak", "vermek", "görmek", "söylemek", "bilmek", "istemek", "sevmek", "anlamak", "düşünmek", "yaşamak", "ölmek", "yemek", "içmek", "uyumak", "kalkmak",
    "ev", "iş", "okul", "araba", "bilgisayar", "telefon", "kitap", "masa", "sandalye", "pencere", "kapı", "su", "yemek", "ekmek", "para", "arkadaş", "aile", "anne", "baba", "çocuk",
  ],
  en: [
    "the", "and", "this", "what", "for", "with", "that", "from", "into", "your", "you", "they", "them", "there", "these", "those", "about", "after", "before", "while",
    "more", "less", "best", "every", "never", "how", "why", "where", "when", "which", "thing", "time", "place", "person", "day", "year", "month", "week", "hour", "minute",
    "good", "bad", "large", "small", "new", "old", "long", "short", "fast", "slow", "beautiful", "ugly", "easy", "hard", "few", "many", "important", "useless", "right", "wrong",
    "make", "become", "do", "come", "go", "take", "give", "see", "say", "know", "want", "love", "understand", "think", "live", "eat", "drink", "sleep", "wake", "learn",
    "home", "work", "school", "car", "computer", "phone", "book", "table", "chair", "window", "door", "water", "bread", "money", "friend", "family", "mother", "father", "child", "community",
  ],
};

const CODE_SNIPPETS = [
  {
    lang: "javascript",
    code: `function fib(n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}`,
  },
  {
    lang: "javascript",
    code: `const getData = async (url) => {\n  const res = await fetch(url);\n  const data = await res.json();\n  return data;\n};`,
  },
  {
    lang: "javascript",
    code: `class Rect {\n  constructor(w, h) {\n    this.w = w;\n    this.h = h;\n  }\n  get area() {\n    return this.w * this.h;\n  }\n}`,
  },
  {
    lang: "javascript",
    code: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst sum = doubled.reduce((a, n) => a + n, 0);`,
  },
  {
    lang: "python",
    code: `def sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]`,
  },
  {
    lang: "python",
    code: `class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None`,
  },
  {
    lang: "java",
    code: `public class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  },
  {
    lang: "csharp",
    code: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
  },
  {
    lang: "cpp",
    code: `#include <iostream>\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  },
  {
    lang: "go",
    code: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  },
  {
    lang: "rust",
    code: `fn main() {\n    println!("Hello, World!");\n}`,
  },
  {
    lang: "assembly",
    code: `section .data\n    msg db "Hello, World!", 0xa\nsection .text\n    global _start\n_start:\n    mov eax, 4\n    mov ebx, 1\n    mov ecx, msg\n    mov edx, 13\n    int 0x80\n    mov eax, 1\n    int 0x80`,
  },
  {
    lang: "typescript",
    code: `interface User {\n    name: string;\n    id: number;\n}\nclass UserAccount {\n    name: string;\n    id: number;\n    constructor(name: string, id: number) {\n        this.name = name;\n        this.id = id;\n    }\n}`,
  },
  {
    lang: "ruby",
    code: `class Greeter\n  def initialize(name)\n    @name = name.capitalize\n  end\n  def salute\n    puts "Hello #{@name}!"\n  end\nend`,
  },
  {
    lang: "php",
    code: `<?php\nclass Greeting {\n    public $name;\n    public function __construct($name) {\n        $this->name = $name;\n    }\n    public function sayHello() {\n        echo "Hello, " . $this->name . "!";\n    }\n}\n?>`,
  },
  {
    lang: "swift",
    code: `import Swift\nstruct Greeter {\n    var name: String\n    func greet() {\n        print("Hello, \\(name)!")\n    }\n}\nlet greeter = Greeter(name: "World")\ngreeter.greet()`,
  },
  {
    lang: "kotlin",
    code: `class Greeter(val name: String) {\n    fun greet() {\n        println("Hello, $name!")\n    }\n}\nfun main() {\n    val greeter = Greeter("World")\n    greeter.greet()\n}`,
  },
  {
    lang: "scala",
    code: `object HelloWorld {\n  def main(args: Array[String]): Unit = {\n    println("Hello, world!")\n  }\n}`,
  },
  {
    lang: "perl",
    code: `use strict;\nuse warnings;\nsub greet {\n    my ($name) = @_;\n    print "Hello, $name!\n";\n}\ngreet("World");`,
  },
  {
    lang: "r",
    code: `greet <- function(name) {\n  paste("Hello,", name, "!")\n}\ngreet("World")`,
  },
];

const COPY = {
  tr: {
    title: "Yazma Hızı Testi",
    subtitle: "Yazma hızını ve doğruluğunu ölç",
    normalMode: "Normal Mod",
    codeMode: "Kod Modu",
    reset: "Sıfırla",
    endlessMode: "Sınırsız Mod",
    endlessHelp: "(Yazdıkça yeni metin gelir)",
    wpm: "KDK",
    accuracy: "Doğruluk",
    time: "Süre",
    rawWpm: "Ham KDK",
    wordsPerMinute: "KDK (Kelime/Dk)",
    correctChars: "Doğru Karakter",
    errors: "Hata",
    clickToStart: "Yazmaya başlamak için yukarıdaki metin kutusuna tıklayın",
    results: "Test Sonuçları",
    tryAgain: "Tekrar Dene",
  },
  en: {
    title: "Typing Speed Test",
    subtitle: "Measure your typing speed and accuracy",
    normalMode: "Normal Mode",
    codeMode: "Code Mode",
    reset: "Reset",
    endlessMode: "Endless Mode",
    endlessHelp: "(A new text appears as you keep typing)",
    wpm: "WPM",
    accuracy: "Accuracy",
    time: "Time",
    rawWpm: "Raw WPM",
    wordsPerMinute: "WPM (Words/Min)",
    correctChars: "Correct Characters",
    errors: "Errors",
    clickToStart: "Click the text box above to start typing",
    results: "Test Results",
    tryAgain: "Try Again",
  },
};

export default function TypingTest() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [mode, setMode] = useState("normal");
  const [isEndless, setIsEndless] = useState(false);
  const [text, setText] = useState("");
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const containerRef = useRef(null);

  const generateText = useCallback(() => {
    if (mode === "normal") {
      const wordCount = 100;
      const randomWords = [];
      const bank = WORD_BANKS[locale];
      for (let i = 0; i < wordCount; i += 1) {
        randomWords.push(bank[Math.floor(Math.random() * bank.length)]);
      }
      return randomWords.join(" ");
    }

    const randomSnippet =
      CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
    return randomSnippet.code;
  }, [mode, locale]);

  const resetTest = useCallback(() => {
    const newText = generateText();
    setText(newText);
    setInput("");
    setCurrentCharIndex(0);
    setStartTime(null);
    setIsActive(false);
    setStats(null);
    setTimeout(() => containerRef.current?.focus(), 100);
  }, [generateText]);

  useEffect(() => {
    resetTest();
  }, [mode, locale, resetTest]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const finishTest = (finalInput, currentText, currentStartTime) => {
    const endTime = Date.now();
    setIsActive(false);

    const timeElapsed = (endTime - currentStartTime) / 1000 / 60;
    const wordsTyped = finalInput.trim().split(/\s+/).length;
    const charsTyped = finalInput.length;

    let correctChars = 0;
    for (let i = 0; i < Math.min(finalInput.length, currentText.length); i += 1) {
      if (finalInput[i] === currentText[i]) correctChars += 1;
    }
    const accuracy = Math.round((correctChars / currentText.length) * 100);
    const wpm = Math.round(wordsTyped / timeElapsed);
    const rawWpm = Math.round(charsTyped / 5 / timeElapsed);

    setStats({
      wpm,
      rawWpm,
      accuracy,
      correctChars,
      totalChars: currentText.length,
      timeElapsed: Math.round(timeElapsed * 60),
    });
  };

  const handleInput = (char) => {
    setInput((prev) => {
      const newInput = prev + char;
      setCurrentCharIndex(newInput.length);

      if (newInput.length >= text.length) {
        if (isEndless) {
          const newText = generateText();
          setText(newText);
          setTimeout(() => {
            setInput("");
            setCurrentCharIndex(0);
          }, 0);
          return newInput;
        }

        finishTest(newInput, text, startTime);
      }
      return newInput;
    });
  };

  const handleKeyDown = (event) => {
    if (stats) return;

    if (!startTime && !isActive) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    if (event.key === "Tab") {
      event.preventDefault();

      if (mode === "code") {
        handleInput("    ");
      } else {
        setInput((prev) => {
          setCurrentCharIndex((current) => {
            let skipTo = current;
            while (
              skipTo < text.length &&
              (text[skipTo] === " " || text[skipTo] === "\t")
            ) {
              skipTo += 1;
            }
            if (skipTo > current) {
              const skippedText = text.substring(current, skipTo);
              const newInput = prev + skippedText;
              setInput(newInput);
              setCurrentCharIndex(newInput.length);
              return newInput.length;
            }
            return current;
          });
          return prev;
        });
      }
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      setInput((prev) => {
        setCurrentCharIndex((current) => {
          let skipTo = current;
          while (skipTo < text.length && text[skipTo] !== "\n") {
            skipTo += 1;
          }
          if (skipTo < text.length && text[skipTo] === "\n") {
            skipTo += 1;
          }
          if (skipTo > current) {
            const skippedText = text.substring(current, skipTo);
            const newInput = prev + skippedText;
            setInput(newInput);
            setCurrentCharIndex(newInput.length);
            return newInput.length;
          }
          return current;
        });
        return prev;
      });
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      setInput((prev) => {
        if (prev.length > 0) {
          const newInput = prev.slice(0, -1);
          setCurrentCharIndex(newInput.length);
          return newInput;
        }
        return prev;
      });
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      handleInput(event.key);
    }
  };

  const renderedText = useMemo(
    () =>
      text.split("").map((char, index) => {
        let className = "transition-all duration-100 ";

        if (index < input.length) {
          if (input[index] === char) {
            className += "opacity-100 text-green-400";
          } else {
            className += "rounded bg-red-500/20 px-0.5 text-red-400 opacity-100";
          }
        } else if (index === input.length) {
          className +=
            "animate-pulse border-b-2 border-blue-400 bg-blue-500/30 text-gray-400 opacity-50";
        } else {
          className += "text-gray-500 opacity-30";
        }

        return (
          <span key={index} className={className}>
            {char === " " ? "\u00A0" : char}
            {char === "\n" ? <br /> : ""}
          </span>
        );
      }),
    [text, input]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 animate-fadeIn text-center">
          <h1 className="mb-2 text-4xl font-bold text-white md:text-5xl">
            {copy.title}
          </h1>
          <p className="text-gray-400">{copy.subtitle}</p>
        </div>

        {!stats ? (
          <div className="animate-fadeIn space-y-6">
            <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      onClick={() => setMode("normal")}
                      disabled={isActive}
                      className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all sm:flex-none ${
                        mode === "normal"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {copy.normalMode}
                    </button>
                    <button
                      onClick={() => setMode("code")}
                      disabled={isActive}
                      className={`flex-1 rounded-lg px-4 py-2 font-medium transition-all sm:flex-none ${
                        mode === "code"
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {copy.codeMode}
                    </button>
                  </div>

                  <button
                    onClick={resetTest}
                    className="w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-lg transition-all hover:bg-red-700 sm:w-auto"
                  >
                    {copy.reset}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isEndless}
                      onChange={(event) => setIsEndless(event.target.checked)}
                      disabled={isActive}
                      className="h-5 w-5 cursor-pointer rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="font-medium text-gray-300">
                      {copy.endlessMode}
                    </span>
                  </label>
                  <span className="text-sm text-gray-500">{copy.endlessHelp}</span>
                </div>
              </div>

              {isActive && (
                <div className="mt-6 flex flex-wrap justify-center gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-400">
                      {Math.round(
                        input.trim().split(/\s+/).length /
                          ((Date.now() - startTime) / 1000 / 60) || 0
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{copy.wpm}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">
                      {Math.round(
                        (input
                          .split("")
                          .filter((char, i) => char === text[i]).length /
                          currentCharIndex) *
                          100 || 0
                      )}
                      %
                    </div>
                    <div className="text-sm text-gray-400">{copy.accuracy}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-400">
                      {Math.round((Date.now() - startTime) / 1000)}s
                    </div>
                    <div className="text-sm text-gray-400">{copy.time}</div>
                  </div>
                </div>
              )}
            </div>

            <div
              ref={containerRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              className="cursor-text overflow-hidden rounded-2xl border-2 border-gray-700 bg-gray-800/50 p-6 shadow-xl backdrop-blur-sm focus:border-blue-500 focus:outline-none md:p-8"
            >
              <div
                className={`leading-relaxed ${
                  mode === "code"
                    ? "overflow-x-auto whitespace-pre-wrap font-mono text-base md:text-lg"
                    : "break-words font-sans text-xl md:text-2xl"
                }`}
                style={{ userSelect: "none", wordBreak: "break-word" }}
              >
                {renderedText}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              {copy.clickToStart}
            </div>
          </div>
        ) : (
          <div className="animate-slideUp rounded-2xl border border-gray-700 bg-gray-800/50 p-8 shadow-xl backdrop-blur-sm">
            <h2 className="mb-8 text-center text-3xl font-bold text-white">
              {copy.results}
            </h2>

            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              <div className="rounded-xl border border-blue-700/50 bg-blue-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-blue-400 md:text-5xl">
                  {stats.wpm}
                </div>
                <div className="text-sm text-gray-400">{copy.wordsPerMinute}</div>
              </div>
              <div className="rounded-xl border border-green-700/50 bg-green-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-green-400 md:text-5xl">
                  {stats.accuracy}%
                </div>
                <div className="text-sm text-gray-400">{copy.accuracy}</div>
              </div>
              <div className="rounded-xl border border-purple-700/50 bg-purple-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-purple-400 md:text-5xl">
                  {stats.rawWpm}
                </div>
                <div className="text-sm text-gray-400">{copy.rawWpm}</div>
              </div>
              <div className="rounded-xl border border-indigo-700/50 bg-indigo-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-indigo-400 md:text-5xl">
                  {stats.timeElapsed}s
                </div>
                <div className="text-sm text-gray-400">{copy.time}</div>
              </div>
              <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-yellow-400 md:text-5xl">
                  {stats.correctChars}
                </div>
                <div className="text-sm text-gray-400">{copy.correctChars}</div>
              </div>
              <div className="rounded-xl border border-red-700/50 bg-red-900/30 p-4 text-center md:p-6">
                <div className="mb-2 text-4xl font-bold text-red-400 md:text-5xl">
                  {stats.totalChars - stats.correctChars}
                </div>
                <div className="text-sm text-gray-400">{copy.errors}</div>
              </div>
            </div>

            <button
              onClick={resetTest}
              className="w-full rounded-lg bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-blue-700"
            >
              {copy.tryAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
